import type { Event } from '../../../types/event'
import { calendarDateKey, kstNow, toKstCalendarDate } from '../../../utils/date'
import { computeAdventStart, computeEaster } from '../../../utils/churchCalendar'

/* /events 일정 목록 — '한 주 = 우편엽서 한 장'(2026-11-26 N2 풍경 엽서 세트).
 * 모든 날짜는 서울(KST) 벽시계 기준. 주는 월요일~주일. */

export interface WeekCard {
  /** 월요일 YYYY-MM-DD — 키 겸 소인 날짜 */
  mondayKey: string
  /** 월~주일 7일 YYYY-MM-DD */
  days: string[]
  /** 이번 주 / 다음 주 / 12월 셋째 주 */
  title: string
  /** 그 주 주일 이름 — 대림절 첫째 주일 · 부활주일 … 없으면 '11월 30일 주일' */
  sundayName: string
  /** 풍경 엽서 번호 = 그 해 몇 번째 주(ISO) */
  no: number
  /** 그 주 일정(시작 시각 순) */
  events: Event[]
}

export const eventDayKey = (ev: Pick<Event, 'start_datetime'>): string =>
  calendarDateKey(toKstCalendarDate(ev.start_datetime))

const parseKey = (k: string): Date => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const addDays = (d: Date, n: number): Date => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const mondayOf = (d: Date): Date => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

/** ISO 주 번호 — 목요일이 속한 해 기준 */
const isoWeek = (monday: Date): number => {
  const thu = addDays(monday, 3)
  const jan4 = new Date(thu.getFullYear(), 0, 4)
  const week1Monday = mondayOf(jan4)
  return Math.round((thu.getTime() - week1Monday.getTime()) / (7 * 86_400_000)) + 1
}

const ORDINAL = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째']

/** 교회력 주일 이름 — 대림·사순·부활·성령강림·성탄만 이름을 붙이고 나머지는 날짜로 */
export const sundayNameOf = (sunday: Date): string => {
  const y = sunday.getFullYear()
  const advent = computeAdventStart(y)
  const christmas = new Date(y, 11, 25)
  if (sunday >= advent && sunday < christmas) {
    const n = Math.round((sunday.getTime() - advent.getTime()) / (7 * 86_400_000))
    return `대림절 ${ORDINAL[n] ?? ''} 주일`
  }
  if (sameDay(sunday, christmas)) return '성탄 주일'
  const easter = computeEaster(y)
  if (sameDay(sunday, easter)) return '부활주일'
  if (sameDay(sunday, addDays(easter, -7))) return '종려주일'
  if (sameDay(sunday, addDays(easter, 49))) return '성령강림주일'
  const ash = addDays(easter, -46)
  if (sunday > ash && sunday < addDays(easter, -7)) {
    const n = Math.round((sunday.getTime() - addDays(ash, 4).getTime()) / (7 * 86_400_000))
    return `사순절 ${ORDINAL[n] ?? ''} 주일`
  }
  return `${sunday.getMonth() + 1}월 ${sunday.getDate()}일 주일`
}

const weekTitle = (monday: Date, thisMonday: Date): string => {
  const diff = Math.round((monday.getTime() - thisMonday.getTime()) / (7 * 86_400_000))
  if (diff === 0) return '이번 주'
  if (diff === 1) return '다음 주'
  if (diff === -1) return '지난주'
  // 목요일이 속한 달의 몇째 주
  const thu = addDays(monday, 3)
  return `${thu.getMonth() + 1}월 ${ORDINAL[Math.ceil(thu.getDate() / 7) - 1]} 주`
}

const byStart = (a: Event, b: Event) =>
  toKstCalendarDate(a.start_datetime).getTime() - toKstCalendarDate(b.start_datetime).getTime()

export const buildWeekCard = (monday: Date, events: Event[], thisMonday: Date): WeekCard => {
  const days = Array.from({ length: 7 }, (_, i) => calendarDateKey(addDays(monday, i)))
  return {
    mondayKey: days[0],
    days,
    title: weekTitle(monday, thisMonday),
    sundayName: sundayNameOf(addDays(monday, 6)),
    no: isoWeek(monday),
    events: [...events].sort(byStart),
  }
}

/**
 * 일정 → 엽서 묶음.
 * - 이번 주 이후 주마다 엽서 한 장(일정 없는 주는 건너뛴다).
 * - 이번 주 엽서는 includeThisWeek 이면 일정이 없어도 둔다('오늘' 띠가 지금 위치를 알려준다).
 * - 이번 주보다 앞선 일정은 past(최근 순)로 — '지난 일정 꺼내 보기'에 접어 둔다.
 */
export const buildWeekCards = (
  events: Event[],
  { includeThisWeek, now = kstNow() }: { includeThisWeek: boolean; now?: Date },
): { weeks: WeekCard[]; past: Event[] } => {
  const thisMonday = mondayOf(now)
  const thisMondayKey = calendarDateKey(thisMonday)
  const byWeek = new Map<string, Event[]>()
  const past: Event[] = []
  for (const ev of events) {
    const monday = mondayOf(toKstCalendarDate(ev.start_datetime))
    const key = calendarDateKey(monday)
    if (key < thisMondayKey) {
      past.push(ev)
      continue
    }
    const arr = byWeek.get(key)
    if (arr) arr.push(ev)
    else byWeek.set(key, [ev])
  }
  if (includeThisWeek && !byWeek.has(thisMondayKey)) byWeek.set(thisMondayKey, [])
  const weeks = [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, evs]) => buildWeekCard(parseKey(key), evs, thisMonday))
  return { weeks, past: past.sort(byStart).reverse() }
}

/** 남은 날 — 오늘 / 내일 / 모레 / N일 뒤 */
export const daysLeftLabel = (dayKey: string, now: Date = kstNow()): string => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.round((parseKey(dayKey).getTime() - today.getTime()) / 86_400_000)
  if (diff <= 0) return '오늘'
  if (diff === 1) return '내일'
  if (diff === 2) return '모레'
  return `${diff}일 뒤`
}

export const dayParts = (dayKey: string) => {
  const d = parseKey(dayKey)
  return { m: d.getMonth() + 1, d: d.getDate(), wd: d.getDay(), date: d }
}
