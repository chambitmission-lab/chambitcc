/**
 * /dev/election-stage — 선거 발표 화면(프로젝터) 미리 보기.
 *
 * 실물(ElectionStage)을 그대로 띄운다. 백엔드·로그인·진행 중인 선거 없이 보려고
 * 표본 데이터만 세웠다. 삽화(`public/images/election/stage-*.webp`)가 아직 없으면
 * CSS 그라데이션 바탕만 뜬다 — 그 상태로도 화면이 서야 한다는 게 이 화면의 약속이다.
 * 프롬프트·구역표: docs/election-stage-bg-prompts.md
 *
 * 손잡이 두 개(득표 가리기 · 발표 화면 끄기)는 여기서도 진짜로 동작한다.
 * '끄기'는 돌아갈 현황판이 없으므로 표본을 처음 상태로 되돌리기만 한다.
 */
import { useState } from 'react'
import ElectionStage from '../Admin/components/ElectionStage'
import type { ElectionAdminDetail, ElectionRules } from '../../types/election'

const RULES: ElectionRules = {
  threshold_num: 2,
  threshold_den: 3,
  threshold_basis: 'ballots',
  threshold_comparison: 'gte',
  max_select: 1,
  runoff_rule: 'top_multiple',
  runoff_multiple: 2,
  runoff_min_num: 1,
  runoff_min_den: 10,
  result_visibility: 'after_close',
}

const NAMES = ['김민수', '이희선', '정민수', '김휘선']
const VOTES = [5, 4, 3, 9]

const BALLOTS = VOTES.reduce((a, b) => a + b, 0)
const REQUIRED = Math.ceil((BALLOTS * 2) / 3)

const ELECTION: ElectionAdminDetail = {
  id: 1,
  title: '2026년 교회 선거',
  seats: 1,
  offline_voter_count: 3,
  status: 'active',
  rules: RULES,
  candidate_count: NAMES.length,
  voter_count: 18,
  current_round_no: 1,
  current_round_status: 'open',
  voted_count: BALLOTS,
  voters_total: 24,
  can_vote: false,
  has_voted: true,
  candidates: NAMES.map((name, i) => ({ id: i + 1, number: i + 1, name })),
  rounds: [
    {
      id: 11,
      round_no: 1,
      status: 'open',
      seats_open: 1,
      max_select: 1,
      candidate_ids: [1, 2, 3, 4],
      rules: RULES,
      voted_count: BALLOTS,
      voters_total: 24,
      result: {
        ballots: BALLOTS,
        voters_total: 24,
        base: BALLOTS,
        required: REQUIRED,
        is_final: false,
        tallies: VOTES.map((votes, i) => ({
          candidate_id: i + 1,
          votes,
          passed: votes >= REQUIRED,
          elected: votes >= REQUIRED,
          tied: false,
        })),
      },
    },
  ],
  voters: [],
  paper_ballots: [],
  runoff_suggestion: [],
  seats_left: 1,
  can_edit_candidates: false,
}

const ElectionStagePreview = () => {
  const [hideTally, setHideTally] = useState(false)

  return (
    <ElectionStage
      election={ELECTION}
      round={ELECTION.rounds[0]}
      hideTally={hideTally}
      onToggleHideTally={() => setHideTally((v) => !v)}
      onExit={() => setHideTally(false)}
      onPickRound={() => {}}
    />
  )
}

export default ElectionStagePreview
