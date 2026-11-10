import { describe, expect, it } from 'vitest'
import type { ElectionRulePreset, ElectionRules } from '../../types/election'
import { presetForTitle, rulesKey, rulesSummary } from './electionShared'

const base: ElectionRules = {
  threshold_num: 2,
  threshold_den: 3,
  threshold_basis: 'ballots',
  threshold_comparison: 'gte',
  max_select: null,
  runoff_rule: 'top_multiple',
  runoff_multiple: 2,
  runoff_min_num: 1,
  runoff_min_den: 10,
  result_visibility: 'after_close',
  quorum_num: 0,
  quorum_den: 2,
  allow_abstain: false,
  blank_in_base: true,
}

const preset = (id: number, name: string, rules: Partial<ElectionRules> = {}): ElectionRulePreset => ({
  id,
  name,
  rules: { ...base, ...rules },
})

describe('직분별 당선 기준', () => {
  it('선거 이름에 들어 있는 가장 긴 직분 이름의 기준을 고른다', () => {
    const presets = [preset(1, '집사'), preset(2, '안수집사'), preset(3, '장로')]
    expect(presetForTitle(presets, '2026 안수집사 선출')?.id).toBe(2)
    expect(presetForTitle(presets, '2026 장로 선출')?.id).toBe(3)
    expect(presetForTitle(presets, '2026 권사 선출')).toBeNull()
    expect(presetForTitle(undefined, '장로')).toBeNull()
  })

  it('키 순서가 달라도 같은 기준이면 같은 열쇠가 나온다', () => {
    const shuffled = Object.fromEntries(Object.entries(base).reverse()) as unknown as ElectionRules
    expect(rulesKey(shuffled)).toBe(rulesKey(base))
    expect(rulesKey({ ...base, quorum_num: 1 })).not.toBe(rulesKey(base))
  })

  it('나머지 기준을 사람 말로 옮긴다', () => {
    const lines = Object.fromEntries(rulesSummary({ ...base, quorum_num: 1, max_select: 3 }).map((l) => [l.label, l.text]))
    expect(lines['한 표에']).toContain('3명까지')
    expect(lines['자리가 남으면']).toContain('2배수')
    expect(lines['성원']).toContain('1/2')
    expect(lines['결과 공개']).toBe('마감 후 공개')
  })
})
