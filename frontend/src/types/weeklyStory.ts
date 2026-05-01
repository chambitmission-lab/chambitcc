// 주간 기도 스토리 타입 — backend/app/schemas/weekly_story.py와 동기화
import type { PrayerEmotion } from './prayer'

export interface WeeklyHook {
  headline: string
  sub: string
  prayer_count: number
  answered_count: number
  new_prayer_count: number
}

export interface WeeklyPrayerSummary {
  id: number
  title: string
  snippet: string
  emotion?: PrayerEmotion
  is_answered: boolean
  prayer_count: number
}

export interface WeeklyDayCard {
  date: string  // YYYY-MM-DD
  weekday: string  // 월/화/...
  weekday_index: number  // 0=월
  prayer_count: number
  new_prayer_count: number
  is_peak: boolean
  emotions: PrayerEmotion[]
  prayers: WeeklyPrayerSummary[]
}

export interface WeeklyEmotionStat {
  key: PrayerEmotion
  label: string
  count: number
}

export interface WeeklyEmotionShift {
  distribution: WeeklyEmotionStat[]
  early_dominant?: PrayerEmotion | null
  late_dominant?: PrayerEmotion | null
  shift_message?: string | null
}

export interface WeeklyHighlight {
  prayer: WeeklyPrayerSummary
  reason: string
}

export interface WeeklyAnswered {
  prayers: WeeklyPrayerSummary[]
  headline: string
}

export interface WeeklyAINarrative {
  title: string
  body: string
  verse_reference?: string | null
  verse_text?: string | null
  fallback: boolean
}

export interface WeeklyStoryData {
  week_start: string
  week_end: string
  hook: WeeklyHook
  days: WeeklyDayCard[]
  emotion_shift?: WeeklyEmotionShift | null
  highlight?: WeeklyHighlight | null
  answered?: WeeklyAnswered | null
  ai_narrative: WeeklyAINarrative
  has_activity: boolean
  cached: boolean
}

export interface WeeklyStoryResponse {
  success: boolean
  data: WeeklyStoryData
}
