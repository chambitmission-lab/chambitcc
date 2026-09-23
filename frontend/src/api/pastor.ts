// Pastor API — 목회자 영역(/pastor). 서버가 is_pastor 로 지킨다 (관리자라도 목회자가 아니면 403)
import { request, requestRaw } from './utils/request'
import type { DashboardMetric } from './admin'

/** 목사님께 맡겨진 기도 — 아직 어느 목회자도 답하지 않은 '목사님과 함께' 기도 */
export interface PastoralPrayerItem {
  id: number
  title: string | null
  excerpt: string
  display_name: string
  avatar_url: string | null
  emotion: string | null
  created_at: string | null
  days_waiting: number | null
  reply_count: number
  prayed_by_me: boolean
  is_answered: boolean
}

export interface PastorHomeData {
  generated_at: string
  pastoral: {
    waiting_count: number
    replied_recent: number
    replied_window_days: number
    items: PastoralPrayerItem[]
  }
  care: {
    quiet_days: number
    members: number
    quiet_count: number
    bands: Array<{ label: string; count: number }>
    quiet_preview: Array<{
      user_id: number
      name: string
      avatar_url: string | null
      days_since: number | null
      band: string
      last_seen: string | null
    }>
    newcomer_days: number | null
    newcomer_count: number
    newcomer_preview: Array<{
      user_id: number
      name: string
      avatar_url: string | null
      days_since_join: number | null
      done: number
      steps: number
    }>
  }
  week: {
    events: Array<{
      id: number
      title: string
      category: string
      start: string | null
      end: string | null
      location: string | null
    }>
    latest_sermon: {
      id: number
      title: string
      pastor: string
      bible_verse: string | null
      sermon_date: string | null
    } | null
  }
  grace: {
    days: number
    count: number
    items: Array<{
      id: number
      title: string | null
      excerpt: string
      testimony: string | null
      display_name: string
      answered_at: string | null
    }>
  }
  pulse: {
    members: number
    weekly: DashboardMetric[]
    trend: Array<{ date: string; active: number }>
  }
  shepherd: {
    birthdays: Array<{
      user_id: number
      name: string
      avatar_url: string | null
      church_title: string | null
      date: string
      days_until: number
      lunar: boolean
    }>
    follow_ups: FollowUp[]
    /** 내 심방 예약 (7일 안 + 지난 예약) */
    plans: Array<PastoralVisit & { overdue: boolean }>
  }
  assistant: SuggestionData
}

export const fetchPastorHome = async (): Promise<PastorHomeData> => {
  const json = await request<{ data: PastorHomeData }>('/pastor/home', {
    auth: 'required',
    errorMessage: '목회자 홈을 불러오는데 실패했습니다',
  })
  return json.data
}

// ── 성도 명부 · 심방 기록 ────────────────────────────────
export type VisitKind = 'visit' | 'call' | 'hospital' | 'counsel' | 'message' | 'other'

export const VISIT_KIND_LABEL: Record<VisitKind, string> = {
  visit: '가정 심방',
  call: '전화',
  hospital: '병문안',
  counsel: '상담',
  message: '문자·메시지',
  other: '기타',
}

export const VISIT_KIND_ICON: Record<VisitKind, string> = {
  visit: 'home',
  call: 'call',
  hospital: 'local_hospital',
  counsel: 'forum',
  message: 'sms',
  other: 'more_horiz',
}

export interface RosterMember {
  user_id: number
  name: string
  avatar_url: string | null
  joined_at: string | null
  church_title: string | null
  district: string | null
  birthday: string | null
  phone: string | null
  has_profile: boolean
  last_seen: string | null
  days_since: number | null
  last_visit: string | null
  last_visit_by: string | null
  visit_count: number
}

export interface RosterData {
  total: number
  with_profile: number
  districts: Array<{ value: string; count: number }>
  titles: Array<{ value: string; count: number }>
  items: RosterMember[]
}

