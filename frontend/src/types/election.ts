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
  /** 성원 — 재적 중 이 비율 이상이 투표해야 한다 (0 이면 확인 안 함) */
  quorum_num: number
  quorum_den: number
  /** 앱에서 기권 표를 낼 수 있는지 */
  allow_abstain: boolean
  /** 기권·무효표를 당선 기준의 분모(투표수)에 넣는지 */
  blank_in_base: boolean
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
  /** 아래는 2026-10 이후 마감분부터 — 옛 회차 사본에는 없다 */
  app_ballots?: number | null
  paper_ballots?: number | null
  valid_ballots?: number | null
  abstain_ballots?: number | null
  invalid_ballots?: number | null
  /** 0 이면 성원을 따지지 않음 */
  quorum_required?: number | null
  quorum_met?: boolean | null
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
  /** 예약 마감 */
  closes_at?: string | null
  is_practice?: boolean
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
  /** 내가 이 선거의 선거관리위원(또는 관리자)인지 — 현황판을 열 수 있다 */
  is_manager?: boolean
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
  /** 현재 회차에 종이 투표용지를 받았는지 (has_voted 도 참) */
  paper_issued?: boolean
}

export type BallotKind = 'valid' | 'abstain' | 'invalid'

export interface ElectionPaperBallot {
  id: number
  kind?: BallotKind
  choices: number[]
}

export interface ElectionManager {
  user_id: number
  name: string
}

export interface ElectionAuditLog {
  id: number
  actor_name: string
  action: string
  summary: string
  created_at: string
}

/** 명부·선관위원 고르기용 회원 — 동명이인을 가를 단서 포함 */
export interface RosterPoolMember {
  id: number
  name: string
  username: string
  church_title?: string | null
  district?: string | null
  birth_year?: number | null
  phone_tail?: string | null
}

export interface ElectionAdminDetail extends ElectionDetail {
  voters: ElectionVoter[]
  paper_ballots: ElectionPaperBallot[]
  runoff_suggestion: number[]
  seats_left: number
  can_edit_candidates: boolean
  managers?: ElectionManager[]
  /** 현재 회차에 넣을 수 있는 종이 표 (앱 미사용 선거인 + 교부 수) */
  paper_allowance?: number
  /** 기준·명부·후보 수정·삭제 (관리자만 — 선관위원은 진행만) */
  can_manage_setup?: boolean
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
  manager_ids: number[]
}

export interface OpenRoundPayload {
  candidate_ids?: number[]
  max_select?: number
  /** 예약 마감 (ISO) */
  closes_at?: string | null
  practice?: boolean
  notify?: boolean
}
