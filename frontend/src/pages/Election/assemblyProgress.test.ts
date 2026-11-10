import { describe, expect, it } from 'vitest'
import type { ElectionSummary } from '../../types/election'
import { assemblyProgress } from './electionShared'

const make = (id: number, patch: Partial<ElectionSummary> = {}): ElectionSummary =>
  ({
    id,
    title: `선거 ${id}`,
    status: 'active',
    assembly_id: 7,
    assembly_title: '2026 공동의회',
    current_round_no: 1,
    current_round_status: 'open',
    can_vote: true,
    has_voted: false,
    ...patch,
  }) as ElectionSummary

describe('assemblyProgress', () => {
  it('함께 열린 투표를 만든 순서로 묶고 다음 투표를 고른다', () => {
    const list = [make(3), make(1, { can_vote: false, has_voted: true }), make(2)]
    const p = assemblyProgress(list, 7, 1)
    expect(p?.title).toBe('2026 공동의회')
    expect(p?.ballots.map((e) => e.id)).toEqual([1, 2, 3])
    expect(p?.left.map((e) => e.id)).toEqual([2, 3])
    expect(p?.next?.id).toBe(2)
  })

  it('지금 보는 선거는 다음 투표가 아니고, 다 마치면 다음이 없다', () => {
    const list = [make(1, { can_vote: false, has_voted: true }), make(2)]
    expect(assemblyProgress(list, 7, 2)?.next).toBeNull()
  })

  it('열린 투표가 하나뿐이거나 단독 선거면 묶지 않는다', () => {
    // 순차 진행: 권사 투표는 아직 열리지 않았다 / 선관위원으로만 보이는 선거는 세지 않는다
    const list = [
      make(1),
      make(2, { current_round_status: null, current_round_no: null, can_vote: false }),
      make(3, { can_vote: false, has_voted: false }),
      make(4, { assembly_id: 9 }),
    ]
    expect(assemblyProgress(list, 7)).toBeNull()
    expect(assemblyProgress(list, null)).toBeNull()
  })
})
