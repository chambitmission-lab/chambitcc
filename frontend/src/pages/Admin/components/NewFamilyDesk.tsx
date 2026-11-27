// 새가족 소식 관리 — 관리 데스크(2026-11-27, 교회소식·말씀·플랜·일정 데스크와 같은 문법)
//
// 예전 화면은 아코디언 카드 + 우측 필터 레일이라, 펼쳐야 사진·인사말을 봤고 성도 화면에서 어떻게
// 보이는지는 /news 로 나가야 알았다. 그래서
//   PC(lg+)  왼쪽 목록(이번 달·올해 현황·전체/공개/비공개·검색, 등록 달별 묶음) /
//            오른쪽 상세(공개 스위치·수정 + 숫자 띠·환영 이모지·사진 판·인사말 + /news 카드 그대로)
//            각자 스크롤, ↑↓ 이동, / 검색
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 작성·수정(사진 순서 포함)은 기존 NewFamilyComposer. 데이터·액션은 NewFamilyManagement 가 쥔다.
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { NewFamilyPost } from '../../../types/newFamily'
import { WELCOME_EMOJIS } from '../../../types/newFamily'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import NewFamilyPostCard from '../../News/components/NewFamilyPostCard'
import { familyMissing, familyMonthKey, familyMonthLabel, familyStats, registeredLabel, type FamilyTab } from './newFamilyDeskUtils'

const isTypingTarget = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches
const noop = () => {}

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
  sprout: <><path d="M12 21v-9" /><path d="M12 12C12 8 9 5 4 5c0 4 3 7 8 7z" /><path d="M12 14c0-3.5 2.5-6 7-6 0 3.5-2.5 6-7 6z" /></>,
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

const Badge = ({ tone, children }: { tone: 'off' | 'warn'; children: ReactNode }) => (
  <span
    className={`inline-flex items-center shrink-0 h-[20px] px-1.5 rounded-md text-[11.5px] font-bold ${
      tone === 'warn' ? 'bg-amber-100 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200' : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65'
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
      danger ? 'text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.07]'
    }`}
  >
    <I d={icon} size={16} />
    <span>{label}</span>
  </button>
)

const Cover = ({ post, size = 52 }: { post: NewFamilyPost; size?: number }) => (
  <span className="shrink-0 rounded-[14px] overflow-hidden bg-[var(--brand-soft)] text-brand flex items-center justify-center" style={{ width: size, height: size }}>
    {post.cover_url ? <img src={post.cover_url} alt="" loading="lazy" className="w-full h-full object-cover" /> : <I d={IC.sprout} size={Math.round(size * 0.44)} />}
  </span>
)

// ── 목록 행 ──────────────────────────────────────────────

