/** '방금 전 / N일 전 / 오늘·어제' 같은 상대 표현. */

import { formatLongDate } from './format'
import { isValidDate } from './parse'

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
  if (!isValidDate(d)) return ''
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
  if (!isValidDate(new Date(iso))) return ''
  const days = calendarDaysSince(iso)
  if (days <= 0) return labels.today
  if (days === 1) return labels.yesterday
  return beyond(iso)
}

/**
 * 상대 시간 (7일 이상이면 '2026년 10월 3일'). 무효한 입력이면 '알 수 없음'.
 */
export const getRelativeTime = (dateString: string): string => {
  if (!isValidDate(new Date(dateString))) return '알 수 없음'
  return timeAgo(dateString, { maxDays: 7, beyond: d => formatLongDate(d.toISOString()) })
}
