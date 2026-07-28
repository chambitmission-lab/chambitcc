import { API_V1, apiFetch } from '../config/api'
import type {
  WeeklyPrayer,
  WeeklyPrayerListItem,
  WeeklyPrayerItem,
  WeeklyPrayerAmenResponse,
  WeeklyPrayerCreateRequest,
  WeeklyPrayerUpdateRequest,
} from '../types/weeklyPrayer'

const authHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
})

// 로그인 상태면 토큰을 실어 is_amened를 받는다 (비로그인도 조회 가능)
const optionalAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// 이번 주 기도제목 조회 (인증 불필요, 로그인 시 is_amened 포함)
export const getCurrentWeeklyPrayer = async (): Promise<WeeklyPrayer> => {
  const response = await apiFetch(`${API_V1}/weekly-prayers/current`, {
    headers: optionalAuthHeaders(),
  })
  if (!response.ok) {
    if (response.status === 404) throw new Error('NOT_FOUND')
    throw new Error('Failed to fetch current weekly prayer')
  }
  return response.json()
}

// 아카이브 목록 (인증 불필요, 공개된 것만)
export const getWeeklyPrayerList = async (limit = 52): Promise<WeeklyPrayerListItem[]> => {
  const response = await apiFetch(`${API_V1}/weekly-prayers?limit=${limit}`)
  if (!response.ok) throw new Error('Failed to fetch weekly prayer list')
  return response.json()
}

// 특정 주차 상세 (인증 불필요, 로그인 시 is_amened 포함)
export const getWeeklyPrayer = async (id: number): Promise<WeeklyPrayer> => {
  const response = await apiFetch(`${API_V1}/weekly-prayers/${id}`, {
    headers: optionalAuthHeaders(),
  })
  if (!response.ok) throw new Error('Failed to fetch weekly prayer')
  return response.json()
}

// 함께 기도했어요 토글 (로그인 필요)
export const toggleWeeklyPrayerAmen = async (
  itemId: number,
): Promise<WeeklyPrayerAmenResponse> => {
  const response = await apiFetch(`${API_V1}/weekly-prayers/items/${itemId}/amen`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Failed to toggle amen')
  return response.json()
}

// 전체 목록 — 미공개 포함 (관리자)
export const getAllWeeklyPrayers = async (): Promise<WeeklyPrayerListItem[]> => {
  const response = await apiFetch(`${API_V1}/weekly-prayers/admin/all`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Failed to fetch all weekly prayers')
  return response.json()
}

// 등록 (관리자)
export const createWeeklyPrayer = async (
  data: WeeklyPrayerCreateRequest,
): Promise<WeeklyPrayer> => {
  const response = await apiFetch(`${API_V1}/weekly-prayers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    if (response.status === 409) throw new Error('DUPLICATE_WEEK')
    throw new Error('Failed to create weekly prayer')
  }
  return response.json()
}

// 수정 (관리자)
export const updateWeeklyPrayer = async (
  id: number,
  data: WeeklyPrayerUpdateRequest,
): Promise<WeeklyPrayer> => {
  const response = await apiFetch(`${API_V1}/weekly-prayers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    if (response.status === 409) throw new Error('DUPLICATE_WEEK')
    throw new Error('Failed to update weekly prayer')
  }
  return response.json()
}

// 삭제 (관리자)
export const deleteWeeklyPrayer = async (id: number): Promise<void> => {
  const response = await apiFetch(`${API_V1}/weekly-prayers/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Failed to delete weekly prayer')
}

// 붙여넣은 원문 파싱 (관리자, 저장 안 함)
export const parseWeeklyPrayerText = async (
  text: string,
): Promise<WeeklyPrayerItem[]> => {
  const response = await apiFetch(`${API_V1}/weekly-prayers/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) throw new Error('Failed to parse text')
  const data = await response.json()
  return data.items
}
