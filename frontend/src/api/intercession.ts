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

/** 내가 이번 달 짝에게 쓴 익명 편지 (도착 전 — 고칠 수 있다) */
export interface IntercessionMyLetter {
  body: string
  updated_at: string
  deliver_on: string // 이 날 아침에 도착
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
  letter: IntercessionMyLetter | null
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
  unread_letters: number
  church: { participants: number; cycle_prayers: number }
}

/** 도착한 익명 편지 — 보낸 사람 정보는 오지 않는다 */
export interface IntercessionLetter {
  id: number
  body: string
  month_start: string // 어느 달의 기도였는지
  delivered_at: string
  is_read: boolean
}

export interface IntercessionLetterList {
  items: IntercessionLetter[]
  unread: number
}

/** [관리자] 신고된 편지 — 운영자만 보낸 사람을 본다 */
export interface IntercessionLetterReport {
  id: number
  body: string
  report_reason: string | null
  reported_at: string
  month_start: string
  sender_name: string
  receiver_name: string
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
  cycle_letters: number
  pending_reports: number
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

export const saveIntercessionLetter = (body: string) =>
  request<IntercessionState>(`${BASE}/letter`, {
    method: 'PUT',
    json: { body },
    auth: 'required',
    errorMessage: '편지를 저장하지 못했습니다',
  })

export const deleteIntercessionLetter = () =>
  request<IntercessionState>(`${BASE}/letter`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '편지를 지우지 못했습니다',
  })

export const getIntercessionLetters = () =>
  request<IntercessionLetterList>(`${BASE}/letters`, {
    auth: 'required',
    errorMessage: '편지를 불러오지 못했습니다',
  })

export const readIntercessionLetter = (id: number) =>
  request<IntercessionLetterList>(`${BASE}/letters/${id}/read`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '편지를 열지 못했습니다',
  })

export const reportIntercessionLetter = (id: number, reason: string | null) =>
  request<IntercessionLetterList>(`${BASE}/letters/${id}/report`, {
    method: 'POST',
    json: { reason },
    auth: 'required',
    errorMessage: '신고하지 못했습니다',
  })

export const getIntercessionLetterReports = () =>
  request<IntercessionLetterReport[]>(`${BASE}/admin/reports`, {
    auth: 'required',
    errorMessage: '신고 목록을 불러오지 못했습니다',
  })

export const resolveIntercessionLetterReport = (id: number, restore: boolean) =>
  request<IntercessionLetterReport[]>(`${BASE}/admin/reports/${id}/${restore ? 'restore' : 'dismiss'}`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '신고를 처리하지 못했습니다',
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