export interface MemberProfile {
  church_title: string | null
  district: string | null
  birthday: string | null
  birthday_lunar: boolean
  phone: string | null
  address: string | null
  family_note: string | null
  registered_at: string | null
  pastoral_note: string | null
  updated_by_name?: string | null
  updated_at?: string | null
}

/** 심방 한 건 — 내용(summary·follow_up)은 내가 쓴 기록에만 채워져 온다 */
export type VisitStatus = 'done' | 'planned'

export interface PastoralVisit {
  id: number
  member_user_id: number
  visit_date: string
  /** 'HH:MM' — 예약에 주로 쓴다 */
  visit_time: string | null
  status: VisitStatus
  kind: VisitKind
  pastor_name: string | null
  is_mine: boolean
  summary: string | null
  follow_up: string | null
  follow_up_date: string | null
  follow_up_done: boolean
  member_name?: string
  member_avatar_url?: string | null
}

export interface FollowUp {
  visit_id: number
  member_user_id: number
  member_name: string
  member_avatar_url: string | null
  follow_up: string
  follow_up_date: string | null
  overdue: boolean
  visit_date: string
  kind: VisitKind
}

export interface MemberDetail {
  user_id: number
  name: string
  username: string
  avatar_url: string | null
  is_active: boolean
  joined_at: string | null
  profile: MemberProfile | null
  activity: { last_seen: string | null; days_since: number | null; total_year: number }
  visits: PastoralVisit[]
  shared_prayers: Array<{
    id: number
    title: string | null
    excerpt: string
    created_at: string | null
    pastor_replied: boolean
    is_answered: boolean
  }>
}

export interface VisitInput {
  visit_date: string
  visit_time?: string | null
  status?: VisitStatus
  kind: VisitKind
  summary?: string
  follow_up?: string
  follow_up_date?: string | null
}

const pastorGet = async <T,>(path: string, errorMessage: string): Promise<T> => {
  const json = await request<{ data: T }>(path, { auth: 'required', errorMessage })
  return json.data
}

const pastorSend = async <T,>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH',
  json: unknown,
  errorMessage: string,
): Promise<T> => {
  const res = await request<{ data: T }>(path, { method, json, auth: 'required', errorMessage })
  return res.data
}

export const fetchRoster = (): Promise<RosterData> =>
  pastorGet('/pastor/members', '성도 명부를 불러오는데 실패했습니다')

export const fetchMemberDetail = (id: number): Promise<MemberDetail> =>
  pastorGet(`/pastor/members/${id}`, '성도 정보를 불러오는데 실패했습니다')

export const saveMemberProfile = (id: number, data: Partial<MemberProfile>): Promise<MemberProfile> =>
  pastorSend(`/pastor/members/${id}/profile`, 'PUT', data, '명부 저장에 실패했습니다')

export const fetchMyVisits = (): Promise<{ follow_ups: FollowUp[]; items: PastoralVisit[] }> =>
  pastorGet('/pastor/visits', '심방 기록을 불러오는데 실패했습니다')

export const createVisit = (memberId: number, data: VisitInput): Promise<PastoralVisit> =>
  pastorSend(`/pastor/members/${memberId}/visits`, 'POST', data, '심방 기록 저장에 실패했습니다')

export const updateVisit = (
  visitId: number,
  data: Partial<VisitInput> & { follow_up_done?: boolean },
): Promise<PastoralVisit> =>
  pastorSend(`/pastor/visits/${visitId}`, 'PATCH', data, '심방 기록 수정에 실패했습니다')

