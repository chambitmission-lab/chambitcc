// 주간 기도 스토리 — React Query 훅
import { useQuery } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { getWeeklyStory } from '../api/weeklyStory'
import type { WeeklyStoryResponse } from '../types/weeklyStory'

export const weeklyStoryKeys = {
  all: ['weekly-story'] as const,
}

/**
 * 주간 기도 스토리 페이로드 조회.
 *
 * - staleTime 10분: 10분 이내 재진입은 캐시 반환, 10분 후 재진입 시 최신 데이터 fetch.
 * - gcTime 은 전역 기본(7일) — 예전엔 30분이라 떠나고 30분 뒤 캐시·persist 에서 빠져 매번 콜드였다.
 * - 백엔드도 동일하게 5분 캐시 → React Query 만료 후 재요청해도 DB 재집계 없이 응답.
 */
const WEEKLY_STORY_STALE_MS = 1000 * 60 * 10

/** 프로필 스토리 카드의 목적지 — 훅과 같은 키로 미리 받는다. coldOnly: 캐시가 없을 때만 */
export const prefetchWeeklyStory = (qc: QueryClient, coldOnly = false): void => {
  void qc.prefetchQuery({
    queryKey: weeklyStoryKeys.all,
    queryFn: () => getWeeklyStory(),
    staleTime: coldOnly ? Infinity : WEEKLY_STORY_STALE_MS,
  })
}

export const useWeeklyStory = (enabled = true) => {
  return useQuery<WeeklyStoryResponse>({
    queryKey: weeklyStoryKeys.all,
    queryFn: () => getWeeklyStory(),
    staleTime: WEEKLY_STORY_STALE_MS, // 10분
    enabled,
    retry: 1,
  })
}
