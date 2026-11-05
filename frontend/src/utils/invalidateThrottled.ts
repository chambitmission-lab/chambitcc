// 실시간 신호가 몰릴 때 같은 쿼리를 몇 번이고 다시 받지 않게 — 화면당 주기에 한 번만 무효화한다.
// 첫 신호는 바로, 이어지는 신호는 주기 끝에 한 번으로 모은다(leading + trailing).
// 선거(electionLiveSync)·좌석(seatLiveSync)이 같은 장치를 쓴다.
import type { QueryClient, QueryKey } from '@tanstack/react-query'

/** 다시 받는 최소 간격 — 신호가 몰려도 화면당 이 주기로 한 번만 조회한다 */
export const REFETCH_THROTTLE_MS = 2500

const lastFired = new Map<string, number>()
const pending = new Map<string, ReturnType<typeof setTimeout>>()

export const invalidateThrottled = (
  qc: QueryClient,
  queryKey: QueryKey,
  throttleMs: number = REFETCH_THROTTLE_MS,
): void => {
  const k = JSON.stringify(queryKey)
  if (pending.has(k)) return
  const fire = () => {
    pending.delete(k)
    lastFired.set(k, Date.now())
    void qc.invalidateQueries({ queryKey })
  }
  const wait = (lastFired.get(k) ?? 0) + throttleMs - Date.now()
  if (wait <= 0) fire()
  else pending.set(k, setTimeout(fire, wait))
}
