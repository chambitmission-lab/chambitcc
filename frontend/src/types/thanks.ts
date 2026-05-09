// 오늘의 감사 (Small Thanks Thread) 타입 정의

export type ThanksEmotion = 'joy' | 'peace' | 'awe' | 'love' | 'laugh'

export const THANKS_EMOTIONS: Record<ThanksEmotion, { emoji: string; label: string; labelEn: string }> = {
  joy: { emoji: '😊', label: '기쁨', labelEn: 'Joy' },
  peace: { emoji: '🕊️', label: '평안', labelEn: 'Peace' },
  awe: { emoji: '✨', label: '감격', labelEn: 'Awe' },
  love: { emoji: '💗', label: '사랑', labelEn: 'Love' },
  laugh: { emoji: '😄', label: '웃음', labelEn: 'Laugh' },
}

export interface Thanks {
  id: number
  user_id: number
  display_name: string
  content: string
  emotion?: ThanksEmotion | null
  amen_count: number
  is_mine: boolean
  is_amened: boolean
  created_at: string
  time_ago: string
}

export interface ThanksListResponse {
  success: boolean
  data: {
    items: Thanks[]
    page: number
    limit: number
    total: number
  }
}

export interface CreateThanksRequest {
  content: string
  emotion?: ThanksEmotion | null
}

export interface ThanksDetailResponse {
  success: boolean
  message?: string
  data: Thanks
}

export interface ThanksAmenResponse {
  success: boolean
  is_amened: boolean
  amen_count: number
}
