// Prayer 관련 타입 정의
export interface Prayer {
  id: number
  display_name: string
  title: string
  content: string
  prayer_count: number
  reply_count: number
  is_prayed: boolean
  created_at: string
  time_ago: string
}

export interface PrayerListResponse {
  success: boolean
  data: {
    items: Prayer[]
    page: number
    limit: number
    total: number
  }
}

export interface CreatePrayerRequest {
  title: string
  content: string
  display_name: string
  is_fully_anonymous: boolean
  fingerprint: string
}

export interface PrayerResponse {
  success: boolean
  message: string
  data: Prayer
}

export type SortType = 'popular' | 'latest'
