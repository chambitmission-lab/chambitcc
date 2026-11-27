// 좌석 예약 관리 데스크 규칙 — 실제 화면과 dev 미리보기가 같이 쓴다
import type { SeatEventSummary } from '../../../types/seatEvent'
import { seatPhase } from '../../Seats/seatShared'
import { parseKstDate } from '../../../utils/date'

export type SeatGroupKey = 'open' | 'draft' | 'done'

/** 목록 묶음 — 지금 예약을 받는(받을) 행사 → 준비 중 → 마감·끝난 행사 */
export const SEAT_GROUPS: { key: SeatGroupKey; label: string }[] = [
  { key: 'open', label: '예약 받는 행사' },
  { key: 'draft', label: '준비 중' },
  { key: 'done', label: '마감·끝난 행사' },
]

export const seatGroupOf = (e: SeatEventSummary): SeatGroupKey => {
  if (e.status === 'draft') return 'draft'
  if (e.status === 'closed' || seatPhase(e) === 'ended') return 'done'
  return 'open'
}

const time = (iso?: string | null) => (iso ? parseKstDate(iso).getTime() : Number.POSITIVE_INFINITY)

export const filterSeatEvents = (events: SeatEventSummary[], q: string) => {
  const s = q.trim().toLowerCase()
  return events.filter((e) => !s || e.title.toLowerCase().includes(s) || (e.venue?.toLowerCase().includes(s) ?? false))
}

/** 묶음별로 나눈 뒤 위→아래 보이는 순서 그대로 펼친 목록 — 다가올 행사는 가까운 순, 끝난 행사는 최근 순 */
export const groupSeatEvents = (events: SeatEventSummary[]) => {
  const groups = SEAT_GROUPS.map((g) => {
    const items = events.filter((e) => seatGroupOf(e) === g.key)
    items.sort((a, b) => (g.key === 'done' ? time(b.performance_at) - time(a.performance_at) : time(a.performance_at) - time(b.performance_at)))
    return { ...g, items }
  }).filter((g) => g.items.length > 0)
  return { groups, order: groups.flatMap((g) => g.items) }
}

export const fillRate = (e: SeatEventSummary) => (e.total_seats ? Math.min(1, e.reserved_count / e.total_seats) : 0)

/**
 * 상세 위 안내 — 서버 is_booking_open 규칙(status open + 기간 안 + 공연 전)과 같은 사실을 사람 말로.
 *   upcoming    예약 열기 전
 *   window-over 예약 기간은 끝났는데 상태는 아직 '예약 받기'
 *   ended-open  공연이 지났는데 상태는 아직 '예약 받기'
 */
export type SeatNotice = 'draft' | 'upcoming' | 'window-over' | 'ended-open' | null
export const seatNotice = (e: SeatEventSummary): SeatNotice => {
  if (e.status === 'draft') return 'draft'
  if (e.status !== 'open' || e.is_booking_open) return null
  const phase = seatPhase(e)
  if (phase === 'ended') return 'ended-open'
  if (phase === 'upcoming') return 'upcoming'
  return 'window-over'
}

/** 성도에게 보내는 예약 링크 (HashRouter) */
export const seatLink = (id: number) => `${window.location.origin}${window.location.pathname}#/seats/${id}`
