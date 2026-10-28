/** 이번주(월~일 KST) 기도 현황 실측 집계 — /prayers/stats/weekly, 홈 레일 묶음(/home/rail)의 weekly 조각 */
export interface WeeklyPrayerStats {
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
