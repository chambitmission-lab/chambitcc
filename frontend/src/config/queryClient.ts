// React Query 설정 with 캐시 영구 저장
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
      gcTime: 1000 * 60 * 60 * 24, // 24시간 캐시 유지 (영구 저장용)
      retry: 1,
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 리페치 비활성화
      refetchOnMount: true, // 마운트 시 stale 데이터만 리페치
    },
    mutations: {
      retry: 0, // Mutation은 재시도하지 않음 (Optimistic Update 사용)
    },
  },
})
