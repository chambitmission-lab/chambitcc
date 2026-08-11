// 앱 버전 자가 갱신
//
// 설치형 PWA(WebAPK)는 강력 새로고침이 없고, 아이콘으로 "다시 여는" 것은
// 대부분 백그라운드에 살아있던 옛 페이지의 복귀라서 재배포 후에도 옛 번들이
// 며칠씩 실행될 수 있다 (재설치해야만 고쳐지던 문제의 원인).
// 앱 시작·포그라운드 복귀 때 서버의 version.json 과 실행 중인 빌드 버전을
// 비교해서 다르면 스스로 새로고침한다.

const CHECK_THROTTLE_MS = 1000 * 60 // 복귀가 잦아도 검사는 1분에 1회면 충분
const RELOAD_GUARD_KEY = 'app_update_reload_guard'
const RELOAD_RETRY_MS = 1000 * 60 * 5

let lastCheckAt = 0

export const checkForAppUpdate = async (): Promise<void> => {
  // dev 서버에는 version.json 이 없다 (빌드 산출물)
  if (import.meta.env.DEV) return

  const now = Date.now()
  if (now - lastCheckAt < CHECK_THROTTLE_MS) return
  lastCheckAt = now

  try {
    const base = import.meta.env.BASE_URL || '/'
    const url = `${base}/version.json`.replace(/\/+/g, '/')
    // no-store: 이 요청만은 HTTP 캐시를 완전히 우회해야 의미가 있다
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return

    const data: unknown = await res.json()
    const latest =
      typeof (data as { version?: unknown })?.version === 'string'
        ? (data as { version: string }).version
        : null
    if (!latest || latest === __APP_VERSION__) return

    // 새로고침 루프 방지: CDN 엣지가 아직 옛 번들을 주는 동안에는
    // reload 해도 버전이 안 바뀔 수 있다 → 같은 목표 버전으로는 5분에 1회만 시도
    try {
      const guard = localStorage.getItem(RELOAD_GUARD_KEY)
      if (guard) {
        const parsed = JSON.parse(guard) as { version?: string; at?: number }
        if (parsed.version === latest && now - (parsed.at ?? 0) < RELOAD_RETRY_MS) {
          return
        }
      }
      localStorage.setItem(
        RELOAD_GUARD_KEY,
        JSON.stringify({ version: latest, at: now }),
      )
    } catch {
      // localStorage 불가 환경이면 가드 없이 1회 reload (throttle이 최소한의 방어)
    }

    window.location.reload()
  } catch {
    // 오프라인 등 — 조용히 넘어가고 다음 복귀 때 다시 검사
  }
}
