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
 * - refetchOnMount 'always': 전역 refetchOnMount:false(queryClient.ts)의 예외.
 *   여정은 묵상·성경읽기·기도 등 여러 활동이 집계되는 파생 데이터라, 각 활동
 *   mutation이 일일이 invalidate하지 않아도 화면 진입 시마다 캐시를 먼저
 *   보여주고 백그라운드에서 최신화한다. (안 그러면 방금 남긴 기록이
 *   재로그인 전까지 안 보이는 문제가 생긴다)
 */
export const useGrowthSummary = (enabled = true) => {
  return useQuery<GrowthSummaryResponse>({
    queryKey: growthKeys.summary,
    queryFn: getGrowthSummary,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
    enabled,
    retry: 1,
  })
}

/**
 * 신앙 여정 타임라인 (무한 스크롤).
 * - pageParam 은 다음 구간을 가리키는 before(YYYY-MM-DD). 최초엔 undefined(최신 구간).
 * - refetchOnMount 'always': 요약과 같은 이유 — 진입 시마다 백그라운드 최신화.
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
    refetchOnMount: 'always',
    enabled,
    retry: 1,
  })
}
