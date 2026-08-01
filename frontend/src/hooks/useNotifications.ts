import { useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  getPopupNotifications,
  markAsRead,
  markAllAsRead,
} from '../api/notification'
import { notificationStream } from '../utils/notificationStream'

const PAGE_SIZE = 20

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'infinite'] as const,
  popups: () => [...notificationKeys.all, 'popups'] as const,
}

/**
 * 공지사항 무한 스크롤 조회
 *
 * 실시간 갱신은 SSE(useNotificationStream)가 담당한다.
 * refetchInterval은 SSE가 끊겨 있을 때만 동작하는 폴백 폴링.
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
    refetchInterval: () => (notificationStream.connected ? false : 1000 * 60 * 5),
    refetchOnWindowFocus: false,
  })
}

/**
 * 홈 팝업 공지 (관리자가 팝업으로 지정한 활성 공지)
 *
 * 비로그인 방문자도 봐야 하므로 토큰 없이도 조회한다.
 * 전역 기본값(staleTime 5분 + refetchOnMount false)은 "캐시 우선"이라 여기엔 맞지 않는다 —
 * 방금 올라온 공지를 놓치지 않도록 홈에 들어올 때마다/앱으로 돌아올 때마다 다시 확인한다.
 * 응답은 최대 5건이라 비용이 거의 없고, 실시간 갱신은 SSE(['notifications'] invalidate)가 함께 돕는다.
 */
export const usePopupNotices = () =>
  useQuery({
    queryKey: notificationKeys.popups(),
    queryFn: getPopupNotifications,
    staleTime: 1000 * 30, // 짧은 중복 진입만 캐시로 흡수
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 1,
  })

/**
 * 알림 SSE 실시간 스트림 연결 (항상 떠 있는 컴포넌트에서 한 번만 호출)
 *
 * 새 공지/개인 알림이 push되면 알림 쿼리를 invalidate해 뱃지·목록이
 * 즉시 갱신된다. 로그아웃 상태에서는 연결하지 않는다.
 */
export const useNotificationStream = (enabled: boolean) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) {
      notificationStream.stop()
      return
    }
    notificationStream.start(queryClient)
    return () => notificationStream.stop()
  }, [enabled, queryClient])
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
