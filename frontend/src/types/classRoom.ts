// 우리반 알림장 — 교회학교 부서(유치부~청년부) 반 단위 소통
// 교사가 공지·암송요절·일정·사진을 올리고, 학부모/멤버가 확인·암송체크·RSVP·댓글로 답한다

export type ClassPostType = 'notice' | 'verse' | 'event' | 'photo'
export type RsvpStatus = 'attending' | 'maybe' | 'not_attending'

export interface ClassMember {
  user_id: number
  name: string
  avatar_url?: string | null
  is_teacher: boolean
  child_name?: string | null
  joined_at: string
}

export interface ClassSummary {
  id: number
  name: string
  department: string
  description?: string | null
  invite_code?: string | null // 멤버에게만 노출
  member_count: number
  teacher_names: string[]
  is_teacher: boolean
  last_post_at?: string | null
  created_at: string
}

export interface ClassDetail extends ClassSummary {
  members: ClassMember[]
}

export interface ClassPreview {
  id: number
  name: string
  department: string
  description?: string | null
  member_count: number
  teacher_names: string[]
  is_member: boolean
}

export interface VerseBlock {
  book_number: number
  chapter: number
  verse_start: number
  verse_end?: number | null
  reference: string
  text: string
  week_label?: string | null
}

export interface EventBlock {
  start_at: string
  end_at?: string | null
  location?: string | null
  rsvp_deadline?: string | null
  attending_count: number
  maybe_count: number
  not_attending_count: number
  my_status?: RsvpStatus | null
}

export interface ClassPost {
  id: number
  class_id: number
  post_type: ClassPostType
  title?: string | null
  content: string
  is_pinned: boolean
  author_id: number
  author_name: string
  author_avatar_url?: string | null
  author_is_teacher: boolean
  is_mine: boolean
  created_at: string
  updated_at?: string | null
  check_count: number
  checked_by_me: boolean
  comment_count: number
  recite_count: number
  recited_by_me: boolean
  verse?: VerseBlock | null
  event?: EventBlock | null
  photos: string[]
}

export interface ClassPostListResponse {
  items: ClassPost[]
  total: number
}

export interface CheckPerson {
  user_id: number
  name: string
  child_name?: string | null
  checked_at?: string | null
}

export interface CheckStatus {
  checked: CheckPerson[]
  unchecked: CheckPerson[]
}

export interface RecitationRow {
  user_id: number
  name: string
  child_name?: string | null
  created_at: string
}

export interface RsvpPerson {
  user_id: number
  name: string
  child_name?: string | null
}

export interface RsvpDetail {
  attending: RsvpPerson[]
  maybe: RsvpPerson[]
  not_attending: RsvpPerson[]
  no_response: RsvpPerson[]
}

export interface ClassComment {
  id: number
  post_id: number
  user_id: number
  author_name: string
  avatar_url?: string | null
  content: string
  is_mine: boolean
  created_at: string
  updated_at?: string | null
}

export interface ClassCreateRequest {
  name: string
  department: string
  description?: string | null
}

export interface ClassPostCreateRequest {
  post_type: ClassPostType
  title?: string | null
  content: string
  is_pinned?: boolean
  verse?: {
    book_number: number
    chapter: number
    verse_start: number
    verse_end?: number | null
    week_label?: string | null
  } | null
  event?: {
    start_at: string
    end_at?: string | null
    location?: string | null
    rsvp_deadline?: string | null
  } | null
}
