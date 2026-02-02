// Prayer API 호출 함수들
import { API_V1 } from '../config/api'
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

// 기도 요청 목록 조회
export const fetchPrayers = async (
  page: number = 1,
  limit: number = 20,
  sort: SortType = 'popular',
  fingerprint?: string
): Promise<PrayerListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
  })

  const headers: HeadersInit = {}
  if (fingerprint) {
    headers['X-Fingerprint'] = fingerprint
  }

  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_V1}/prayers?${params}`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('기도 요청을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 기도 요청 생성
export const createPrayer = async (
  data: CreatePrayerRequest
): Promise<PrayerResponse> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_V1}/prayers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('기도 요청 등록에 실패했습니다')
  }

  return response.json()
}

// 기도했어요 (Single Responsibility: 기도 추가만 담당)
export const addPrayer = async (
  prayerId: number,
  fingerprint: string
): Promise<{ success: boolean; message: string }> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_V1}/prayers/${prayerId}/pray`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fingerprint }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '기도 처리에 실패했습니다')
  }

  return response.json()
}

// 기도 취소 (Single Responsibility: 기도 취소만 담당)
export const removePrayer = async (
  prayerId: number
): Promise<{ success: boolean; message: string }> => {
  const headers: HeadersInit = {}

  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_V1}/prayers/${prayerId}/pray`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '기도 취소에 실패했습니다')
  }

  return response.json()
}

// 기도 요청 상세 조회
export const fetchPrayerDetail = async (
  prayerId: number,
  fingerprint?: string
): Promise<Prayer> => {
  const headers: HeadersInit = {}
  
  if (fingerprint) {
    headers['X-Fingerprint'] = fingerprint
  }

  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_V1}/prayers/${prayerId}`, {
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
  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_V1}/prayers/${prayerId}/replies?${params}`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('댓글을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 댓글 작성 (Single Responsibility: 댓글 작성만 담당)
export const createReply = async (
  prayerId: number,
  data: CreateReplyRequest
): Promise<ReplyResponse> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_V1}/prayers/${prayerId}/replies`, {
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
