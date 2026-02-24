// Prayer API 호출 함수들
import { API_V1, apiFetch } from '../config/api'
import type { 
  PrayerListResponse, 
  CreatePrayerRequest, 
  PrayerResponse,
  SortType,
  Prayer,
  ReplyListResponse,
  CreateReplyRequest,
  ReplyResponse
} from '../types/prayer'

// 기도 요청 목록 조회 (비로그인 가능)
export const fetchPrayers = async (
  page: number = 1,
  limit: number = 20,
  sort: SortType = 'popular',
  groupId?: number | null
): Promise<PrayerListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
  })

  // 그룹 ID가 있으면 쿼리 파라미터에 추가
  if (groupId !== undefined && groupId !== null) {
    params.append('group_id', groupId.toString())
  }

  const headers: HeadersInit = {}
  const token = localStorage.getItem('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await apiFetch(`${API_V1}/prayers?${params}`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('기도 요청을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 기도 요청 생성 (로그인 필수)
export const createPrayer = async (
  data: CreatePrayerRequest
): Promise<PrayerResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('기도 요청 등록에 실패했습니다')
  }

  return response.json()
}

// 기도했어요 (로그인 필수)
export const addPrayer = async (
  prayerId: number
): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayers/${prayerId}/pray`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '기도 처리에 실패했습니다')
  }

  return response.json()
}

// 기도 취소 (로그인 필수)
export const removePrayer = async (
  prayerId: number
): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayers/${prayerId}/pray`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '기도 취소에 실패했습니다')
  }

  return response.json()
}

// 기도 요청 상세 조회 (비로그인 가능)
export const fetchPrayerDetail = async (
  prayerId: number
): Promise<Prayer> => {
  const headers: HeadersInit = {}
  
  const token = localStorage.getItem('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await apiFetch(`${API_V1}/prayers/${prayerId}`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('기도 요청을 불러오는데 실패했습니다')
  }

  const result = await response.json()
  return result.data
}

// 댓글 목록 조회 (Single Responsibility: 댓글 조회만 담당)
export const fetchReplies = async (
  prayerId: number,
  page: number = 1,
  limit: number = 50
): Promise<ReplyListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  const headers: HeadersInit = {}
  const token = localStorage.getItem('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await apiFetch(`${API_V1}/prayers/${prayerId}/replies?${params}`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('댓글을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 댓글 작성 (로그인 필수)
export const createReply = async (
  prayerId: number,
  data: CreateReplyRequest
): Promise<ReplyResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayers/${prayerId}/replies`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '댓글 작성에 실패했습니다')
  }

  return response.json()
}

// 기도 요청 삭제 (로그인 필수, 작성자만 가능)
export const deletePrayer = async (
  prayerId: number
): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayers/${prayerId}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '기도 요청 삭제에 실패했습니다')
  }

  return response.json()
}
