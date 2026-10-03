import { useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import {
  getNotifications,
  getPopupNotifications,
  markAsRead,
  markAllAsRead,
  deleteMyNotification,
} from '../api/notification'
import type { NotificationsResponse } from '../types/notification'
import { tokenStore } from '../utils/tokenStore'
import { notificationStream } from '../utils/notificationStream'
import { refetchIfFewPages } from '../utils/infiniteQueryTrim'
import { notificationKeys } from './queryKeys'

export { notificationKeys }

const PAGE_SIZE = 20

/**
 * 공지사항 무한 스크롤 조회
 *
 * 실시간 갱신은 SSE(useNotificationStream)가 담당한다.
 * refetchInterval은 SSE가 끊겨 있을 때만 동작하는 폴백 폴링.
 */
export const useNotifications = () => {
  const token = tokenStore.getAccess()

  return useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam }) =>
      getNotifications({ page: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.has_next ? lastPage.page + 1 : undefined,
    enabled: !!token,
    staleTime: 0,
    // 헤더·레일·모달 세 곳이 마운트하는 쿼리 — 모달을 열 때마다 내려간 페이지 전부를
    // 순차 재요청하지 않게, 페이지가 적을 때만 마운트 갱신 (실시간은 SSE 가 담당)
    refetchOnMount: refetchIfFewPages(2),
    refetchInterval: () => (notificationStream.connected ? false : 1000 * 60 * 5),
    refetchOnWindowFocus: false,
  })
}

/**
 * 공지 아카이브 — /news '공지' 탭의 지난 공지 목록.
 *
 * 알림함(useNotifications)과 달리 개인 알림을 빼고 전체 공지만 최신순으로 받는다.
 * 비로그인 방문자도 지난 안내를 읽을 수 있어야 하므로 토큰을 요구하지 않는다.
 * 읽음 상태를 쓰지 않으니 SSE 로 안 읽음 뱃지가 갱신돼도 다시 받을 이유가 없다 —
 * 탭을 다시 열 때만 확인한다.
 */
export const useNoticeArchive = (enabled = true) =>
  useInfiniteQuery({
    queryKey: notificationKeys.archive(),
    queryFn: ({ pageParam }) =>
      getNotifications({ page: pageParam as number, limit: PAGE_SIZE, announcementsOnly: true }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
    enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: refetchIfFewPages(2),
    refetchOnWindowFocus: false,
  })

/**
 * 홈 팝업 공지 (관리자가 팝업으로 지정한 활성 공지)
 *
 * 비로그인 방문자도 봐야 하므로 토큰 없이도 조회한다.
 * 전역 staleTime(5분)은 여기엔 길다 —
 * 방금 올라온 공지를 놓치지 않도록 30초만 지나면 홈에 들어올 때마다/앱으로 돌아올 때마다 다시 확인한다.
 * 응답은 최대 5건이라 비용이 거의 없고, 실시간 갱신은 SSE(['notifications'] invalidate)가 함께 돕는다.
 */
export const usePopupNotices = () =>
  useQuery({
    queryKey: notificationKeys.popups(),
    queryFn: getPopupNotifications,
    staleTime: 1000 * 30, // 짧은 중복 진입만 캐시로 흡수
    refetchOnMount: true,
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
 * 내 개인 알림 삭제 — 목록에서 먼저 빼고(낙관적), 실패하면 되돌린다.
 * 안 읽은 알림을 지우면 뱃지 수도 함께 줄인다.
 */
export const useDeleteMyNotification = () => {
  const queryClient = useQueryClient()
  const key = notificationKeys.list()

  return useMutation({
    mutationFn: deleteMyNotification,
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<InfiniteData<NotificationsResponse>>(key)
      if (prev) {
        const target = prev.pages.flatMap((p) => p.notifications).find((n) => n.id === id)
        const unreadDelta = target && !target.is_read ? 1 : 0
        queryClient.setQueryData<InfiniteData<NotificationsResponse>>(key, {
          ...prev,
          pages: prev.pages.map((p) => ({
            ...p,
            notifications: p.notifications.filter((n) => n.id !== id),
            total: Math.max(0, p.total - 1),
            unread_count: Math.max(0, p.unread_count - unreadDelta),
          })),
        })
      }
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
