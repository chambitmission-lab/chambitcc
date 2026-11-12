import type {
  GrowthRewind,
  GrowthSummaryResponse,
  GrowthTimelineResponse,
} from '../types/growth'
import { request, requestData } from './utils/request'

/** 신앙 여정 요약 (성장의 증거) */
export const getGrowthSummary = async (): Promise<GrowthSummaryResponse> => {
  return request<GrowthSummaryResponse>('/growth/summary', { auth: 'required', errorMessage: '신앙 여정 요약을 불러오지 못했어요' })
}

/** 신앙 여정 타임라인 (시간순 활동 로그) */
export const getGrowthTimeline = async (
  before?: string,
  days = 60,
): Promise<GrowthTimelineResponse> => {
  const params = new URLSearchParams()
  if (before) params.set('before', before)
  params.set('days', String(days))
  return request<GrowthTimelineResponse>(`/growth/timeline?${params.toString()}`, { auth: 'required', errorMessage: '활동 기록을 불러오지 못했어요' })
}

/** 다시 꺼내보는 기록 — 그때 오늘의 내 기록 + 응답 기다리는 기도 + 마음에 담아 둔 말씀 */
export const getGrowthRewind = (): Promise<GrowthRewind> =>
  requestData('/growth/rewind', { auth: 'required', errorMessage: '지난 기록을 불러오지 못했어요' })
