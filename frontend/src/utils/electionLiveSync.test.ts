import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { AssemblyBoard, ElectionSummary } from '../types/election'
import { applyElectionUpdate } from './electionLiveSync'

const BOARD_KEY = ['elections', 'assembly-board', 7]

const summary = (id: number, voted: number): ElectionSummary =>
  ({
    id,
    title: `선거 ${id}`,
    current_round_no: 1,
    current_round_status: 'open',
    voted_count: voted,
    voters_total: 100,
  }) as ElectionSummary

const seed = () => {
  const qc = new QueryClient()
  qc.setQueryData<AssemblyBoard>(BOARD_KEY, { id: 7, title: '공동의회', elections: [summary(1, 10), summary(2, 20)] })
  return qc
}

const ballot = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    election_id: 2,
    kind: 'ballot',
    round_no: 1,
    round_status: 'open',
    voted_count: 21,
    voters_total: 100,
    ...over,
  })

describe('applyElectionUpdate — 공동의회 현황판 탭', () => {
  it('표가 들어오면 그 선거의 투표 수만 캐시에서 고친다(다시 받지 않는다)', () => {
    const qc = seed()
    applyElectionUpdate(qc, ballot())
    const board = qc.getQueryData<AssemblyBoard>(BOARD_KEY)
    expect(board?.elections.map((e) => e.voted_count)).toEqual([10, 21])
    expect(qc.getQueryState(BOARD_KEY)?.isInvalidated).toBe(false)
  })

  it('캐시가 다른 회차를 보고 있으면 통째로 다시 받게 한다', () => {
    const qc = seed()
    applyElectionUpdate(qc, ballot({ round_no: 2 }))
    expect(qc.getQueryState(BOARD_KEY)?.isInvalidated).toBe(true)
    expect(qc.getQueryData<AssemblyBoard>(BOARD_KEY)?.elections[1].voted_count).toBe(20)
  })

  it('이 공동의회에 없는 선거의 표는 건드리지 않는다', () => {
    const qc = seed()
    const before = qc.getQueryData<AssemblyBoard>(BOARD_KEY)
    applyElectionUpdate(qc, ballot({ election_id: 99 }))
    expect(qc.getQueryData<AssemblyBoard>(BOARD_KEY)).toBe(before)
  })
})
