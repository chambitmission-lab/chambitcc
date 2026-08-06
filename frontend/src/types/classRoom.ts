// 우리반 알림장 — 교회학교 부서(유치부~청년부) 반 단위 소통
// 교사가 공지·암송요절·일정·사진을 올리고, 학부모/멤버가 확인·암송체크·RSVP·댓글로 답한다

export type ClassPostType = 'notice' | 'verse' | 'event' | 'photo' | 'poll'
export type RsvpStatus = 'attending' | 'maybe' | 'not_attending'
export type RemindTarget = 'unchecked' | 'unrecited' | 'no_rsvp' | 'no_vote'

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

export interface PollOption {
  id: number
  text: string
  vote_count: number
  voted_by_me: boolean
}

export interface PollBlock {
  multiple: boolean
  total_voters: number
  options: PollOption[]
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
  poll?: PollBlock | null
  photos: string[]
  publish_at?: string | null
  is_scheduled: boolean
  reminded_at?: string | null
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
  poll?: {
    options: string[]
    multiple: boolean
  } | null
  publish_at?: string | null
}

// ── 투표 현황 (교사) ──
export interface PollOptionVoters {
  option_id: number
  text: string
  voters: RsvpPerson[]
}

export interface PollDetail {
  options: PollOptionVoters[]
  no_response: RsvpPerson[]
}

// ── 콕 찌르기 ──
export interface RemindResult {
  sent: number
  target: RemindTarget
  reminded_at: string
}

// ── 우리반 리포트 (교사) ──
export interface ReportWeekRow {
  week_start: string
  post_count: number
  check_rate: number | null
  recite_rate: number | null
  rsvp_rate: number | null
}

export interface ReportMemberRow {
  user_id: number
  name: string
  child_name?: string | null
  is_teacher: boolean
  check_count: number
  check_total: number
  recite_count: number
  recite_total: number
  star_count: number
  rsvp_responded: number
  rsvp_total: number
  attend_count: number
  last_active_at?: string | null
  attention_flags: string[]
}

export interface ClassReport {
  weeks: number
  period_start: string
  post_count: number
  check_rate: number | null
  recite_rate: number | null
  rsvp_rate: number | null
  trend: ReportWeekRow[]
  members: ReportMemberRow[]
}

// ── 암송 별 랭킹 ──
export interface StarRow {
  user_id: number
  name: string
  child_name?: string | null
  star_count: number
  last_recited_at?: string | null
}

// ── 출석부 (교사) ──
export interface AttendanceMonth {
  month: string
  records: Record<string, number[]> // 날짜(ISO) → 출석 user_id 목록
}

export interface AttendanceToggleResult {
  att_date: string
  user_id: number
  present: boolean
}

// ── 성장 카드 ──
export interface MyGrowth {
  class_name: string
  child_name?: string | null
  joined_at?: string | null
  star_count: number
  attend_count: number
  check_count: number
  recent_verses: string[]
}
