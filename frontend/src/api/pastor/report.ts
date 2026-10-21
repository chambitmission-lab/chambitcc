// 주간 목양 리포트
import type { VisitKind } from './roster'
import { pastorGet } from './_http'

export interface WeeklyReport {
  week_start: string
  week_end: string
  week_offset: number
  is_current: boolean
  summary: {
    my_visits: number
    my_visits_prev: number
    my_visits_by_kind: Array<{ kind: VisitKind; count: number }>
    my_members_met: number
    team_visits: number
    team_members_met: number
    follow_ups_done: number
    my_prayer_replies: number
    team_prayer_replies: number
    shared_prayers_new: number
    members: number
    with_profile: number
  }
  coverage: {
    window_days: number
    total: number
    covered: number
    rate: number
    districts: Array<{
      district: string
      members: number
      covered: number
      rate: number
      quiet: number
      days_since_visit: number | null
      unvisited_count: number
      unvisited: Array<{
        user_id: number
        name: string
        avatar_url: string | null
        church_title: string | null
        last_visit: string | null
        quiet_days: number | null
      }>
    }>
  }
  emotions: {
    min_sample: number
    enough: boolean
    total: number
    prev_total: number
    this_week: Array<{ key: string; label: string; count: number; prev: number }>
    rising: { key: string; label: string; delta: number } | null
    trend: Array<{ week_start: string; total: number; heavy: number; bright: number }>
  }
}

export const fetchWeeklyReport = (week: number): Promise<WeeklyReport> =>
  pastorGet(`/pastor/report?week=${week}`, '주간 리포트를 불러오는데 실패했습니다')
