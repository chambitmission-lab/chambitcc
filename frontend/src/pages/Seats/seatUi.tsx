// 좌석 예약 공통 UI — 좌석 글리프·모바일 티켓·목록 카드
// 껍데기(셸·레일·안내)는 설문 화면의 surveyUi 를 그대로 쓴다(누군가의 기도와 같은 방식).
import type { ReactNode } from 'react'
import { sessionStore } from '../../utils/tokenStore'
import { preloadRoute } from '../../utils/routePreload'
import type { SeatEventSummary } from '../../types/seatEvent'
import { ChevronRight } from '../Survey/surveyUi'
import { sortSeats } from './seatLayout'
import { PHASE_META, dDayLabel, formatDay, formatShort, formatTime, isAlmostFull, seatPhase } from './seatShared'

/** 극장 의자 — 목록 카드·히어로·메뉴가 함께 쓰는 상징 (1.7 스트로크 선화) */
export const SeatIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6.5 11V6.5A2.5 2.5 0 0 1 9 4h6a2.5 2.5 0 0 1 2.5 2.5V11" />
    <path d="M4.5 11.5a1.5 1.5 0 0 1 3 0V14h9v-2.5a1.5 1.5 0 0 1 3 0V16a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4.5 16z" />
    <path d="M7 17.5V20M17 17.5V20" />
  </svg>
)

/**
 * 내 좌석 티켓 — 입장할 때 보여주는 화면.
 * 위: 브랜드 면(행사 정보) / 절취선 / 아래: 좌석 번호 크게.
 */
