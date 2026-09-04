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
  /** 그 날 읽은 멤버 user_id — members 와 조인해 얼굴 스택을 그린다 (구버전 백엔드는 없음) */
  reader_ids?: number[]
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
  /** 오늘 일차를 읽은 멤버 수 */
  today_read_count?: number
  /** 전원 읽음 연속 일수 */
  group_streak?: number
  /** 전원이 읽은 일차 수(누적) */
  all_read_days?: number
  /** 아침 알림 "HH:MM" */
  reminder_time?: string | null
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

export interface RoomUpdateRequest {
  title?: string
  description?: string
  emoji?: string
  /** "HH:MM" — 빈 문자열이면 해제 */
  reminder_time?: string
}

export interface SplitPreview {
  total_verses: number
  total_days: number
  avg_verses_per_day: number
  est_minutes_per_day: number
  sample_titles: string[]
}

export type RoomReactionKey = 'grace' | 'comfort' | 'challenge' | 'question' | 'thanks'

export interface DayReaction {
  reaction: RoomReactionKey
  count: number
  mine: boolean
  names: string[]
}

export interface VerseMark {
  book_number: number
  chapter: number
  verse: number
  count: number
  mine: boolean
  names: string[]
}

export interface RoomDayDetail {
  day_number: number
  reader_ids: number[]
  reactions: DayReaction[]
  verse_marks: VerseMark[]
  nudge_sent: boolean
  unread_count: number
}
