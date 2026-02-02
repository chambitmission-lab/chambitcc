// Prayer 관련 타입 정의
export interface Prayer {
  id: number
  display_name: string
  title: string
  content: string
  title_en?: string  // 영어 번역 제목
  content_en?: string  // 영어 번역 내용
  prayer_count: number
  reply_count: number
  is_prayed: boolean
  is_owner?: boolean  // 내가 작성한 기도인지
  created_at: string
  time_ago: string
}

export interface PrayerDetailResponse {
  success: boolean
  data: Prayer
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
  display_name?: string  // 선택 (기본값: "익명")
  is_fully_anonymous: boolean
}

export interface PrayerResponse {
  success: boolean
  message: string
  data: Prayer
}

export type SortType = 'popular' | 'latest'

// Reply 관련 타입 정의
export interface Reply {
  id: number
  display_name: string
  content: string
  created_at: string
  time_ago: string
}

export interface ReplyListResponse {
  success: boolean
  data: {
    items: Reply[]
    page: number
    limit: number
  }
}

export interface CreateReplyRequest {
  content: string
  display_name?: string  // 선택 (기본값: "익명")
}

export interface ReplyResponse {
  success: boolean
  message: string
  data: Reply
}
