// 알림 관련 React Query 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUnreadCount, markAsRead, markAllAsRead } from '../api/notification'

// Query Keys
export const notificationKeys = {
  all: ['notifications'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

/**
 * 읽지 않은 알림 개수 조회
 */
export const useUnreadCount = () => {
  const token = localStorage.getItem('access_token')
  
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    enabled: !!token, // 로그인 상태일 때만 실행
    staleTime: 1000 * 30, // 30초간 fresh 상태 유지
    refetchInterval: 1000 * 60, // 1분마다 자동 갱신
    refetchOnMount: false, // 마운트 시 중복 호출 방지 (StrictMode 대응)
    refetchOnWindowFocus: true, // 창 포커스 시 갱신
  })
}

/**
 * 알림 읽음 처리
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      // 읽지 않은 개수 캐시 무효화
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
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
      // 읽지 않은 개수 캐시 무효화
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
    },
  })
}

/**
 * 알림 개수 수동 갱신
 */
export const useRefreshUnreadCount = () => {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
  }
}
