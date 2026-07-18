// 공동 묵상방 — 초대 링크로 모이는 소그룹 공동 묵상
import type { PlanPassage } from './biblePlan'

export interface RoomMember {
  user_id: number
  name: string
  avatar_url?: string | null
  is_admin: boolean
}

export interface RoomDay {
  day_number: number
  title?: string | null
  passages: PlanPassage[]
  date?: string | null
  post_count: number
  read_count: number
  read_by_me: boolean
}

export type RoomStatus = 'upcoming' | 'active' | 'finished'

export interface RoomSummary {
  id: number
  title: string
  description?: string | null
  emoji?: string | null
  start_date: string
  total_days: number
  current_day: number
  status: RoomStatus
  member_count: number
  is_member: boolean
  is_admin: boolean
  invite_code?: string | null
  today_reference?: string | null
  today_read_by_me: boolean
  my_read_count: number
}

export interface RoomDetail extends RoomSummary {
  members: RoomMember[]
  days: RoomDay[]
}

export interface RoomPreview {
  id: number
  title: string
  description?: string | null
  emoji?: string | null
  start_date: string
  total_days: number
  status: RoomStatus
  member_count: number
  member_names: string[]
  is_member: boolean
  first_reference?: string | null
}

export type RoomPostType = 'meditation' | 'prayer'

export interface RoomPost {
  id: number
  room_id: number
  day_number: number
  post_type: RoomPostType
  content: string
  user_id: number
  name: string
  avatar_url?: string | null
  like_count: number
  reply_count: number
  liked_by_me: boolean
  is_mine: boolean
  created_at: string
}

export interface RoomPostListResponse {
  total: number
  items: RoomPost[]
}

export interface RoomReply {
  id: number
  user_id: number
  name: string
  avatar_url?: string | null
  content: string
  created_at: string
  is_mine: boolean
}

export interface RoomCreateRequest {
  title: string
  description?: string | null
  emoji?: string | null
  book_number: number
  chapter_start: number
  chapter_end: number
  total_days: number
  start_date?: string | null
}
