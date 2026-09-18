// 누군가의 기도 — 날짜 표기 (서버는 KST 날짜를 'YYYY-MM-DD' 로 준다)

const WEEKDAY = ['주일', '월', '화', '수', '목', '금', '토']

const parseDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** '2026-11-01' → '11월 1일 주일' */
export const formatDay = (iso: string, withWeekday = true) => {
  const d = parseDay(iso)
  const base = `${d.getMonth() + 1}월 ${d.getDate()}일`
  return withWeekday ? `${base} ${WEEKDAY[d.getDay()]}` : base
}

/** 오늘(기기 날짜)부터 iso 까지 남은 날 수 */
export const daysUntil = (iso: string) => {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((parseDay(iso).getTime() - start.getTime()) / 86_400_000)
}

/** 'M월의 기도' — 주기 시작일의 달 */
export const cycleMonthLabel = (startIso: string) => `${parseDay(startIso).getMonth() + 1}월`
