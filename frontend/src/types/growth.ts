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
  /** 오늘의 묵상 저널 기록 수 (구버전 백엔드엔 없음) */
  meditations?: number
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
  /** 오늘 활동 완료 여부 — 구버전 백엔드 응답엔 없을 수 있음 */
  active_today?: boolean
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

// =========================================================================
// 말씀 여정 인사이트 (룰 기반 — backend faith_journey_service)
// =========================================================================
export type JourneyStageKey =
  | 'calling'
  | 'galilee'
  | 'origin'
  | 'sinai'
  | 'wilderness'
  | 'canaan'
  | 'zion'
  | 'pilgrim'

/** 읽기 동선의 한 정거장 — 연속으로 읽은 같은 책 묶음 */
export interface JourneyFlowStop {
  book: string
  theme: string
  verses: number
}

/** 지금 단계에 맞게 큐레이션된 추천 말씀 */
export interface JourneyVerse {
  reference: string
  text: string
  reason: string
}

export interface FaithJourneyData {
  has_data: boolean
  stage_key: JourneyStageKey
  stage_title: string
  stage_icon: string
  headline: string
  metaphor: string
  narrative: string
  emotion_note: string | null
  flow: JourneyFlowStop[]
  verses: JourneyVerse[]
}

export interface FaithJourneyResponse {
  success: boolean
  data: FaithJourneyData
}
