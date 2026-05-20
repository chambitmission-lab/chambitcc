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

export interface PlanDay {
  id: number
  day_number: number
  title?: string | null
  passages: PlanPassage[]
  reflection_prompt?: string | null
  completed: boolean
  completed_at?: string | null
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
  is_published: boolean
  sort_order: number
  progress?: PlanProgress | null
}

export interface PlanDetail extends PlanSummary {
  days: PlanDay[]
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
  total_days: number
  completed_days: number
  percent: number
  streak_count: number
}

export interface TodayResponse {
  items: TodayReading[]
}

export interface PlanReflection {
  reference: string
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

export interface PlanDayInput {
  day_number: number
  title?: string | null
  passages: PlanPassageInput[]
  reflection_prompt?: string | null
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
  days?: PlanDayInput[]
}

export type PlanUpdateRequest = Partial<PlanCreateRequest>

export interface GenerateScheduleResponse {
  total_days: number
  days: PlanDayInput[]
}
