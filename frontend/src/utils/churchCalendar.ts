// 교회력(서방 전통) 계산 — 부활절 날짜를 기준으로 한 해의 절기 경계를 산출한다.
// 백엔드 plan_day.season은 시드 플레이스홀더(전부 epiphany)라 신뢰할 수 없어
// 절기 태그·리본은 이 모듈의 계산값을 사용한다.

export type ChurchSeason =
  | 'christmas'
  | 'epiphany'
  | 'lent'
  | 'easter'
  | 'ordinary'
  | 'advent'

export interface SeasonSegment {
  key: ChurchSeason
  start: Date
  end: Date // inclusive
}

/** 그레고리력 부활절 — Meeus/Jones/Butcher 알고리즘 */
export const computeEaster = (year: number): Date => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 3=3월, 4=4월
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

const addDays = (date: Date, n: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + n)
  return result
}

/** 대림절 첫 주일 — 성탄절(12/25) 직전 4번째 주일 */
export const computeAdventStart = (year: number): Date => {
  const christmas = new Date(year, 11, 25)
  const dow = christmas.getDay() // 0=일요일
  return addDays(christmas, -(dow === 0 ? 7 : dow) - 21)
}

/** 1월 1일 기준 몇 번째 날인지 (1-base) — UTC 산술로 DST 영향 배제 */
export const dayOfYear = (date: Date): number => {
  const start = Date.UTC(date.getFullYear(), 0, 1)
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((current - start) / 86_400_000) + 1
}

/**
 * 한 해의 절기 구간 목록 (연초 → 연말 순).
 * - 성탄절기: 12/25~12/31 + 이듬해 1/1~1/5 (연 경계로 두 구간)
 * - 주현절기: 1/6 ~ 재의 수요일 전날
 * - 사순절: 재의 수요일(부활절-46일) ~ 부활절 전날
 * - 부활절기: 부활절 ~ 성령강림절(부활절+49일)
 * - 연중: 성령강림절 다음날 ~ 대림절 전날
 * - 대림절: 대림 첫 주일 ~ 12/24
 */
export const getSeasonSegments = (year: number): SeasonSegment[] => {
  const easter = computeEaster(year)
  const ashWednesday = addDays(easter, -46)
  const pentecost = addDays(easter, 49)
  const adventStart = computeAdventStart(year)

  return [
    { key: 'christmas', start: new Date(year, 0, 1), end: new Date(year, 0, 5) },
    { key: 'epiphany', start: new Date(year, 0, 6), end: addDays(ashWednesday, -1) },
    { key: 'lent', start: ashWednesday, end: addDays(easter, -1) },
    { key: 'easter', start: easter, end: pentecost },
    { key: 'ordinary', start: addDays(pentecost, 1), end: addDays(adventStart, -1) },
    { key: 'advent', start: adventStart, end: new Date(year, 11, 24) },
    { key: 'christmas', start: new Date(year, 11, 25), end: new Date(year, 11, 31) },
  ]
}

/** 특정 날짜가 속한 절기 */
export const getCurrentSeason = (date: Date): ChurchSeason => {
  const doy = dayOfYear(date)
  const segment = getSeasonSegments(date.getFullYear()).find(
    (s) => doy >= dayOfYear(s.start) && doy <= dayOfYear(s.end),
  )
  return segment?.key ?? 'ordinary'
}
