// 목회자 홈 — 맡겨진 기도·돌봄·이번 주·은혜·맥박·목자 카드를 한 번에
import type { DashboardMetric } from '../admin'
import type { SuggestionData } from './assistant'
import type { FollowUp, PastoralVisit } from './roster'
import { pastorGet } from './_http'

/** 목사님께 맡겨진 기도 — 아직 어느 목회자도 답하지 않은 '목사님과 함께' 기도 */
export interface PastoralPrayerItem {
  id: number
  title: string | null
  excerpt: string
  display_name: string
  avatar_url: string | null
  emotion: string | null
  created_at: string | null
  days_waiting: number | null
  reply_count: number
  prayed_by_me: boolean
  is_answered: boolean
}

export interface PastorHeart {
  days: number
  emotions: {
    min_sample: number
    enough: boolean
    total: number
    items: Array<{ key: string; label: string; count: number; prev: number }>
    rising: { key: string; label: string; delta: number } | null
  }
  chapters: Array<{ book_number: number; chapter: number; book_name: string; readers: number }>
  /** 0~23시 기도 등록 + '기도했어요' 수 — 표본이 적으면 null */
  hours: number[] | null
}

export interface PastorHomeData {
  generated_at: string
  pastoral: {
    waiting_count: number
    replied_recent: number
    replied_window_days: number
    items: PastoralPrayerItem[]
  }
  care: {
    quiet_days: number
    members: number
    quiet_count: number
    bands: Array<{ label: string; count: number }>
    quiet_preview: Array<{
      user_id: number
      name: string
      avatar_url: string | null
      days_since: number | null
      band: string
      last_seen: string | null
    }>
    newcomer_days: number | null
    newcomer_count: number
    newcomer_preview: Array<{
      user_id: number
      name: string
      avatar_url: string | null
      days_since_join: number | null
      done: number
      steps: number
    }>
  }
  week: {
    events: Array<{
      id: number
      title: string
      category: string
      start: string | null
      end: string | null
      location: string | null
    }>
    latest_sermon: {
      id: number
      title: string
      pastor: string
      bible_verse: string | null
      sermon_date: string | null
    } | null
  }
  grace: {
    days: number
    count: number
    items: Array<{
      id: number
      title: string | null
      excerpt: string
      testimony: string | null
      display_name: string
      answered_at: string | null
    }>
  }
  pulse: {
    members: number
    weekly: DashboardMetric[]
    trend: Array<{ date: string; active: number }>
  }
  /** 이번 주 성도들의 마음(익명 집계) — 옛 백엔드는 없다 */
  heart?: PastorHeart
  shepherd: {
    birthdays: Array<{
      user_id: number
      name: string
      avatar_url: string | null
      church_title: string | null
      date: string
      days_until: number
      lunar: boolean
    }>
    follow_ups: FollowUp[]
    /** 내 심방 예약 (7일 안 + 지난 예약) */
    plans: Array<PastoralVisit & { overdue: boolean }>
  }
  assistant: SuggestionData
}

export const fetchPastorHome = (): Promise<PastorHomeData> =>
  pastorGet('/pastor/home', '목회자 홈을 불러오는데 실패했습니다')
