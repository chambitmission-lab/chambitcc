// 읽기 플랜 목록 '말씀 오솔길' 계산 — 정거장 · 내 위치 · 이번 주 도장 · 오늘 분량.
// 화면 컴포넌트(TodayHero · JourneyBoard · PlanTrail)가 같은 규칙을 쓰도록 순수 함수만 둔다.

import type { PlanBookStop, PlanProgress, PlanSummary, TodayReading } from '../../../../types/biblePlan'
import { getBookGenre } from '../../../../components/bible/bookGenre'
import { canonicalBookName } from '../../../Sermon/utils/sermonMeta'

export interface TrailStop {
  label: string
  /** 이 정거장이 시작되는 일차(1-base) */
  startDay: number
}

/** 길 위 정거장 최대 수 — 모바일 세로 길에서 이름표가 겹치지 않는 선 */
export const MAX_TRAIL_STOPS = 8

// 같은 날 시작하는 정거장은 첫 것만 — 하루에 여러 권을 읽는 짧은 플랜(모세오경 3일 등)에서
// 정거장과 내 위치가 서로 다른 책을 가리키지 않게
const uniqueByDay = (stops: TrailStop[]): TrailStop[] =>
  stops.filter((s, i) => stops.findIndex((o) => o.startDay === s.startDay) === i)

// 처음·끝은 남기고 고르게 솎는다
const sampleEven = <T,>(items: T[], max: number): T[] =>
  items.length <= max
    ? items
    : Array.from({ length: max }, (_, i) => items[Math.round((i * (items.length - 1)) / (max - 1))])

/**
 * 정거장 만들기.
 * - 성경 구간(BOOK_GENRES)을 세 곳 이상 지나면 구간 이름(모세오경 → 역사서 → …)
 * - 한두 구간 안에서만 읽는 플랜(모세오경·복음서 등)은 책 이름
 * - 책 정보가 없거나(구버전 응답) 한 권짜리면 일차로 4등분
 * 같은 구간이 연달아 나오면 한 정거장이다 — 연대기순 플랜은 구간을 오가므로 같은 이름이 다시 나올 수 있다.
 */
export const buildTrailStops = (route: PlanBookStop[] | null | undefined, totalDays: number): TrailStop[] => {
  if (route && route.length > 0) {
    const groups: TrailStop[] = []
    let lastGenre = ''
    for (const stop of route) {
      const genre = getBookGenre(stop.book_number)
      if (genre.id !== lastGenre) groups.push({ label: genre.label, startDay: stop.start_day })
      lastGenre = genre.id
    }
    const sections = uniqueByDay(groups)
    if (sections.length >= 3) return sampleEven(sections, MAX_TRAIL_STOPS)
    const books = uniqueByDay(
      route.map((s) => ({ label: canonicalBookName(s.book_number) || `${s.start_day}일차`, startDay: s.start_day })),
    )
    if (books.length >= 2) return sampleEven(books, MAX_TRAIL_STOPS)
  }
  const total = Math.max(1, totalDays)
  const stops: TrailStop[] = []
  for (let i = 0; i < 4; i++) {
    const day = Math.floor((i * total) / 4) + 1
    if (!stops.some((s) => s.startDay === day)) stops.push({ label: `${day}일차`, startDay: day })
  }
  return stops
}

export type StopState = 'passed' | 'current' | 'upcoming'

/**
 * 길 위 내 위치(0~1, 1 = 끝의 완주 깃발)와 정거장 상태.
 * 정거장은 길 위에 고르게(i/N) 놓고, 정거장 사이는 일차로 보간한다 — 뒤쪽 구간(서신서 등)이
 * 일수로는 짧아도 이름표가 겹치지 않게 하려는 것.
 */
export const trailProgress = (stops: TrailStop[], doneDays: number, totalDays: number) => {
  const n = stops.length
  const edge = (i: number) => (i < n ? stops[i].startDay - 1 : totalDays)
  let position = 1
  for (let i = 0; i < n; i++) {
    const a = edge(i)
    const b = edge(i + 1)
    if (doneDays < b) {
      position = (i + Math.max(0, doneDays - a) / Math.max(1, b - a)) / n
      break
    }
  }
  const states: StopState[] = stops.map((_, i) =>
    doneDays >= edge(i + 1) ? 'passed' : doneDays >= edge(i) ? 'current' : 'upcoming',
  )
  return { position: Math.min(1, Math.max(0, position)), states }
}

