/**
 * 표시용 포매터.
 *
 * - formatDot / formatLong / formatNumericDate 계열은 기기 로컬 필드 기준(옛 화면 호환).
 * - formatMonthDay / formatKstDateTime 은 서울 기준으로 고정 — 새 화면은 이쪽을 쓴다.
 * 빈 값('—', '날짜 없음') 가드는 호출부가 맡는다.
 */

import { KO_WEEKDAYS, kstNow, toKstCalendarDate } from './calendar'
import { isValidDate, pad2, parseApiDate, parseKstDate } from './parse'

export type DateLang = 'ko' | 'en'

/** 'YYYY.MM.DD' — 무효한 입력이면 '' */
export const formatDotDate = (iso: string): string => {
  const d = new Date(iso)
  if (!isValidDate(d)) return ''
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`
}

/** 'YYYY.MM.DD (요일)' — 요일 배열은 일요일부터, 기본은 한국어. 무효한 입력이면 '' */
export const formatDotDateWeekday = (iso: string, weekdays: readonly string[] = KO_WEEKDAYS): string => {
  const d = new Date(iso)
  if (!isValidDate(d)) return ''
  return `${formatDotDate(iso)} (${weekdays[d.getDay()]})`
}

/** 'YYYY-MM-DD' 날짜 전용 문자열 → 'YYYY.MM.DD (요일)'. 파싱이 안 되면 입력을 그대로 돌려준다 */
export const formatYmdWeekday = (value: string): string => {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return value
  const weekday = KO_WEEKDAYS[new Date(y, m - 1, d).getDay()]
  return `${y}.${pad2(m)}.${pad2(d)} (${weekday})`
}

/** '2026년 10월 3일' (ko-KR) / 'October 3, 2026' (en-US) */
export const formatLongDate = (iso: string, locale: string = 'ko-KR'): string =>
  new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })

/** '2026. 10. 03.' — ko-KR 2자리 숫자 표기 */
export const formatNumericDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })

/** 'YYYY.MM.DD HH:mm' */
export const formatDotDateTime = (iso: string): string => {
  const d = new Date(iso)
  if (!isValidDate(d)) return ''
  return `${formatDotDate(iso)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** '10월 3일 오후 02:05' — ko-KR 월·일·시·분 */
export const formatLongDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export interface MonthDayOptions {
  lang?: DateLang
  /** 요일을 붙인다 — ko '8월 5일 (수)', en 'Wed, Aug 5' */
  weekday?: boolean
  /** never(기본) 연도 없음 · auto 올해가 아니면 붙임 · always 항상 붙임 */
  year?: 'never' | 'auto' | 'always'
}

/**
 * '8월 5일' / 'Aug 5' — 서울 달력 기준. 무효한 입력이면 ''.
 * 화면마다 손으로 조립하던 `${getMonth()+1}월 ${getDate()}일` 의 공용 출구.
 */
export const formatMonthDay = (iso: string, options: MonthDayOptions = {}): string => {
  const { lang = 'ko', weekday = false, year = 'never' } = options
  const actual = parseApiDate(iso)
  if (!isValidDate(actual)) return ''
  const c = toKstCalendarDate(actual)
  const showYear = year === 'always' || (year === 'auto' && c.getFullYear() !== kstNow().getFullYear())
  if (lang === 'en') {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      month: 'short',
      day: 'numeric',
      ...(weekday ? { weekday: 'short' } : {}),
      ...(showYear ? { year: 'numeric' } : {}),
    }).format(actual)
  }
  const yearPart = showYear ? `${c.getFullYear()}년 ` : ''
  const weekdayPart = weekday ? ` (${KO_WEEKDAYS[c.getDay()]})` : ''
  return `${yearPart}${c.getMonth() + 1}월 ${c.getDate()}일${weekdayPart}`
}

/** 서울 기준으로 포맷 (기기 타임존과 무관하게 교회 현지 시각). 예: 8/5(화) 오후 6:00 */
export const formatKstDateTime = (value: string, lang: DateLang = 'ko'): string => {
  const d = parseKstDate(value)
  if (!isValidDate(d)) return ''
  const parts = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'ko-KR', {
    timeZone: 'Asia/Seoul',
    month: lang === 'en' ? 'short' : 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  if (lang === 'en') {
    return `${get('month')} ${get('day')} (${get('weekday')}) ${get('hour')}:${get('minute')} ${get('dayPeriod')} KST`
  }
  return `${get('month')}/${get('day')}(${get('weekday')}) ${get('dayPeriod')} ${get('hour')}:${get('minute')}`
}

/** 남은 시간을 사람이 읽는 단위로. 예: 3일 · 5시간 20분 · 12분 (0 이하면 null) */
export const formatRemaining = (ms: number, lang: DateLang = 'ko'): string | null => {
  if (ms <= 0) return null
  const totalMinutes = Math.floor(ms / 60000)
  const u =
    lang === 'en'
      ? { lt1: 'less than a minute', d: 'd', h: 'h', m: 'm' }
      : { lt1: '1분 미만', d: '일', h: '시간', m: '분' }
  if (totalMinutes < 1) return u.lt1
  const days = Math.floor(totalMinutes / (60 * 24))
  if (days >= 1) return `${days}${u.d}`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours >= 1) return minutes > 0 ? `${hours}${u.h} ${minutes}${u.m}` : `${hours}${u.h}`
  return `${minutes}${u.m}`
}
