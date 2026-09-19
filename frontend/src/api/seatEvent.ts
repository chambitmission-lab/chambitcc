// 행사 좌석 예약 API
import type {
  SeatAssignPayload,
  SeatEventDetail,
  SeatEventPayload,
  SeatEventStatus,
  SeatEventSummary,
  SeatMyResult,
  SeatReservation,
} from '../types/seatEvent'
import { request, requestRaw } from './utils/request'

// ── 성도 ──────────────────────────────────────────────────────────────

/** 예약 행사 목록 — eventId 를 주면 그 일정에 연결된 행사만 (일정 상세 카드용) */
export const getSeatEvents = async (eventId?: number): Promise<SeatEventSummary[]> =>
  request<SeatEventSummary[]>('/seat-events', {
    query: eventId ? { event_id: eventId } : undefined,
    errorMessage: '예약 행사를 불러오지 못했습니다',
  })

/** 배치도·예약 현황 — 비로그인도 볼 수 있다 */
export const getSeatEvent = async (id: number): Promise<SeatEventDetail> =>
  request<SeatEventDetail>(`/seat-events/${id}`, {
    errorMessage: '좌석 정보를 불러오지 못했습니다',
  })

export const bookSeats = async (id: number, seats: string[]): Promise<SeatMyResult> =>
  request<SeatMyResult>(`/seat-events/${id}/reservations`, {
    method: 'POST',
    auth: 'required',
    json: { seats },
    errorMessage: '예약하지 못했습니다',
  })

/** seats 를 비우면 내 좌석 전체 취소 */
export const cancelMySeats = async (id: number, seats?: string[]): Promise<SeatMyResult> =>
  request<SeatMyResult>(`/seat-events/${id}/reservations/cancel`, {
    method: 'POST',
    auth: 'required',
    json: { seats: seats?.length ? seats : null },
    errorMessage: '취소하지 못했습니다',
  })

// ── 관리자 ────────────────────────────────────────────────────────────

export const getAllSeatEvents = async (): Promise<SeatEventSummary[]> =>
  request<SeatEventSummary[]>('/seat-events/admin/all', {
    auth: 'required',
    errorMessage: '예약 행사를 불러오지 못했습니다',
  })

export const createSeatEvent = async (data: SeatEventPayload): Promise<SeatEventDetail> =>
  request<SeatEventDetail>('/seat-events', {
    method: 'POST',
    auth: 'required',
    json: data,
    errorMessage: '행사를 만들지 못했습니다',
  })

export const updateSeatEvent = async (
  id: number,
  data: Partial<SeatEventPayload>
): Promise<SeatEventDetail> =>
  request<SeatEventDetail>(`/seat-events/${id}`, {
    method: 'PUT',
    auth: 'required',
    json: data,
    errorMessage: '행사를 저장하지 못했습니다',
  })

export const updateSeatEventStatus = async (
  id: number,
  status: SeatEventStatus
): Promise<SeatEventDetail> =>
  request<SeatEventDetail>(`/seat-events/${id}/status`, {
    method: 'PATCH',
    auth: 'required',
    json: { status },
    errorMessage: '상태를 바꾸지 못했습니다',
  })

export const deleteSeatEvent = async (id: number): Promise<void> => {
  await requestRaw(`/seat-events/${id}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '행사를 삭제하지 못했습니다',
  })
}

export const getSeatReservations = async (id: number): Promise<SeatReservation[]> =>
  request<SeatReservation[]>(`/seat-events/${id}/admin/reservations`, {
    auth: 'required',
    errorMessage: '예약 목록을 불러오지 못했습니다',
  })

export const adminAssignSeats = async (
  id: number,
  data: SeatAssignPayload
): Promise<SeatReservation[]> =>
  request<SeatReservation[]>(`/seat-events/${id}/admin/reservations`, {
    method: 'POST',
    auth: 'required',
    json: data,
    errorMessage: '좌석을 배정하지 못했습니다',
  })

export const adminCancelSeats = async (id: number, seats: string[]): Promise<void> => {
  await request(`/seat-events/${id}/admin/cancel`, {
    method: 'POST',
    auth: 'required',
    json: { seats },
    errorMessage: '예약을 취소하지 못했습니다',
  })
}

export const checkInSeats = async (
  id: number,
  seats: string[],
  checkedIn: boolean
): Promise<void> => {
  await request(`/seat-events/${id}/admin/check-in`, {
    method: 'POST',
    auth: 'required',
    json: { seats, checked_in: checkedIn },
    errorMessage: '입장 처리를 하지 못했습니다',
  })
}

/** 예약자 명단 CSV — 인증 헤더가 필요해 blob 으로 받아 저장한다 */
export const downloadSeatCsv = async (id: number, filename: string): Promise<void> => {
  const response = await requestRaw(`/seat-events/${id}/export`, {
    auth: 'required',
    errorMessage: 'CSV 내려받기에 실패했습니다',
  })
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
