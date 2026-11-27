// 설문 관리 — 관리 데스크(2026-11-27, 교회소식·일정·새가족 데스크와 같은 문법)
//
// 예전 화면은 좁은 카드 줄(상태 버튼 셋·결과·수정·삭제)이라, 결과를 보려면 모달을 열어야 했고
// 마감일이 지났는데 '진행'으로 남은 설문이나 홈에 떠 있는 설문이 무엇인지 한눈에 안 보였다. 그래서
//   PC(lg+)  왼쪽 목록(진행 중·작성 중·마감 묶음, 검색) / 오른쪽 상세(상태 세그먼트·수정 + 숫자 띠·
//            설정·확인할 것 + 통계·개별 응답·CSV 를 그 자리에서) — 각자 스크롤, ↑↓ 이동, / 검색
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 작성·수정은 기존 SurveyComposer. 데이터·액션은 SurveyManagement 가 쥔다.
import { Fragment, useMemo, useRef, useState, type ReactNode } from 'react'
import type { SurveyStatus, SurveySummary } from '../../../types/survey'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { displayStatus, formatDate, formatDateTime } from '../../Survey/surveyShared'
import { endsLabel, groupSurveys, isStaleOpen } from './surveyDeskUtils'
import { I, TextBtn } from './deskBits'
import { DESK_IC } from './deskIcons'
import { DESK_PAGE_CLS, DESK_FRAME_CLS, useDeskHotkeys, stepIndex, isDesktop } from './deskUtils'

// ── 아이콘 ───────────────────────────────────────────────

const IC = {
  ...DESK_IC,
  check: <path d="M20 6L9 17l-5-5" />,
  dash: <path d="M6 12h12" />,
}

// ── 작은 조각 ────────────────────────────────────────────

const Badge = ({ tone, children }: { tone: 'brand' | 'warn' | 'off'; children: ReactNode }) => (
  <span
    className={`inline-flex items-center shrink-0 h-[20px] px-1.5 rounded-md text-[11.5px] font-bold ${
      tone === 'brand'
        ? 'bg-[var(--brand-soft)] text-brand'
        : tone === 'warn'
          ? 'bg-amber-100 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200'
          : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65'
    }`}
  >
    {children}
  </span>
)

const STATUS_STEPS: [SurveyStatus, string][] = [
  ['draft', '작성 중'],
  ['open', '진행'],
  ['closed', '마감'],
]

// ── 목록 행 ──────────────────────────────────────────────

