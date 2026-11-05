// 좌석 SSE(seat_update) → react-query 캐시 동기화
//
// 배치도를 열어 둔 화면은 예전엔 15초(관리자 현황판은 15초 + 20초)마다 상세를 통째로 다시
// 받았다 — 예약 당일 N명이 열어 두면 요청이 N/15초로 늘고, 아무것도 안 바뀐 때가 대부분이었다.
// 이제 서버가 좌석이 바뀔 때만 방송하고(연결된 모두에게, 숫자 몇 개), 이 파일이:
//   - kind 'seats'(예약·취소·입장 확인): 목록 카드의 좌석 수는 이벤트 값으로 바로 고치고(요청 0),
//     배치도(detail)·예약 목록(reservations)은 캐시가 있을 때만 다시 받되 몰아서 받는다.
//     내가 방금 한 예약의 되울림(응답으로 이미 맞춰 둔 숫자와 같음)은 건너뛴다.
//   - kind 'state'(행사 수정·상태·삭제): 드문 일이라 좌석 캐시 전부를 다시 받는다.
// 폴링은 SSE 가 끊겨 있을 때만 돈다(hooks/useSeatEvents).
import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { SeatEventDetail, SeatEventSummary } from '../types/seatEvent'
import { seatKeys } from '../hooks/queryKeys'
import { invalidateThrottled } from './invalidateThrottled'

export interface SeatUpdateEvent {
  seat_event_id: number
  kind?: 'seats' | 'state'
  reserved_count?: number
  available_count?: number
}

const parse = (raw: string): SeatUpdateEvent | null => {
  try {
    const ev = JSON.parse(raw) as SeatUpdateEvent
    return typeof ev?.seat_event_id === 'number' ? ev : null
  } catch {
    return null
  }
}

const hasCounts = (ev: SeatUpdateEvent): ev is SeatUpdateEvent & { reserved_count: number; available_count: number } =>
  typeof ev.reserved_count === 'number' && typeof ev.available_count === 'number'

const sameCounts = (row: Pick<SeatEventSummary, 'reserved_count' | 'available_count'>, ev: SeatUpdateEvent) =>
  row.reserved_count === ev.reserved_count && row.available_count === ev.available_count

/** 이미 무효화된 캐시는 건드리지 않는다 — setQueryData 가 무효 표시를 지워 버린다 */
const patchable = (qc: QueryClient, queryKey: QueryKey): boolean => {
  const state = qc.getQueryState(queryKey)
  return !!state?.data && !state.isInvalidated
}

/** 목록 캐시(성도 목록·일정별·관리자 전체)의 좌석 수만 이벤트 값으로 맞춘다 */
const patchLists = (qc: QueryClient, ev: SeatUpdateEvent & { reserved_count: number; available_count: number }) => {
  qc.setQueriesData<SeatEventSummary[]>(
    {
      predicate: (q) => {
        const key = q.queryKey
        const isList =
          key[0] === seatKeys.all[0] && (key[1] === 'list' || key[1] === 'by-event' || key[1] === 'admin')
        return isList && patchable(qc, key)
      },
    },
    (old) => {
      if (!old?.some((e) => e.id === ev.seat_event_id && !sameCounts(e, ev))) return old
      return old.map((e) =>
        e.id === ev.seat_event_id
          ? { ...e, reserved_count: ev.reserved_count, available_count: ev.available_count }
          : e,
      )
    },
  )
}

export const applySeatUpdate = (qc: QueryClient, raw: string): void => {
  const ev = parse(raw)
  if (!ev) return
  if (ev.kind !== 'seats') {
    void qc.invalidateQueries({ queryKey: seatKeys.all })
    return
  }
  const detailKey = seatKeys.detail(ev.seat_event_id)
  if (hasCounts(ev)) {
    patchLists(qc, ev)
    // 되울림 — 내 예약·취소 응답(SeatMyResult)으로 상세를 이미 맞춰 둔 상태면 다시 받을 게 없다
    const detail = qc.getQueryData<SeatEventDetail>(detailKey)
    if (detail && sameCounts(detail, ev)) return
  }
  // 어느 좌석이 바뀌었는지는 이벤트에 없다 — 배치도·예약 목록은 다시 받되 몰아서
  invalidateThrottled(qc, detailKey)
  invalidateThrottled(qc, seatKeys.reservations(ev.seat_event_id))
}
