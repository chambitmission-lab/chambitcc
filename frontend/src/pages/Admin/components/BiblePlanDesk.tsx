// 읽기 플랜 관리 — 관리 데스크(2026-11-27, 교회소식·공지·말씀·헌금 데스크와 같은 문법)
//
// 예전 화면은 아코디언 카드 + 우측 검색 레일이라, 플랜이 성도에게 어떻게 보이는지·일정이 다 찼는지·
// 몇 명이 읽고 있는지를 펼쳐 봐야 알았다. 그래서
//   PC(lg+)  왼쪽 목록(현황 띠·공개/임시저장 세그먼트·검색) / 오른쪽 상세(공개 스위치·수정 +
//            숫자 띠·빈 일정 경고·성도 목록 쿠폰 카드 그대로) — 각자 스크롤, ↑↓ 이동, / 검색
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 작성·수정은 기존 BiblePlanComposer. 데이터·액션은 BiblePlanManagement 가 쥔다.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { PlanSummary } from '../../../types/biblePlan'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { accentGradient } from '../../Bible/Plans/planVisuals'
import { PlanGlyph } from '../../Bible/Plans/PlanIcons'
import { CouponPlanCard } from '../../Bible/Plans/list/PlanCards'
import '../../Bible/Plans/plan-journey.css'
import { calendarDayToday, completionRate, missingDays, type PlanFilter } from './biblePlanDeskUtils'

const isTypingTarget = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

// ── 아이콘 ───────────────────────────────────────────────

const I = ({ d, size = 16, className = '' }: { d: ReactNode; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {d}
  </svg>
)
const IC = {
  search: <><circle cx="11" cy="11" r="7.5" /><path d="M21 21l-4.6-4.6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  back: <path d="M15 18l-6-6 6-6" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6l-1.4 14a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 6" /><path d="M9 6V4h6v2" /></>,
  ext: <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  eye: <><path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></>,
}

// ── 작은 조각 ────────────────────────────────────────────

const Switch = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onClick}
    className={`relative shrink-0 w-11 h-[26px] rounded-full transition-colors ${on ? 'bg-brand' : 'bg-gray-300 dark:bg-white/15'}`}
  >
    <span className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : ''}`} />
  </button>
)

const Badge = ({ tone, children }: { tone: 'draft' | 'warn' | 'cal'; children: ReactNode }) => (
  <span
    className={`inline-flex items-center shrink-0 h-[20px] px-1.5 rounded-md text-[11.5px] font-bold ${
      tone === 'warn'
        ? 'bg-amber-100 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200'
        : tone === 'cal'
          ? 'bg-[var(--brand-soft)] text-brand'
          : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65'
    }`}
  >
    {children}
  </span>
)

const TextBtn = ({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13.5px] font-semibold whitespace-nowrap transition ${
      danger
        ? 'text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10'
        : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.07]'
    }`}
  >
    <I d={icon} size={16} />
    <span>{label}</span>
  </button>
)

const Tile = ({ plan, size = 44 }: { plan: PlanSummary; size?: number }) => (
  <span
    className={`shrink-0 rounded-[14px] bg-gradient-to-br ${accentGradient(plan.accent)} text-white flex items-center justify-center shadow-[0_6px_16px_-8px_var(--brand-glow)]`}
    style={{ width: size, height: size }}
  >
    <PlanGlyph emoji={plan.emoji} size={Math.round(size * 0.46)} />
  </span>
)

// ── 목록 행 ──────────────────────────────────────────────

