import { describe, expect, it } from 'vitest'
import type { ElectionSummary } from '../../../../types/election'
import { liveWords, quorumRequired, spokenDuration, spokenTime } from './liveWords'

const NOW = new Date(2026, 10, 8, 15, 7).getTime()

const base = (over: Partial<ElectionSummary> = {}): ElectionSummary => ({
  id: 1,
  title: '2026 장로 선거',
  seats: 2,
  offline_voter_count: 28,
  status: 'active',
  rules: {
    threshold_num: 2,
    threshold_den: 3,
    threshold_basis: 'ballots',
    threshold_comparison: 'gte',
    max_select: null,
    runoff_rule: 'top_multiple',
    runoff_multiple: 2,
    runoff_min_num: 1,
    runoff_min_den: 3,
    result_visibility: 'after_close',
    quorum_num: 2,
    quorum_den: 3,
    allow_abstain: true,
    blank_in_base: false,
  },
  candidate_count: 5,
  voter_count: 96,
  current_round_no: 2,
  current_round_status: 'open',
  voted_count: 87,
  voters_total: 124,
  can_vote: false,
  has_voted: false,
  round_closes_at: new Date(2026, 10, 8, 15, 30).toISOString(),
  paper_expected: 28,
  paper_in: 0,
  recent_votes: 5,
  recent_minutes: 10,
  ...over,
})

describe('liveWords', () => {
  it('세 카드: 최근 흐름 · 마감 때 예상 · 종이 표', () => {
    const w = liveWords(base(), NOW)
    expect(w.percent).toBe(70)
    expect(w.waiting).toBe(37)
    expect(w.minutesLeft).toBe(23)
    expect(w.quorum).toBe(83)
    expect(w.quorumMet).toBe(true)
    const [recent, projection, paper] = w.cards
    expect(recent).toMatchObject({ label: '최근 10분 동안', value: '5', unit: '명' })
    expect(recent.text).toBe('2분에 1명꼴로 들어오고 있어요.')
    // 87 + 0.5명/분 × 23분 = 98.5 → 99 (반올림)
    expect(projection).toMatchObject({ value: '약 99', tone: 'accent' })
    expect(paper).toMatchObject({ value: '28', unit: '장', tone: 'warn' })
  })

  it('예상이 성원에 못 미치면 경고', () => {
    const w = liveWords(base({ voted_count: 60, recent_votes: 2 }), NOW)
    expect(w.quorumMet).toBe(false)
    expect(w.cards[1].tone).toBe('warn')
    expect(w.cards[1].text).toContain('성원(83명)')
  })

  it('기록이 없거나 마감 시각이 없을 때', () => {
    const w = liveWords(base({ recent_votes: null, recent_minutes: null, round_closes_at: null }), NOW)
    expect(w.minutesLeft).toBeNull()
    expect(w.cards[0].value).toBe('확인 중')
    expect(w.cards[1].value).toBe('정하지 않음')
  })

  it('모두 투표·종이 표 없음·종이 표 다 입력', () => {
    expect(liveWords(base({ voted_count: 124 }), NOW).cards[0].tone).toBe('good')
    expect(liveWords(base({ paper_expected: 0 }), NOW).cards[2].value).toBe('없음')
    expect(liveWords(base({ paper_in: 28 }), NOW).cards[2].value).toBe('모두 입력')
  })

  it('성원을 따지지 않으면 0', () => {
    expect(quorumRequired(base({ rules: { ...base().rules, quorum_num: 0 } }), 124)).toBe(0)
  })
})

describe('spoken', () => {
  it('시각과 길이를 말로', () => {
    expect(spokenTime(new Date(2026, 10, 8, 15, 30))).toBe('오후 3시 30분')
    expect(spokenTime(new Date(2026, 10, 8, 12, 0))).toBe('오후 12시')
    expect(spokenTime(new Date(2026, 10, 8, 9, 5))).toBe('오전 9시 5분')
    expect(spokenDuration(23)).toBe('23분')
    expect(spokenDuration(65)).toBe('1시간 5분')
  })
})
