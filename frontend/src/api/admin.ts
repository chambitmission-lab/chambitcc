// Admin API
import type { PrayerGroup } from '../types/prayer'
import { request, requestRaw, type UntypedJson } from './utils/request'

// 관리자용 그룹 목록 조회
export interface AdminGroupListResponse {
  success: boolean
  data: {
    items: Array<PrayerGroup & {
      creator_id: number
      creator_name: string
      updated_at: string
    }>
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export const fetchAdminGroups = async (
  page: number = 1,
  limit: number = 20
): Promise<AdminGroupListResponse> => {
  return request<AdminGroupListResponse>(`/admin/groups?page=${page}&limit=${limit}`, { auth: 'required', errorMessage: '그룹 목록을 불러오는데 실패했습니다' })
}

// 말씀 반응 통계 (익명 집계 — 개인 식별 정보 없음)
export interface EngagementCount {
  total: number
  users: number
}

export interface EngagementVerse {
  verse_id: number
  book_number: number
  book_name: string
  chapter: number
  verse: number
  text: string
  count: number
  users: number
  /** 밑줄 단어 TOP에서만: 이 구절에서 밑줄 그어진 단어들 (많이 그은 순) */
  words?: string[]
}

export interface BibleEngagementData {
  summary: {
    favorites: EngagementCount
    notes: EngagementCount
    highlights: EngagementCount
    word_notes: EngagementCount
  }
  top_favorites: EngagementVerse[]
  top_notes: EngagementVerse[]
  top_underlines: EngagementVerse[]
  top_words: Array<{ word: string; count: number }>
  book_distribution: Array<{ book_number: number; book_name: string; count: number }>
}

export const fetchBibleEngagement = async (
  days?: number
): Promise<BibleEngagementData> => {

  const query = days ? `?days=${days}` : ''
  const json = await request<UntypedJson>(`/admin/bible-engagement${query}`, { auth: 'required', errorMessage: '말씀 반응 통계를 불러오는데 실패했습니다' })
  return json.data
}

// ── 관리자 홈 대시보드 · 돌봄 레이더 ──────────────────────
const adminGet = async <T,>(path: string, errorMessage: string): Promise<T> => {
  const json = await request<{ data: T }>(path, { auth: 'required', errorMessage })
  return json.data
}

/** 대시보드 액션 카드 — 0건인 항목은 서버가 아예 내려보내지 않는다 */
export interface DashboardAction {
  key: string
  label: string
  count: number
  detail: string
  link: string
  tone: 'urgent' | 'warn' | 'info'
}

export interface DashboardMetric {
  key: string
  label: string
  unit: string
  /** 최근 7일 */
  value: number
  /** 직전 7일 */
  prev: number
  delta: number
}

export interface AdminDashboardData {
  generated_at: string
  members: number
  actions: DashboardAction[]
  weekly: DashboardMetric[]
  reach: { subscribed: number; members: number; rate: number }
  trend: Array<{ date: string; active: number }>
}

export const fetchAdminDashboard = (): Promise<AdminDashboardData> =>
  adminGet('/admin/dashboard', '현황을 불러오는데 실패했습니다')

/** 조용해진 성도 — 기록 '내용'은 서버가 내려보내지 않는다 (마지막 활동 시점까지만) */
export interface QuietMember {
  user_id: number
  name: string
  username: string
  avatar_url: string | null
  joined_at: string | null
  last_seen: string | null
  /** 마지막 활동 이후 지난 날 수 (최근 1년 내 기록이 없으면 null) */
  days_since: number | null
  activity_total: number
  band: string
}

export interface NewcomerStep {
  key: string
  label: string
  count: number
  rate: number
}

export interface NewcomerMember {
  user_id: number
  name: string
  avatar_url: string | null
  joined_at: string | null
  days_since_join: number | null
  /** 도달한 단계 키 목록 */
  done: string[]
}

export interface CareRadarData {
  generated_at: string
  quiet_days: number
  summary: {
    members: number
    quiet: number
    bands: Array<{ label: string; count: number }>
  }
  quiet_members: QuietMember[]
  quiet_truncated: number
  newcomers: {
    cohort_days: number
    total: number
    steps: NewcomerStep[]
    members: NewcomerMember[]
  }
}

export const fetchCareRadar = (quietDays: number): Promise<CareRadarData> =>
  adminGet(
    `/admin/care-radar?quiet_days=${quietDays}`,
    '돌봄 레이더를 불러오는데 실패했습니다'
  )

// 관리자용 그룹 삭제
export const deleteAdminGroup = async (groupId: number): Promise<void> => {
  await requestRaw(`/admin/groups/${groupId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '그룹 삭제에 실패했습니다',
  })
}
