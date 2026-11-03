import { describe, expect, it } from 'vitest'
import { isValidDate, pad2, parseApiDate, parseKstDate } from './parse'

// vitest.config.ts 가 TZ 를 LA 로 둔다 — 테스트 자체가 그 전제를 확인한다.
describe('테스트 타임존', () => {
  it('기기 타임존이 서울이 아니다(서울 고정 로직 검증 전제)', () => {
    expect(new Date('2026-08-05T00:00:00Z').getTimezoneOffset()).not.toBe(-540)
  })
})

describe('parseApiDate', () => {
  it('오프셋 없는 날짜+시각은 KST 로 해석한다', () => {
    expect(parseApiDate('2026-08-05T18:00:00').toISOString()).toBe('2026-08-05T09:00:00.000Z')
  })

  it('Z · +09:00 · +0900 오프셋은 그대로 존중한다', () => {
    expect(parseApiDate('2026-08-05T09:00:00Z').toISOString()).toBe('2026-08-05T09:00:00.000Z')
    expect(parseApiDate('2026-08-05T18:00:00+09:00').toISOString()).toBe('2026-08-05T09:00:00.000Z')
    expect(parseApiDate('2026-08-05T18:00:00+0900').toISOString()).toBe('2026-08-05T09:00:00.000Z')
  })

  it("'YYYY-MM-DD HH:mm' 공백 꼴도 같은 결과", () => {
    expect(parseApiDate(' 2026-08-05 18:00 ').toISOString()).toBe('2026-08-05T09:00:00.000Z')
  })

  it('날짜 전용 문자열은 옛 동작(UTC 자정) 유지', () => {
    expect(parseApiDate('2026-08-05').toISOString()).toBe('2026-08-05T00:00:00.000Z')
  })

  it('무효한 입력은 Invalid Date', () => {
    expect(isValidDate(parseApiDate('not-a-date'))).toBe(false)
    expect(isValidDate(parseApiDate(''))).toBe(false)
  })
})

describe('parseKstDate', () => {
  it('날짜 전용 문자열은 서울 자정으로 못 박는다', () => {
    expect(parseKstDate('2026-08-05').toISOString()).toBe('2026-08-04T15:00:00.000Z')
  })

  it('날짜+시각은 parseApiDate 와 같다', () => {
    expect(parseKstDate('2026-08-05T18:00:00').getTime()).toBe(parseApiDate('2026-08-05T18:00:00').getTime())
    expect(parseKstDate('2026-08-05T18:00:00Z').getTime()).toBe(parseApiDate('2026-08-05T18:00:00Z').getTime())
  })
})

describe('pad2', () => {
  it('한 자리는 0 을 붙이고 두 자리 이상은 그대로', () => {
    expect(pad2(3)).toBe('03')
    expect(pad2(12)).toBe('12')
    expect(pad2(0)).toBe('00')
  })
})
