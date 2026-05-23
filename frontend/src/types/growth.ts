// 신앙 성장 여정 타입 — backend/app/schemas/growth.py 와 동기화

export interface GrowthTotals {
  prayers: number
  intercessions: number
  answered: number
  prayer_sessions: number
  prayer_minutes: number
  verses_read: number
  chapters_read: number
  books_completed: number
  devotional_notes: number
  highlights: number
  thanks: number
  plan_days: number
  games_completed: number
  quiz_correct: number
  posts: number
}

export interface MonthDelta {
  key: string
  label: string
  icon: string
  this_month: number
  last_month: number
}

export interface StreakInfo {
  current: number
  best: number
}

export interface GrowthMilestone {
  key: string
  icon: string
  label: string
  value?: string | null
}

export interface GrowthSummaryData {
  started_on: string | null
  days_together: number
  headline: string
  sub: string
  totals: GrowthTotals
  deltas: MonthDelta[]
  streak: StreakInfo
  milestones: GrowthMilestone[]
  has_activity: boolean
}

export interface GrowthSummaryResponse {
  success: boolean
  data: GrowthSummaryData
}

// 타임라인 도메인 — 색상/그룹 구분용
export type TimelineDomain =
  | 'prayer'
  | 'bible'
  | 'devotional'
  | 'thanks'
  | 'community'
  | 'game'

export type TimelineType =
  | 'prayer'
  | 'answered'
  | 'session'
  | 'read'
  | 'note'
  | 'thanks'
  | 'plan'
  | 'game'
  | 'post'
  | 'intercession'

export interface TimelineEvent {
  id: string
  type: TimelineType
  domain: TimelineDomain
  occurred_at: string // KST naive ISO
  date: string // YYYY-MM-DD (KST)
  time: string | null // HH:MM (KST), 하루 묶음은 null
  title: string
  snippet?: string | null
  icon: string
  accent: string
  meta: Record<string, unknown>
  link?: string | null
}

export interface GrowthTimelineData {
  events: TimelineEvent[]
  window_start: string
  window_end: string
  next_before: string
  has_more: boolean
}

export interface GrowthTimelineResponse {
  success: boolean
  data: GrowthTimelineData
}
