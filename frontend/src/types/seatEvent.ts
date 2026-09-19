// 행사 좌석 예약 — 백엔드 app/schemas/seat_event.py 와 1:1

export type SeatEventStatus = 'draft' | 'open' | 'closed'

/** row_letter: 행이 알파벳(A1…A16, 극장식) / col_letter: 열이 알파벳(A1…A11, 세로 줄 기준) */
export type SeatLabeling = 'row_letter' | 'col_letter'

export interface SeatSection {
  name: string
  rows: number
  cols: number
}

export interface SeatLayout {
  sections: SeatSection[]
  labeling: SeatLabeling
  /** 자리 자체가 없는 칸 (통로·기둥) — 빈칸으로 그린다 */
  disabled: string[]
  /** 관리자 보류 — 보이지만 성도는 예약할 수 없다 */
  held: string[]
  stage_label: string
}

export interface SeatEventSummary {
  id: number
  title: string
  description?: string | null
  notice?: string | null
  venue?: string | null
  event_id?: number | null
  performance_at?: string | null
  opens_at?: string | null
  closes_at?: string | null
  status: SeatEventStatus
  max_per_user: number
  total_seats: number
  reserved_count: number
  available_count: number
  holder_count: number
  is_booking_open: boolean
  my_seats: string[]
  created_at?: string | null
}

export interface SeatEventDetail extends SeatEventSummary {
  layout: SeatLayout
  /** 다른 사람이 예약한 좌석 (내 좌석 제외) */
  taken: string[]
}

export interface SeatMyResult {
  my_seats: string[]
  taken: string[]
  reserved_count: number
  available_count: number
}

export interface SeatReservation {
  id: number
  seat_label: string
  user_id?: number | null
  holder_name: string
  /** 예약 묶음 — 성도 u:<id> / 관리자 대리 m:<랜덤> */
  group_code: string
  source: 'member' | 'admin'
  note?: string | null
  checked_in_at?: string | null
  created_at?: string | null
}

export interface SeatEventPayload {
  title: string
  description?: string | null
  notice?: string | null
  venue?: string | null
  event_id?: number | null
  performance_at?: string | null
  opens_at?: string | null
  closes_at?: string | null
  status: SeatEventStatus
  max_per_user: number
  layout: SeatLayout
}

export interface SeatAssignPayload {
  seats: string[]
  holder_name: string
  user_id?: number | null
  note?: string | null
}
