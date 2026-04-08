// Event 데이터 관리 커스텀 훅 - React Query 기반
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchEvents, fetchEventDetail } from '../api/event'
import type { EventCategory } from '../types/event'

// Query Keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (startDate?: string, endDate?: string, category?: EventCategory) =>
    [...eventKeys.lists(), startDate ?? 'all', endDate ?? 'all', category ?? 'all'] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (eventId: number) => [...eventKeys.details(), eventId] as const,
}

export const useEvents = (
  startDate?: string,
  endDate?: string,
  category?: EventCategory
) => {
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: eventKeys.list(startDate, endDate, category),
    queryFn: async ({ pageParam = 0 }) => {
      return await fetchEvents(startDate, endDate, category, pageParam, 20)
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.items.length < 20) return undefined
      return allPages.length * 20
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const events = query.data?.pages.flatMap(page => page.data.items) ?? []

  return {
    events,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    hasMore: query.hasNextPage,
    loadMore: () => query.fetchNextPage(),
    refresh: () => queryClient.invalidateQueries({
      queryKey: eventKeys.list(startDate, endDate, category),
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
