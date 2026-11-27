// 좌석 예약 관리 — 관리 데스크(2026-11-27, 설문·푸시·새가족 데스크와 같은 문법)
//
// 예전 화면은 좁은 카드 줄(상태 버튼 셋·현황판·수정·링크·삭제)이라, 예약·입장을 보려면 현황판 모달을 따로 열어야 했고
// 예약 기간이 끝났거나 공연이 지났는데 '예약 받기'로 남은 행사가 한눈에 안 보였다. 그래서
//   PC(lg+)  왼쪽 목록(예약 받는·준비 중·마감 묶음, 검색, 채움 막대) / 오른쪽 상세(상태 세그먼트·링크·수정 +
//            확인할 것 + 현황판(숫자 띠·배치도/명단·대리 예약·입장)을 그 자리에서 + 설정) — 각자 스크롤, ↑↓ 이동, / 검색
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 배치 편집은 기존 SeatEventComposer, 현황판은 SeatBoard. 데이터·액션은 SeatEventManagement 가 쥔다.
import { Fragment, useMemo, useRef, useState, type ReactNode } from 'react'
import type { SeatEventStatus, SeatEventSummary } from '../../../types/seatEvent'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { dDayLabel, formatShort, stubDate } from '../../Seats/seatShared'
import { fillRate, groupSeatEvents, seatGroupOf, seatNotice } from './seatDeskUtils'
import { I, TextBtn } from './deskBits'
import { DESK_IC as IC } from './deskIcons'
import { DESK_PAGE_CLS, DESK_FRAME_CLS, useDeskHotkeys, stepIndex, isDesktop } from './deskUtils'

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

const STATUS_STEPS: [SeatEventStatus, string][] = [
  ['draft', '준비 중'],
  ['open', '예약 받기'],
  ['closed', '마감'],
]

// ── 목록 행 ──────────────────────────────────────────────

const Row = ({ e, active, onClick }: { e: SeatEventSummary; active: boolean; onClick: () => void }) => {
  const stub = stubDate(e.performance_at)
  const notice = seatNotice(e)
  const done = seatGroupOf(e) === 'done'
  const full = e.total_seats > 0 && e.available_count === 0
  return (
    <button
      id={`seat-row-${e.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <span className={`shrink-0 w-11 text-center ${done ? 'opacity-60' : ''}`}>
        {stub ? (
          <>
            <span className="block text-[11.5px] font-semibold text-gray-500 dark:text-white/50 leading-none">{stub.month}</span>
            <span className="block mt-0.5 text-[19px] font-extrabold tabular-nums text-ink-strong leading-none">{stub.day}</span>
            <span className="block mt-0.5 text-[11.5px] font-semibold text-gray-400 dark:text-white/40 leading-none">{stub.weekday}</span>
          </>
        ) : (
          <span className="block text-[12px] font-semibold text-gray-400 dark:text-white/40">미정</span>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className={`truncate text-[15.5px] font-bold ${done || e.status === 'draft' ? 'text-gray-600 dark:text-white/65' : 'text-ink-strong'}`}>{e.title}</span>
          {full && !done && <Badge tone="brand">매진</Badge>}
          {(notice === 'window-over' || notice === 'ended-open') && <Badge tone="warn">{notice === 'ended-open' ? '공연 지남' : '기간 끝'}</Badge>}
          {notice === 'upcoming' && <Badge tone="off">오픈 전</Badge>}
        </span>
        <span className="mt-1.5 flex items-center gap-2">
          <span className="flex-1 h-1.5 rounded-full bg-gray-200/80 dark:bg-white/[0.08] overflow-hidden">
            <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round(fillRate(e) * 100)}%` }} />
          </span>
          <span className="shrink-0 text-[12.5px] text-gray-500 dark:text-white/55 truncate max-w-[45%]">{e.venue || `1인 ${e.max_per_user}석`}</span>
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className={`block text-[17px] font-extrabold tabular-nums leading-none ${e.reserved_count > 0 ? 'text-ink-strong' : 'text-gray-300 dark:text-white/25'}`}>
          {e.reserved_count}
          <span className="text-[12px] font-semibold text-gray-400 dark:text-white/40">/{e.total_seats}</span>
        </span>
        <span className="block mt-1 text-[11.5px] font-semibold text-gray-400 dark:text-white/40">{e.holder_count}팀</span>
      </span>
    </button>
  )
}

// ── 상세 ─────────────────────────────────────────────────

