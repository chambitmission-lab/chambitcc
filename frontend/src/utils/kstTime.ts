/**
 * 서버가 내려주는 일정 시각은 "오프셋 없는 KST 벽시계" 문자열이다.
 * (백엔드 저장 정책: app/core/kst.py — 모든 이벤트 시각은 KST-naive)
 *
 * new Date('2026-08-05T18:00:00') 는 기기 타임존으로 해석되므로,
 * RSVP 마감처럼 "실제로 지났는가"가 중요한 곳에서는 반드시 여기서 KST로 못 박아 파싱한다.
 */

const KST_OFFSET = '+09:00'

/** 오프셋 없는 KST 문자열을 실제 시각(Date)으로 파싱. 오프셋이 이미 있으면 그대로 존중한다. */
export const parseKstDate = (value: string): Date => {
  const normalized = value.trim().replace(' ', 'T')
  const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized)
  return new Date(hasOffset ? normalized : `${normalized}${KST_OFFSET}`)
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/**
 * 서울 벽시계 필드(연·월·일·요일·시·분)를 그대로 담은 기기 로컬 Date.
 * getFullYear()/getMonth()/getDate()/getDay()/getHours() 가 전부 서울 기준 값이 되므로,
 * 기존 로컬 getter 기반 표시·그룹핑 코드를 그대로 두고 기준만 서울로 바꿀 수 있다.
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

const pad2 = (n: number) => n.toString().padStart(2, '0')

/** 캘린더 Date(이미 서울 기준 필드) → 'YYYY-MM-DD' */
export const calendarDateKey = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

/** 'YYYY-MM-DD' (서울 기준). 인자는 서버 문자열이나 실제 시각 Date —
 *  toKstCalendarDate/kstNow 가 돌려준 캘린더 Date 를 다시 넣으면 9시간이 두 번 더해진다.
 *  캘린더 Date 는 calendarDateKey 를 쓸 것. */
export const kstDateKey = (value: string | Date): string =>
  calendarDateKey(toKstCalendarDate(value))

/** 'YYYY-MM-DDTHH:mm' — datetime-local 입력값 (서울 기준). 인자 주의사항은 kstDateKey 와 동일 */
export const kstDatetimeInputValue = (value: string | Date): string => {
  const d = toKstCalendarDate(value)
  return `${calendarDateKey(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

type Lang = 'ko' | 'en'

/** 서울 기준으로 포맷 (기기 타임존과 무관하게 교회 현지 시각). 예: 8/5(화) 오후 6:00 */
export const formatKstDateTime = (value: string, lang: Lang = 'ko'): string => {
  const d = parseKstDate(value)
  if (Number.isNaN(d.getTime())) return ''
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
export const formatRemaining = (ms: number, lang: Lang = 'ko'): string | null => {
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