/** 지금 읽는 책 이름 — 오늘 본문이 있으면 그 책, 없으면 지나는 책 순서에서 찾는다 */
export const currentBookName = (
  plan: PlanSummary,
  today: TodayReading | undefined,
  doneDays: number,
): string | null => {
  const fromToday = today?.passages?.find((p) => p.book_name_ko)?.book_name_ko
  if (fromToday) return fromToday
  const route = plan.book_route ?? []
  let found: PlanBookStop | null = null
  for (const s of route) if (s.start_day <= doneDays + 1) found = s
  return found ? canonicalBookName(found.book_number) || null : null
}

// ── 날짜 ── 로컬(KST) 기준 'YYYY-MM-DD'. toISOString 은 UTC 라 자정 근처에 하루 밀린다
export const localDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const parseDateKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

const daysBetween = (a: Date, b: Date) =>
  Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() -
    new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / 86_400_000)

/** 연속 기록이 아직 살아 있는지 — 마지막으로 읽은 날이 오늘이나 어제 */
export const streakAlive = (progress?: PlanProgress | null, now = new Date()): boolean => {
  if (!progress?.last_completed_date || !progress.streak_count) return false
  return daysBetween(parseDateKey(progress.last_completed_date), now) <= 1
}

export interface WeekStamp {
  key: string
  label: string
  stamped: boolean
  isToday: boolean
}

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

/**
 * 오늘로 끝나는 최근 7일 도장.
 * recent_dates 가 오면 그대로 쓰고, 구버전 응답이면 연속 기록(마지막 읽은 날부터 streak 일)으로 채운다.
 */
export const weekStamps = (progress?: PlanProgress | null, now = new Date()): WeekStamp[] => {
  let read: Set<string>
  if (progress?.recent_dates) {
    read = new Set(progress.recent_dates)
  } else {
    read = new Set()
    if (progress && streakAlive(progress, now)) {
      const last = parseDateKey(progress.last_completed_date as string)
      for (let i = 0; i < Math.min(progress.streak_count, 7); i++) {
        read.add(localDateKey(new Date(last.getFullYear(), last.getMonth(), last.getDate() - i)))
      }
    }
  }
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i))
    const key = localDateKey(d)
    return { key, label: i === 6 ? '오늘' : WEEKDAY[d.getDay()], stamped: read.has(key), isToday: i === 6 }
  })
}

export interface TodayInfo {
  /** 다음에 읽을 일차(오늘 이미 읽었어도 그다음 일차). 달력 고정은 오늘 날짜의 일차 */
  day: number | null
  doneToday: boolean
  lastDoneDay: number | null
  /** 일차 제목 또는 본문 참조 */
  headline: string
  /** 제목과 본문 참조가 다를 때만 본문 참조 */
  subline: string | null
  /** 달력 고정 플랜을 오늘 읽은 뒤 — '다음' 대신 보여줄 안내(밀린 읽기 / 내일 본문) */
  calendarAfter: string | null
}

export const todayInfo = (plan: PlanSummary, today?: TodayReading): TodayInfo => {
  const progress = plan.progress
  const day = today?.day_number ?? progress?.current_day ?? null
  const refs = (today?.passages ?? [])
    .map((p) => p.reference)
    .filter(Boolean)
    .join(' · ')
  const title = today?.day_title?.trim() || ''
  const doneToday = today?.done_today ?? progress?.completed_today ?? false
  const calendarAfter =
    doneToday && plan.schedule_mode === 'calendar'
      ? (progress?.behind_days ?? 0) > 0
        ? `밀린 읽기 ${progress?.behind_days}일 · ${progress?.catch_up_day}일차부터`
        : '내일 본문으로 이어서 함께 읽어요'
      : null
  return {
    day,
    doneToday,
    lastDoneDay: today?.last_completed_day ?? progress?.last_completed_day ?? null,
    headline: title || refs || (day != null ? `${day}일차` : ''),
    subline: title && refs && title !== refs ? refs : null,
    calendarAfter,
  }
}

/** 진행 숫자 한 묶음 — 카드마다 같은 계산을 되풀이하지 않게 */
export const planNumbers = (plan: PlanSummary) => {
  const progress = plan.progress
  const totalDays = progress?.total_days || plan.total_days
  const doneDays = progress?.completed_days ?? 0
  return {
    totalDays,
    doneDays,
    remainDays: Math.max(0, totalDays - doneDays),
    percent: Math.min(100, progress?.percent ?? 0),
  }
}

export const formatStartLabel = (value?: string | null): string | null => {
  if (!value) return null
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseDateKey(value) : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getMonth() + 1}월 ${d.getDate()}일부터`
}
