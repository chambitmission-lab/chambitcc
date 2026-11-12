import type { TodayMemory } from '../api/todayChurch'

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
  /** @deprecated 서버가 더는 채우지 않는다(2026-09-01). 아이콘은 GrowthIcons 가 key/type 으로 고른다 */
  icon?: string
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
  /** @deprecated 서버가 더는 채우지 않는다(2026-09-01). 아이콘은 GrowthIcons 가 key/type 으로 고른다 */
  icon?: string
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
  | 'meditation'
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
  /** @deprecated 서버가 더는 채우지 않는다(2026-09-01). 아이콘은 GrowthIcons 가 key/type 으로 고른다 */
  icon?: string
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
// 말씀 여정 단계 키 — 인사이트 API 는 삭제(2026-11-12), 단계 아이콘(JourneyStageGlyph)만 남아 쓴다
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

// =========================================================================
// 다시 꺼내보는 기록 (backend app/services/growth/rewind.py, 2026-11-12 인사이트 대체)
// =========================================================================
/** 아직 응답을 기다리는 내 기도 — 쓴 지 2주~1년, 오래된 순 */
export interface WaitingPrayer {
  id: number
  title: string | null
  text: string
  created_date: string
  /** 기도한 지 며칠 */
  days: number
  prayer_count: number
}

/** 마음에 담아 둔 말씀 — 밑줄·노트·즐겨찾기·같은 구절 묵상 수로 고른 순 */
export interface HeldVerse {
  reference: string
  text: string
  book_number: number
  chapter: number
  verse: number
  highlight: boolean
  note: boolean
  favorite: boolean
  meditations: number
  /** 처음 담은 날 (YYYY-MM-DD) */
  since: string | null
}

export interface GrowthRewind {
  date: string
  memories: TodayMemory[]
  waiting: WaitingPrayer[]
  verses: HeldVerse[]
}
