// Event API 호출 함수들
import { API_V1, apiFetch } from '../config/api'
import type {
  EventListResponse,
  EventDetailResponse,
  CreateEventRequest,
  UpdateEventRequest,
  AttendEventRequest,
  CreateCommentRequest,
  ApiResponse,
  EventCategory,
} from '../types/event'

// 이벤트 목록 조회 (공개, 비로그인 가능)
export const fetchEvents = async (
  startDate?: string,
  endDate?: string,
  category?: EventCategory,
  skip: number = 0,
  limit: number = 20
): Promise<EventListResponse> => {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  })

  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)
  if (category) params.append('category', category)

  const headers: HeadersInit = {}
  const token = localStorage.getItem('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await apiFetch(`${API_V1}/events?${params}`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('이벤트를 불러오는데 실패했습니다')
  }

  const data = await response.json()
  
  // 백엔드가 배열을 직접 반환하는 경우 처리
  if (Array.isArray(data)) {
    return {
      success: true,
      data: {
        items: data,
        total: data.length,
        page: Math.floor(skip / limit) + 1,
        limit: limit,
      }
    }
  }
  
  // 백엔드가 객체로 감싸서 반환하는 경우
  return data
}

// 이벤트 상세 조회 (공개)
export const fetchEventDetail = async (eventId: number): Promise<EventDetailResponse> => {
  const headers: HeadersInit = {}
  const token = localStorage.getItem('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await apiFetch(`${API_V1}/events/${eventId}`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('이벤트를 불러오는데 실패했습니다')
  }

  const data = await response.json()
  
  // 백엔드가 객체를 직접 반환하는 경우 처리
  if (data && !data.success) {
    return {
      success: true,
      data: data
    }
  }
  
  return data
}

// 이벤트 생성 (관리자, 인증 필요)
export const createEvent = async (
  data: CreateEventRequest,
  file?: File
): Promise<EventDetailResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const formData = new FormData()
  formData.append('title', data.title)
  formData.append('category', data.category)
  formData.append('start_datetime', data.start_datetime)
  formData.append('end_datetime', data.end_datetime)
  
  if (data.description) formData.append('description', data.description)
  if (data.location) formData.append('location', data.location)
  if (data.repeat_type) formData.append('repeat_type', data.repeat_type)
  if (data.repeat_end_date) formData.append('repeat_end_date', data.repeat_end_date)
  if (data.is_published !== undefined) formData.append('is_published', String(data.is_published))
  if (file) formData.append('file', file)

  const response = await apiFetch(`${API_V1}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '이벤트 생성에 실패했습니다')
  }

  return response.json()
}

// 이벤트 수정 (관리자)
export const updateEvent = async (
  eventId: number,
  data: UpdateEventRequest
): Promise<EventDetailResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const response = await apiFetch(`${API_V1}/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '이벤트 수정에 실패했습니다')
  }

  return response.json()
}

// 이벤트 삭제 (관리자)
export const deleteEvent = async (eventId: number): Promise<ApiResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const response = await apiFetch(`${API_V1}/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '이벤트 삭제에 실패했습니다')
  }

  return response.json()
}

// 참석 의사 표시 (로그인 필요)
export const attendEvent = async (
  eventId: number,
  data: AttendEventRequest
): Promise<ApiResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const response = await apiFetch(`${API_V1}/events/${eventId}/attend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '참석 의사 표시에 실패했습니다')
  }

  return response.json()
}

// 참석 취소 (로그인 필요)
export const cancelAttendance = async (eventId: number): Promise<ApiResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const response = await apiFetch(`${API_V1}/events/${eventId}/attend`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '참석 취소에 실패했습니다')
  }

  return response.json()
}

// 댓글 작성 (로그인 필요)
export const createEventComment = async (
  eventId: number,
  data: CreateCommentRequest
): Promise<ApiResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const response = await apiFetch(`${API_V1}/events/${eventId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '댓글 작성에 실패했습니다')
  }

  return response.json()
}

// 댓글 삭제 (본인만)
export const deleteEventComment = async (commentId: number): Promise<ApiResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const response = await apiFetch(`${API_V1}/events/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '댓글 삭제에 실패했습니다')
  }

  return response.json()
}

// 전체 이벤트 조회 (관리자, 미공개 포함)
export const fetchAllEvents = async (
  skip: number = 0,
  limit: number = 50
): Promise<EventListResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  })

  const response = await apiFetch(`${API_V1}/events/all?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('이벤트를 불러오는데 실패했습니다')
  }

  const data = await response.json()
  
  // 백엔드가 배열을 직접 반환하는 경우 처리
  if (Array.isArray(data)) {
    return {
      success: true,
      data: {
        items: data,
        total: data.length,
        page: Math.floor(skip / limit) + 1,
        limit: limit,
      }
    }
  }
  
  return data
}
