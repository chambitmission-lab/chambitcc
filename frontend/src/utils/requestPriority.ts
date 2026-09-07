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
