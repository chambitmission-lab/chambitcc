// 공지사항 타입 정의

export interface Notification {
  id: number
  title: string
  content: string
  created_at: string
  updated_at?: string
  is_active: boolean
  is_read?: boolean  // 로그인 사용자의 읽음 상태
  target_user_id?: number | null  // null이면 전체 공지, 있으면 개인 알림
  link_url?: string | null  // 클릭 시 이동할 앱 내 경로 (예: /prayers/12)
  is_popup?: boolean  // 홈 진입 시 전면 팝업으로 노출
  popup_until?: string | null  // 팝업 노출 종료 시각 (KST, null이면 무기한)
  image_url?: string | null  // 본문에 함께 보여줄 이미지
}

export interface NotificationsResponse {
  notifications: Notification[]
  total: number
  unread_count: number
  page: number
  has_next: boolean
}

export interface CreateNotificationRequest {
  title: string
  content: string
  is_active?: boolean
  is_popup?: boolean
  popup_until?: string | null
  image_url?: string | null
}

export interface UpdateNotificationRequest {
  title?: string
  content?: string
  is_active?: boolean
  is_popup?: boolean
  popup_until?: string | null
  image_url?: string | null
}

export interface UnreadCountResponse {
  unread_count: number
}
