// 누군가의 기도 — 교회 전체 익명 중보 짝 API
//
// 참여 성도를 원형 사슬로 이어 각자 한 명을 위해 몰래 기도한다. 매월 첫 주일에 짝이 바뀐다.
// 익명 원칙: 나를 위해 기도하는 사람에 대한 정보는 어떤 응답에도 오지 않는다(lamp 는 주별 불빛뿐).
import { request } from './utils/request'

export interface IntercessionCycle {
  id: number
  start_date: string
  end_date: string // 미포함 경계 (다음 주기 시작일)
  theme_key: string | null
  week_count: number
  current_week: number // 0부터
}

export interface IntercessionTargetPrayer {
  id: number
  title: string | null
  preview: string
  time_ago: string
}

/** 내가 이번 달 기도할 분 */
export interface IntercessionTarget {
  user_id: number
  display_name: string
  avatar_url: string | null
  request_line: string | null
  recent_prayers: IntercessionTargetPrayer[]
  prayed_today: boolean
  prayed_days: number
}

export interface IntercessionLampWeek {
  start: string
  end: string
  lit: boolean
  is_current: boolean
  is_future: boolean
}

/** 나를 위한 기도 등불 — 주마다 한 칸 */
export interface IntercessionLamp {
  weeks: IntercessionLampWeek[]
  received_today: boolean
  months_received: number
}

export interface IntercessionState {
  open: boolean
  participant: { status: 'active' | 'paused'; request_line: string | null; joined_at: string } | null
  cycle: IntercessionCycle | null
  next_start_date: string | null
  waiting_reason: 'not_started' | 'gathering' | null
  target: IntercessionTarget | null
  lamp: IntercessionLamp | null
  church: { participants: number; cycle_prayers: number }
}

export interface IntercessionSummary {
  open: boolean
  participants: number
  cycle_prayers: number
  total_prayers: number
  next_start_date: string | null
}

export interface IntercessionAdminOverview {
  open: boolean
  first_cycle_date: string
  cycle: IntercessionCycle | null
  next_start_date: string | null
  active_participants: number
  paused_participants: number
  linked_givers: number
  unlinked_active: number
  cycle_prayers: number
  total_prayers: number
  today_givers: number
}

const BASE = '/intercession'

export const getIntercessionSummary = () =>
  request<IntercessionSummary>(`${BASE}/summary`, {
    errorMessage: '누군가의 기도 현황을 불러오지 못했습니다',
  })

export const getMyIntercession = () =>
  request<IntercessionState>(`${BASE}/me`, {
    errorMessage: '누군가의 기도를 불러오지 못했습니다',
  })

export const joinIntercession = (requestLine: string | null) =>
  request<IntercessionState>(`${BASE}/join`, {
    method: 'POST',
    json: { request_line: requestLine },
    auth: 'required',
    errorMessage: '참여하지 못했습니다',
  })

export const updateIntercessionLine = (requestLine: string | null) =>
  request<IntercessionState>(`${BASE}/me`, {
    method: 'PATCH',
    json: { request_line: requestLine },
    auth: 'required',
    errorMessage: '기도제목을 저장하지 못했습니다',
  })

export const pauseIntercession = () =>
  request<IntercessionState>(`${BASE}/pause`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '잠시 쉬기로 바꾸지 못했습니다',
  })

export const prayIntercession = () =>
  request<IntercessionState>(`${BASE}/pray`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '기도를 기록하지 못했습니다',
  })

export const getIntercessionAdminOverview = () =>
  request<IntercessionAdminOverview>(`${BASE}/admin/overview`, {
    auth: 'required',
    errorMessage: '현황을 불러오지 못했습니다',
  })

export const setIntercessionOpen = (open: boolean) =>
  request<IntercessionAdminOverview>(`${BASE}/admin/open`, {
    method: 'PUT',
    json: { open },
    auth: 'required',
    errorMessage: '설정을 바꾸지 못했습니다',
  })

export const startIntercessionNow = () =>
  request<IntercessionAdminOverview>(`${BASE}/admin/start-now`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '주기를 시작하지 못했습니다',
  })
