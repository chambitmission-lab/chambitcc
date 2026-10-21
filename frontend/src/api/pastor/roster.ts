// 성도 명부 · 심방 기록
import type { MemberSituation, SituationKind } from './situations'
import { pastorDelete, pastorGet, pastorSend } from './_http'

export type VisitKind = 'visit' | 'call' | 'hospital' | 'counsel' | 'message' | 'other'

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
  /** 지금 겪는 일(마치지 않은 것)의 종류 */
  situations: SituationKind[]
}

export interface RosterData {
  total: number
  with_profile: number
  districts: Array<{ value: string; count: number }>
  titles: Array<{ value: string; count: number }>
  /** 지금 겪는 일이 하나라도 있는 성도 수 */
  in_care: number
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
  /** 지금 겪는 일 — 마치지 않은 것 먼저(시작 최신순), 그 뒤 지나간 것 몇 건 */
  situations: MemberSituation[]
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

export const deleteVisit = (visitId: number): Promise<void> =>
  pastorDelete(`/pastor/visits/${visitId}`, '심방 기록 삭제에 실패했습니다')
