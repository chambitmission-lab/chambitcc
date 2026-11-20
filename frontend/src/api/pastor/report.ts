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

// 읽기 플랜 참여·완주 현황 — 진도(완료 일수·마지막 완료일)만, 내용 없음
export type PlanMemberState = 'stalled' | 'not_started' | 'reading' | 'completed'

export interface PlanProgressMember {
  user_id: number
  name: string
  avatar_url: string | null
  state: PlanMemberState
  completed_days: number
  percent: number
  last_completed_date: string | null
  days_since: number | null
  /** 교회 달력 고정 플랜에서 오늘까지 밀린 일수 — 각자 속도 플랜·완주자는 null */
  behind_days: number | null
}

export interface PlanProgressRow {
  id: number
  title: string
  emoji: string | null
  total_days: number
  is_published: boolean
  schedule_mode: 'calendar' | 'self_paced'
  anchor_date: string | null
  expected_day: number | null
  /** 달력 고정 플랜의 마지막 날이 지났다 */
  ended: boolean
  participants: number
  counts: Record<PlanMemberState, number>
  completion_rate: number
  avg_percent: number
  members: PlanProgressMember[]
}

export interface PlanProgress {
  generated_at: string
  stall_days: number
  summary: { plans: number; participants: number; reading: number; completed: number; stalled: number }
  plans: PlanProgressRow[]
}

export const fetchPlanProgress = (): Promise<PlanProgress> =>
  pastorGet('/pastor/plan-progress', '읽기 플랜 현황을 불러오는데 실패했습니다')
