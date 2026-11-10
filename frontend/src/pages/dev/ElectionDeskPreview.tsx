/**
 * /dev/election-desk — PC 선거 관리(중계 스코어보드 + 말로 풀기) 미리 보기.
 *
 * 실물(ElectionDesk)을 표본 데이터로 띄운다. 관리자 로그인·진행 중인 선거 없이 배치를 보려는 것.
 * ?v=empty 면 선거 없음, ?v=quiet 면 진행 중 투표 없이 목록만. 버튼은 동작하지 않는다(표본).
 * PC 화면 전용이라 1024px 이상에서 볼 것.
 */
import { useSearchParams } from 'react-router-dom'
import ElectionDesk from '../Admin/components/electionDesk/ElectionDesk'
import type { ElectionRules, ElectionSummary } from '../../types/election'

const RULES: ElectionRules = {
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
}
const MAJORITY: ElectionRules = { ...RULES, threshold_num: 1, threshold_den: 2, threshold_comparison: 'gt' }

const minutesFromNow = (m: number) => new Date(Date.now() + m * 60000).toISOString()

const base = {
  description: null,
  notice: null,
  can_vote: false,
  has_voted: false,
  is_manager: true,
}

const SAMPLE: ElectionSummary[] = [
  {
    ...base,
    id: 1,
    title: '2026 장로 선거',
    seats: 2,
    offline_voter_count: 28,
    status: 'active',
    rules: RULES,
    candidate_count: 5,
    voter_count: 96,
    elected_count: 1,
    current_round_no: 2,
    current_round_status: 'open',
    voted_count: 87,
    voters_total: 124,
    round_opened_at: minutesFromNow(-67),
    round_closes_at: minutesFromNow(23),
    paper_expected: 28,
    paper_in: 0,
    recent_votes: 5,
    recent_minutes: 10,
  },
  {
    ...base,
    id: 2,
    title: '2026 권사 선거',
    seats: 3,
    offline_voter_count: 28,
    status: 'active',
    rules: MAJORITY,
    candidate_count: 7,
    voter_count: 96,
    elected_count: 2,
    current_round_no: 1,
    current_round_status: 'closed',
    voted_count: 118,
    voters_total: 124,
  },
  {
    ...base,
    id: 3,
    title: '2026 안수집사 선거',
    seats: 4,
    offline_voter_count: 28,
    status: 'draft',
    rules: RULES,
    candidate_count: 9,
    voter_count: 96,
    elected_count: 0,
    current_round_no: null,
    current_round_status: null,
    voted_count: 0,
    voters_total: 124,
  },
  {
    ...base,
    id: 4,
    title: '2025 장로 선거',
    seats: 2,
    offline_voter_count: 34,
    status: 'finished',
    rules: RULES,
    candidate_count: 4,
    voter_count: 84,
    elected_count: 2,
    current_round_no: 3,
    current_round_status: 'closed',
    voted_count: 109,
    voters_total: 118,
  },
]

const ElectionDeskPreview = () => {
  const [params] = useSearchParams()
  const v = params.get('v')
  const elections =
    v === 'empty' ? [] : v === 'quiet' ? SAMPLE.filter((e) => e.current_round_status !== 'open') : SAMPLE
  const noop = () => {}
  return (
    <div className="min-h-screen bg-[var(--app-canvas)]">
      <ElectionDesk
        elections={elections}
        loadingEdit={null}
        onAssemblies={noop}
        onNew={noop}
        onBoard={noop}
        onEdit={noop}
        onCopyLink={noop}
        onDelete={noop}
      />
    </div>
  )
}

export default ElectionDeskPreview
