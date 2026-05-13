// Event 관련 타입 정의

export type EventCategory = 'worship' | 'meeting' | 'service' | 'special' | 'education' | 'other'
export type AttendanceStatus = 'attending' | 'maybe' | 'not_attending'
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly'

export interface EventAttendance {
  id: number
  user_id: number
  user_name: string
  status: AttendanceStatus
  created_at: string
}

export interface EventComment {
  id: number
  user_id: number
  user_name: string
  content: string
  created_at: string
}

// 이벤트가 속한 소그룹 요약 (백엔드 EventGroupInfo 와 동일)
export interface EventGroupInfo {
  id: number
  name: string
  icon?: string
}

export interface Event {
  id: number
  title: string
  description?: string
  category: EventCategory
  start_datetime: string
  end_datetime: string
  location?: string
  attachment_url?: string
  repeat_type: RepeatType
  repeat_end_date?: string
  is_published: boolean
  attendance_count: number
  views: number
  created_at: string
  updated_at: string
  attendances?: EventAttendance[]
  comments?: EventComment[]
  user_attendance_status?: AttendanceStatus | null
  // 소그룹 전용 모임: null이면 전체 공개
  group_id?: number | null
  group?: EventGroupInfo | null
  // RSVP 마감 시각 (ISO). null이면 마감 없음
  rsvp_deadline?: string | null
}

export interface EventListResponse {
  success: boolean
  data: {
    items: Event[]
    total: number
    page: number
    limit: number
  }
}

export interface EventDetailResponse {
  success: boolean
  data: Event
}

export interface CreateEventRequest {
  title: string
  description?: string
  category: EventCategory
  start_datetime: string
  end_datetime: string
  location?: string
  repeat_type?: RepeatType
  repeat_end_date?: string
  is_published?: boolean
  group_id?: number | null
  rsvp_deadline?: string | null
}

export interface UpdateEventRequest {
  title?: string
  description?: string
  category?: EventCategory
  start_datetime?: string
  end_datetime?: string
  location?: string
  repeat_type?: RepeatType
  repeat_end_date?: string
  is_published?: boolean
  group_id?: number | null
  rsvp_deadline?: string | null
}

export interface AttendEventRequest {
  status: AttendanceStatus
}

export interface CreateCommentRequest {
  content: string
}

export interface ApiResponse {
  success: boolean
  message: string
}
