// 목양칼럼 '편지 도착' 표지의 계절·절기 — 편지 날짜에서 정한다.
//  - 계절(봄·여름·가을·겨울): 표지 배경 사진(/visit 의 scene-{계절}-{day|night}.webp)과 계절 입자
//  - 절기 이름: 소인 도장·지난 호 목록에 찍는 이름. 교회력 계산은 utils/churchCalendar 가 진실,
//    맥추·추수감사주일은 한국 교회 관례(7월 첫 주일 / 11월 셋째 주일)

import { computeAdventStart, computeEaster } from '../../utils/churchCalendar'

export type LetterSeason = 'spring' | 'summer' | 'autumn' | 'winter'

const parse = (dateStr: string): Date | null => {
  const m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null
}

export const letterSeasonOf = (dateStr: string): LetterSeason => {
  const m = (parse(dateStr) ?? new Date()).getMonth() + 1
  if (m >= 3 && m <= 5) return 'spring'
  if (m >= 6 && m <= 8) return 'summer'
  if (m >= 9 && m <= 11) return 'autumn'
  return 'winter'
}

/** 표지 배경 — 라이트는 낮, 다크는 밤 사진 */
export const seasonScene = (season: LetterSeason, time: 'day' | 'night') => `/images/visit/scene-${season}-${time}.webp`

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
/** month(0-base)의 n번째 주일 */
const nthSunday = (year: number, month: number, n: number) => {
  const first = new Date(year, month, 1)
  return new Date(year, month, 1 + ((7 - first.getDay()) % 7) + 7 * (n - 1))
}

const ADVENT_KO = ['첫째', '둘째', '셋째', '넷째']
const ADVENT_EN = ['1st', '2nd', '3rd', '4th']

/** 편지 날짜가 특별한 주일이면 그 이름, 아니면 null */
export const specialSundayLabel = (dateStr: string, ko: boolean): string | null => {
  const d = parse(dateStr)
  if (!d) return null
  const y = d.getFullYear()
  const easter = computeEaster(y)

  if (sameDay(d, easter)) return ko ? '부활주일' : 'Easter Sunday'
  if (sameDay(d, addDays(easter, -7))) return ko ? '종려주일' : 'Palm Sunday'
  if (sameDay(d, addDays(easter, 49))) return ko ? '성령강림주일' : 'Pentecost'
  if (d.getMonth() === 11 && d.getDate() === 25) return ko ? '성탄절' : 'Christmas'
  if (sameDay(d, nthSunday(y, 0, 1))) return ko ? '신년주일' : 'New Year Sunday'
  if (sameDay(d, nthSunday(y, 6, 1))) return ko ? '맥추감사주일' : 'Summer Thanksgiving'
  if (sameDay(d, nthSunday(y, 10, 3))) return ko ? '추수감사주일' : 'Thanksgiving Sunday'

  const advent = computeAdventStart(y)
  for (let k = 0; k < 4; k++) {
    if (sameDay(d, addDays(advent, 7 * k))) return ko ? `대림절 ${ADVENT_KO[k]} 주일` : `${ADVENT_EN[k]} Sunday of Advent`
  }
  // 사순절 기간의 주일
  if (d.getDay() === 0 && d > addDays(easter, -46) && d < addDays(easter, -7)) return ko ? '사순절' : 'Lent'
  return null
}
