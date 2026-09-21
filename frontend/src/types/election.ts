// 선거(직분자 선출 투표) 타입 — 백엔드 schemas/election.py 와 짝

export type ElectionStatus = 'draft' | 'active' | 'finished'
export type ElectionRoundStatus = 'open' | 'closed'

export type ThresholdBasis = 'ballots' | 'voters'
export type ThresholdComparison = 'gte' | 'gt'
export type RunoffRule = 'top_multiple' | 'min_share' | 'all'
export type ResultVisibility = 'after_close' | 'live' | 'admin_only'

/** 당선 기준·2차 규칙·공개 범위 — 기본값은 백엔드 services/election_rules.py 한 곳에 있다 */
export interface ElectionRules {
  threshold_num: number
  threshold_den: number
  threshold_basis: ThresholdBasis
  threshold_comparison: ThresholdComparison
  /** null 이면 그 회차의 남은 자리 수만큼 */
  max_select: number | null
  runoff_rule: RunoffRule
  runoff_multiple: number
  runoff_min_num: number
  runoff_min_den: number
  result_visibility: ResultVisibility
}

export interface ElectionCandidate {
  id: number
  number: number
  name: string
  photo_url?: string | null
  bio?: string | null
  /** 결과가 공개되지 않은 화면에서는 null 로 가려진다 */
  elected_round_no?: number | null
}

export interface ElectionTallyRow {
  candidate_id: number
  votes: number
  passed: boolean
  elected: boolean
  tied: boolean
}

export interface ElectionRoundResult {
  ballots: number
  voters_total: number
  base: number
  required: number
  tallies: ElectionTallyRow[]
  is_final: boolean
}

export interface ElectionRound {
  id: number
  round_no: number
  status: ElectionRoundStatus
  seats_open: number
  max_select: number
  candidate_ids: number[]
  rules: ElectionRules
  opened_at?: string | null
  closed_at?: string | null
  voted_count: number
  voters_total: number
  /** 공개 범위 밖이면 없다 */
  result?: ElectionRoundResult | null
}

export interface ElectionSummary {
  id: number
  title: string
  description?: string | null
  notice?: string | null
  seats: number
  offline_voter_count: number
  status: ElectionStatus
  rules: ElectionRules
  candidate_count: number
  voter_count: number
  elected_count?: number | null
  current_round_no?: number | null
  current_round_status?: ElectionRoundStatus | null
  voted_count: number
  voters_total: number
  can_vote: boolean
  has_voted: boolean
  created_at?: string | null
}

export interface ElectionDetail extends ElectionSummary {
  candidates: ElectionCandidate[]
  rounds: ElectionRound[]
}

export interface ElectionVoter {
  user_id: number
  name: string
  has_voted: boolean
}

export interface ElectionPaperBallot {
  id: number
  choices: number[]
}

export interface ElectionAdminDetail extends ElectionDetail {
  voters: ElectionVoter[]
  paper_ballots: ElectionPaperBallot[]
  runoff_suggestion: number[]
  seats_left: number
  can_edit_candidates: boolean
}

export interface ElectionCandidateInput {
  id?: number
  name: string
  photo_url?: string | null
  bio?: string | null
}

export interface ElectionPayload {
  title: string
  description?: string | null
  notice?: string | null
  seats: number
  offline_voter_count: number
  rules: Partial<ElectionRules>
  candidates: ElectionCandidateInput[]
  voter_ids: number[]
}

export interface OpenRoundPayload {
  candidate_ids?: number[]
  max_select?: number
}
