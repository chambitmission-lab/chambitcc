// 목회 일정 (어젠다) — 심방 예약 · 후속 · 생일 · 교회 행사
import type { VisitKind } from './roster'
import { pastorGet } from './_http'

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
