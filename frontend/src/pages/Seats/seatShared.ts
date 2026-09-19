// 좌석 예약 화면 공통 — 상태 문구·날짜 표시·예약 단계
//
// 서버 시각은 "오프셋 없는 KST 벽시계" 문자열이다. 기기 타임존을 타지 않도록
// 비교는 parseKstDate, 표시는 Asia/Seoul 로 못 박는다([[rsvp-deadline-kst]] 규칙).
import { kstDateKey, parseKstDate } from '../../utils/kstTime'
import type { SeatEventStatus, SeatEventSummary } from '../../types/seatEvent'

export const STATUS_META: Record<SeatEventStatus, { label: string; badge: string }> = {
  draft: {
    label: '준비 중',
    badge:
      'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-white/45 dark:border-white/[0.08]',
  },
  open: {
    label: '예약 중',
    badge: 'bg-[var(--brand-soft)] text-brand border-[var(--brand-soft-strong)]',
  },
  closed: {
    label: '마감',
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25',
  },
}

/** 성도 입장에서 본 지금 단계 — 카드 칩·CTA 문구가 전부 여기서 갈린다 */
export type SeatPhase = 'upcoming' | 'open' | 'closed' | 'ended'

const past = (iso?: string | null) => !!iso && parseKstDate(iso).getTime() <= Date.now()

export const seatPhase = (e: SeatEventSummary): SeatPhase => {
  if (past(e.performance_at)) return 'ended'
  if (e.is_booking_open) return 'open'
  if (e.status === 'open' && e.opens_at && !past(e.opens_at)) return 'upcoming'
  return 'closed'
}

export const PHASE_META: Record<SeatPhase, { label: string; badge: string }> = {
  upcoming: {
    label: '오픈 예정',
    badge:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/25',
  },
  open: STATUS_META.open,
  closed: STATUS_META.closed,
  ended: {
    label: '종료',
    badge:
      'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-white/45 dark:border-white/[0.08]',
  },
}

const seoul = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ...opts }).format(parseKstDate(iso))

/** 2026년 9월 19일 (토) */
export const formatDay = (iso?: string | null): string =>
  iso ? seoul(iso, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) : ''

/** 오후 5:00 */
export const formatTime = (iso?: string | null): string =>
  iso ? seoul(iso, { hour: 'numeric', minute: '2-digit', hour12: true }) : ''

/** 9월 19일 (토) 오후 5:00 */
export const formatShort = (iso?: string | null): string =>
  iso
    ? seoul(iso, { month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
    : ''

/** 공연까지 남은 날 (서울 달력 기준) — 오늘이면 0 */
export const daysUntil = (iso?: string | null): number | null => {
  if (!iso) return null
  const toUtcDay = (key: string) => Date.parse(`${key}T00:00:00Z`)
  return Math.round((toUtcDay(kstDateKey(iso)) - toUtcDay(kstDateKey(new Date()))) / 86400000)
}

export const dDayLabel = (iso?: string | null): string | null => {
  const d = daysUntil(iso)
  if (d === null || d < 0) return null
  return d === 0 ? 'D-DAY' : `D-${d}`
}

/** 예약 가능한 좌석 비율로 매진 임박 판단 (잔여 10% 이하 또는 10석 이하) */
export const isAlmostFull = (e: SeatEventSummary): boolean =>
  e.available_count > 0 && (e.available_count <= 10 || e.available_count / Math.max(e.total_seats, 1) <= 0.1)

export const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

export const labelCls =
  'text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block'

export const cardCls =
  'rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm'
