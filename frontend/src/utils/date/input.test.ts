import { describe, expect, it } from 'vitest'
import { addMinutes, diffMinutes, joinDT, splitDT, toLocalDatetimeInput } from './input'

describe('datetime-local 입력 값', () => {
  it('toLocalDatetimeInput 은 로컬 필드를 그대로 쓴다', () => {
    expect(toLocalDatetimeInput(new Date(2026, 7, 5, 9, 7))).toBe('2026-08-05T09:07')
  })

  it('addMinutes 는 날짜 경계를 넘는다', () => {
    expect(addMinutes('2026-08-05T23:30', 60)).toBe('2026-08-06T00:30')
    expect(addMinutes('2026-08-05T00:10', -20)).toBe('2026-08-04T23:50')
    expect(addMinutes('', 10)).toBe('')
  })

  it('diffMinutes', () => {
    expect(diffMinutes('2026-08-05T10:30', '2026-08-05T09:00')).toBe(90)
    expect(diffMinutes('2026-08-05T09:00', '2026-08-05T10:30')).toBe(-90)
  })

  it('splitDT / joinDT 왕복', () => {
    expect(splitDT('2026-08-05T18:00')).toEqual({ date: '2026-08-05', time: '18:00' })
    expect(splitDT('')).toEqual({ date: '', time: '' })
    expect(joinDT('2026-08-05', '18:00')).toBe('2026-08-05T18:00')
    expect(joinDT('2026-08-05', '')).toBe('')
  })
})
