// Pastor API — 목회자 영역(/pastor). 서버가 is_pastor 로 지킨다 (관리자라도 목회자가 아니면 403)
import { request } from './utils/request'
import type { DashboardMetric } from './admin'

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
}

export const fetchPastorHome = async (): Promise<PastorHomeData> => {
  const json = await request<{ data: PastorHomeData }>('/pastor/home', {
    auth: 'required',
    errorMessage: '목회자 홈을 불러오는데 실패했습니다',
  })
  return json.data
}
