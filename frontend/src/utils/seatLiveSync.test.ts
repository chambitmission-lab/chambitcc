import { QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { seatKeys } from '../hooks/queryKeys'
import type { SeatEventDetail, SeatEventSummary } from '../types/seatEvent'
import { applySeatUpdate } from './seatLiveSync'

const summary = (id: number, reserved = 2): SeatEventSummary => ({
  id,
  title: '찬양의 밤',
  status: 'open',
  max_per_user: 3,
  total_seats: 10,
  reserved_count: reserved,
  available_count: 10 - reserved,
  holder_count: 1,
  is_booking_open: true,
  my_seats: [],
})

const detail = (id: number, reserved = 2): SeatEventDetail => ({
  ...summary(id, reserved),
  layout: { sections: [], labeling: 'row_letter', disabled: [], held: [], stage_label: '무대' },
  taken: ['A1', 'A2'].slice(0, reserved),
})

const seats = (id: number, counts?: { reserved: number; available: number }) =>
  JSON.stringify({
    seat_event_id: id,
    kind: 'seats',
    ...(counts ? { reserved_count: counts.reserved, available_count: counts.available } : {}),
  })

describe('applySeatUpdate', () => {
  let qc: QueryClient
  beforeEach(() => {
    vi.useFakeTimers()
    qc = new QueryClient()
  })
  afterEach(() => {
    qc.clear()
    vi.useRealTimers()
  })

  it('seats 신호: 목록 카드 숫자는 바로 고치고 배치도·예약 목록은 무효화한다', () => {
    qc.setQueryData(seatKeys.list(), [summary(7), summary(8)])
    qc.setQueryData(seatKeys.detail(7), detail(7))
    qc.setQueryData(seatKeys.reservations(7), [])

    applySeatUpdate(qc, seats(7, { reserved: 3, available: 7 }))

    const list = qc.getQueryData<SeatEventSummary[]>(seatKeys.list())!
    expect(list.find((e) => e.id === 7)).toMatchObject({ reserved_count: 3, available_count: 7 })
    expect(list.find((e) => e.id === 8)).toMatchObject({ reserved_count: 2 })
    expect(qc.getQueryState(seatKeys.detail(7))?.isInvalidated).toBe(true)
    expect(qc.getQueryState(seatKeys.reservations(7))?.isInvalidated).toBe(true)
  })

  it('되울림: 상세 숫자가 이미 같으면 다시 받지 않는다', () => {
    qc.setQueryData(seatKeys.detail(7), detail(7, 3))
    applySeatUpdate(qc, seats(7, { reserved: 3, available: 7 }))
    expect(qc.getQueryState(seatKeys.detail(7))?.isInvalidated).toBe(false)
  })

  it('몰린 신호는 주기당 한 번으로 모은다', () => {
    const spy = vi.spyOn(qc, 'invalidateQueries')
    qc.setQueryData(seatKeys.detail(9), detail(9))
    for (let i = 0; i < 5; i += 1) applySeatUpdate(qc, seats(9))
    // 첫 신호는 바로(detail + reservations 두 키), 나머지는 주기 끝에 한 번
    expect(spy).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(3000)
    expect(spy).toHaveBeenCalledTimes(4)
  })

  it('state 신호는 좌석 캐시 전부, 깨진 페이로드는 무시', () => {
    const spy = vi.spyOn(qc, 'invalidateQueries')
    applySeatUpdate(qc, '{broken')
    expect(spy).not.toHaveBeenCalled()
    applySeatUpdate(qc, JSON.stringify({ seat_event_id: 7, kind: 'state' }))
    expect(spy).toHaveBeenCalledWith({ queryKey: seatKeys.all })
  })
})
