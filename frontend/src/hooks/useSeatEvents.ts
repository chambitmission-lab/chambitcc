// 행사 좌석 예약 React Query 훅 — 캐시만 다루고 토스트는 호출부(feedback)에 맡긴다
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminAssignSeats,
  adminCancelSeats,
  bookSeats,
  cancelMySeats,
  checkInSeats,
  createSeatEvent,
  deleteSeatEvent,
  getAllSeatEvents,
  getSeatEvent,
  getSeatEvents,
  getSeatReservations,
  updateSeatEvent,
  updateSeatEventStatus,
} from '../api/seatEvent'
import type {
  SeatAssignPayload,
  SeatEventDetail,
  SeatEventPayload,
  SeatEventStatus,
  SeatMyResult,
} from '../types/seatEvent'
import type { MutationFeedback } from './mutationFeedback'

export const seatKeys = {
  all: ['seat-events'] as const,
  list: () => [...seatKeys.all, 'list'] as const,
  byEvent: (eventId: number) => [...seatKeys.all, 'by-event', eventId] as const,
  adminList: () => [...seatKeys.all, 'admin'] as const,
  detail: (id: number) => [...seatKeys.all, 'detail', id] as const,
  reservations: (id: number) => [...seatKeys.all, 'reservations', id] as const,
}

// ── 성도 ──────────────────────────────────────────────────────────────

export const useSeatEvents = () =>
  useQuery({
    queryKey: seatKeys.list(),
    queryFn: () => getSeatEvents(),
    staleTime: 1000 * 60,
  })

/** 일정 상세의 "좌석 예약" 카드 — 연결된 행사가 없으면 빈 배열 */
export const useSeatEventsForEvent = (eventId: number) =>
  useQuery({
    queryKey: seatKeys.byEvent(eventId),
    queryFn: () => getSeatEvents(eventId),
    enabled: eventId > 0,
    staleTime: 1000 * 60 * 5,
  })

/**
 * 배치도 — 다른 사람이 막 잡은 자리가 늦게 보이면 헛걸음이 되므로
 * 화면을 보고 있는 동안 15초마다 조용히 새로 받는다.
 */
export const useSeatEvent = (id: number, live = true) =>
  useQuery({
    queryKey: seatKeys.detail(id),
    queryFn: () => getSeatEvent(id),
    enabled: id > 0,
    staleTime: 1000 * 10,
    refetchInterval: live ? 1000 * 15 : false,
    refetchIntervalInBackground: false,
  })

/** 예약·취소 응답(SeatMyResult)으로 상세 캐시를 즉시 맞춘다 — 재조회를 기다리지 않는다 */
const patchDetail = (
  qc: ReturnType<typeof useQueryClient>,
  id: number,
  result: SeatMyResult
) => {
  qc.setQueryData<SeatEventDetail>(seatKeys.detail(id), (prev) =>
    prev ? { ...prev, ...result } : prev
  )
  void qc.invalidateQueries({ queryKey: seatKeys.list() })
  void qc.invalidateQueries({ queryKey: [...seatKeys.all, 'by-event'] })
  void qc.invalidateQueries({ queryKey: seatKeys.adminList() })
}

export const useBookSeats = (
  feedback?: MutationFeedback<SeatMyResult, { id: number; seats: string[] }>
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, seats }: { id: number; seats: string[] }) => bookSeats(id, seats),
    onSuccess: (result, variables) => {
      patchDetail(qc, variables.id, result)
      feedback?.onSuccess?.(result, variables)
    },
    onError: (error: Error, variables) => {
      // 409(다른 분이 먼저 예약) 등 — 최신 배치도로 다시 그린다
      void qc.invalidateQueries({ queryKey: seatKeys.detail(variables.id) })
      feedback?.onError?.(error, variables)
    },
  })
}

export const useCancelMySeats = (
  feedback?: MutationFeedback<SeatMyResult, { id: number; seats?: string[] }>
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, seats }: { id: number; seats?: string[] }) => cancelMySeats(id, seats),
    onSuccess: (result, variables) => {
      patchDetail(qc, variables.id, result)
      feedback?.onSuccess?.(result, variables)
    },
    onError: (error: Error, variables) => feedback?.onError?.(error, variables),
  })
}

// ── 관리자 ────────────────────────────────────────────────────────────

export const useAdminSeatEvents = () =>
  useQuery({
    queryKey: seatKeys.adminList(),
    queryFn: getAllSeatEvents,
    staleTime: 0,
  })

export const useSeatReservations = (id: number, enabled = true) =>
  useQuery({
    queryKey: seatKeys.reservations(id),
    queryFn: () => getSeatReservations(id),
    enabled: enabled && id > 0,
    staleTime: 1000 * 10,
    refetchInterval: enabled ? 1000 * 20 : false,
    refetchIntervalInBackground: false,
  })

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) =>
  void qc.invalidateQueries({ queryKey: seatKeys.all })

export const useSaveSeatEvent = (
  feedback?: MutationFeedback<SeatEventDetail, { id?: number; data: SeatEventPayload }>
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: SeatEventPayload }) =>
      id ? updateSeatEvent(id, data) : createSeatEvent(data),
    onSuccess: (result, variables) => {
      invalidateAll(qc)
      feedback?.onSuccess?.(result, variables)
    },
    onError: (error: Error, variables) => feedback?.onError?.(error, variables),
  })
}

export const useUpdateSeatEventStatus = (
  feedback?: MutationFeedback<SeatEventDetail, { id: number; status: SeatEventStatus }>
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: SeatEventStatus }) =>
      updateSeatEventStatus(id, status),
    onSuccess: (result, variables) => {
      invalidateAll(qc)
      feedback?.onSuccess?.(result, variables)
    },
    onError: (error: Error, variables) => feedback?.onError?.(error, variables),
  })
}

export const useDeleteSeatEvent = (feedback?: MutationFeedback<void, number>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSeatEvent(id),
    onSuccess: (_r, id) => {
      invalidateAll(qc)
      feedback?.onSuccess?.(undefined, id)
    },
    onError: (error: Error, id) => feedback?.onError?.(error, id),
  })
}

/** 관리자 좌석 조작(배정·취소·입장) 공통 — 예약 목록과 배치도를 함께 새로 받는다 */
type SeatAdminAction =
  | { kind: 'assign'; id: number; data: SeatAssignPayload }
  | { kind: 'cancel'; id: number; seats: string[] }
  | { kind: 'check-in'; id: number; seats: string[]; checkedIn: boolean }

export const useSeatAdminAction = (feedback?: MutationFeedback<unknown, SeatAdminAction>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (action: SeatAdminAction) => {
      if (action.kind === 'assign') return adminAssignSeats(action.id, action.data)
      if (action.kind === 'cancel') return adminCancelSeats(action.id, action.seats)
      return checkInSeats(action.id, action.seats, action.checkedIn)
    },
    onSuccess: (result, action) => {
      void qc.invalidateQueries({ queryKey: seatKeys.reservations(action.id) })
      void qc.invalidateQueries({ queryKey: seatKeys.detail(action.id) })
      void qc.invalidateQueries({ queryKey: seatKeys.adminList() })
      void qc.invalidateQueries({ queryKey: seatKeys.list() })
      feedback?.onSuccess?.(result, action)
    },
    onError: (error: Error, action) => {
      void qc.invalidateQueries({ queryKey: seatKeys.reservations(action.id) })
      feedback?.onError?.(error, action)
    },
  })
}
