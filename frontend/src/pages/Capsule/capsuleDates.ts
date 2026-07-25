// 타임캡슐 개봉일 프리셋/포맷 유틸
// 절기 프리셋(부활절·성탄)은 churchCalendar의 계산값을 사용한다.
import { computeEaster } from '../../utils/churchCalendar'

export interface OpenDatePreset {
  key: string
  label: string // 칩에 보이는 이름 ("1년 뒤", "부활절 아침")
  openLabel: string // 서버에 저장되는 개봉 라벨
  date: Date
}

/** 로컬(KST) 기준 YYYY-MM-DD */
export const toDateStr = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** n개월 뒤 같은 날 (말일 넘침은 말일로 클램프: 1/31 + 1개월 → 2/28) */
const addMonthsClamped = (base: Date, months: number): Date => {
  const target = new Date(base.getFullYear(), base.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(base.getDate(), lastDay))
  return target
}

/** 오늘 이후의 가장 가까운 부활절 */
const nextEaster = (today: Date): Date => {
  const thisYear = computeEaster(today.getFullYear())
  return thisYear > today ? thisYear : computeEaster(today.getFullYear() + 1)
}

/** 오늘 이후의 가장 가까운 성탄절 */
const nextChristmas = (today: Date): Date => {
  const thisYear = new Date(today.getFullYear(), 11, 25)
  return thisYear > today ? thisYear : new Date(today.getFullYear() + 1, 11, 25)
}

export const buildPresets = (now = new Date()): OpenDatePreset[] => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return [
    { key: '1m', label: '1개월 뒤', openLabel: '1개월 뒤', date: addMonthsClamped(today, 1) },
    { key: '3m', label: '3개월 뒤', openLabel: '3개월 뒤', date: addMonthsClamped(today, 3) },
    { key: '6m', label: '6개월 뒤', openLabel: '6개월 뒤', date: addMonthsClamped(today, 6) },
    { key: '1y', label: '1년 뒤', openLabel: '1년 뒤', date: addMonthsClamped(today, 12) },
    { key: 'easter', label: '부활절 아침', openLabel: '부활절', date: nextEaster(today) },
    { key: 'christmas', label: '성탄절 아침', openLabel: '성탄절', date: nextChristmas(today) },
    {
      key: 'newyear',
      label: '새해 첫날',
      openLabel: '새해 첫날',
      date: new Date(today.getFullYear() + 1, 0, 1),
    },
  ]
}

export const formatKoreanDate = (isoLike: string): string => {
  const d = new Date(isoLike)
  if (Number.isNaN(d.getTime())) return isoLike
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** 개봉일까지 남은 일수 (오늘 개봉 가능이면 0) */
export const daysUntil = (openAt: string): number => {
  const target = new Date(openAt)
  if (Number.isNaN(target.getTime())) return 0
  const now = new Date()
  const a = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.max(0, Math.round((a - b) / 86_400_000))
}
