// React Query 설정
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지 (기도 목록은 자주 안 바뀜)
      gcTime: 1000 * 60 * 30, // 30분간 캐시 유지 (구 cacheTime)
      retry: 1,
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 리페치 비활성화
    },
  },
})