const Row = ({ s, active, onClick }: { s: SurveySummary; active: boolean; onClick: () => void }) => {
  const ends = endsLabel(s)
  const closed = displayStatus(s) === 'closed'
  return (
    <button
      id={`survey-row-${s.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className={`truncate text-[15.5px] font-bold ${closed || s.status === 'draft' ? 'text-gray-600 dark:text-white/65' : 'text-ink-strong'}`}>{s.title}</span>
          {s.status === 'open' && !closed && s.show_on_home && <Badge tone="brand">홈 카드</Badge>}
          {isStaleOpen(s) && <Badge tone="warn">마감일 지남</Badge>}
        </span>
        <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">
          문항 {s.question_count}
          {ends && !isStaleOpen(s) && ` · ${closed ? `${formatDate(s.ends_at!)} 마감` : ends}`}
          {s.is_result_public && ' · 결과 공개'}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className={`block text-[17px] font-extrabold tabular-nums leading-none ${s.response_count > 0 ? 'text-ink-strong' : 'text-gray-300 dark:text-white/25'}`}>{s.response_count}</span>
        <span className="block mt-1 text-[11.5px] font-semibold text-gray-400 dark:text-white/40">응답</span>
      </span>
    </button>
  )
}

// ── 상세 ─────────────────────────────────────────────────

export interface SurveyDeskActions {
  onEdit: (s: SurveySummary) => void
  onSetStatus: (s: SurveySummary, status: SurveyStatus) => void
  onDelete: (s: SurveySummary) => void
  onView: (s: SurveySummary) => void
}

interface DetailCtx {
  renderResults: (s: SurveySummary) => ReactNode
  editingId: number | null
  onClose?: () => void
}

const Flag = ({ on, label, hint }: { on: boolean; label: string; hint: string }) => (
  <div className="flex items-start gap-3 px-4 py-3">
    <span className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${on ? 'bg-brand text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/40'}`}>
      <I d={on ? IC.check : IC.dash} size={12} />
    </span>
    <span className="min-w-0">
      <span className={`block text-[14.5px] font-semibold ${on ? 'text-ink-strong' : 'text-gray-500 dark:text-white/55'}`}>{label}</span>
      <span className="block text-[13px] text-gray-500 dark:text-white/50 break-keep">{hint}</span>
    </span>
  </div>
)

const Detail = ({ s, renderResults, editingId, onClose, ...a }: SurveyDeskActions & DetailCtx & { s: SurveySummary }) => {
  const shown = displayStatus(s)
  const ends = endsLabel(s)
  const stale = isStaleOpen(s)
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        {/* 상태 — 작성 중 → 진행 → 마감 */}
        <div role="radiogroup" aria-label="설문 상태" className="inline-grid grid-cols-3 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.05]">
          {STATUS_STEPS.map(([k, label]) => {
            const on = s.status === k
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => !on && a.onSetStatus(s, k)}
                className={`h-8 px-3 rounded-lg text-[13.5px] font-bold whitespace-nowrap transition ${
                  on ? (k === 'open' ? 'bg-brand text-white shadow-sm' : 'bg-white dark:bg-white/[0.12] text-ink-strong shadow-sm') : 'text-gray-500 dark:text-white/55 hover:text-gray-800 dark:hover:text-white/80'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={() => a.onView(s)} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(s)} />
        </span>
        <button
          type="button"
          onClick={() => a.onEdit(s)}
          disabled={editingId === s.id}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap disabled:opacity-60 transition"
        >
          <I d={IC.edit} size={15} />
          {editingId === s.id ? '여는 중…' : '수정'}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[760px] space-y-5">
          <header>
            <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">
              {shown === 'open' ? '진행 중' : shown === 'draft' ? '작성 중' : '마감'}
              {s.created_at && ` · ${formatDate(s.created_at)} 만듦`}
            </p>
            <h2 className="mt-0.5 text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{s.title}</h2>
            {s.description && <p className="mt-1.5 text-[15px] leading-[1.7] text-gray-600 dark:text-white/65 whitespace-pre-wrap break-keep">{s.description}</p>}
          </header>

          <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
            {(
              [
                ['응답', `${s.response_count}`, '명', false],
                ['문항', `${s.question_count}`, '개', false],
                ['마감', ends ?? '없음', '', stale],
              ] as const
            ).map(([k, v, u, warn]) => (
              <div key={k} className="px-3 lg:px-4 py-3 min-w-0 bg-gray-50 dark:bg-card-dark">
                <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55">{k}</dt>
                <dd className={`mt-0.5 whitespace-nowrap ${warn ? 'text-amber-700 dark:text-amber-300' : 'text-ink-strong'}`}>
                  <span className="text-[22px] font-extrabold tabular-nums tracking-tight">{v}</span>
                  {u && <span className="ml-0.5 text-[13px] font-semibold text-gray-500 dark:text-white/55">{u}</span>}
                </dd>
              </div>
            ))}
          </dl>

          {stale && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 flex items-start gap-3">
              <p className="flex-1 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
                마감일({formatDate(s.ends_at!)})이 지나 응답은 이미 안 받아요. 상태도 마감으로 바꿔 두면 목록이 깔끔해져요.
              </p>
              <button
                type="button"
                onClick={() => a.onSetStatus(s, 'closed')}
                className="shrink-0 h-9 px-3 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition"
              >
                마감으로
              </button>
            </div>
          )}
          {s.status === 'draft' && (
            <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
              작성 중이라 성도에게 안 보여요. 문항을 다 만들었으면 위에서 <b className="font-bold text-brand">진행</b>을 눌러 열어 주세요.
            </p>
          )}

          <section>
            <h3 className="mb-2.5 text-[13px] font-bold text-gray-500 dark:text-white/55">설정</h3>
            <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
              <Flag on={s.show_on_home} label="홈에 참여 카드 띄우기" hint={s.show_on_home ? (shown === 'open' ? '지금 성도 홈에 떠 있어요' : '진행 중일 때만 떠요') : '설문 목록에서만 찾을 수 있어요'} />
              <Flag on={s.is_result_public} label="결과를 성도에게 공개" hint={s.is_result_public ? '응답한 성도가 통계를 볼 수 있어요' : '통계는 관리자만 봐요'} />
              <Flag on={s.allow_edit} label="응답 고치기 허용" hint={s.allow_edit ? '마감 전까지 자기 답을 고칠 수 있어요' : '한 번 내면 고칠 수 없어요'} />
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-[14px] text-gray-500 dark:text-white/55">기간</span>
                <span className="text-[14.5px] font-semibold text-ink-strong text-right">
                  {s.starts_at ? formatDateTime(s.starts_at) : '바로'} ~ {s.ends_at ? formatDateTime(s.ends_at) : '마감일 없음'}
                </span>
              </div>
            </div>
          </section>

          {renderResults(s)}

          <div className="sm:hidden">
            <button type="button" onClick={() => a.onDelete(s)} className="w-full h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = ({ s, onClose, ...rest }: SurveyDeskActions & DetailCtx & { s: SurveySummary; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail s={s} onClose={onClose} {...rest} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

export interface SurveyDeskProps extends SurveyDeskActions {
  surveys: SurveySummary[]
  /** 검색 적용 결과 */
  filtered: SurveySummary[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: () => void
  onBack: () => void
  editingId: number | null
  renderResults: (s: SurveySummary) => ReactNode
}

const SurveyDesk = ({ surveys, filtered, loading, searchTerm, onSearchChange, selectedId, onSelect, onCreate, onBack, editingId, renderResults, ...actions }: SurveyDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { groups, order } = useMemo(() => groupSurveys(filtered), [filtered])
  const activeId = order.some((s) => s.id === selectedId) ? selectedId : (order[0]?.id ?? null)
  const selected = activeId != null ? (surveys.find((s) => s.id === activeId) ?? null) : null
  const sheetSurvey = sheetOpen ? (surveys.find((s) => s.id === selectedId) ?? null) : null

  const stats = useMemo(() => {
    const open = surveys.filter((s) => displayStatus(s) === 'open')
    return {
      open: open.length,
      onHome: open.filter((s) => s.show_on_home).length,
      responses: open.reduce((n, s) => n + s.response_count, 0),
    }
  }, [surveys])

  // '/' 검색, ↑↓ 이동 — PC 전용(확인창·모달이 떠 있거나 입력 중이면 무시)
  useDeskHotkeys({
    searchRef,
    canMove: order.length > 0,
    onMove: (dir) => {
      const i = order.findIndex((x) => x.id === activeId)
      const next = stepIndex(order.length, i, dir)
      const id = order[next].id
      onSelect(id)
      document.getElementById(`survey-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    },
  })

  const select = (id: number) => {
    onSelect(id)
    if (!isDesktop()) setSheetOpen(true)
  }

  const ctx: DetailCtx = { renderResults, editingId }

  return (
    <div className={DESK_PAGE_CLS}>
      <div className={DESK_FRAME_CLS}>
        {/* ── 왼쪽: 목록 ─────────────────────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">설문</h1>
                <p className="mt-0.5 text-[13px] text-gray-500 dark:text-white/55">진행하면 설문 목록과 홈 참여 카드에 올라가요</p>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                새 설문
              </button>
            </div>

            <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
              {(
                [
                  ['진행 중', stats.open, '개'],
                  ['홈 카드', stats.onHome, '개'],
                  ['진행 중 응답', stats.responses, '명'],
                ] as const
              ).map(([k, v, u]) => (
                <div key={k} className="px-3 py-2.5 min-w-0 bg-gray-50 dark:bg-card-dark">
                  <dt className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
                  <dd className="mt-0.5 whitespace-nowrap text-ink-strong">
                    {loading ? (
                      <span className="inline-block w-8 h-6 rounded bg-gray-200/70 dark:bg-white/[0.08] animate-pulse align-middle" />
                    ) : (
                      <>
                        <span className="text-[21px] font-extrabold tabular-nums tracking-tight">{v}</span>
                        <span className="ml-0.5 text-[12.5px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
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
                placeholder="설문 제목·설명 찾기"
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
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <div className="space-y-1 px-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[66px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : order.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[15px] font-bold text-ink-strong">{surveys.length === 0 ? '아직 설문이 없어요' : '맞는 설문이 없어요'}</p>
                {surveys.length === 0 ? (
                  <button type="button" onClick={onCreate} className="mt-2 text-[14px] font-semibold text-brand">
                    첫 설문 만들기
                  </button>
                ) : (
                  <button type="button" onClick={() => onSearchChange('')} className="mt-2 text-[14px] font-semibold text-brand">
                    검색어 지우기
                  </button>
                )}
              </div>
            ) : (
              groups.map((g) => (
                <Fragment key={g.status}>
                  <p className="px-3 pt-3 pb-1 text-[13px] font-extrabold text-gray-400 dark:text-white/40 first:pt-1">
                    {g.label} · {g.items.length}
                  </p>
                  {g.items.map((s) => (
                    <Row key={s.id} s={s} active={s.id === activeId} onClick={() => select(s.id)} />
                  ))}
                </Fragment>
              ))
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} s={selected} {...ctx} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '' : '왼쪽에서 설문을 골라요'}</div>
          )}
        </section>
      </div>

      {/* key 없이 — 시트 안에서 항목이 바뀌어도 다시 마운트(뒤로가기 기록 중복)되지 않게 */}
      {sheetOpen && sheetSurvey && <MobileDetailSheet s={sheetSurvey} onClose={() => setSheetOpen(false)} {...ctx} {...actions} />}
    </div>
  )
}

export default SurveyDesk
