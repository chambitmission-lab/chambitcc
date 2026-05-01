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
 * - staleTime 1시간: 한 주 단위 데이터라 너무 자주 다시 부를 필요가 없다.
 * - gcTime 6시간: 화면을 잠시 떠났다 와도 즉시 보이게.
 * - 백엔드도 프로세스 메모리에 캐싱하지만, 그건 Gemini 재호출 방지용이고
 *   브라우저 측 즉시 응답은 React Query 캐시가 맡는다.
 */
export const useWeeklyStory = (enabled = true) => {
  return useQuery<WeeklyStoryResponse>({
    queryKey: weeklyStoryKeys.all,
    queryFn: () => getWeeklyStory(),
    staleTime: 1000 * 60 * 60, // 1h
    gcTime: 1000 * 60 * 60 * 6, // 6h
    enabled,
    retry: 1,
  })
}
