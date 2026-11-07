// 판 연도(3월~이듬해 2월) 규칙 — 백엔드 bulletin_service.edition_year 와 두 곳에 같은 규칙이 있어
// 경계(2월 말·3월 초)를 테스트로 고정한다. 바꿀 땐 양쪽을 같이.
import { describe, expect, it } from 'vitest'
import type { Bulletin } from '../../../types/bulletin'
import { currentEditionYear, editionYearOf, editionYearText, toIssue } from './bulletinIssue'

const bulletin = (date: string) => ({ id: 1, bulletin_date: `${date}T00:00:00+09:00` }) as Bulletin

describe('editionYearOf', () => {
  it('3월 1일부터 그해 판', () => {
    expect(editionYearOf(2026, 3)).toBe(2026)
    expect(editionYearOf(2026, 12)).toBe(2026)
  })
  it('1·2월은 전해 판(겨울판이 한 해에 묶인다)', () => {
    expect(editionYearOf(2027, 1)).toBe(2026)
    expect(editionYearOf(2027, 2)).toBe(2026)
  })
})

describe('toIssue.edition', () => {
  it('경계 날짜', () => {
    expect(toIssue(bulletin('2027-02-28')).edition).toBe(2026)
    expect(toIssue(bulletin('2027-03-01')).edition).toBe(2027)
  })
  it('기기 시간대와 무관하게 날짜 앞 10자리로 읽는다', () => {
    expect(toIssue(bulletin('2026-03-01')).edition).toBe(2026)
    expect(toIssue(bulletin('2026-02-28')).edition).toBe(2025)
  })
})

describe('currentEditionYear', () => {
  it('KST 기준 — UTC 2월 28일 밤은 KST 3월 1일', () => {
    expect(currentEditionYear(new Date('2027-02-28T16:00:00Z'))).toBe(2027)
    expect(currentEditionYear(new Date('2027-02-28T14:00:00Z'))).toBe(2026)
  })
})

describe('editionYearText', () => {
  it('겨울만 해를 넘겨 표기', () => {
    expect(editionYearText(2026)).toBe('2026')
    expect(editionYearText(2026, 'all')).toBe('2026')
    expect(editionYearText(2026, 'winter')).toBe('2026–27')
    expect(editionYearText(2099, 'winter')).toBe('2099–00')
  })
})
