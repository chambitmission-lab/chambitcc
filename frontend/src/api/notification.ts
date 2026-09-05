// 공지사항 API
import type { Notification, NotificationsResponse, CreateNotificationRequest, UpdateNotificationRequest } from '../types/notification'
import { tokenStore } from '../utils/tokenStore'
import { request, requestRaw, isApiError, type UntypedJson } from './utils/request'

/**
 * 공지사항 목록 조회 (페이지네이션)
 * 로그인 시 읽음 상태 및 unread_count 포함
 */
export const getNotifications = async (params?: {
  page?: number
  limit?: number
}): Promise<NotificationsResponse> => {


  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  const qs = query.toString()

  const data = await request<UntypedJson>(`/notifications${qs ? `?${qs}` : ''}`, { errorMessage: '공지사항을 불러오는데 실패했습니다' })

  return {
    notifications: data.notifications ?? [],
    total: data.total ?? 0,
    unread_count: data.unread_count ?? 0,
    page: data.page ?? params?.page ?? 1,
    has_next: data.has_next ?? false,
  }
}

/**
 * 공지사항 관리 목록 (관리자 전용)
 *
 * 공개용 목록과 달리 비공개 공지까지 포함하고, 개인 알림(기도 응답·타임캡슐 등
 * 시스템이 사용자별로 만든 알림)은 제외한다 — 관리 화면에서 남의 알림을
 * 수정·삭제하는 일이 없도록.
 */
export const getAdminNotifications = async (params?: {
  page?: number
  limit?: number
}): Promise<NotificationsResponse> => {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  const qs = query.toString()

  const data = await request<UntypedJson>(`/notifications/admin${qs ? `?${qs}` : ''}`, { errorMessage: '공지사항을 불러오는데 실패했습니다' })

  return {
    notifications: data.notifications ?? [],
    total: data.total ?? 0,
    unread_count: 0,
    page: data.page ?? params?.page ?? 1,
    has_next: data.has_next ?? false,
  }
}

/**
 * 홈 팝업 공지 조회 (최신순, 최대 5건)
 * 로그인/비로그인 모두 조회 가능 — 로그인 시 is_read 포함
 */
export const getPopupNotifications = async (): Promise<Notification[]> => {
  const data = await request<UntypedJson>('/notifications/popups', { errorMessage: '팝업 공지를 불러오는데 실패했습니다' })
  return Array.isArray(data) ? data : []
}

/**
 * 공지 이미지 업로드 (관리자). multipart/form-data.
 * 업로드만 수행하고, 반환된 URL은 공지 생성/수정 시 image_url로 저장한다.
 */
export const uploadNotificationImage = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)

  const data = await request<UntypedJson>('/notifications/upload-image', {
    method: 'POST',
    body: formData,
    errorMessage: '이미지 업로드에 실패했습니다',
  })
  return data.url as string
}

/**
 * 공지사항 상세 조회 (모든 사용자)
 */
export const getNotificationDetail = async (id: number): Promise<Notification> => {
  return request<Notification>(`/notifications/${id}`, { errorMessage: '공지사항을 불러오는데 실패했습니다' })
}

/**
 * 읽지 않은 알림 개수 조회 (로그인 필수)
 */
export const getUnreadCount = async (): Promise<number> => {
  if (!tokenStore.hasAccess()) {
    return 0
  }

  let data: UntypedJson
  try {
    data = await request<UntypedJson>('/notifications/unread-count', { auth: 'required' })
  } catch (error) {
    if (isApiError(error)) return 0
    throw error
  }
  
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
  await requestRaw(`/notifications/${id}/read`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '읽음 처리에 실패했습니다',
  })
}

/**
 * 모든 알림 읽음 처리 (로그인 필수)
 */
export const markAllAsRead = async (): Promise<void> => {
  await requestRaw('/notifications/read-all', {
    method: 'POST',
    auth: 'required',
    errorMessage: '읽음 처리에 실패했습니다',
  })
}

/**
 * 공지사항 생성 (관리자 전용)
 */
export const createNotification = async (data: CreateNotificationRequest): Promise<Notification> => {
  return request<Notification>('/notifications', {
    method: 'POST',
    json: data,
    errorMessage: '공지사항 생성에 실패했습니다',
  })
}

/**
 * 공지사항 수정 (관리자 전용)
 */
export const updateNotification = async (id: number, data: UpdateNotificationRequest): Promise<Notification> => {
  return request<Notification>(`/notifications/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: '공지사항 수정에 실패했습니다',
  })
}

/**
 * 공지사항 삭제 (관리자 전용)
 */
export const deleteNotification = async (id: number): Promise<void> => {
  await requestRaw(`/notifications/${id}`, { method: 'DELETE', errorMessage: '공지사항 삭제에 실패했습니다' })
}
