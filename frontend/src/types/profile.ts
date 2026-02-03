// 프로필 관련 타입 정의

export interface ProfileStats {
  user_id: number
  username: string
  full_name: string
  activity: {
    this_week_count: number
    total_count: number
    streak_days: number
  }
  content: {
    my_prayers: number
    praying_for: number
    my_replies: number
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
