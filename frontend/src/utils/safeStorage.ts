/**
 * 예외를 삼키는 localStorage 래퍼.
 *
 * 저장소 접근은 실패할 수 있다 — 일부 인앱 웹뷰·저장소 차단 설정에선 접근 자체가 던지고,
 * Safari 는 용량 초과 시 setItem 이 QuotaExceededError 를 던진다. 앱 시작 경로(App 마운트,
 * 테마·언어 초기화, 로그인 프리필)에서 한 번이라도 던지면 ErrorBoundary 가 전체 화면을
 * 덮으므로, 그 경로만큼은 "못 읽으면 기본값, 못 쓰면 그냥 넘어감"으로 다룬다.
 *
 * 토큰은 utils/tokenStore 가 따로 맡는다. 여기엔 환경설정·프리필 같은 편의 값만.
 */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* 저장 실패는 조용히 무시 — 다음 실행에서 기본값으로 돌아갈 뿐 */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      /* noop */
    }
  },
}
