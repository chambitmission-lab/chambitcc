import type { Event } from '../../../types/event'

export interface AgendaGroup {
  key: 'today' | 'tomorrow' | 'thisWeek' | 'thisMonth' | 'later' | 'past'
  label: string
  events: Event[]
}

const startOfDay = (d: Date): Date => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

const diffInDays = (a: Date, b: Date): number => {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

/**
 * 다음 일요일까지 같은 주로 판단 (월~일 또는 일~토 어느 쪽이든 7일 범위 내).
 * 간단하게 "오늘로부터 7일 이내"를 이번 주로 봄.
 */
const isWithinThisWeek = (eventDate: Date, today: Date): boolean => {
  const d = diffInDays(eventDate, today)
  return d >= 2 && d <= 7
}

export const groupEventsByDate = (events: Event[], now: Date = new Date()): AgendaGroup[] => {
  const today = startOfDay(now)
  const sorted = [...events].sort(
    (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime(),
  )

  const upcoming = sorted.filter(e => new Date(e.start_datetime).getTime() >= today.getTime())
  const pastEvents = sorted
    .filter(e => new Date(e.start_datetime).getTime() < today.getTime())
    .reverse()

  const buckets: Record<AgendaGroup['key'], Event[]> = {
    today: [],
    tomorrow: [],
    thisWeek: [],
    thisMonth: [],
    later: [],
    past: pastEvents,
  }

  for (const ev of upcoming) {
    const d = new Date(ev.start_datetime)
    const diff = diffInDays(d, today)

    if (diff === 0) buckets.today.push(ev)
    else if (diff === 1) buckets.tomorrow.push(ev)
    else if (isWithinThisWeek(d, today)) buckets.thisWeek.push(ev)
    else if (isSameMonth(d, today)) buckets.thisMonth.push(ev)
    else buckets.later.push(ev)
  }

  const labels: Record<AgendaGroup['key'], string> = {
    today: '오늘',
    tomorrow: '내일',
    thisWeek: '이번 주',
    thisMonth: '이번 달',
    later: '다가오는 일정',
    past: '지난 일정',
  }

  const upcomingOrder: AgendaGroup['key'][] = ['today', 'tomorrow', 'thisWeek', 'thisMonth', 'later']
  const result = upcomingOrder
    .map(key => ({ key, label: labels[key], events: buckets[key] }))
    .filter(g => g.events.length > 0)

  if (buckets.past.length > 0) {
    result.push({ key: 'past' as const, label: labels.past, events: buckets.past })
  }

  return result
}

/**
 * 가장 가까운 다가오는 일정 1건 (Hero 카드용).
 * 오늘 시작한 이벤트가 있으면 우선, 없으면 다음 일정.
 */
export const getNextEvent = (events: Event[], now: Date = new Date()): Event | null => {
  const todayStart = startOfDay(now).getTime()
  const sorted = [...events].sort(
    (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime(),
  )
  return sorted.find(e => new Date(e.start_datetime).getTime() >= todayStart) ?? null
}

/**
 * D-Day 칩 텍스트.
 * 오늘 → "오늘", 내일 → "내일", 2~6일 → "D-N",
 * 같은 주 7일 이내 → "이번 주 N요일",
 * 그 외 → "M월 D일"
 */
export const formatDDay = (datetime: string, now: Date = new Date()): string => {
  const d = new Date(datetime)
  const diff = diffInDays(d, now)
  if (diff < 0) return '지남'
  if (diff === 0) return '오늘'
  if (diff === 1) return '내일'
  if (diff < 7) return `D-${diff}`
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export const formatEventTime = (datetime: string): string => {
  const d = new Date(datetime)
  const hh = d.getHours()
  const mm = d.getMinutes().toString().padStart(2, '0')
  const ampm = hh < 12 ? '오전' : '오후'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${ampm} ${h12}:${mm}`
}

export const formatEventDateLabel = (datetime: string): string => {
  const d = new Date(datetime)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`
}

/**
 * 한 달치 캘린더 strip — 해당 월의 각 날짜에 이벤트 갯수 매핑.
 * key는 'YYYY-MM-DD'.
 */
export const buildEventDateMap = (events: Event[]): Map<string, Event[]> => {
  const map = new Map<string, Event[]>()
  for (const ev of events) {
    const d = new Date(ev.start_datetime)
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    const arr = map.get(key)
    if (arr) arr.push(ev)
    else map.set(key, [ev])
  }
  return map
}
