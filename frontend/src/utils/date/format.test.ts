import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  formatDotDate,
  formatDotDateTime,
  formatDotDateWeekday,
  formatKstDateTime,
  formatMonthDay,
  formatRemaining,
  formatYmdWeekday,
} from './format'
import { toKstCalendarDate } from './calendar'

afterEach(() => {
  vi.useRealTimers()
})

/** 기기 로컬 필드로 만든 ISO — 로컬 기준 포매터가 타임존과 무관하게 같은 날짜를 내야 한다 */
const localIso = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).toISOString()

describe('formatMonthDay (서울 고정)', () => {
  it("ko 기본: '8월 5일'", () => {
    expect(formatMonthDay('2026-08-05T18:00:00+09:00')).toBe('8월 5일')
  })

  it('기기 타임존(LA)이 아니라 서울 날짜로 — 서울 8/6 00:30 은 LA 로는 8/5', () => {
    expect(formatMonthDay('2026-08-06T00:30:00+09:00')).toBe('8월 6일')
    expect(formatMonthDay('2026-08-06T00:30:00+09:00', { lang: 'en' })).toBe('Aug 6')
  })

  it('오프셋 없는 서버 문자열은 서울 벽시계 그대로', () => {
    expect(formatMonthDay('2026-08-06T00:30:00')).toBe('8월 6일')
  })

  it('요일 붙이기', () => {
    expect(formatMonthDay('2026-08-05T18:00:00+09:00', { weekday: true })).toBe('8월 5일 (수)')
    expect(formatMonthDay('2026-08-05T18:00:00+09:00', { lang: 'en', weekday: true })).toBe('Wed, Aug 5')
  })

  it("year: 'always' / 'auto'", () => {
    expect(formatMonthDay('2025-08-05T18:00:00+09:00', { year: 'always' })).toBe('2025년 8월 5일')
    expect(formatMonthDay('2025-08-05T18:00:00+09:00', { lang: 'en', year: 'always' })).toBe('Aug 5, 2025')

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-03T03:00:00Z'))
    expect(formatMonthDay('2026-08-05T18:00:00+09:00', { year: 'auto' })).toBe('8월 5일')
    expect(formatMonthDay('2025-08-05T18:00:00+09:00', { year: 'auto' })).toBe('2025년 8월 5일')
  })

  it("auto 는 서울 기준 '올해' — 서울은 이미 새해, LA 는 아직 작년", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-31T16:00:00Z')) // 서울 2027-01-01 01:00
    expect(formatMonthDay('2027-01-01T01:00:00+09:00', { year: 'auto' })).toBe('1월 1일')
    expect(formatMonthDay('2026-12-31T20:00:00+09:00', { year: 'auto' })).toBe('2026년 12월 31일')
  })

  it('Date 는 캘린더 필드 그대로 — 서울 캘린더 Date·로컬 생성 Date 모두', () => {
    expect(formatMonthDay(toKstCalendarDate('2026-08-06T00:30:00+09:00'))).toBe('8월 6일')
    expect(formatMonthDay(new Date(2026, 7, 6))).toBe('8월 6일')
    expect(formatMonthDay(new Date(2026, 7, 6), { lang: 'en', weekday: true, year: 'always' })).toBe('Thu, Aug 6, 2026')
  })

  it("날짜 전용 'YYYY-MM-DD' 문자열은 그 날짜 그대로", () => {
    expect(formatMonthDay('2026-08-06')).toBe('8월 6일')
    expect(formatMonthDay('2026-08-06', { weekday: true })).toBe('8월 6일 (목)')
  })

  it("무효한 입력은 ''", () => {
    expect(formatMonthDay('')).toBe('')
    expect(formatMonthDay('nope')).toBe('')
    expect(formatMonthDay(new Date(NaN))).toBe('')
  })
})

describe('formatKstDateTime (서울 고정)', () => {
  it('ko: 8/5(수) 오후 6:00', () => {
    expect(formatKstDateTime('2026-08-05T18:00:00')).toBe('8/5(수) 오후 6:00')
  })

  it('en: Aug 5 (Wed) 6:00 PM KST', () => {
    expect(formatKstDateTime('2026-08-05T18:00:00', 'en')).toBe('Aug 5 (Wed) 6:00 PM KST')
  })

  it("무효한 입력은 ''", () => {
    expect(formatKstDateTime('x')).toBe('')
  })
})

describe('로컬 기준 포매터 (옛 화면 호환)', () => {
  it('formatDotDate / Weekday / DateTime', () => {
    const iso = localIso(2026, 11, 3, 14, 5)
    expect(formatDotDate(iso)).toBe('2026.11.03')
    expect(formatDotDateWeekday(iso)).toBe('2026.11.03 (화)')
    expect(formatDotDateWeekday(iso, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])).toBe('2026.11.03 (Tue)')
    expect(formatDotDateTime(iso)).toBe('2026.11.03 14:05')
  })

  it("무효한 입력은 ''", () => {
    expect(formatDotDate('bad')).toBe('')
    expect(formatDotDateWeekday('bad')).toBe('')
    expect(formatDotDateTime('bad')).toBe('')
  })

  it("formatYmdWeekday: 'YYYY-MM-DD' 문자열, 파싱 실패면 입력 그대로", () => {
    expect(formatYmdWeekday('2026-11-03')).toBe('2026.11.03 (화)')
    expect(formatYmdWeekday('2026-2-9')).toBe('2026.02.09 (월)')
    expect(formatYmdWeekday('미정')).toBe('미정')
  })
})

describe('formatRemaining', () => {
  const MIN = 60_000
  it('단위별 표기', () => {
    expect(formatRemaining(0)).toBeNull()
    expect(formatRemaining(-1)).toBeNull()
    expect(formatRemaining(30_000)).toBe('1분 미만')
    expect(formatRemaining(12 * MIN)).toBe('12분')
    expect(formatRemaining(5 * 60 * MIN + 20 * MIN)).toBe('5시간 20분')
    expect(formatRemaining(2 * 60 * MIN)).toBe('2시간')
    expect(formatRemaining(3 * 24 * 60 * MIN + 5 * 60 * MIN)).toBe('3일')
  })

  it('en', () => {
    expect(formatRemaining(30_000, 'en')).toBe('less than a minute')
    expect(formatRemaining(5 * 60 * MIN + 20 * MIN, 'en')).toBe('5h 20m')
    expect(formatRemaining(3 * 24 * 60 * MIN, 'en')).toBe('3d')
  })
})
