// 행사 좌석 예약 React Query 훅 — 캐시만 다루고 토스트는 호출부(feedback)에 맡긴다
//
// 실시간: 좌석이 바뀌면 서버가 SSE `seat_update` 를 방송하고 utils/seatLiveSync 가 캐시를 맞춘다.
// 배치도·예약 목록의 주기 폴링은 스트림이 끊겨 있을 때(비로그인 포함)만 도는 폴백이다.
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
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
import { notificationStream } from '../utils/notificationStream'
import { applySeatUpdate } from '../utils/seatLiveSync'
import type { MutationFeedback } from './mutationFeedback'
import { seatKeys } from './queryKeys'

export { seatKeys }

let streamInstalled = false
/** SSE 핸들러를 한 번만 붙인다 — 배치도·현황판이 처음 마운트될 때 부른다 */
const installSeatStream = (qc: QueryClient) => {
  if (streamInstalled) return
  streamInstalled = true
  notificationStream.on('seat_update', (raw) => applySeatUpdate(qc, raw))
  // 끊겨 있던 사이의 방송은 놓쳤다 — 떠 있는 좌석 화면만 다시 받는다
  notificationStream.on('reconnected', () => void qc.invalidateQueries({ queryKey: seatKeys.all }))
}

/** 스트림이 붙어 있으면 SSE 가 갱신을 맡는다 — 폴백 폴링은 끊겼을 때만 */
const fallbackInterval = (ms: number) => () => (notificationStream.connected ? false : ms)

// ── 성도 ──────────────────────────────────────────────────────────────

const LIST_STALE = 1000 * 60
const DETAIL_STALE = 1000 * 10

/**
 * /seats 목록을 청크와 나란히 미리 받아 둔다 — 메뉴 호버(routePreload)·라우트 진입(RouteDataPrefetch).
 * 예전엔 청크만 데워 두고 목록은 화면이 마운트된 뒤에야 출발해 히어로 → 스피너 → 카드 두 박자였다.
 * 키·staleTime 은 useSeatEvents 와 같다. coldOnly: 유휴 프리로드용 — 캐시가 없을 때만.
 */
export const prefetchSeatEvents = (qc: QueryClient, coldOnly = false): void => {
  void qc.prefetchQuery({
    queryKey: seatKeys.list(),
    queryFn: () => getSeatEvents(),
    staleTime: coldOnly ? Infinity : LIST_STALE,
  })
}

/**
 * 배치도 상세를 미리 받아 둔다 — 목록 카드 호버·터치(청크 프리로드와 같은 순간)와 딥링크 진입.
 * 상세는 응답 전엔 배치도를 아예 그릴 수 없어 청크 → 상세 직렬이 그대로 체감됐다.
 */
export const prefetchSeatEvent = (qc: QueryClient, id: number): void => {
  if (!(id > 0)) return
  void qc.prefetchQuery({
    queryKey: seatKeys.detail(id),
    queryFn: () => getSeatEvent(id),
    staleTime: DETAIL_STALE,
  })
}

export const useSeatEvents = () =>
  useQuery({
    queryKey: seatKeys.list(),
    queryFn: () => getSeatEvents(),
    staleTime: LIST_STALE,
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
 * 배치도 — 다른 사람이 막 잡은 자리가 늦게 보이면 헛걸음이 되므로 실시간으로 따라간다.
 * 로그인 사용자는 SSE(seat_update)가 밀어 주고, 스트림이 없는 동안(비로그인·순단)만
 * 15초마다 조용히 새로 받는다.
 */
export const useSeatEvent = (id: number, live = true) => {
  const qc = useQueryClient()
  useEffect(() => installSeatStream(qc), [qc])
  return useQuery({
    queryKey: seatKeys.detail(id),
    queryFn: () => getSeatEvent(id),
    enabled: id > 0,
    staleTime: DETAIL_STALE,
    refetchInterval: live ? fallbackInterval(1000 * 15) : false,
    refetchIntervalInBackground: false,
  })
}

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
  void qc.invalidateQueries({ queryKey: seatKeys.byEvents() })
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

/** 현황판 예약 목록 — 배치도와 같이 SSE 가 갱신하고, 끊겼을 때만 20초 폴링 */
export const useSeatReservations = (id: number, enabled = true) => {
  const qc = useQueryClient()
  useEffect(() => installSeatStream(qc), [qc])
  return useQuery({
    queryKey: seatKeys.reservations(id),
    queryFn: () => getSeatReservations(id),
    enabled: enabled && id > 0,
    staleTime: 1000 * 10,
    refetchInterval: enabled ? fallbackInterval(1000 * 20) : false,
    refetchIntervalInBackground: false,
  })
}

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
