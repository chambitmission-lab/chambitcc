// 읽기 플랜 관리 데스크 규칙 — 실제 화면과 dev 미리보기가 같이 쓴다
import type { PlanSummary } from '../../../types/biblePlan'

export type PlanFilter = 'all' | 'published' | 'draft'

export const filterPlans = (plans: PlanSummary[], searchTerm: string, filter: PlanFilter) => {
  const q = searchTerm.trim().toLowerCase()
  return plans.filter((p) => {
    if (filter === 'published' && !p.is_published) return false
    if (filter === 'draft' && p.is_published) return false
    return (
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.subtitle?.toLowerCase().includes(q) ?? false) ||
      (p.category?.toLowerCase().includes(q) ?? false)
    )
  })
}

/** 일정이 덜 채워진 일차 수 — 성도가 그 날엔 읽을 분량이 없다 */
export const missingDays = (p: PlanSummary) => Math.max(0, p.total_days - p.day_count)

/** 완주율(%) — 참여자가 없으면 null */
export const completionRate = (p: PlanSummary) => {
  const n = p.participant_count ?? 0
  return n > 0 ? Math.round(((p.completed_count ?? 0) / n) * 100) : null
}

/** 달력 고정 플랜의 오늘 일차 — 1일차 전이면 음수(D-n), 끝났으면 total 초과 */
export const calendarDayToday = (p: PlanSummary, now = new Date()) => {
  if (p.schedule_mode !== 'calendar' || !p.anchor_date) return null
  const [y, m, d] = p.anchor_date.slice(0, 10).split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((today.getTime() - start.getTime()) / 86400000) + 1
}
