// 인증 관련 유틸리티 함수
import { clearAllPersistedCache } from '../config/persister'
import { unsubscribeFromPushNotifications } from './pushNotification'
import { tokenStore, sessionStore } from './tokenStore'
import { getRole } from './access'

/**
 * 로그아웃 처리
 * - localStorage 정리 (토큰, 사용자 정보, React Query 캐시) → 즉시 동기 처리
 * - 푸시 구독 해제 (브라우저 + 백엔드) → 백그라운드 처리
 *
 * 핵심: 푸시 구독 해제는 서비스워커 준비 대기 + 백엔드 네트워크 호출을 포함해
 * 느리거나 멈출 수 있다. 이걸 await 하면 로그아웃/화면 전환이 그만큼 버벅인다.
 * 따라서 토큰·캐시 제거는 즉시 끝내고, 푸시 해제는 백그라운드로 던진다(fire-and-forget).
 *
 * 푸시 구독은 브라우저(오리진) 단위로 유지되기 때문에 로그아웃 시
 * 명시적으로 해제하지 않으면 다음에 같은 디바이스로 로그인한 다른
 * 사용자가 이전 사용자의 구독 상태를 그대로 물려받게 된다.
 * 백엔드 DELETE 호출은 인증이 필요하므로 토큰을 지우기 *전에* 스냅샷해서 넘긴다.
 *
 * 참고: React Query 캐시는 자동으로 무효화됩니다.
 * 로그인 시 queryClient.invalidateQueries()가 호출되어
 * 새 사용자의 데이터로 갱신됩니다.
 */
export const logout = async () => {
  // 백엔드 구독 해제에 필요한 토큰을 제거 전에 스냅샷
  const token = tokenStore.getAccess()

  // 토큰 및 사용자 정보 제거 (동기 · 즉시)
  tokenStore.clear()
  sessionStore.clear()
  localStorage.removeItem('last_cached_username')

  // React Query 캐시 제거 (모든 사용자의 캐시 - 프로필 포함)
  clearAllPersistedCache()

  // 푸시 구독 해제는 화면 전환을 막지 않도록 백그라운드로 처리.
  // (네트워크/서비스워커가 느려도 로그아웃 UI는 즉시 반응한다)
  void unsubscribeFromPushNotifications(token).catch((error) => {
    console.warn('로그아웃 중 푸시 구독 해제 실패 (무시):', error)
  })
}

/**
 * 로그인 응답을 세션으로 확정한다 — 토큰·세션 사용자 필드 저장 + 이전 사용자 캐시 제거.
 * (React Query 메모리 캐시 초기화는 호출부가 queryClient.clear() 로 담당)
 */
export const establishSession = (
  data: { access_token: string; refresh_token?: string; username?: string; full_name?: string },
  fallbackUsername: string
): { username: string; fullName: string | null } => {
  tokenStore.setAccess(data.access_token)
  // Refresh token 저장 (백엔드에서 제공하는 경우)
  if (data.refresh_token) tokenStore.setRefresh(data.refresh_token)

  // 백엔드에서 username을 반환하지 않으면 입력한 값 사용
  const username = data.username || fallbackUsername
  sessionStore.set('username', username)
  localStorage.setItem('last_cached_username', username)
  if (data.full_name) sessionStore.set('fullName', data.full_name)

  // 이전 사용자의 캐시 완전히 제거 (사용자별 캐시 분리)
  clearAllPersistedCache()

  return { username, fullName: data.full_name ?? null }
}

/**
 * JWT payload 의 exp(초) 를 읽어 만료 여부를 판정한다.
 * 파싱 불가(비 JWT/손상) 토큰은 만료로 단정하지 않고 서버 판정에 맡긴다(false).
 * skewMs: 전송 지연 중 만료되는 경계 케이스를 피하기 위한 여유 시간.
 */
export const isTokenExpired = (token: string, skewMs = 30_000): boolean => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    if (typeof payload.exp !== 'number') return false
    return payload.exp * 1000 - skewMs <= Date.now()
  } catch {
    return false
  }
}

/**
 * 로그인 상태 확인
 * 토큰 문자열 존재만 보면 만료된 뒤에도 "로그인됨"으로 오판하므로 exp 까지 확인한다.
 * access 가 만료됐어도 refresh token 이 살아있으면 apiFetch 가 자동 갱신하므로 로그인 상태로 본다.
 */
export const isAuthenticated = (): boolean => {
  const accessToken = tokenStore.getAccess()
  if (!accessToken) return false
  if (!isTokenExpired(accessToken)) return true
  return !!tokenStore.getRefresh()
}

/**
 * 현재 사용자 정보 가져오기
 */
export const getCurrentUser = () => {
  return {
    username: sessionStore.get('username'),
    fullName: sessionStore.get('fullName'),
  }
}

/**
 * 관리자 권한 확인 — 화면에서는 utils/access 의 can('...') 을 쓴다 (역할 확장 대비)
 */
export const isAdmin = (): boolean => getRole() === 'admin'

/**
 * Access Token 갱신
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = tokenStore.getRefresh()
  
  if (!refreshToken) {
    return null
  }

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      // 401/403 만 refresh token 무효(만료·위조)로 확정할 수 있다.
      // 5xx 는 서버 재시작·재배포 중 응답이므로 토큰을 지우면
      // 멀쩡히 로그인된 사용자가 서버 리스타트 타이밍에 로그아웃된다.
      if (response.status === 401 || response.status === 403) {
        await logout()
      }
      return null
    }

    const data = await response.json()
    const newAccessToken = data.access_token

    // 새 access token 저장
    tokenStore.setAccess(newAccessToken)

    return newAccessToken
  } catch (error) {
    // 네트워크 오류(오프라인, 앱 복귀 직후 연결 전 등)는 토큰 유효성과
    // 무관하므로 로그아웃하지 않고 다음 요청에서 재시도하게 둔다.
    console.error('Token refresh failed (tokens preserved):', error)
    return null
  }
}
