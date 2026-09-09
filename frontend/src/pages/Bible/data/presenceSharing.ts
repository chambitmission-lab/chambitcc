// 함께 읽기 — "내 읽기 위치 공유" 설정. 읽기 설정(Aa)에서 끄고 켠다.
//
// 켜져 있으면 20~30초마다 지금 읽는 책·장·절을 서버 메모리에 알리고,
// 같은 장을 읽는 성도에게 숫자로만 보인다(이름 노출 없음). 기본값은 켜짐.
// 저장·전파 방식은 readerLayout 과 같다 — 끄는 즉시 열린 본문의 하트비트가 멈춘다.

const STORAGE_KEY = 'bible-presence-sharing'
let cache: boolean | null = null
const listeners = new Set<() => void>()

export const isPresenceSharingEnabled = (): boolean => {
  if (cache === null) {
    try {
      cache = localStorage.getItem(STORAGE_KEY) !== 'off'
    } catch {
      cache = true
    }
  }
  return cache
}

export const setPresenceSharingEnabled = (value: boolean) => {
  cache = value
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off')
  } catch {
    /* 사파리 프라이빗 모드 등 — 이번 세션만 반영 */
  }
  listeners.forEach((fn) => fn())
}

/** useSyncExternalStore 용 구독 */
export const subscribePresenceSharing = (fn: () => void): (() => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
