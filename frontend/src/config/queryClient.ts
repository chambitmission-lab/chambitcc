// React Query 설정
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30초간 fresh 상태 유지 (5분 → 30초로 단축)
      gcTime: 1000 * 60 * 30, // 30분간 캐시 유지 (구 cacheTime)
      retry: 1,
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 리페치 비활성화
    },
  },
})
