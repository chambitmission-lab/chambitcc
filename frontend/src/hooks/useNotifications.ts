// 알림 관련 React Query 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAsRead, markAllAsRead } from '../api/notification'

// Query Keys
export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

/**
 * 공지사항 목록 및 읽지 않은 개수 조회
 * /api/v1/notifications 한 번 호출로 두 정보 모두 가져옴
 */
export const useNotifications = () => {
  const token = localStorage.getItem('access_token')
  
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: getNotifications,
    enabled: !!token, // 로그인 상태일 때만 실행
    staleTime: 0, // 항상 stale → 마운트/새로고침 시 재조회
    refetchInterval: 1000 * 60 * 5, // 5분마다 자동 갱신
    refetchOnMount: true, // 새로고침 시 최신 공지 즉시 반영
    refetchOnWindowFocus: false,
  })
}

/**
 * 읽지 않은 알림 개수만 조회
 * useNotifications의 캐시에서 파생 (별도 API 호출 없음)
 */
export const useUnreadCount = () => {
  const { data } = useNotifications()
  return data && typeof data === 'object' && 'unread_count' in data
    ? (data.unread_count as number)
    : 0
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
