/* 자연 계절(봄·여름·가을·겨울) — 교회력 절기(churchCalendar)와 별개로
 * 홈 히어로의 계절 배경·앰비언트 연출에 쓴다. 한국 기준 월 구분. */

export type NaturalSeason = 'spring' | 'summer' | 'autumn' | 'winter'

export const getNaturalSeason = (date: Date): NaturalSeason => {
  const month = date.getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}
