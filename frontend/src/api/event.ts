// Event API 호출 함수들
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
import { request, type UntypedJson } from './utils/request'

// 이벤트 목록 조회
// - groupId 미지정 → 전체 공개 이벤트만
// - groupId 지정 → 해당 그룹 이벤트만 (해당 그룹 멤버여야 함, 토큰 필요)
export const fetchEvents = async (
  startDate?: string,
  endDate?: string,
  category?: EventCategory,
  skip: number = 0,
  limit: number = 20,
  groupId?: number
): Promise<EventListResponse> => {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  })

  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)
  if (category) params.append('category', category)
  if (groupId !== undefined && groupId !== null) {
    params.append('group_id', String(groupId))
  }


  const data = await request<UntypedJson>(`/events?${params}`, { errorMessage: '이벤트를 불러오는데 실패했습니다' })
  
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
  const data = await request<UntypedJson>(`/events/${eventId}`, { errorMessage: '이벤트를 불러오는데 실패했습니다' })
  
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
  if (data.group_id !== undefined && data.group_id !== null) {
    formData.append('group_id', String(data.group_id))
  }
  if (data.rsvp_deadline) formData.append('rsvp_deadline', data.rsvp_deadline)
  if (file) formData.append('file', file)

  return request<EventDetailResponse>('/events', {
    method: 'POST',
    auth: 'required',
    body: formData,
    errorMessage: '이벤트 생성에 실패했습니다',
  })
}

// 이벤트 수정 (관리자)
export const updateEvent = async (
  eventId: number,
  data: UpdateEventRequest
): Promise<EventDetailResponse> => {
  return request<EventDetailResponse>(`/events/${eventId}`, {
    method: 'PUT',
    auth: 'required',
    json: data,
    errorMessage: '이벤트 수정에 실패했습니다',
  })
}

// 이벤트 삭제 (관리자)
export const deleteEvent = async (eventId: number): Promise<ApiResponse> => {
  return request<ApiResponse>(`/events/${eventId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '이벤트 삭제에 실패했습니다',
  })
}

// 참석 의사 표시 (로그인 필요)
export const attendEvent = async (
  eventId: number,
  data: AttendEventRequest
): Promise<ApiResponse> => {
  return request<ApiResponse>(`/events/${eventId}/attend`, {
    method: 'POST',
    auth: 'required',
    json: data,
    errorMessage: '참석 의사 표시에 실패했습니다',
  })
}

// 참석 취소 (로그인 필요)
export const cancelAttendance = async (eventId: number): Promise<ApiResponse> => {
  return request<ApiResponse>(`/events/${eventId}/attend`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '참석 취소에 실패했습니다',
  })
}

// 댓글 작성 (로그인 필요)
export const createEventComment = async (
  eventId: number,
  data: CreateCommentRequest
): Promise<ApiResponse> => {
  return request<ApiResponse>(`/events/${eventId}/comments`, {
    method: 'POST',
    auth: 'required',
    json: data,
    errorMessage: '댓글 작성에 실패했습니다',
  })
}

// 댓글 삭제 (본인만)
export const deleteEventComment = async (commentId: number): Promise<ApiResponse> => {
  return request<ApiResponse>(`/events/comments/${commentId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '댓글 삭제에 실패했습니다',
  })
}

// 전체 이벤트 조회 (관리자, 미공개 포함)
export const fetchAllEvents = async (
  skip: number = 0,
  limit: number = 50
): Promise<EventListResponse> => {

  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  })

  const data = await request<UntypedJson>(`/events/all?${params}`, { auth: 'required', errorMessage: '이벤트를 불러오는데 실패했습니다' })
  
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
