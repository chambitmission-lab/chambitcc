import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAsRead, markAllAsRead } from '../api/notification'

const PAGE_SIZE = 20

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'infinite'] as const,
}

/**
 * 공지사항 무한 스크롤 조회
 */
export const useNotifications = () => {
  const token = localStorage.getItem('access_token')

  return useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam }) =>
      getNotifications({ page: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.has_next ? lastPage.page + 1 : undefined,
    enabled: !!token,
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

/**
 * 읽지 않은 알림 개수 (첫 페이지 응답 기준 — 전체 카운트)
 */
export const useUnreadCount = () => {
  const { data } = useNotifications()
  return data?.pages[0]?.unread_count ?? 0
}

/**
 * 알림 읽음 처리
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
    },
  })
}

/**
 * 모든 알림 읽음 처리
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
    },
  })
}

/**
 * 알림 목록 수동 갱신
 */
export const useRefreshNotifications = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
  }
}
