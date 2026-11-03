import { afterEach, describe, expect, it, vi } from 'vitest'
import { KO_WEEKDAYS, calendarDateKey, kstDateKey, kstNow, toKstCalendarDate } from './calendar'

afterEach(() => {
  vi.useRealTimers()
})

describe('toKstCalendarDate', () => {
  it('로컬 getter 가 서울 벽시계 값을 돌려준다', () => {
    const c = toKstCalendarDate('2026-08-05T18:00:00Z')
    expect([c.getFullYear(), c.getMonth() + 1, c.getDate(), c.getHours(), c.getMinutes()]).toEqual([2026, 8, 6, 3, 0])
    expect(c.getDay()).toBe(4) // 2026-08-06 목요일
  })

  it('Date 를 넣어도 같은 결과', () => {
    const fromString = toKstCalendarDate('2026-08-05T18:00:00+09:00')
    const fromDate = toKstCalendarDate(new Date('2026-08-05T09:00:00Z'))
    expect(fromDate.getTime()).toBe(fromString.getTime())
  })
})

describe('kstDateKey / calendarDateKey', () => {
  it('서울 자정 경계에서 날짜가 넘어간다', () => {
    expect(kstDateKey('2026-08-05T14:59:59Z')).toBe('2026-08-05')
    expect(kstDateKey('2026-08-05T15:00:00Z')).toBe('2026-08-06')
  })

  it('오프셋 없는 서버 문자열은 서울 벽시계 그대로', () => {
    expect(kstDateKey('2026-12-31T23:30:00')).toBe('2026-12-31')
    expect(kstDateKey('2026-12-31')).toBe('2026-12-31')
  })

  it('calendarDateKey 는 이미 서울 필드인 Date 를 그대로 키로', () => {
    expect(calendarDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('kstNow 는 서울 기준 오늘', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-05T15:30:00Z')) // 서울 8/6 00:30
    expect(calendarDateKey(kstNow())).toBe('2026-08-06')
  })
})

describe('KO_WEEKDAYS', () => {
  it('일요일부터 7개', () => {
    expect(KO_WEEKDAYS).toHaveLength(7)
    expect(KO_WEEKDAYS[0]).toBe('일')
    expect(KO_WEEKDAYS[6]).toBe('토')
  })
})
