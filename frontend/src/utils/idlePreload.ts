// "첫 화면이 끝난 뒤" 를 기준으로 미리 받기(청크·이미지·데이터)를 예약하는 공통 유틸.
//
// 배경: requestIdleCallback 은 CPU 가 한가하면 첫 페인트 직후(≈300ms)에도 바로 불린다.
// 그 시점에 dynamic import() 로 청크를 받으면 브라우저는 스크립트를 High 우선순위로
// 다루기 때문에 아직 내려오는 중인 LCP 이미지·아이콘 폰트·API 응답과 대역폭을 다툰다
// (느린 4G 실측: 홈 히어로 3초, 아이콘 폰트 7~11초). 그래서 `load` 이벤트 + 짧은 여유
// 시간까지 기다린 뒤에야 유휴 콜백을 건다.
//
// 또 절약 모드·2G 에서는 미리 받지 않고, 3G 에서는 꼭 필요한 것만 받도록 예산을 낸다.

type ConnectionLike = {
  saveData?: boolean
  effectiveType?: string
}

export type PreloadBudget = 'none' | 'essential' | 'full'

/** 네트워크 상태로 미리 받기 예산을 정한다. 정보가 없으면(iOS 등) full 로 본다 */
export const preloadBudget = (): PreloadBudget => {
  const conn = (navigator as Navigator & { connection?: ConnectionLike }).connection
  if (!conn) return 'full'
  if (conn.saveData) return 'none'
  const type = conn.effectiveType ?? ''
  if (type === 'slow-2g' || type === '2g') return 'none'
  if (type === '3g') return 'essential'
  return 'full'
}

const afterLoad = (fn: () => void): (() => void) => {
  if (document.readyState === 'complete') {
    fn()
    return () => undefined
  }
  const handler = () => fn()
  window.addEventListener('load', handler, { once: true })
  return () => window.removeEventListener('load', handler)
}

interface ScheduleOptions {
  /** load 이후 추가로 기다릴 시간 — 첫 화면의 늦은 이미지·API 가 끝나도록 */
  settleMs?: number
  /** 유휴 콜백 최대 대기(그 뒤엔 바쁘더라도 실행) */
  idleTimeoutMs?: number
}

/**
 * `load` → settleMs → requestIdleCallback 순으로 기다렸다가 fn 을 실행한다.
 * 반환값은 취소 함수 (언마운트 시 호출).
 */
export const scheduleAfterFirstScreen = (
  fn: () => void,
  { settleMs = 2500, idleTimeoutMs = 10000 }: ScheduleOptions = {},
): (() => void) => {
  let cancelled = false
  let timer: number | null = null
  let idleId: number | null = null

  const runIdle = () => {
    if (cancelled) return
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(() => !cancelled && fn(), { timeout: idleTimeoutMs })
    } else {
      timer = window.setTimeout(() => !cancelled && fn(), 200)
    }
  }

  const removeLoad = afterLoad(() => {
    if (cancelled) return
    timer = window.setTimeout(runIdle, settleMs)
  })

  return () => {
    cancelled = true
    removeLoad()
    if (timer !== null) window.clearTimeout(timer)
    if (idleId !== null && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId)
  }
}
