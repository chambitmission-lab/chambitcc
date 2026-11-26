import type { Event } from '../../../types/event'
import { KO_WEEKDAYS, calendarDateKey, formatMonthDay, kstNow, toKstCalendarDate } from '../../../utils/date'

/* 이 파일의 모든 날짜 계산은 서울(KST) 기준이다.
 * 서버가 주는 일정 시각엔 오프셋이 없어 new Date() 로 파싱하면 기기 타임존을 타므로,
 * 반드시 toKstCalendarDate 로 서울 벽시계 필드를 담은 Date 를 만들어 쓴다. */
const eventDate = (datetime: string): Date => toKstCalendarDate(datetime)

const startOfDay = (d: Date): Date => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

const diffInDays = (a: Date, b: Date): number => {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

/**
 * 가장 가까운 다가오는 일정 1건 (Hero 카드용).
 * 오늘 시작한 이벤트가 있으면 우선, 없으면 다음 일정.
 */
export const getNextEvent = (events: Event[], now: Date = kstNow()): Event | null => {
  const todayStart = startOfDay(now).getTime()
  const sorted = [...events].sort(
    (a, b) => eventDate(a.start_datetime).getTime() - eventDate(b.start_datetime).getTime(),
  )
  return sorted.find(e => eventDate(e.start_datetime).getTime() >= todayStart) ?? null
}

/**
 * D-Day 칩 텍스트.
 * 오늘 → "오늘", 내일 → "내일", 2~6일 → "D-N",
 * 같은 주 7일 이내 → "이번 주 N요일",
 * 그 외 → "M월 D일"
 */
export const formatDDay = (datetime: string, now: Date = kstNow()): string => {
  const d = eventDate(datetime)
  const diff = diffInDays(d, now)
  if (diff < 0) return '지남'
  if (diff === 0) return '오늘'
  if (diff === 1) return '내일'
  if (diff < 7) return `D-${diff}`
  return formatMonthDay(d)
}

export const formatEventTime = (datetime: string): string => {
  const d = eventDate(datetime)
  const hh = d.getHours()
  const mm = d.getMinutes().toString().padStart(2, '0')
  const ampm = hh < 12 ? '오전' : '오후'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${ampm} ${h12}:${mm}`
}

/**
 * 시각 없이 날짜만 있는 일정 — 0시 시작 ~ 23:59 끝(주보 소식 자동 초안이 시각 미상이면 이렇게 만든다).
 * 따로 종일 칼럼이 없어 이 모양을 종일로 읽는다.
 */
export const isAllDayEvent = (ev: { start_datetime: string; end_datetime: string }): boolean => {
  const s = eventDate(ev.start_datetime)
  const e = eventDate(ev.end_datetime)
  return s.getHours() === 0 && s.getMinutes() === 0 && e.getHours() === 23 && e.getMinutes() === 59
}

/** 일정 시작 시각 — 종일 일정이면 '종일' */
export const formatEventStartTime = (ev: { start_datetime: string; end_datetime: string }): string =>
  isAllDayEvent(ev) ? '종일' : formatEventTime(ev.start_datetime)

export const formatEventDateLabel = (datetime: string): string => {
  const d = eventDate(datetime)
  const days = KO_WEEKDAYS
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`
}

/**
 * 한 달치 캘린더 strip — 해당 월의 각 날짜에 이벤트 갯수 매핑.
 * key는 'YYYY-MM-DD'.
 */
export const buildEventDateMap = (events: Event[]): Map<string, Event[]> => {
  const map = new Map<string, Event[]>()
  for (const ev of events) {
    const key = calendarDateKey(eventDate(ev.start_datetime))
    const arr = map.get(key)
    if (arr) arr.push(ev)
    else map.set(key, [ev])
  }
  return map
}
