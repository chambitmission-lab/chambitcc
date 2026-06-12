// 주간 기도 스토리 — React Query 훅
import { useQuery } from '@tanstack/react-query'
import { getWeeklyStory } from '../api/weeklyStory'
import type { WeeklyStoryResponse } from '../types/weeklyStory'

export const weeklyStoryKeys = {
  all: ['weekly-story'] as const,
}

/**
 * 주간 기도 스토리 페이로드 조회.
 *
 * - staleTime 10분: 10분 이내 재진입은 캐시 반환, 10분 후 재진입 시 최신 데이터 fetch.
 * - gcTime 30분: 화면을 잠시 떠났다 와도 즉시 보이게.
 * - 백엔드도 동일하게 5분 캐시 → React Query 만료 후 재요청해도 DB 재집계 없이 응답.
 */
export const useWeeklyStory = (enabled = true) => {
  return useQuery<WeeklyStoryResponse>({
    queryKey: weeklyStoryKeys.all,
    queryFn: () => getWeeklyStory(),
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 30,   // 30분
    enabled,
    retry: 1,
  })
}
