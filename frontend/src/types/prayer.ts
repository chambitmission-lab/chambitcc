// Prayer 관련 타입 정의
export interface Prayer {
  id: number
  display_name: string
  title: string
  content: string
  title_en?: string  // 한글→영어 번역 제목
  content_en?: string  // 한글→영어 번역 내용
  title_ko?: string  // 영어→한글 번역 제목
  content_ko?: string  // 영어→한글 번역 내용
  original_language?: string  // 원본 언어 코드 (ko, en, vi 등)
  prayer_count: number
  reply_count: number
  is_prayed: boolean
  is_owner?: boolean  // 내가 작성한 기도인지
  created_at: string
  time_ago: string
  recommended_verses?: RecommendedVerses  // 성경 구절 추천
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

// 성경 구절 추천 타입
export interface BibleVerse {
  reference: string  // 예: "마태복음 11:28"
  text: string       // 성경 구절 내용
  message: string    // 적용 메시지
}

export interface RecommendedVerses {
  summary: string           // 기도 주제 요약
  verses: BibleVerse[]      // 추천 성경 구절 목록
  language: string          // 언어 코드 (ko, en 등)
}

export interface PrayerResponse {
  success: boolean
  message: string
  data: Prayer  // 이제 prayer 객체가 바로 data에 있음
  processing?: boolean  // 백그라운드 처리 중 여부
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