export const deleteVisit = async (visitId: number): Promise<void> => {
  await requestRaw(`/pastor/visits/${visitId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '심방 기록 삭제에 실패했습니다',
  })
}

// ── 목회 비서 (규칙 기반) ─────────────────────────────────
export type ReasonTone = 'urgent' | 'care' | 'joy'

export interface Suggestion {
  user_id: number
  name: string
  avatar_url: string | null
  church_title: string | null
  district: string | null
  phone: string | null
  last_visit: string | null
  score: number
  reasons: Array<{ code: string; label: string; tone: ReasonTone }>
}

export interface SuggestionData {
  total: number
  items: Suggestion[]
}

export interface Briefing {
  headline: string
  points: Array<{
    kind: 'visit' | 'plan' | 'memo' | 'follow_up' | 'activity' | 'prayer' | 'birthday' | 'family' | 'note'
    text: string
    tone: 'info' | 'urgent' | 'care' | 'joy'
  }>
}

export const fetchSuggestions = (): Promise<SuggestionData> =>
  pastorGet('/pastor/assistant/suggestions', '목회 비서 제안을 불러오는데 실패했습니다')

export const fetchBriefing = (id: number): Promise<Briefing> =>
  pastorGet(`/pastor/members/${id}/briefing`, '브리핑을 불러오는데 실패했습니다')

// ── 주간 목양 리포트 ─────────────────────────────────────
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

// ── 목회 일정 (어젠다) ────────────────────────────────────
export type AgendaItem =
  | {
      type: 'visit_plan'
      id: string
      visit_id: number
      date: string
      time: string | null
      overdue: boolean
      member_user_id: number
      member_name: string
      member_avatar_url: string | null
      kind: VisitKind
      is_mine: boolean
      pastor_name: string
      /** 내 예약에만 채워진다 */
      memo: string | null
    }
  | {
      type: 'follow_up'
      id: string
      visit_id: number
      date: string
      time: null
      overdue: boolean
      member_user_id: number
      member_name: string
      member_avatar_url: string | null
      title: string
    }
  | {
      type: 'birthday'
      id: string
      date: string
      time: null
      overdue: false
      member_user_id: number
      member_name: string
      member_avatar_url: string | null
      title: string
      lunar: boolean
    }
  | {
      type: 'event'
      id: string
      event_id: number
      date: string
      time: string | null
      overdue: false
      title: string
      location: string | null
      category: string
    }

export interface AgendaData {
  today: string
  until: string
  items: AgendaItem[]
}

export const fetchAgenda = (): Promise<AgendaData> =>
  pastorGet('/pastor/agenda', '목회 일정을 불러오는데 실패했습니다')

// ── 설교 준비 도우미 ─────────────────────────────────────
export interface SermonRef {
  id: number
  title: string
  date: string
  bible_verse: string | null
  pastor: string
}

export interface SermonPrep {
  years: 0 | 1 | 3
  total_sermons: number
  in_period: number
  unparsed: number
  testament: { ot: number; nt: number }
  books: Array<{
    book_number: number
    name: string
    testament: 'OT' | 'NT'
    count: number
    last_date: string | null
    sermons: SermonRef[]
  }>
  stale: Array<{ book_number: number; name: string; last_date: string | null }>
  recent: Array<SermonRef & { views: number; parsed: boolean }>
  heart: WeeklyReport['emotions']
  engagement: {
    days: number
    favorites: EngagedVerse[]
    underlines: EngagedVerse[]
    words: string[]
  }
}

export interface EngagedVerse {
  verse_id: number
  book_number: number
  book_name: string
  chapter: number
  verse: number
  text: string
  count: number
  users: number
}

export interface PassageCheck {
  query: string
  parsed: string[]
  matches: SermonRef[]
}

export const fetchSermonPrep = (years: number): Promise<SermonPrep> =>
  pastorGet(`/pastor/sermon-prep?years=${years}`, '설교 준비 자료를 불러오는데 실패했습니다')

export const checkPassage = (ref: string): Promise<PassageCheck> =>
  pastorGet(`/pastor/sermon-prep/check?ref=${encodeURIComponent(ref)}`, '본문 확인에 실패했습니다')
