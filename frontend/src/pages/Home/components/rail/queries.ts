// 레일 위젯이 함께 쓰는 이번주 기도 통계 쿼리.

import { useQuery } from '@tanstack/react-query'
import { request } from '../../../../api/utils/request'
import { prayerStatsKeys } from '../../../../hooks/queryKeys'
import { useHomeRailPending } from '../../../../hooks/useHomeRail'
import type { WeeklyPrayerStats } from '../../../../types/weeklyPrayerStats'

// 이번주(월~일 KST) 실측 집계 — 구버전 백엔드에는 없으므로 실패 시 폴백 경로를 탄다.
// 홈 레일 묶음(useHomeRail)이 같은 키에 심어 주는 동안은 단건 요청을 미룬다(캐시가 있으면 그대로 보인다).
const useWeeklyPrayerStats = () => {
  const railPending = useHomeRailPending()
  return useQuery({
    queryKey: prayerStatsKeys.weekly(),
    queryFn: async (): Promise<WeeklyPrayerStats> => {
      const json = await request<{ data: WeeklyPrayerStats }>('/prayers/stats/weekly', {
        errorMessage: '주간 기도 현황을 불러오지 못했습니다',
      })
      return json.data
    },
    enabled: !railPending,
    // 서버도 5분 캐시라 더 자주 물어봐야 새 숫자가 없다 — 15분이면 충분
    staleTime: 1000 * 60 * 15,
    retry: 1,
  })
}

// ── 분리 전 같은 파일에 있던 형제 모듈이 쓴다 ──
export { useWeeklyPrayerStats }
export type { WeeklyPrayerStats }
