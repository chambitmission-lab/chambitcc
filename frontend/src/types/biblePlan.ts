// 구독형 성경 읽기 플랜 (YouVersion 스타일) 타입
// 주의: 오늘의 묵상 통독표(reading_plans)와는 별개의 bible_plans 시스템

export interface PlanPassage {
  book_number: number
  chapter_start: number
  chapter_end: number
  verse_start?: number | null
  verse_end?: number | null
  book_name_ko?: string | null
  reference?: string | null
}

// 그날의 설교(예: 새벽기도회) — 읽기 분량과 별개인 선택 정보
export interface PlanDaySermon {
  label?: string | null
  passages: PlanPassage[]
  preacher?: string | null
  note?: string | null // 본문 없는 날 — "개인묵상"
}

// 진행 방식 — self_paced(각자 속도, 기본) | calendar(교회 달력 고정)
export type PlanScheduleMode = 'self_paced' | 'calendar'

export interface PlanDay {
  id: number
  day_number: number
  title?: string | null
  passages: PlanPassage[]
  reflection_prompt?: string | null
  completed: boolean
  completed_at?: string | null
  sermon?: PlanDaySermon | null
  // 달력 고정 플랜만 — 이 일차를 읽는 날짜 'YYYY-MM-DD'
  scheduled_date?: string | null
}

export interface PlanProgress {
  subscribed: boolean
  status?: string | null
  start_date?: string | null
  current_day: number
  completed_days: number
  total_days: number
  percent: number
  streak_count: number
  best_streak: number
  last_completed_date?: string | null
  completed_today: boolean
  last_completed_day?: number | null
  // ── 달력 고정 플랜만 ── 오늘 날짜의 일차(시작 전·미등록이면 null) / 밀린 일차 수 / 밀린 첫 일차
  today_day?: number | null
  behind_days?: number
  catch_up_day?: number | null
}

export interface PlanSummary {
  id: number
  slug: string
  title: string
  subtitle?: string | null
  description?: string | null
  category?: string | null
  level?: string | null
  emoji?: string | null
  accent?: string | null
  total_days: number
  day_count: number
  // 구버전 백엔드 응답에는 없을 수 있어 optional — UI 에서 ?? 0 처리
  participant_count?: number
  completed_count?: number
  is_published: boolean
  sort_order: number
  progress?: PlanProgress | null
  // ── 개인 플랜(성도가 직접 만든 "나만의 플랜") 메타 — 구버전 응답엔 없을 수 있어 optional ──
  is_personal?: boolean
  is_owner?: boolean
  owner_name?: string | null
  invite_code?: string | null
  schedule_mode?: PlanScheduleMode
  anchor_date?: string | null // 달력 고정 플랜의 1일차 날짜
}

// 개인 플랜을 함께 읽는 사람 한 명의 진행 상태
export interface PlanParticipant {
  user_id: number
  name: string
  avatar_url?: string | null
  is_owner: boolean
  is_me: boolean
  status: string
  completed_days: number
  percent: number
  streak_count: number
  last_completed_date?: string | null
}

export interface PlanDetail extends PlanSummary {
  days: PlanDay[]
  participants?: PlanParticipant[]
}

export interface PlanListResponse {
  total: number
  items: PlanSummary[]
}

export interface TodayReading {
  plan_id: number
  plan_slug: string
  plan_title: string
  emoji?: string | null
  accent?: string | null
  day_number: number
  day_title?: string | null
  passages: PlanPassage[]
  done_today: boolean
  last_completed_day?: number | null
  total_days: number
  completed_days: number
  percent: number
  streak_count: number
  // 달력 고정 플랜이면 day_number 는 "오늘 날짜의 일차"(없으면 밀린 첫 일차)이고
  // done_today 는 그 일차를 읽었는지다
  schedule_mode?: PlanScheduleMode
  scheduled_date?: string | null
  behind_days?: number
  catch_up_day?: number | null
  sermon?: PlanDaySermon | null
}

export interface TodayResponse {
  items: TodayReading[]
}

export interface PlanReflection {
  reference: string
  reflection: string
  questions: string[]
}

// 관리자 — AI 묵상 직접 수정
export interface PlanReflectionUpdateRequest {
  reflection: string
  questions: string[]
}

// ── 관리자 등록/수정 ──
export interface PlanPassageInput {
  book_number: number
  chapter_start: number
  chapter_end: number
  verse_start?: number | null
  verse_end?: number | null
}

export interface PlanDaySermonInput {
  label?: string | null
  passages: PlanPassageInput[]
  preacher?: string | null
  note?: string | null
}

export interface PlanDayInput {
  day_number: number
  title?: string | null
  passages: PlanPassageInput[]
  reflection_prompt?: string | null
  sermon?: PlanDaySermonInput | null
}

export interface PlanCreateRequest {
  slug: string
  title: string
  subtitle?: string | null
  description?: string | null
  category?: string | null
  level?: string | null
  emoji?: string | null
  accent?: string | null
  is_published: boolean
  sort_order: number
  schedule_mode?: PlanScheduleMode
  anchor_date?: string | null
  days?: PlanDayInput[]
}

export type PlanUpdateRequest = Partial<PlanCreateRequest>

export interface GenerateScheduleResponse {
  total_days: number
  days: PlanDayInput[]
}

// 관리자 — 표 붙여넣기 분석 결과 (저장 안 됨)
export interface ParseScheduleError {
  line: number
  text: string
  message: string
}

export interface ParseScheduleResponse {
  anchor_date?: string | null
  days: PlanDayInput[]
  errors: ParseScheduleError[]
  // 일차 번호(문자열 키) → 설교 본문 표시 문자열
  sermon_references: Record<string, string>
}

// ── 개인 플랜(나만의 플랜) / 초대 ──
export interface PersonalPlanCreateRequest {
  title?: string | null
  book_numbers: number[]
  total_days: number
  emoji?: string | null
  accent?: string | null
  start_date?: string | null
}

export interface PersonalPlanUpdateRequest {
  title?: string
  emoji?: string
  accent?: string
}

export interface PlanInvitePreview {
  id: number
  title: string
  emoji?: string | null
  accent?: string | null
  total_days: number
  owner_name: string
  participant_count: number
  participant_names: string[]
  first_reference?: string | null
  is_member: boolean
}