const Row = ({ plan, active, onClick }: { plan: PlanSummary; active: boolean; onClick: () => void }) => {
  const people = plan.participant_count ?? 0
  const gap = missingDays(plan)
  return (
    <button
      id={`plan-row-${plan.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <span className={plan.is_published ? '' : 'opacity-55'}>
        <Tile plan={plan} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className={`truncate text-[15.5px] font-bold tracking-[-0.01em] ${plan.is_published ? 'text-ink-strong' : 'text-gray-500 dark:text-white/55'}`}>
            {plan.title}
          </span>
          {!plan.is_published && <Badge tone="draft">임시저장</Badge>}
          {gap > 0 && <Badge tone="warn">일정 {gap}일 빔</Badge>}
        </span>
        <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">
          {plan.total_days}일{plan.category ? ` · ${plan.category}` : ''}
          {plan.level ? ` · ${plan.level}` : ''}
          {plan.schedule_mode === 'calendar' ? ' · 달력 고정' : ''}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className={`block text-[17px] font-extrabold tabular-nums leading-none ${people > 0 ? 'text-ink-strong' : 'text-gray-300 dark:text-white/25'}`}>{people}</span>
        <span className="block mt-1 text-[11.5px] font-semibold text-gray-400 dark:text-white/40">명</span>
      </span>
    </button>
  )
}

const RowSkeleton = () => (
  <div className="space-y-1 px-1">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="h-[68px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

// ── 상세 ─────────────────────────────────────────────────

export interface PlanDeskActions {
  onEdit: (p: PlanSummary) => void
  onTogglePublish: (p: PlanSummary) => void
  onDelete: (p: PlanSummary) => void
  onView: (p: PlanSummary) => void
}

const Detail = ({ plan, onClose, ...a }: PlanDeskActions & { plan: PlanSummary; onClose?: () => void }) => {
  const people = plan.participant_count ?? 0
  const done = plan.completed_count ?? 0
  const rate = completionRate(plan)
  const gap = missingDays(plan)
  const calDay = calendarDayToday(plan)

  const calLine =
    calDay == null
      ? null
      : calDay < 1
        ? `1일차까지 D-${1 - calDay}`
        : calDay > plan.total_days
          ? '교회 달력 일정이 끝났어요'
          : `오늘은 ${calDay}일차`

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <Switch on={plan.is_published} onClick={() => a.onTogglePublish(plan)} label="성도에게 공개" />
          <span className={`text-[14px] font-bold whitespace-nowrap ${plan.is_published ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>
            {plan.is_published ? '공개 중' : '임시저장'}
          </span>
        </div>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={() => a.onView(plan)} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(plan)} />
        </span>
        <button
          type="button"
          onClick={() => a.onEdit(plan)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
        >
          <I d={IC.edit} size={15} />
          수정
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[720px] space-y-5">
          <header className="flex items-start gap-3.5">
            <Tile plan={plan} size={56} />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">
                {[plan.category, plan.level, plan.schedule_mode === 'calendar' ? '교회 달력 고정' : '각자 속도'].filter(Boolean).join(' · ')}
              </p>
              <h2 className="mt-0.5 text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{plan.title}</h2>
              {plan.subtitle && <p className="mt-1 text-[15px] text-gray-600 dark:text-white/65 break-keep">{plan.subtitle}</p>}
            </div>
          </header>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
            {(
              [
                ['일정', `${plan.day_count}`, `/${plan.total_days}일`, gap > 0],
                ['함께 읽는 중', `${people}`, '명', false],
                ['완주', `${done}`, '명', false],
                ['완주율', rate == null ? '–' : `${rate}`, rate == null ? '' : '%', false],
              ] as const
            ).map(([k, v, u, warn]) => (
              <div key={k} className="px-3 lg:px-4 py-3 min-w-0 bg-gray-50 dark:bg-card-dark">
                <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
                <dd className={`mt-0.5 whitespace-nowrap ${warn ? 'text-amber-700 dark:text-amber-300' : 'text-ink-strong'}`}>
                  <span className="text-[22px] font-extrabold tabular-nums tracking-tight">{v}</span>
                  <span className="ml-0.5 text-[13px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
                </dd>
              </div>
            ))}
          </dl>

          {gap > 0 && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 flex items-start gap-3">
              <p className="flex-1 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
                {plan.total_days}일 중 <b className="font-extrabold">{gap}일</b>의 읽을 분량이 비어 있어요. 그날엔 성도가 읽을 본문이 없어요.
              </p>
              <button
                type="button"
                onClick={() => a.onEdit(plan)}
                className="shrink-0 h-9 px-3 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition"
              >
                채우기
              </button>
            </div>
          )}
          {!plan.is_published && (
            <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
              임시저장이라 성도 플랜 목록에 안 보여요. 위 스위치를 켜면 바로 올라가요.
              {people > 0 && ' 이미 시작한 성도는 계속 읽을 수 있어요.'}
            </p>
          )}

          <dl className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
            {(
              [
                ['진행 방식', plan.schedule_mode === 'calendar' ? `교회 달력 고정${plan.anchor_date ? ` · 1일차 ${plan.anchor_date.slice(0, 10)}` : ''}` : '각자 시작한 날부터'],
                ...(calLine ? ([['오늘', calLine]] as const) : []),
                ['주소 이름', plan.slug],
                ['목록 순서', `${plan.sort_order}`],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="shrink-0 text-[14px] text-gray-500 dark:text-white/55">{k}</dt>
                <dd className="min-w-0 truncate text-[14.5px] font-semibold text-ink-strong tabular-nums text-right">{v}</dd>
              </div>
            ))}
          </dl>

          {plan.description && (
            <section>
              <h3 className="mb-2 text-[13px] font-bold text-gray-500 dark:text-white/55">소개 글</h3>
              <p className="text-[15px] leading-[1.75] text-gray-800 dark:text-white/85 whitespace-pre-wrap break-keep">{plan.description}</p>
            </section>
          )}

          <section>
            <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-gray-500 dark:text-white/55">
              <I d={IC.eye} size={15} />
              {plan.is_published ? '성도 플랜 목록에 이렇게 보여요' : '공개하면 플랜 목록에 이렇게 보여요'}
            </div>
            <div className="rounded-3xl bg-[var(--app-canvas)] dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/[0.06] p-5 flex items-start gap-5">
              <div className="w-[210px] shrink-0">
                <CouponPlanCard plan={plan} index={0} onClick={() => a.onView(plan)} />
              </div>
              <p className="hidden sm:block pt-2 text-[13px] leading-[1.65] text-gray-500 dark:text-white/50 break-keep">
                /bible/plans "둘러보기"의 쿠폰 카드 그대로예요. 눌러서 성도가 보는 상세 화면을 열 수 있어요.
              </p>
            </div>
          </section>

          <div className="sm:hidden">
            <button type="button" onClick={() => a.onDelete(plan)} className="w-full h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = ({ plan, onClose, ...a }: PlanDeskActions & { plan: PlanSummary; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail plan={plan} onClose={onClose} {...a} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

export interface BiblePlanDeskProps extends PlanDeskActions {
  plans: PlanSummary[]
  /** 검색·세그먼트 적용 결과 */
  filtered: PlanSummary[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  filter: PlanFilter
  onFilterChange: (f: PlanFilter) => void
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: () => void
  onBack: () => void
}

const BiblePlanDesk = ({
  plans,
  filtered,
  loading,
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  onCreate,
  onBack,
  ...actions
}: BiblePlanDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const activeId = filtered.some((p) => p.id === selectedId) ? selectedId : (filtered[0]?.id ?? null)
  const selected = activeId != null ? (plans.find((p) => p.id === activeId) ?? null) : null
  const sheetPlan = sheetOpen ? (plans.find((p) => p.id === selectedId) ?? null) : null

  const stats = useMemo(() => {
    const published = plans.filter((p) => p.is_published).length
    return {
      published,
      draft: plans.length - published,
      readers: plans.reduce((s, p) => s + (p.participant_count ?? 0), 0),
      gaps: plans.filter((p) => missingDays(p) > 0).length,
    }
  }, [plans])

  // '/' 검색, ↑↓ 이동 — PC 전용(확인창·모달이 떠 있거나 입력 중이면 무시)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!isDesktop()) return
      if (document.querySelector('[role="alertdialog"], [role="dialog"]')) return
      if (isTypingTarget(document.activeElement)) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
      if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || filtered.length === 0) return
      e.preventDefault()
      const i = filtered.findIndex((p) => p.id === activeId)
      const next = e.key === 'ArrowDown' ? Math.min(filtered.length - 1, i + 1) : Math.max(0, i - 1)
      const id = filtered[next].id
      onSelect(id)
      document.getElementById(`plan-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, activeId, onSelect])

  const select = (id: number) => {
    onSelect(id)
    if (!isDesktop()) setSheetOpen(true)
  }

  const segs: [PlanFilter, string, number][] = [
    ['all', '전체', plans.length],
    ['published', '공개', stats.published],
    ['draft', '임시저장', stats.draft],
  ]

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:min-h-0 lg:h-[calc(100dvh-56px)] lg:p-4 lg:overflow-hidden">
      <div className="max-w-[1320px] mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:min-h-0 lg:h-full lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:rounded-3xl lg:overflow-hidden lg:border lg:border-gray-200/70 dark:lg:border-white/[0.08] lg:shadow-2xl">
        {/* ── 왼쪽: 목록 ─────────────────────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">읽기 플랜</h1>
                <p className="mt-0.5 text-[13px] text-gray-500 dark:text-white/55">성경 › 읽기 플랜 "둘러보기"에 올라가요</p>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                새 플랜
              </button>
            </div>

            {/* 현황 띠 — 빈 일정이 있으면 누르면 그 플랜으로 */}
            {!loading && (
              <button
                type="button"
                onClick={() => {
                  const first = plans.find((p) => missingDays(p) > 0)
                  if (first) {
                    onFilterChange('all')
                    onSearchChange('')
                    select(first.id)
                  }
                }}
                disabled={stats.gaps === 0}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-left text-[13.5px] transition ${
                  stats.gaps > 0
                    ? 'bg-amber-50 dark:bg-amber-400/10 text-amber-900 dark:text-amber-100 hover:bg-amber-100/70 dark:hover:bg-amber-400/15'
                    : 'bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-white/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${stats.gaps > 0 ? 'bg-amber-500' : 'bg-brand'}`} />
                <span className="flex-1 min-w-0 truncate">
                  지금 <b className="font-extrabold tabular-nums text-ink-strong">{stats.readers.toLocaleString()}명</b>이 함께 읽는 중
                  {stats.gaps > 0 && (
                    <>
                      {' · '}
                      <b className="font-bold">일정 빈 플랜 {stats.gaps}개</b>
                    </>
                  )}
                </span>
                {stats.gaps > 0 && <span className="shrink-0 text-[12.5px] font-bold">보기 ›</span>}
              </button>
            )}

            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <I d={IC.search} size={17} />
              </span>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="제목·분류·주소 이름 찾기"
                className="w-full h-10 pl-9 pr-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[var(--brand-glow)] focus:bg-white dark:focus:bg-white/[0.08] transition"
              />
              {searchTerm ? (
                <button type="button" onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white/80" aria-label="검색어 지우기">
                  <I d={IC.close} size={14} />
                </button>
              ) : (
                <kbd className="hidden lg:block absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 dark:text-white/35 border border-gray-300 dark:border-white/15 rounded px-1.5 leading-[18px]">/</kbd>
              )}
            </label>

            <div role="tablist" className="grid grid-cols-3 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.05]">
              {segs.map(([k, label, n]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={filter === k}
                  onClick={() => onFilterChange(k)}
                  className={`h-8 rounded-lg text-[13.5px] font-semibold transition ${
                    filter === k ? 'bg-white dark:bg-white/[0.12] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/55 hover:text-gray-800 dark:hover:text-white/80'
                  }`}
                >
                  {label} <span className="tabular-nums opacity-70">{n}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <RowSkeleton />
            ) : filtered.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[15px] font-bold text-ink-strong">{plans.length === 0 ? '아직 플랜이 없어요' : '맞는 플랜이 없어요'}</p>
                {plans.length === 0 ? (
                  <button type="button" onClick={onCreate} className="mt-2 text-[14px] font-semibold text-brand">
                    첫 플랜 만들기
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchChange('')
                      onFilterChange('all')
                    }}
                    className="mt-2 text-[14px] font-semibold text-brand"
                  >
                    조건 지우기
                  </button>
                )}
              </div>
            ) : (
              filtered.map((p) => <Row key={p.id} plan={p} active={p.id === activeId} onClick={() => select(p.id)} />)
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} plan={selected} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '' : '왼쪽에서 플랜을 골라요'}</div>
          )}
        </section>
      </div>

      {/* key 없이 — 시트 안에서 항목이 바뀌어도 다시 마운트(뒤로가기 기록 중복)되지 않게 */}
      {sheetOpen && sheetPlan && <MobileDetailSheet plan={sheetPlan} onClose={() => setSheetOpen(false)} {...actions} />}
    </div>
  )
}

export default BiblePlanDesk
