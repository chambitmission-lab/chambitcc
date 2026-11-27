// 일정 관리 데스크 규칙 — 실제 화면과 dev 미리보기가 같이 쓴다
// 날짜는 모두 서울 벽시계(toKstCalendarDate·kstNow) 기준 — /events 화면과 같은 계산
import type { Event, EventCategory } from '../../../types/event'
import { kstNow, toKstCalendarDate } from '../../../utils/date'

/** bulletin = 주보 소식에서 AI가 만든 비공개 초안(2026-11-25 전에 남은 것) */
export type EventTab = 'upcoming' | 'past' | 'draft' | 'bulletin'
export const EVENT_TABS: readonly EventTab[] = ['upcoming', 'past', 'draft', 'bulletin']

export const isBulletinDraft = (ev: Event) => !ev.is_published && ev.source_bulletin_id != null

export type EventPhase = 'upcoming' | 'ongoing' | 'past'
export const eventPhase = (ev: Event, now: Date = kstNow()): EventPhase => {
  const s = toKstCalendarDate(ev.start_datetime).getTime()
  const e = toKstCalendarDate(ev.end_datetime).getTime()
  const n = now.getTime()
  if (e < n) return 'past'
  return s <= n ? 'ongoing' : 'upcoming'
}

const startMs = (ev: Event) => toKstCalendarDate(ev.start_datetime).getTime()

export const filterEvents = (
  events: Event[],
  opts: { tab: EventTab; category: EventCategory | 'all'; q: string },
  now: Date = kstNow(),
) => {
  const q = opts.q.trim().toLowerCase()
  const list = events.filter((ev) => {
    if (opts.category !== 'all' && ev.category !== opts.category) return false
    if (q && !ev.title.toLowerCase().includes(q) && !(ev.location?.toLowerCase().includes(q) ?? false) && !(ev.description?.toLowerCase().includes(q) ?? false))
      return false
    const past = eventPhase(ev, now) === 'past'
    if (opts.tab === 'upcoming') return !past
    if (opts.tab === 'past') return past
    if (opts.tab === 'draft') return !ev.is_published
    return isBulletinDraft(ev)
  })
  // 지난 일정은 최근 것부터, 나머지는 가까운 것부터
  return list.sort((a, b) => (opts.tab === 'past' ? startMs(b) - startMs(a) : startMs(a) - startMs(b)))
}

/** 목록 달 머리 — 같은 해면 '12월', 다른 해면 '2027년 1월' */
export const monthKey = (ev: Event) => {
  const d = toKstCalendarDate(ev.start_datetime)
  return `${d.getFullYear()}-${d.getMonth()}`
}
export const monthLabel = (ev: Event, now: Date = kstNow()) => {
  const d = toKstCalendarDate(ev.start_datetime)
  return d.getFullYear() === now.getFullYear() ? `${d.getMonth() + 1}월` : `${d.getFullYear()}년 ${d.getMonth() + 1}월`
}

/** 신청 마감 — null(없음) / 남은 일수 / 지남 */
export const rsvpState = (ev: Event, now: Date = kstNow()): { label: string; closed: boolean } | null => {
  if (!ev.rsvp_deadline) return null
  const d = toKstCalendarDate(ev.rsvp_deadline)
  const ms = d.getTime() - now.getTime()
  if (ms <= 0) return { label: '마감됨', closed: true }
  const days = Math.floor(ms / 86400000)
  return { label: days === 0 ? '오늘 마감' : `D-${days}`, closed: false }
}
