import { API_V1, apiFetch } from '../config/api'
import type {
  GrowthSummaryResponse,
  GrowthTimelineResponse,
} from '../types/growth'

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('로그인이 필요합니다')
  return { Authorization: `Bearer ${token}` }
}

/** 신앙 여정 요약 (성장의 증거) */
export const getGrowthSummary = async (): Promise<GrowthSummaryResponse> => {
  const response = await apiFetch(`${API_V1}/growth/summary`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error('신앙 여정 요약을 불러오지 못했어요')
  }
  return response.json()
}

/** 신앙 여정 타임라인 (시간순 활동 로그) */
export const getGrowthTimeline = async (
  before?: string,
  days = 60,
): Promise<GrowthTimelineResponse> => {
  const params = new URLSearchParams()
  if (before) params.set('before', before)
  params.set('days', String(days))
  const response = await apiFetch(`${API_V1}/growth/timeline?${params.toString()}`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error('활동 기록을 불러오지 못했어요')
  }
  return response.json()
}
