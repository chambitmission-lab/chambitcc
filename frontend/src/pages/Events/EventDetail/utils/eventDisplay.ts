import { toKstCalendarDate } from '../../../../utils/kstTime'

const WEEKDAYS_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** 초대장 큰 숫자용 날짜 조각 — "11.06" + "금요일" */
export const eventDateParts = (value: string, language: string) => {
  const d = toKstCalendarDate(value)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return {
    big: `${mm}.${dd}`,
    weekday: (language === 'en' ? WEEKDAYS_EN : WEEKDAYS_KO)[d.getDay()],
  }
}

export const isSameKstDay = (a: string, b: string): boolean => {
  const d1 = toKstCalendarDate(a)
  const d2 = toKstCalendarDate(b)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/** "히스토리 캠퍼스(경기도 광주)" → 이름 + 지역. 괄호가 없으면 전체가 이름 */
export const splitLocation = (location: string): { name: string; sub: string | null } => {
  const m = location.trim().match(/^(.+?)\s*[(（]([^()（）]+)[)）]\s*$/)
  return m ? { name: m[1], sub: m[2] } : { name: location.trim(), sub: null }
}

/** 아바타 배경 — 이름마다 고정된 파스텔 한 벌 */
const AVATAR_TONES = [
  'bg-[#e3efff] text-[#1b64da] dark:bg-[#1d3150] dark:text-[#8fbaff]',
  'bg-[#dff5ee] text-[#0e8a5f] dark:bg-[#173a2c] dark:text-[#6fdcaa]',
  'bg-[#fff1dc] text-[#b86e00] dark:bg-[#3d2e14] dark:text-[#f5c06b]',
  'bg-[#ffe6e8] text-[#c93a40] dark:bg-[#3f1e21] dark:text-[#ff9a9d]',
  'bg-[#e6f6fb] text-[#0b7fa3] dark:bg-[#173440] dark:text-[#7fd3ef]',
  'bg-[#eceff3] text-[#4e5968] dark:bg-[#2c2f34] dark:text-[#b4b6bc]',
]
export const avatarTone = (name: string): string =>
  AVATAR_TONES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TONES.length]
