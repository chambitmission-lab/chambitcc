// 레일 위젯이 함께 쓰는 이번주 기도 통계 쿼리.

import { useQuery } from '@tanstack/react-query'
import { API_V1, apiFetch } from '../../../../config/api'
import { prayerStatsKeys } from '../../../../hooks/queryKeys'

interface WeeklyPrayerStats {
  week_start: string
  week_end: string
  prayers_today: number
  prayers_week: number
  amens_week: number
  answered_week: number
  emotions: { emotion: string; count: number }[]
  // 아래 둘은 신버전 백엔드에서만 내려온다 — 없으면 차트·진행률을 숨긴다
  daily?: { date: string; prayers: number; amens: number }[]
  amen_goal?: number
}

// 이번주(월~일 KST) 실측 집계 — 구버전 백엔드에는 없으므로 실패 시 폴백 경로를 탄다
const useWeeklyPrayerStats = () =>
  useQuery({
    queryKey: prayerStatsKeys.weekly(),
    queryFn: async (): Promise<WeeklyPrayerStats> => {
      const res = await apiFetch(`${API_V1}/prayers/stats/weekly`)
      if (!res.ok) throw new Error('주간 기도 현황을 불러오지 못했습니다')
      const json = await res.json()
      return json.data as WeeklyPrayerStats
    },
    // 서버도 5분 캐시라 더 자주 물어봐야 새 숫자가 없다 — 15분이면 충분
    staleTime: 1000 * 60 * 15,
    retry: 1,
  })

// ── 분리 전 같은 파일에 있던 형제 모듈이 쓴다 ──
export { useWeeklyPrayerStats }
export type { WeeklyPrayerStats }
