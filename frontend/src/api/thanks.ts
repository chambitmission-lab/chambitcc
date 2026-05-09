// 오늘의 감사 API
import { API_V1, apiFetch } from '../config/api'
import type {
  CreateThanksRequest,
  Thanks,
  ThanksAmenResponse,
  ThanksListResponse,
} from '../types/thanks'

const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// 목록 조회 (인증 옵션 — 토큰 있으면 is_mine/is_amened 채워짐)
export const getThanksList = async (page = 1, limit = 10): Promise<ThanksListResponse['data']> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  const response = await apiFetch(`${API_V1}/thanks?${params.toString()}`, {
    headers: { ...authHeaders() },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch thanks')
  }
  const json: ThanksListResponse = await response.json()
  return json.data
}

// 생성 (로그인 필수)
export const createThanks = async (data: CreateThanksRequest): Promise<Thanks> => {
  const response = await apiFetch(`${API_V1}/thanks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to create thanks')
  }
  const json = await response.json()
  return json.data as Thanks
}

// 삭제 (작성자 또는 관리자)
export const deleteThanks = async (id: number): Promise<void> => {
  const response = await apiFetch(`${API_V1}/thanks/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to delete thanks')
  }
}

// 아멘 토글 (로그인 필수)
export const toggleThanksAmen = async (id: number): Promise<ThanksAmenResponse> => {
  const response = await apiFetch(`${API_V1}/thanks/${id}/amen`, {
    method: 'POST',
    headers: { ...authHeaders() },
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to toggle amen')
  }
  return response.json()
}
