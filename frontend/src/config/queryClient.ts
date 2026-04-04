// React Query 설정 with 캐시 영구 저장
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7일 캐시 유지 (오프라인 대응)
      retry: (failureCount, error: any) => {
        // 네트워크 에러는 재시도하지 않음 (캐시 사용)
        if (error?.message?.includes('Failed to fetch') || 
            error?.message?.includes('Network request failed') ||
            error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          return false
        }
        return failureCount < 1
      },
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 리페치 비활성화
      refetchOnMount: false, // 캐시 우선 전략 (오프라인 PWA 대응)
      refetchOnReconnect: true, // 네트워크 재연결 시 자동 업데이트
    },
    mutations: {
      retry: 0, // Mutation은 재시도하지 않음 (Optimistic Update 사용)
    },
  },
})
