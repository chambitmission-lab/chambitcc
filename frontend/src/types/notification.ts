// 공지사항 타입 정의

export interface Notification {
  id: number
  title: string
  content: string
  created_at: string
  updated_at?: string
  is_active: boolean
  is_read?: boolean  // 로그인 사용자의 읽음 상태
}

export interface CreateNotificationRequest {
  title: string
  content: string
  is_active?: boolean
}

export interface UpdateNotificationRequest {
  title?: string
  content?: string
  is_active?: boolean
}

export interface UnreadCountResponse {
  unread_count: number
}
