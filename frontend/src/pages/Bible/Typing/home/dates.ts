// 'YYYY-MM-DD' 문자열 날짜 계산 — 서버가 KST 기준 날짜 문자열을 주므로 기기 시간대와 무관하게 UTC 로만 다룬다

const parse = (s: string) => new Date(`${s}T00:00:00Z`)
const fmt = (d: Date) => d.toISOString().slice(0, 10)

export const addDays = (s: string, n: number): string => {
  const d = parse(s)
  d.setUTCDate(d.getUTCDate() + n)
  return fmt(d)
}

/** 월요일 = 0 … 일요일 = 6 */
export const weekdayMon0 = (s: string): number => (parse(s).getUTCDay() + 6) % 7

export const mondayOf = (s: string): string => addDays(s, -weekdayMon0(s))

export const monthOf = (s: string): number => parse(s).getUTCMonth() + 1
export const dayOf = (s: string): number => parse(s).getUTCDate()

/** 기기 시계로 본 KST 오늘 — 서버 응답 전 자리표시용 */
export const kstToday = (): string => fmt(new Date(Date.now() + 9 * 3600 * 1000))

export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']