export const TicketCard = ({
  event,
  seats,
  actions,
}: {
  event: SeatEventSummary
  seats: string[]
  actions?: ReactNode
}) => {
  const name = sessionStore.get('fullName') || sessionStore.get('username') || ''
  const sorted = sortSeats(seats)
  return (
    <section className="relative rounded-3xl overflow-hidden shadow-[0_14px_36px_-16px_var(--brand-glow)] border border-[var(--brand-soft-strong)]">
      <div className="relative bg-brand text-white px-5 pt-4 pb-5 lg:px-7 lg:pt-5 lg:pb-6">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold tracking-[0.28em] text-white/75">MY TICKET</span>
          <span className="text-[11px] font-bold text-white/85 lg:text-[15px]">{sorted.length}석</span>
        </div>
        <p className="mt-2 text-[18px] font-extrabold tracking-[-0.02em] leading-snug break-keep lg:text-[24px]">
          {event.title}
        </p>
        <p className="mt-1 text-[12.5px] text-white/85 lg:mt-1.5 lg:text-[16px]">
          {event.performance_at ? `${formatDay(event.performance_at)} ${formatTime(event.performance_at)}` : '일시 미정'}
          {event.venue ? ` · ${event.venue}` : ''}
        </p>
      </div>

      {/* 절취선 — 양옆 반원 홈 + 점선 */}
      <div className="relative h-0 bg-white dark:bg-card-dark">
        <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-background-light dark:bg-background-dark" />
        <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-background-light dark:bg-background-dark" />
        <span className="absolute left-5 right-5 top-0 border-t-2 border-dashed border-[var(--brand-soft-strong)]" />
      </div>

      <div className="bg-white dark:bg-card-dark px-5 pt-4 pb-4 lg:px-7 lg:pt-5 lg:pb-6">
        <div className="flex items-end justify-between gap-3">
          <p className="text-[11px] font-bold text-gray-400 dark:text-white/40 tracking-[0.08em] lg:text-[14px]">좌석</p>
          {name ? <p className="text-[12px] font-semibold text-ink-muted lg:text-[15px]">{name} 님</p> : null}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5 lg:mt-2.5 lg:gap-2">
          {sorted.map((s) => (
            <span
              key={s}
              className="inline-flex items-center h-9 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25 text-[16px] font-extrabold tabular-nums tracking-[-0.01em] lg:h-12 lg:px-4 lg:text-[22px]"
            >
              {s}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] text-ink-muted lg:text-[15px]">입장할 때 이 화면을 보여주세요.</p>
        {actions ? <div className="mt-3">{actions}</div> : null}
      </div>
    </section>
  )
}

/** 예약 행사 목록 카드 — /seats 목록과 일정 상세 카드가 함께 쓴다 */
export const SeatEventCard = ({
  event,
  onOpen,
  compact = false,
}: {
  event: SeatEventSummary
  onOpen: () => void
  compact?: boolean
}) => {
  const phase = seatPhase(event)
  const dday = phase !== 'ended' ? dDayLabel(event.performance_at) : null
  const soldOut = phase === 'open' && event.available_count === 0
  const almostFull = phase === 'open' && isAlmostFull(event)
  const ratio = event.total_seats ? event.reserved_count / event.total_seats : 0
  const hasMine = event.my_seats.length > 0
  const action = hasMine
    ? '내 좌석 보기'
    : phase === 'open'
      ? soldOut
        ? '배치도 보기'
        : '좌석 고르기'
      : phase === 'upcoming'
        ? '미리 둘러보기'
        : '자세히 보기'
  const primary = phase === 'open' && !soldOut
  // PC 노안 — /seats 목록 카드만 키운다(일정 상세에 박히는 compact 카드는 그대로)
  const lg = (cls: string) => (compact ? '' : cls)

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => void preloadRoute(`/seats/${event.id}`)}
      onTouchStart={() => void preloadRoute(`/seats/${event.id}`)}
      className={`w-full text-left p-4 rounded-2xl bg-white dark:bg-card-dark border shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.985] ${
        primary || hasMine ? 'border-[var(--brand-soft-strong)]' : 'border-gray-200/70 dark:border-white/[0.07]'
      } ${phase === 'ended' ? 'opacity-80' : ''} ${lg('lg:p-6')}`}
    >
      <div className={`flex items-start gap-3 ${lg('lg:gap-4')}`}>
        <span className={`shrink-0 w-11 h-11 rounded-2xl bg-[var(--brand-soft)] text-brand flex items-center justify-center ${lg('lg:w-14 lg:h-14')}`}>
          <SeatIcon size={22} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className={`flex-1 min-w-0 text-[15px] font-bold text-ink-strong leading-snug tracking-[-0.015em] ${lg('lg:text-[20px]')}`}>
              {event.title}
            </h3>
            <span className="shrink-0 mt-0.5 flex items-center gap-1">
              {dday ? (
                <span className={`inline-flex text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 tabular-nums leading-[1.5] ${lg('lg:text-[13px]')}`}>
                  {dday}
                </span>
              ) : null}
              <span className={`inline-flex text-[10.5px] font-bold px-2 py-0.5 rounded-full border leading-[1.5] ${lg('lg:text-[13px]')} ${
                soldOut
                  ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25'
                  : PHASE_META[phase].badge
              }`}>
                {soldOut ? '매진' : almostFull ? '마감 임박' : PHASE_META[phase].label}
              </span>
            </span>
          </div>

          <p className={`mt-1 text-[12.5px] text-ink-muted ${lg('lg:mt-1.5 lg:text-[16px]')}`}>
            {event.performance_at ? formatShort(event.performance_at) : '일시 미정'}
            {event.venue ? ` · ${event.venue}` : ''}
          </p>

          {hasMine ? (
            <p className={`mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-emerald-600 dark:text-emerald-300 ${lg('lg:text-[16px]')}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              내 좌석 {sortSeats(event.my_seats).join(', ')}
            </p>
          ) : !compact && phase !== 'ended' ? (
            <div className="mt-2.5">
              <div className={`h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden ${lg('lg:h-2.5')}`}>
                <div
                  className={`h-full rounded-full ${almostFull || soldOut ? 'bg-red-400' : 'bg-brand'}`}
                  style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
                />
              </div>
              <p className={`mt-1 text-[11.5px] text-gray-400 dark:text-white/45 tabular-nums ${lg('lg:mt-1.5 lg:text-[14.5px] lg:text-gray-500')}`}>
                남은 좌석 {event.available_count} / {event.total_seats}
              </p>
            </div>
          ) : null}

          <span className={`mt-2 inline-flex items-center gap-0.5 text-[13px] font-bold ${lg('lg:mt-3 lg:text-[16.5px]')} ${primary || hasMine ? 'text-brand' : 'text-gray-400 dark:text-white/45'}`}>
            {action}
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </button>
  )
}