const Row = ({ post, active, onClick }: { post: NewFamilyPost; active: boolean; onClick: () => void }) => {
  const missing = familyMissing(post)
  return (
    <button
      id={`family-row-${post.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <span className={post.is_published ? '' : 'opacity-50'}>
        <Cover post={post} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className={`truncate text-[15.5px] font-bold ${post.is_published ? 'text-ink-strong' : 'text-gray-500 dark:text-white/55'}`}>{post.member_name}</span>
          {!post.is_published && <Badge tone="off">비공개</Badge>}
          {missing.length > 0 && <Badge tone="warn">{missing.join('·')} 없음</Badge>}
        </span>
        <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">
          {registeredLabel(post.registered_at)}
          {post.group_name && ` · ${post.group_name}`}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className={`block text-[17px] font-extrabold tabular-nums leading-none ${post.welcome_count > 0 ? 'text-ink-strong' : 'text-gray-300 dark:text-white/25'}`}>{post.welcome_count}</span>
        <span className="block mt-1 text-[11.5px] font-semibold text-gray-400 dark:text-white/40">환영</span>
      </span>
    </button>
  )
}

// ── 상세 ─────────────────────────────────────────────────

export interface FamilyDeskActions {
  onEdit: (p: NewFamilyPost) => void
  onTogglePublish: (p: NewFamilyPost) => void
  onDelete: (p: NewFamilyPost) => void
  onViewPublic: () => void
}

const Detail = ({ post, onClose, ...a }: FamilyDeskActions & { post: NewFamilyPost; onClose?: () => void }) => {
  const missing = familyMissing(post)
  const photos = [...post.photos].sort((x, y) => x.sort_order - y.sort_order)
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <Switch on={post.is_published} onClick={() => a.onTogglePublish(post)} label="성도에게 공개" />
          <span className={`text-[14px] font-bold whitespace-nowrap ${post.is_published ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>{post.is_published ? '공개 중' : '비공개'}</span>
        </div>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={a.onViewPublic} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(post)} />
        </span>
        <button
          type="button"
          onClick={() => a.onEdit(post)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
        >
          <I d={IC.edit} size={15} />
          수정
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[720px] space-y-5">
          <header className="flex items-center gap-3.5">
            <Cover post={post} size={60} />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">
                {registeredLabel(post.registered_at)} 등록{post.group_name && ` · ${post.group_name}`}
              </p>
              <h2 className="mt-0.5 text-[24px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{post.member_name}</h2>
            </div>
          </header>

          <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
            {(
              [
                ['사진', post.photo_count, '장'],
                ['환영', post.welcome_count, '명'],
                ['댓글', post.comment_count, '개'],
              ] as const
            ).map(([k, v, u]) => (
              <div key={k} className="px-3 lg:px-4 py-3 min-w-0 bg-gray-50 dark:bg-card-dark">
                <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55">{k}</dt>
                <dd className="mt-0.5 whitespace-nowrap text-ink-strong">
                  <span className="text-[22px] font-extrabold tabular-nums tracking-tight">{v}</span>
                  <span className="ml-0.5 text-[13px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
                </dd>
              </div>
            ))}
          </dl>

          {post.welcome_count > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {WELCOME_EMOJIS.filter((e) => post.welcome_breakdown[e]).map((e) => (
                <span key={e} className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-gray-100 dark:bg-white/[0.07] text-[14px] font-semibold text-gray-700 dark:text-white/80">
                  <span aria-hidden="true">{e}</span>
                  <span className="tabular-nums">{post.welcome_breakdown[e]}</span>
                </span>
              ))}
            </div>
          )}

          {missing.length > 0 && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 flex items-start gap-3">
              <p className="flex-1 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
                {missing.join('과 ')}이 아직 없어요. 성도들이 얼굴과 한마디를 보면 더 반갑게 맞이할 수 있어요.
              </p>
              <button
                type="button"
                onClick={() => a.onEdit(post)}
                className="shrink-0 h-9 px-3 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition"
              >
                채우기
              </button>
            </div>
          )}
          {!post.is_published && (
            <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
              비공개라 교회소식 › 새가족에 안 보여요. 위 스위치를 켜면 바로 올라가요.
            </p>
          )}

          {photos.length > 0 && (
            <section>
              <h3 className="mb-2.5 text-[13px] font-bold text-gray-500 dark:text-white/55">사진 {photos.length}장 · 맨 앞이 대표</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((ph, i) => (
                  <div key={ph.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.04]">
                    <img src={ph.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute left-1.5 top-1.5 h-[20px] px-1.5 rounded-md bg-brand text-white text-[11.5px] font-bold flex items-center">대표</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {post.greeting?.trim() && (
            <section>
              <h3 className="mb-2 text-[13px] font-bold text-gray-500 dark:text-white/55">인사말</h3>
              <p className="text-[15.5px] leading-[1.8] text-gray-800 dark:text-white/85 whitespace-pre-wrap break-keep">{post.greeting}</p>
            </section>
          )}

          <section>
            <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-gray-500 dark:text-white/55">
              <I d={IC.eye} size={15} />
              {post.is_published ? '교회소식 › 새가족에 이렇게 보여요' : '공개하면 교회소식 › 새가족에 이렇게 보여요'}
            </div>
            {/* 성도 카드 그대로 — 환영·댓글·사진 넘기기는 미리보기라 눌러도 아무 일 없다 */}
            <div className="max-w-[420px] rounded-3xl bg-[var(--app-canvas)] dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/[0.06] p-4">
              <NewFamilyPostCard post={post} onToggleWelcome={noop} onOpenComments={noop} onOpenViewer={noop} />
            </div>
          </section>

          <div className="sm:hidden">
            <button type="button" onClick={() => a.onDelete(post)} className="w-full h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = ({ post, onClose, ...a }: FamilyDeskActions & { post: NewFamilyPost; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail post={post} onClose={onClose} {...a} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

export interface NewFamilyDeskProps extends FamilyDeskActions {
  posts: NewFamilyPost[]
  /** 탭·검색 적용, 등록 주일 최근 순 */
  filtered: NewFamilyPost[]
  loading: boolean
  tab: FamilyTab
  onTabChange: (t: FamilyTab) => void
  searchTerm: string
  onSearchChange: (v: string) => void
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: () => void
  onBack: () => void
}

const NewFamilyDesk = ({ posts, filtered, loading, tab, onTabChange, searchTerm, onSearchChange, selectedId, onSelect, onCreate, onBack, ...actions }: NewFamilyDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const activeId = filtered.some((p) => p.id === selectedId) ? selectedId : (filtered[0]?.id ?? null)
  const selected = activeId != null ? (posts.find((p) => p.id === activeId) ?? null) : null
  const sheetPost = sheetOpen ? (posts.find((p) => p.id === selectedId) ?? null) : null
  const stats = useMemo(() => familyStats(posts), [posts])

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
      const i = filtered.findIndex((x) => x.id === activeId)
      const next = e.key === 'ArrowDown' ? Math.min(filtered.length - 1, i + 1) : Math.max(0, i - 1)
      const id = filtered[next].id
      onSelect(id)
      document.getElementById(`family-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, activeId, onSelect])

  const select = (id: number) => {
    onSelect(id)
    if (!isDesktop()) setSheetOpen(true)
  }

  // 달 머리 — 그 달 인원과 함께, 연속한 같은 달 묶음의 첫 행 위에만
  const withMonths = useMemo(() => {
    const count = new Map<string, number>()
    for (const p of filtered) count.set(familyMonthKey(p), (count.get(familyMonthKey(p)) ?? 0) + 1)
    return filtered.map((p, i) => ({
      p,
      head: i === 0 || familyMonthKey(filtered[i - 1]) !== familyMonthKey(p) ? `${familyMonthLabel(p)} · ${count.get(familyMonthKey(p))}명` : null,
    }))
  }, [filtered])

  const segs: [FamilyTab, string, number][] = [
    ['all', '전체', posts.length],
    ['published', '공개', posts.length - stats.hidden],
    ['hidden', '비공개', stats.hidden],
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
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">새가족</h1>
                <button type="button" onClick={actions.onViewPublic} className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-gray-500 dark:text-white/55 hover:text-brand transition-colors">
                  <I d={IC.ext} size={13} />
                  교회소식 › 새가족에서 보기
                </button>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                새가족
              </button>
            </div>

            <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
              {(
                [
                  ['이번 달', stats.month],
                  ['올해', stats.year],
                  ['모두', posts.length],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="px-3 py-2.5 min-w-0 bg-gray-50 dark:bg-card-dark">
                  <dt className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">{k}</dt>
                  <dd className="mt-0.5 whitespace-nowrap text-ink-strong">
                    {loading ? (
                      <span className="inline-block w-8 h-6 rounded bg-gray-200/70 dark:bg-white/[0.08] animate-pulse align-middle" />
                    ) : (
                      <>
                        <span className="text-[21px] font-extrabold tabular-nums tracking-tight">{v}</span>
                        <span className="ml-0.5 text-[12.5px] font-semibold text-gray-500 dark:text-white/55">명</span>
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <I d={IC.search} size={17} />
              </span>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="이름·부서·인사말 찾기"
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
                  aria-selected={tab === k}
                  onClick={() => onTabChange(k)}
                  className={`h-8 rounded-lg text-[13.5px] font-semibold transition ${
                    tab === k ? 'bg-white dark:bg-white/[0.12] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/55 hover:text-gray-800 dark:hover:text-white/80'
                  }`}
                >
                  {label} <span className="tabular-nums opacity-70">{n}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <div className="space-y-1 px-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-[72px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[15px] font-bold text-ink-strong">{posts.length === 0 ? '아직 새가족 소식이 없어요' : '맞는 새가족이 없어요'}</p>
                {posts.length === 0 ? (
                  <button type="button" onClick={onCreate} className="mt-2 text-[14px] font-semibold text-brand">
                    첫 새가족 소개하기
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchChange('')
                      onTabChange('all')
                    }}
                    className="mt-2 text-[14px] font-semibold text-brand"
                  >
                    조건 지우기
                  </button>
                )}
              </div>
            ) : (
              withMonths.map(({ p, head }) => (
                <Fragment key={p.id}>
                  {head && <p className="px-3 pt-3 pb-1 text-[13px] font-extrabold text-gray-400 dark:text-white/40 first:pt-1">{head}</p>}
                  <Row post={p} active={p.id === activeId} onClick={() => select(p.id)} />
                </Fragment>
              ))
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} post={selected} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '' : '왼쪽에서 새가족을 골라요'}</div>
          )}
        </section>
      </div>

      {/* key 없이 — 시트 안에서 항목이 바뀌어도 다시 마운트(뒤로가기 기록 중복)되지 않게 */}
      {sheetOpen && sheetPost && <MobileDetailSheet post={sheetPost} onClose={() => setSheetOpen(false)} {...actions} />}
    </div>
  )
}

export default NewFamilyDesk
