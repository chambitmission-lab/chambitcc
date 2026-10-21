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
  /** 이 주 바로 앞(더 오래된 쪽)에 쉬어간 주 수 — 지나온 길에 '쉬어간 시간'으로 접어 보인다 */
  rested_before: number
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
  /** 함께 걸은 주(쉬어간 주 제외) — 쉬어간 짝·다시 걷자는 초대에도 예전 기록이 실린다 */
  together_weeks: number
  lit_weeks: number
  cheer: CompanionCheerState | null
  created_at: string
  started_at: string | null
  /** 쉬어간 짝만 — 쉬어가기 한 시각 */
  ended_at: string | null
}

export interface CompanionDetail extends CompanionSummary {
  days_left: number
  history: CompanionWeek[]
  /** 이번 주 기도제목 — 이 짝 둘에게만 보인다 */
  my_topic: string | null
  partner_topic: string | null
  /** 등불이 켜진 주에 바꾼 목표 — 다음 주부터 적용된다 */
  next_goal?: CompanionGoal | null
}

export interface CompanionHome {
  active: CompanionSummary[]
  incoming: CompanionSummary[]
  outgoing: CompanionSummary[]
  /** 쉬어간 짝 — 최근 순. 예전 응답(필드 없음)도 견디게 옵셔널 */
  ended?: CompanionSummary[]
}

export interface CompanionGoal {
  goal_type: CompanionGoalType
  goal_amount: number
}
