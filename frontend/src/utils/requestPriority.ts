/**
 * 첫 화면 요청 우선순위 게이트.
 *
 * 홈은 마운트 순간 API 요청을 12개 넘게 한꺼번에 보낸다(공지·묵상·감사·주간기도·기도방·알림 …).
 * 백엔드(클라우드타입 소형 컨테이너)는 이를 거의 순서대로 처리해서, 가장 크고 중요한
 * 기도 목록이 매번 맨 뒤로 밀렸다 — 실측 단독 100ms 가 동시 요청 속에선 600~700ms.
 *
 * 그래서 기도 목록이 콜드(캐시 없음)로 뜨는 첫 마운트에만 게이트를 걸어, 'critical' 이 아닌
 * 요청은 기도 목록 응답이 도착할 때까지(최대 HOLD_TIMEOUT_MS) 출발을 미룬다.
 * 캐시가 있는 웜 진입은 게이트를 걸지 않는다(목록이 즉시 그려지므로 경쟁해도 스피너가 없다).
 */
const HOLD_TIMEOUT_MS = 1500

let gate: Promise<void> | null = null
let release: (() => void) | null = null
let timer: ReturnType<typeof setTimeout> | null = null

export const releaseSecondaryRequests = (): void => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  const r = release
  gate = null
  release = null
  r?.()
}

/** 이미 걸려 있으면 아무 일도 하지 않는다(멱등) — 렌더 중 호출해도 안전하다 */
export const holdSecondaryRequests = (): void => {
  if (gate) return
  gate = new Promise<void>((resolve) => {
    release = resolve
  })
  // 안전장치 — 기도 목록이 실패·지연되더라도 나머지 화면이 영영 굶지 않게 한다
  timer = setTimeout(releaseSecondaryRequests, HOLD_TIMEOUT_MS)
}

/** 게이트가 없으면 즉시 resolve 되는 Promise (await 비용만) */
export const waitForCriticalRequests = (): Promise<void> => gate ?? Promise.resolve()

/**
 * 동시 요청 제한(세마포어).
 *
 * 2026-10-14 실측 — 홈이 마운트 때 보내는 GET 19개를
 *   한꺼번에 보내면 전부 끝나는 데 5.3초(요청마다 평균 4.3초),
 *   동시 1~6개로 제한하면 1.5초(한 요청 평균 80~440ms) 로 총시간이 같았다.
 * 백엔드(단일 워커 소형 컨테이너)는 요청을 사실상 직렬로 처리하므로 한꺼번에 몰아 보내는 것
 * 자체가 3배 넘는 손해다. 그래서 일반 GET 은 동시 MAX_IN_FLIGHT 개만 내보내고 나머지는 줄을 세운다.
 * 멀티 워커로 늘리는 해법은 쓰지 않는다(알림 SSE·presence 가 단일 프로세스 전제).
 *
 * 줄 순서: 라우트가 바뀌면(hashchange) 세대가 올라가고 새 세대가 먼저 나간다 — 홈에서 다른
 * 화면으로 넘어갔을 때 홈이 남긴 뒷순위 요청보다 지금 화면의 요청이 앞선다. 같은 세대 안은 선착순.
 * 'critical'·'high'·GET 아닌 요청(사용자 행동)·keepalive 는 줄을 서지 않고 바로 나가되 자리는 센다.
 * 한 요청이 SLOT_LEASE_MS 넘게 붙들면(TTS 생성·검색 등) 자리를 먼저 돌려줘 뒤가 막히지 않게 한다.
 */
const MAX_IN_FLIGHT = 3
const SLOT_LEASE_MS = 4000

interface Waiter {
  generation: number
  seq: number
  signal?: AbortSignal
  resolve: () => void
  reject: (error: unknown) => void
}

let inFlight = 0
let generation = 0
let seq = 0
const waiting: Waiter[] = []

// 줄 서는 요청(bypass 아닌 것)의 진행 중+대기 수 — 전역 "불러오는 중" 말풍선(LoadingVerseToast)이 구독한다.
// bypass 요청(핵심·사용자 행동)은 저마다 스피너·버튼 상태가 있어 세지 않는다.
let queuedInFlight = 0
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

export const getPendingRequestCount = (): number => queuedInFlight + waiting.length
export const subscribeRequestQueue = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    generation += 1
  })
}

const abortError = () =>
  typeof DOMException !== 'undefined' ? new DOMException('The operation was aborted.', 'AbortError') : new Error('aborted')

const pump = (): void => {
  while (inFlight < MAX_IN_FLIGHT && waiting.length > 0) {
    let best = 0
    for (let i = 1; i < waiting.length; i++) {
      const a = waiting[i]
      const b = waiting[best]
      if (a.generation > b.generation || (a.generation === b.generation && a.seq < b.seq)) best = i
    }
    const [next] = waiting.splice(best, 1)
    if (next.signal?.aborted) {
      next.reject(abortError())
      continue
    }
    inFlight += 1
    queuedInFlight += 1
    next.resolve()
  }
  notify()
}

const takeSlot = (counted: boolean): (() => void) => {
  let released = false
  const release = () => {
    if (released) return
    released = true
    clearTimeout(lease)
    inFlight -= 1
    if (counted) queuedInFlight -= 1
    pump()
  }
  const lease = setTimeout(release, SLOT_LEASE_MS)
  return release
}

/**
 * 요청 자리를 하나 받는다. 돌려주는 함수로 자리를 반납한다(여러 번 불러도 한 번만 반납).
 * bypass 면 줄을 서지 않고 바로 자리를 받는다(동시 한도를 넘어서라도).
 */
export const acquireRequestSlot = async (bypass: boolean, signal?: AbortSignal): Promise<() => void> => {
  if (bypass) {
    inFlight += 1
    return takeSlot(false)
  }
  if (inFlight < MAX_IN_FLIGHT && waiting.length === 0) {
    inFlight += 1
    queuedInFlight += 1
    notify()
    return takeSlot(true)
  }
  if (signal?.aborted) throw abortError()
  await new Promise<void>((resolve, reject) => {
    waiting.push({ generation, seq: seq++, signal, resolve, reject })
    notify()
  })
  return takeSlot(true)
}
