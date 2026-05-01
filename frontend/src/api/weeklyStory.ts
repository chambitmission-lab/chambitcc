import { API_V1, apiFetch } from '../config/api'
import type { WeeklyStoryResponse } from '../types/weeklyStory'

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('로그인이 필요합니다')
  return { Authorization: `Bearer ${token}` }
}

export const getWeeklyStory = async (
  forceRefresh = false,
): Promise<WeeklyStoryResponse> => {
  const qs = forceRefresh ? '?force_refresh=true' : ''
  const response = await apiFetch(`${API_V1}/prayers/weekly-story${qs}`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error('주간 기도 스토리를 불러오지 못했어요')
  }
  return response.json()
}