export interface SeatDeskActions {
  onEdit: (e: SeatEventSummary) => void
  onSetStatus: (e: SeatEventSummary, status: SeatEventStatus) => void
  onDelete: (e: SeatEventSummary) => void
  onCopyLink: (e: SeatEventSummary) => void
  onView: (e: SeatEventSummary) => void
}

interface DetailCtx {
  renderBoard: (e: SeatEventSummary) => ReactNode
  editingId: number | null
  onClose?: () => void
}

const Detail = ({ e, renderBoard, editingId, onClose, ...a }: SeatDeskActions & DetailCtx & { e: SeatEventSummary }) => {
  const notice = seatNotice(e)
  const dday = dDayLabel(e.performance_at)
  const group = seatGroupOf(e)
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        {/* 상태 — 준비 중 → 예약 받기 → 마감 */}
        <div role="radiogroup" aria-label="예약 상태" className="inline-grid grid-cols-3 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.05]">
          {STATUS_STEPS.map(([k, label]) => {
            const on = e.status === k
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => !on && a.onSetStatus(e, k)}
                className={`h-8 px-2.5 sm:px-3 rounded-lg text-[13px] sm:text-[13.5px] font-bold whitespace-nowrap transition ${
                  on ? (k === 'open' ? 'bg-brand text-white shadow-sm' : 'bg-white dark:bg-white/[0.12] text-ink-strong shadow-sm') : 'text-gray-500 dark:text-white/55 hover:text-gray-800 dark:hover:text-white/80'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="flex-1" />
        <span className="hidden md:contents">
          <TextBtn icon={IC.link} label="링크 복사" onClick={() => a.onCopyLink(e)} />
        </span>
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={() => a.onView(e)} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(e)} />
        </span>
        <button
          type="button"
          onClick={() => a.onEdit(e)}
          disabled={editingId === e.id}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap disabled:opacity-60 transition"
        >
          <I d={IC.edit} size={15} />
          {editingId === e.id ? '여는 중…' : '수정'}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[1000px] space-y-5">
          <header>
            <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">
              {e.performance_at ? formatShort(e.performance_at) : '일시 미정'}
              {dday && group !== 'done' && <span className="ml-1.5 text-brand">{dday}</span>}
            </p>
            <h2 className="mt-0.5 text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{e.title}</h2>
            {e.venue && <p className="mt-1 text-[15px] text-gray-600 dark:text-white/65">{e.venue}</p>}
          </header>

          {notice === 'draft' && (
            <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
              준비 중이라 성도에게 안 보여요. 배치를 다 잡았으면 위에서 <b className="font-bold text-brand">예약 받기</b>를 눌러 열어 주세요. 그전에도 여기서 대리 배정은 할 수 있어요.
            </p>
          )}
          {notice === 'upcoming' && (
            <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
              성도 목록엔 보이지만 예약은 <b className="font-bold text-ink-strong">{formatShort(e.opens_at)}</b>에 열려요.
            </p>
          )}
          {(notice === 'window-over' || notice === 'ended-open') && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 flex items-start gap-3">
              <p className="flex-1 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
                {notice === 'ended-open' ? '공연이 끝났는데 아직 예약 받기 상태예요.' : '예약 기간이 끝나 성도는 더 예약할 수 없어요.'} 마감으로 바꿔 두면 목록이 깔끔해져요.
              </p>
              <button
                type="button"
                onClick={() => a.onSetStatus(e, 'closed')}
                className="shrink-0 h-9 px-3 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition"
              >
                마감으로
              </button>
            </div>
          )}

          {renderBoard(e)}

          <section>
            <h3 className="mb-2.5 text-[13px] font-bold text-gray-500 dark:text-white/55">설정</h3>
            <dl className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
              {(
                [
                  ['공연', e.performance_at ? formatShort(e.performance_at) : '미정'],
                  ['예약 기간', `${e.opens_at ? formatShort(e.opens_at) : '바로'} ~ ${e.closes_at ? formatShort(e.closes_at) : '공연 시작 전까지'}`],
                  ['1인 최대', `${e.max_per_user}석`],
                  ['교회 일정', e.event_id ? '연결됨 — 일정 상세에 예약 카드가 떠요' : '연결 안 함'],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="shrink-0 text-[14px] text-gray-500 dark:text-white/55">{k}</dt>
                  <dd className="text-[14.5px] font-semibold text-ink-strong text-right break-keep">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[13px] text-gray-500 dark:text-white/50 break-keep">
              마감해도 공연 전까지 성도 본인 취소는 계속 돼요. 관리자 대리 배정은 기간·인원 제한 없이 돼요.
            </p>
          </section>

          <div className="sm:hidden grid grid-cols-2 gap-2">
            <button type="button" onClick={() => a.onCopyLink(e)} className="h-11 rounded-xl text-[14px] font-semibold text-brand bg-[var(--brand-soft)]">
              예약 링크 복사
            </button>
            <button type="button" onClick={() => a.onDelete(e)} className="h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = ({ e, onClose, ...rest }: SeatDeskActions & DetailCtx & { e: SeatEventSummary; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail e={e} onClose={onClose} {...rest} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

export interface SeatDeskProps extends SeatDeskActions {
  events: SeatEventSummary[]
  /** 검색 적용 결과 */
  filtered: SeatEventSummary[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: () => void
  onBack: () => void
  editingId: number | null
  renderBoard: (e: SeatEventSummary) => ReactNode
}

const SeatDesk = ({ events, filtered, loading, searchTerm, onSearchChange, selectedId, onSelect, onCreate, onBack, editingId, renderBoard, ...actions }: SeatDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { groups, order } = useMemo(() => groupSeatEvents(filtered), [filtered])
  const activeId = order.some((x) => x.id === selectedId) ? selectedId : (order[0]?.id ?? null)
  const selected = activeId != null ? (events.find((x) => x.id === activeId) ?? null) : null
  const sheetEvent = sheetOpen ? (events.find((x) => x.id === selectedId) ?? null) : null

  const stats = useMemo(() => {
    const live = events.filter((x) => seatGroupOf(x) === 'open')
    return {
      live: live.length,
      reserved: live.reduce((n, x) => n + x.reserved_count, 0),
      left: live.reduce((n, x) => n + x.available_count, 0),
    }
  }, [events])

  // '/' 검색, ↑↓ 이동 — PC 전용(확인창·모달이 떠 있거나 입력 중이면 무시)
  useDeskHotkeys({
    searchRef,
    canMove: order.length > 0,
    onMove: (dir) => {
      const i = order.findIndex((x) => x.id === activeId)
      const next = stepIndex(order.length, i, dir)
      const id = order[next].id
      onSelect(id)
      document.getElementById(`seat-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    },
  })

  const select = (id: number) => {
    onSelect(id)
    if (!isDesktop()) setSheetOpen(true)
  }

  const ctx: DetailCtx = { renderBoard, editingId }

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
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">좌석 예약</h1>
                <p className="mt-0.5 text-[13px] text-gray-500 dark:text-white/55">콘서트·특별 행사 좌석을 받고, 당일 입장까지</p>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                새 행사
              </button>
            </div>

            <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
              {(
                [
                  ['예약 받는 행사', stats.live, '개'],
                  ['예약된 좌석', stats.reserved, '석'],
                  ['남은 좌석', stats.left, '석'],
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
                onChange={(ev) => onSearchChange(ev.target.value)}
                placeholder="행사 이름·장소 찾기"
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
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-[70px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : order.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[15px] font-bold text-ink-strong">{events.length === 0 ? '아직 좌석 예약 행사가 없어요' : '맞는 행사가 없어요'}</p>
                {events.length === 0 ? (
                  <>
                    <p className="mt-1 text-[13px] text-gray-500 dark:text-white/55">‘본당 좌우 2블록’ 배치로 바로 시작할 수 있어요</p>
                    <button type="button" onClick={onCreate} className="mt-2 text-[14px] font-semibold text-brand">
                      첫 행사 만들기
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => onSearchChange('')} className="mt-2 text-[14px] font-semibold text-brand">
                    검색어 지우기
                  </button>
                )}
              </div>
            ) : (
              groups.map((g) => (
                <Fragment key={g.key}>
                  <p className="px-3 pt-3 pb-1 text-[13px] font-extrabold text-gray-400 dark:text-white/40 first:pt-1">
                    {g.label} · {g.items.length}
                  </p>
                  {g.items.map((x) => (
                    <Row key={x.id} e={x} active={x.id === activeId} onClick={() => select(x.id)} />
                  ))}
                </Fragment>
              ))
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} e={selected} {...ctx} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '' : '왼쪽에서 행사를 골라요'}</div>
          )}
        </section>
      </div>

      {/* key 없이 — 시트 안에서 항목이 바뀌어도 다시 마운트(뒤로가기 기록 중복)되지 않게 */}
      {sheetOpen && sheetEvent && <MobileDetailSheet e={sheetEvent} onClose={() => setSheetOpen(false)} {...ctx} {...actions} />}
    </div>
  )
}

export default SeatDesk
