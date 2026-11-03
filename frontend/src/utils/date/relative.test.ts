import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calendarDaysSince, getRelativeTime, relativeDayLabel, timeAgo } from './relative'

const NOW = new Date(2026, 10, 3, 12, 0) // 로컬 2026-11-03 12:00
const minutesAgo = (n: number) => new Date(NOW.getTime() - n * 60_000).toISOString()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('timeAgo', () => {
  it('방금 전 → 분 → 시간 → 일', () => {
    expect(timeAgo(minutesAgo(0))).toBe('방금 전')
    expect(timeAgo(minutesAgo(1))).toBe('1분 전')
    expect(timeAgo(minutesAgo(59))).toBe('59분 전')
    expect(timeAgo(minutesAgo(60))).toBe('1시간 전')
    expect(timeAgo(minutesAgo(23 * 60 + 59))).toBe('23시간 전')
    expect(timeAgo(minutesAgo(24 * 60))).toBe('1일 전')
    expect(timeAgo(minutesAgo(10 * 24 * 60))).toBe('10일 전')
  })

  it("미래 시각은 '방금 전', 무효는 ''", () => {
    expect(timeAgo(minutesAgo(-5))).toBe('방금 전')
    expect(timeAgo('bad')).toBe('')
  })

  it('maxDays 를 넘기면 beyond 로', () => {
    const opts = { maxDays: 7, beyond: (d: Date) => `D:${d.getDate()}` }
    expect(timeAgo(minutesAgo(6 * 24 * 60), opts)).toBe('6일 전')
    expect(timeAgo(minutesAgo(7 * 24 * 60), opts)).toBe('D:27')
  })
})

describe('calendarDaysSince / relativeDayLabel', () => {
  it('자정 기준으로 센다 — 어젯밤 11시는 1일 전', () => {
    expect(calendarDaysSince(new Date(2026, 10, 3, 0, 1).toISOString())).toBe(0)
    expect(calendarDaysSince(new Date(2026, 10, 2, 23, 0).toISOString())).toBe(1)
    expect(calendarDaysSince(new Date(2026, 10, 4, 1, 0).toISOString())).toBe(-1)
  })

  it('오늘·어제·그 외', () => {
    const labels = { today: '오늘', yesterday: '어제' }
    const beyond = (iso: string) => `b:${iso.slice(0, 4)}`
    expect(relativeDayLabel(new Date(2026, 10, 3, 1).toISOString(), labels, beyond)).toBe('오늘')
    expect(relativeDayLabel(new Date(2026, 10, 2, 23).toISOString(), labels, beyond)).toBe('어제')
    expect(relativeDayLabel(new Date(2026, 10, 1, 23).toISOString(), labels, beyond)).toBe('b:2026')
    expect(relativeDayLabel('bad', labels, beyond)).toBe('')
  })
})

describe('getRelativeTime', () => {
  it('7일 미만은 상대, 이후는 긴 날짜', () => {
    expect(getRelativeTime(minutesAgo(3))).toBe('3분 전')
    expect(getRelativeTime(minutesAgo(8 * 24 * 60))).toBe('2026년 10월 26일')
  })

  it("무효는 '알 수 없음'", () => {
    expect(getRelativeTime('bad')).toBe('알 수 없음')
  })
})
