// 프로필 관련 타입 정의

export interface ProfileStats {
  user_id: number
  username: string
  full_name: string
  activity: {
    this_week_count: number
    total_count: number
    streak_days: number
    total_prayer_time?: number // 분 단위 (선택적, 향후 API 추가)
  }
  content: {
    my_prayers: number
    praying_for: number
    my_replies: number
  }
  bible_reading?: {
    verses_read: number // 읽은 구절 수
    chapters_read: number // 완독한 장 수
    books_completed: string[] // 완독한 책 목록
  }
}

export interface MyPrayer {
  id: number
  title: string
  content: string
  prayer_count: number
  reply_count: number
  created_at: string
  is_active: boolean
}

export interface PrayingFor {
  id: number
  title: string
  content: string
  display_name: string
  prayer_count: number
  prayed_at: string
}

export interface MyReply {
  id: number
  prayer_id: number
  prayer_title: string
  content: string
  display_name: string
  created_at: string
}

export interface ProfileDetail {
  stats: ProfileStats
  my_prayers: MyPrayer[]
  praying_for: PrayingFor[]
  my_replies: MyReply[]
}

export type ProfileTab = 'prayers' | 'praying' | 'replies'
