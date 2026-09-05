import type {
  FaithJourneyResponse,
  GrowthSummaryResponse,
  GrowthTimelineResponse,
} from '../types/growth'
import { request } from './utils/request'

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

/** 말씀 여정 인사이트 (읽기 동선 기반 영적 자리 진단 — 룰 기반) */
export const getFaithJourneyInsight = async (): Promise<FaithJourneyResponse> => {
  return request<FaithJourneyResponse>('/growth/insight', { auth: 'required', errorMessage: '말씀 여정 인사이트를 불러오지 못했어요' })
}
