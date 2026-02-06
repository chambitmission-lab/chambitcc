// 공지사항 API
import { API_V1, apiFetch } from '../config/api'
import type { Notification, NotificationsResponse, CreateNotificationRequest, UpdateNotificationRequest } from '../types/notification'

/**
 * 공지사항 목록 조회 (모든 사용자)
 * 로그인 시 읽음 상태 및 unread_count 포함
 */
export const getNotifications = async (): Promise<NotificationsResponse> => {
  const token = localStorage.getItem('access_token')
  const headers: HeadersInit = {}
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await apiFetch(`${API_V1}/notifications`, {
    headers
  })
  
  if (!response.ok) {
    throw new Error('공지사항을 불러오는데 실패했습니다')
  }
  
  const data = await response.json()
  
  // 응답 형식 확인 및 처리
  let notifications: Notification[] = []
  let unread_count = 0
  
  if (Array.isArray(data)) {
    notifications = data
  } else if (data && Array.isArray(data.notifications)) {
    notifications = data.notifications
    unread_count = data.unread_count || 0
  } else if (data && Array.isArray(data.data)) {
    notifications = data.data
    unread_count = data.unread_count || 0
  } else if (data && Array.isArray(data.items)) {
    notifications = data.items
    unread_count = data.unread_count || 0
  } else if (data && data.success && Array.isArray(data.data)) {
    notifications = data.data
    unread_count = data.unread_count || 0
  } else {
    console.error('예상치 못한 응답 형식:', data)
  }
  
  return { notifications, unread_count }
}

/**
 * 공지사항 상세 조회 (모든 사용자)
 */
export const getNotificationDetail = async (id: number): Promise<Notification> => {
  const token = localStorage.getItem('access_token')
  const headers: HeadersInit = {}
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await apiFetch(`${API_V1}/notifications/${id}`, {
    headers
  })
  
  if (!response.ok) {
    throw new Error('공지사항을 불러오는데 실패했습니다')
  }
  return response.json()
}

/**
 * 읽지 않은 알림 개수 조회 (로그인 필수)
 */
export const getUnreadCount = async (): Promise<number> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    return 0
  }
  
  const response = await apiFetch(`${API_V1}/notifications/unread-count`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    return 0
  }
  
  const data = await response.json()
  
  // 응답 형식 확인
  if (typeof data === 'number') {
    return data
  } else if (data && typeof data.unread_count === 'number') {
    return data.unread_count
  } else if (data && typeof data.count === 'number') {
    return data.count
  }
  
  return 0
}

/**
 * 알림 읽음 처리 (로그인 필수)
 */
export const markAsRead = async (id: number): Promise<void> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  
  const response = await apiFetch(`${API_V1}/notifications/${id}/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '읽음 처리에 실패했습니다')
  }
}

/**
 * 모든 알림 읽음 처리 (로그인 필수)
 */
export const markAllAsRead = async (): Promise<void> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  
  const response = await apiFetch(`${API_V1}/notifications/read-all`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '읽음 처리에 실패했습니다')
  }
}

/**
 * 공지사항 생성 (관리자 전용)
 */
export const createNotification = async (data: CreateNotificationRequest): Promise<Notification> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '공지사항 생성에 실패했습니다')
  }
  
  return response.json()
}

/**
 * 공지사항 수정 (관리자 전용)
 */
export const updateNotification = async (id: number, data: UpdateNotificationRequest): Promise<Notification> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/notifications/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '공지사항 수정에 실패했습니다')
  }
  
  return response.json()
}

/**
 * 공지사항 삭제 (관리자 전용)
 */
export const deleteNotification = async (id: number): Promise<void> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/notifications/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '공지사항 삭제에 실패했습니다')
  }
}
