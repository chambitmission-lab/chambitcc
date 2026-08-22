import { useQuery } from '@tanstack/react-query'
import { getLandingStats } from '../api/landing'

// 백엔드 /landing/stats 미배포(404) 환경에서는 조용히 실패 → 호출부가 티커를 숨긴다.
export const useLandingStats = () =>
  useQuery({
    queryKey: ['landing-stats'],
    queryFn: getLandingStats,
    staleTime: 1000 * 60 * 10,
    retry: false,
  })
