import type { WeeklyStoryResponse } from '../types/weeklyStory'
import { request } from './utils/request'

export const getWeeklyStory = async (
  forceRefresh = false,
): Promise<WeeklyStoryResponse> => {
  const qs = forceRefresh ? '?force_refresh=true' : ''
  return request<WeeklyStoryResponse>(`/prayers/weekly-story${qs}`, { auth: 'required', errorMessage: '주간 기도 스토리를 불러오지 못했어요' })
}
