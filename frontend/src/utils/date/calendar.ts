/**
 * 서울 달력 기준 필드·키.
 *
 * 기기 타임존이 KST 가 아니어도(해외 교우) 교회 현지 날짜로 그룹핑·표시하기 위한 층.
 */

import { pad2, parseKstDate } from './parse'

export const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

/** 서울 = UTC+9 — 자정 경계를 서울 기준으로 자를 때 ms 에 더한다 */
export const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/**
 * 서울 벽시계 필드(연·월·일·요일·시·분)를 그대로 담은 기기 로컬 Date.
 * getFullYear()/getMonth()/getDate()/getDay()/getHours() 가 전부 서울 기준 값이 되므로,
 * 로컬 getter 기반 표시·그룹핑 코드를 그대로 두고 기준만 서울로 바꿀 수 있다.
 *
 * 주의: 이 Date 의 getTime() 은 실제 시각이 아니다.
 * "지났는가" 같은 실제 시각 비교에는 parseKstDate 를 쓸 것.
 */
export const toKstCalendarDate = (value: string | Date): Date => {
  const source = typeof value === 'string' ? parseKstDate(value) : value
  const shifted = new Date(source.getTime() + KST_OFFSET_MS)
  return new Date(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
    shifted.getUTCHours(),
    shifted.getUTCMinutes(),
    shifted.getUTCSeconds(),
    shifted.getUTCMilliseconds(),
  )
}

/** 지금(서울 기준)을 담은 캘린더 Date */
export const kstNow = (): Date => toKstCalendarDate(new Date())

/** 캘린더 Date(이미 서울 기준 필드) → 'YYYY-MM-DD' */
export const calendarDateKey = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

/** 'YYYY-MM-DD' (서울 기준). 인자는 서버 문자열이나 실제 시각 Date —
 *  toKstCalendarDate/kstNow 가 돌려준 캘린더 Date 를 다시 넣으면 9시간이 두 번 더해진다.
 *  캘린더 Date 는 calendarDateKey 를 쓸 것. */
export const kstDateKey = (value: string | Date): string =>
  calendarDateKey(toKstCalendarDate(value))
