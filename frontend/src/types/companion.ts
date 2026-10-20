// 동행 — 두 성도가 한 주 목표를 합산으로 함께 채운다 (backend/app/schemas/companion.py 와 동기화)
export type CompanionGoalType = 'reading' | 'typing' | 'prayer'
export type CompanionStatus = 'pending' | 'active' | 'ended'

export interface CompanionUser {
  id: number
  name: string
  avatar_url: string | null
}

export interface CompanionWeek {
  week_start: string // YYYY-MM-DD (월요일)
  goal_type: CompanionGoalType
  goal_amount: number
  /** 둘의 합산 — 화면에 숫자로 보이는 건 이것뿐 */
  total: number
  /** 발자국 색을 나누는 데만 쓴다(사람별 숫자는 보이지 않는다) */
  mine: number
  partner: number
  achieved: boolean
}

export interface CompanionCheerState {
  /** 오늘(KST) 내가 짝을 위해 기도했는지 */
  by_me_today: boolean
  /** 오늘 짝이 나를 위해 기도했는지 */
  by_partner_today: boolean
  /** 함께한 동안 서로를 위해 기도한 횟수(둘 합산) */
  total: number
}

export interface CompanionSummary {
  id: number
  status: CompanionStatus
  partner: CompanionUser
  is_inviter: boolean
  goal_type: CompanionGoalType
  goal_amount: number
  week: CompanionWeek | null
  together_weeks: number
  lit_weeks: number
  cheer: CompanionCheerState | null
  created_at: string
  started_at: string | null
}

export interface CompanionDetail extends CompanionSummary {
  days_left: number
  history: CompanionWeek[]
  /** 이번 주 기도제목 — 이 짝 둘에게만 보인다 */
  my_topic: string | null
  partner_topic: string | null
}

export interface CompanionHome {
  active: CompanionSummary[]
  incoming: CompanionSummary[]
  outgoing: CompanionSummary[]
}

export interface CompanionGoal {
  goal_type: CompanionGoalType
  goal_amount: number
}
