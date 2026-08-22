// 비로그인 랜딩 공개 통계 (backend/app/schemas/landing.py 와 1:1)
export interface LandingStats {
  year: number
  members: number
  verses_read_total: number
  verses_read_year: number
  prayers_total: number
  prayers_week: number
  prayed_together: number
  answered_prayers: number
  sermons: number
  plan_completions: number
  thanks: number
  meditations: number
  generated_at: string
}
