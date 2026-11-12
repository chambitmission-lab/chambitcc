// 신앙 성장 여정 — React Query 훅
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import {
  getGrowthRewind,
  getGrowthSummary,
  getGrowthTimeline,
} from '../api/growth'
import type {
  GrowthRewind,
  GrowthSummaryResponse,
  GrowthTimelineResponse,
} from '../types/growth'

import { growthKeys } from './queryKeys'

export { growthKeys }

// gcTime 은 전역 기본(7일)을 따른다 — 예전엔 네 쿼리 모두 30분이라, 여정 화면을 떠나고 30분이
// 지나면 캐시·persist 스냅샷에서 빠져 다음 진입이 매번 콜드(전체 로딩)였다.

const TIMELINE_DAYS = 60
const fetchTimelinePage = ({ pageParam }: { pageParam: unknown }) =>
  getGrowthTimeline(pageParam as string | undefined, TIMELINE_DAYS)
const nextTimelineParam = (lastPage: GrowthTimelineResponse) =>
  lastPage.data.has_more ? lastPage.data.next_before : undefined

/**
 * /growth 첫 화면 데이터(요약·타임라인 첫 구간·다시 꺼내보는 기록)를 훅과 같은 키로 미리 받는다.
 * coldOnly: 유휴 프리로드용 — 캐시가 아예 없을 때만 받는다(최신화는 진입 시 refetchOnMount 몫).
 */
export const prefetchGrowth = (qc: QueryClient, coldOnly = false): void => {
  const stale = (ms: number) => (coldOnly ? Infinity : ms)
  void qc.prefetchQuery({ queryKey: growthKeys.summary, queryFn: getGrowthSummary, staleTime: stale(1000 * 60 * 5) })
  void qc.prefetchInfiniteQuery({
    queryKey: growthKeys.timeline,
    queryFn: fetchTimelinePage,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextTimelineParam,
    staleTime: stale(1000 * 60 * 5),
  })
  void qc.prefetchQuery({ queryKey: growthKeys.rewind, queryFn: getGrowthRewind, staleTime: stale(1000 * 60 * 10) })
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
    refetchOnMount: true,
    enabled,
    retry: 1,
  })
}

/**
 * 최근 N일 활동만 (프로필의 발자국 스트립·주간 스토리 트레이용).
 *
 * /growth 의 무한 타임라인(60일 x 여러 페이지)과 캐시를 분리해 두는 이유:
 * 프로필은 2주치 날짜별 유무만 필요한데 60일 전체를 매 진입마다 받는 건 과하다.
 * 두 카드가 같은 days 값으로 부르므로 React Query 가 요청을 하나로 합친다.
 */
export const useGrowthRecentDays = (days = 14, enabled = true) => {
  return useQuery<GrowthTimelineResponse>({
    queryKey: [...growthKeys.recent, days],
    queryFn: () => getGrowthTimeline(undefined, days),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
    enabled,
    retry: 1,
  })
}

/**
 * 다시 꺼내보는 기록 (그때 오늘의 내 기록·응답 기다리는 기도·마음에 담아 둔 말씀).
 * - 하루 단위로 바뀌는 내용이라 staleTime 10분, 진입 시 백그라운드 최신화(요약과 같은 이유).
 */
export const useGrowthRewind = (enabled = true) => {
  return useQuery<GrowthRewind>({
    queryKey: growthKeys.rewind,
    queryFn: getGrowthRewind,
    staleTime: 1000 * 60 * 10,
    refetchOnMount: true,
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
    queryFn: fetchTimelinePage,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextTimelineParam,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
    enabled,
    retry: 1,
  })
}
