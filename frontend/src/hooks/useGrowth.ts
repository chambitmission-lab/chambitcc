// 신앙 성장 여정 — React Query 훅
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getGrowthSummary, getGrowthTimeline } from '../api/growth'
import type {
  GrowthSummaryResponse,
  GrowthTimelineResponse,
} from '../types/growth'

export const growthKeys = {
  summary: ['growth', 'summary'] as const,
  timeline: ['growth', 'timeline'] as const,
}

/**
 * 신앙 여정 요약.
 * - staleTime 5분: 활동에 따라 바뀌지만 과하게 다시 부르지 않도록.
 */
export const useGrowthSummary = (enabled = true) => {
  return useQuery<GrowthSummaryResponse>({
    queryKey: growthKeys.summary,
    queryFn: getGrowthSummary,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled,
    retry: 1,
  })
}

/**
 * 신앙 여정 타임라인 (무한 스크롤).
 * - pageParam 은 다음 구간을 가리키는 before(YYYY-MM-DD). 최초엔 undefined(최신 구간).
 */
export const useGrowthTimeline = (enabled = true) => {
  return useInfiniteQuery<GrowthTimelineResponse>({
    queryKey: growthKeys.timeline,
    queryFn: ({ pageParam }) =>
      getGrowthTimeline(pageParam as string | undefined, 60),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.data.has_more ? lastPage.data.next_before : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled,
    retry: 1,
  })
}
