/**
 * 예외를 삼키는 Web Storage 래퍼 (localStorage → safeStorage, sessionStorage → safeSessionStorage).
 *
 * 저장소 접근은 실패할 수 있다 — 일부 인앱 웹뷰·저장소 차단 설정에선 접근 자체가 던지고,
 * Safari 는 용량 초과 시 setItem 이 QuotaExceededError 를 던진다. 앱 시작 경로(App 마운트,
 * 테마·언어 초기화, 로그인 프리필)에서 한 번이라도 던지면 ErrorBoundary 가 전체 화면을
 * 덮으므로, "못 읽으면 기본값, 못 쓰면 그냥 넘어감"으로 다룬다.
 *
 * getJson/setJson 은 화면마다 손으로 반복하던 `try { JSON.parse(getItem(..)) } catch` 를 모은 것이다.
 * 파싱까지만 책임지고 **형태 검증은 호출부**가 한다 — 저장값은 구버전·수동 편집으로 깨져 있을 수
 * 있으니 `Array.isArray` 등으로 좁혀서 써야 한다. 없거나 깨졌으면 undefined.
 *
 * 토큰은 utils/tokenStore 가 따로 맡는다(내부적으로 이 래퍼를 쓴다).
 */
export interface SafeStorage {
  get(key: string): string | null
  /** 저장에 성공했으면 true — "자동 저장됨" 같은 표시를 실패 시 띄우지 않으려면 반환값을 본다 */
  set(key: string, value: string): boolean
  remove(key: string): void
  /** JSON 으로 저장된 값. 없거나 파싱이 실패하면 undefined (형태 검증은 호출부 몫) */
  getJson(key: string): unknown
  /** JSON.stringify 해서 저장. 성공하면 true */
  setJson(key: string, value: unknown): boolean
}

const makeSafeStorage = (backend: () => Storage): SafeStorage => {
  const get = (key: string): string | null => {
    try {
      return backend().getItem(key)
    } catch {
      return null
    }
  }
  const set = (key: string, value: string): boolean => {
    try {
      backend().setItem(key, value)
      return true
    } catch {
      /* 저장 실패는 조용히 무시 — 다음 실행에서 기본값으로 돌아갈 뿐 */
      return false
    }
  }
  const remove = (key: string): void => {
    try {
      backend().removeItem(key)
    } catch {
      /* noop */
    }
  }
  const getJson = (key: string): unknown => {
    const raw = get(key)
    if (raw === null) return undefined
    try {
      return JSON.parse(raw) as unknown
    } catch {
      return undefined
    }
  }
  const setJson = (key: string, value: unknown): boolean => {
    try {
      return set(key, JSON.stringify(value))
    } catch {
      /* 순환 참조 등 stringify 실패 */
      return false
    }
  }
  return { get, set, remove, getJson, setJson }
}

/** localStorage — 기기에 남는 편의 값(설정·초안·최근 목록) */
export const safeStorage: SafeStorage = makeSafeStorage(() => localStorage)

/** sessionStorage — 탭을 닫으면 사라지는 값(스크롤 위치·이번 세션에 본 안내) */
export const safeSessionStorage: SafeStorage = makeSafeStorage(() => sessionStorage)
