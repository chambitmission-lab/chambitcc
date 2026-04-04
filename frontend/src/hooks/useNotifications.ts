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
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    refetchInterval: 1000 * 60 * 5, // 5분마다 자동 갱신
    refetchOnMount: false, // 마운트 시 중복 호출 방지 (StrictMode 대응)
    refetchOnWindowFocus: false, // 창 포커스 시 갱신 비활성화 (공지사항은 자주 변경되지 않음)
  })
}

/**
 * 읽지 않은 알림 개수만 조회
 * useNotifications의 캐시된 데이터에서 추출
 */
export const useUnreadCount = () => {
  const queryClient = useQueryClient()
  const token = localStorage.getItem('access_token')
  
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      // 먼저 캐시된 notifications 데이터 확인
      const cachedData = queryClient.getQueryData(notificationKeys.list())
      if (cachedData && typeof cachedData === 'object' && 'unread_count' in cachedData) {
        return cachedData.unread_count as number
      }
      
      // 캐시가 없으면 API 호출
      const data = await getNotifications()
      return data.unread_count
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    refetchInterval: 1000 * 60 * 5, // 5분마다 자동 갱신
    refetchOnMount: false,
    refetchOnWindowFocus: false, // 창 포커스 시 갱신 비활성화
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
      // 알림 목록 및 개수 캐시 무효화
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
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
      // 알림 목록 및 개수 캐시 무효화
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
    },
  })
}

/**
 * 알림 목록 및 개수 수동 갱신
 */
export const useRefreshNotifications = () => {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
  }
}
