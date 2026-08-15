// Event 데이터 관리 커스텀 훅 - React Query 기반
import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchEvents, fetchEventDetail } from '../api/event'
import type { EventCategory } from '../types/event'

// Query Keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (
    startDate?: string,
    endDate?: string,
    category?: EventCategory,
    groupId?: number,
  ) =>
    [
      ...eventKeys.lists(),
      startDate ?? 'all',
      endDate ?? 'all',
      category ?? 'all',
      groupId ?? 'public',
    ] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (eventId: number) => [...eventKeys.details(), eventId] as const,
}

export const useEvents = (
  startDate?: string,
  endDate?: string,
  category?: EventCategory,
  groupId?: number,
  // 기간·카테고리가 바뀔 때 이전 데이터를 유지한 채 뒤에서 교체할지 (달력 월 이동용).
  // 켜면 새 조회 동안 스켈레톤 대신 직전 화면이 그대로 보인다. 그룹 상세처럼
  // "다른 대상의 데이터가 잠깐이라도 보이면 안 되는" 화면에서는 끈 채로 둔다.
  keepPrevious = false,
) => {
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: eventKeys.list(startDate, endDate, category, groupId),
    queryFn: async ({ pageParam = 0 }) => {
      return await fetchEvents(startDate, endDate, category, pageParam, 20, groupId)
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.items.length < 20) return undefined
      return allPages.length * 20
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5, // 5분
    // refetchOnMount/refetchOnWindowFocus 는 전역 기본을 따른다 — 캐시를 먼저
    // 그리되 stale 이면 백그라운드로 재조회. 여기서 false 로 끄면 캐시(7일 persist)가
    // 한 번 잡힌 뒤 새로 등록된 일정이 사용자 화면에 반영될 계기가 없다.
    placeholderData: keepPrevious ? keepPreviousData : undefined,
  })

  const events = query.data?.pages.flatMap(page => page.data.items) ?? []

  return {
    events,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    hasMore: query.hasNextPage,
    // 다음 페이지를 받아오는 중 (자동 드레인/더보기 버튼의 중복 호출 방지용)
    loadingMore: query.isFetchingNextPage,
    // 지금 보이는 events 가 이전 키의 잔상(placeholder)인지 — 새 기간을 받는 중
    isPlaceholder: query.isPlaceholderData,
    loadMore: () => query.fetchNextPage(),
    refresh: () => queryClient.invalidateQueries({
      queryKey: eventKeys.list(startDate, endDate, category, groupId),
    }),
  }
}

// 이벤트 상세 조회 훅
export const useEventDetail = (eventId: number) => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: async () => {
      const response = await fetchEventDetail(eventId)
      return response.success ? response.data : null
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    event: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refresh: () => queryClient.invalidateQueries({
      queryKey: eventKeys.detail(eventId),
    }),
  }
}
