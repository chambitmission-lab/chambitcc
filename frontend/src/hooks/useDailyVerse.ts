import { useQuery } from '@tanstack/react-query'
import { getTodayVerse } from '../api/dailyVerse'

export const useDailyVerse = () => {
  return useQuery({
    queryKey: ['dailyVerse', 'today'],
    queryFn: getTodayVerse,
    staleTime: 1000 * 60 * 60 * 24, // 24시간 동안 캐시 유지 (하루 1회 변경되는 데이터)
    retry: false, // 404 에러 시 재시도 안 함
  })
}
