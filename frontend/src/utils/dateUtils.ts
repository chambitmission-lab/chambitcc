/**
 * 날짜·시각 공용 유틸.
 *
 * 화면마다 복사돼 있던 formatDate/timeAgo 류를 한곳에 모은다. 출력 포맷은 기존
 * 화면과 같게 유지하고, null/'—'/'날짜 없음' 같은 빈 값 가드는 호출부가 맡는다.
 */

/**
 * API 시각 문자열을 Date 로 파싱한다.
 *
 * 백엔드는 이제 모든 datetime 에 오프셋(+09:00 / Z)을 붙여 내려준다. 오프셋이 없는
 * 문자열은 배포가 혼재된 구간의 옛 응답뿐이며, 백엔드 저장 정책(KST naive)에 맞춰
 * KST 로 간주해 '+09:00' 을 붙여 파싱한다. 'YYYY-MM-DD' 날짜 전용 문자열('T' 없음)은
 * 그대로 둔다.
 *
 * @param dateString - ISO 8601 시각 문자열
 */
export const parseApiDate = (dateString: string): Date => {
  const hasTimezone = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(dateString)
  if (!hasTimezone && dateString.includes('T')) {
    return new Date(`${dateString}+09:00`)
  }
  return new Date(dateString)
}

export const pad2 = (n: number): string => String(n).padStart(2, '0')

const isValid = (d: Date): boolean => !Number.isNaN(d.getTime())

export const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

/** 'YYYY.MM.DD' — 무효한 입력이면 '' */
export const formatDotDate = (iso: string): string => {
  const d = new Date(iso)
  if (!isValid(d)) return ''
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`
}

/** 'YYYY.MM.DD (요일)' — 요일 배열은 일요일부터, 기본은 한국어. 무효한 입력이면 '' */
export const formatDotDateWeekday = (iso: string, weekdays: readonly string[] = KO_WEEKDAYS): string => {
  const d = new Date(iso)
  if (!isValid(d)) return ''
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
  if (!isValid(d)) return ''
  return `${formatDotDate(iso)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** '10월 3일 오후 02:05' — ko-KR 월·일·시·분 */
export const formatLongDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export interface TimeAgoOptions {
  /** 이 일수 이상이면 beyond(d) 로 넘긴다. beyond 가 없으면 계속 'N일 전' */
  maxDays?: number
  beyond?: (d: Date) => string
}

/**
 * '방금 전 / N분 전 / N시간 전 / N일 전'. 무효한 입력이면 '', 미래 시각은 '방금 전'.
 */
export const timeAgo = (iso: string, options: TimeAgoOptions = {}): string => {
  const d = new Date(iso)
  if (!isValid(d)) return ''
  const diff = Date.now() - d.getTime()
  if (diff < 0) return '방금 전'
  const min = Math.floor(diff / 60_000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (options.maxDays !== undefined && day >= options.maxDays && options.beyond) return options.beyond(d)
  return `${day}일 전`
}

/** 오늘 자정 기준으로 며칠 전인지 (오늘 0, 어제 1, 내일 -1) */
export const calendarDaysSince = (iso: string): number => {
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  return Math.round((startOf(new Date()) - startOf(new Date(iso))) / 86_400_000)
}

/** 오늘·어제는 사람 말로, 그 외는 beyond(iso). 무효한 입력이면 '' */
export const relativeDayLabel = (
  iso: string,
  labels: { today: string; yesterday: string },
  beyond: (iso: string) => string
): string => {
  if (!isValid(new Date(iso))) return ''
  const days = calendarDaysSince(iso)
  if (days <= 0) return labels.today
  if (days === 1) return labels.yesterday
  return beyond(iso)
}

/**
 * 상대 시간 (7일 이상이면 '2026년 10월 3일'). 무효한 입력이면 '알 수 없음'.
 *
 * @param dateString - ISO 8601 형식의 시각 문자열
 */
export const getRelativeTime = (dateString: string): string => {
  if (!isValid(new Date(dateString))) return '알 수 없음'
  return timeAgo(dateString, { maxDays: 7, beyond: d => formatLongDate(d.toISOString()) })
}
