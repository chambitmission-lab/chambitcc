// 인증 관련 유틸리티 함수
import { clearAllPersistedCache } from '../config/persister'
import { unsubscribeFromPushNotifications } from './pushNotification'

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
  const token = localStorage.getItem('access_token')

  // 토큰 및 사용자 정보 제거 (동기 · 즉시)
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  localStorage.removeItem('user_username')
  localStorage.removeItem('user_full_name')
  localStorage.removeItem('user_fingerprint')
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
  const accessToken = localStorage.getItem('access_token')
  if (!accessToken) return false
  if (!isTokenExpired(accessToken)) return true
  return !!localStorage.getItem('refresh_token')
}

/**
 * 현재 사용자 정보 가져오기
 */
export const getCurrentUser = () => {
  return {
    username: localStorage.getItem('user_username'),
    fullName: localStorage.getItem('user_full_name'),
  }
}

/**
 * 관리자 권한 확인
 */
export const isAdmin = (): boolean => {
  const username = localStorage.getItem('user_username')
  return username === 'admin'
}

/**
 * Access Token 갱신
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refresh_token')
  
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
      // Refresh token도 만료됨
      await logout()
      return null
    }

    const data = await response.json()
    const newAccessToken = data.access_token
    
    // 새 access token 저장
    localStorage.setItem('access_token', newAccessToken)
    
    return newAccessToken
  } catch (error) {
    console.error('Token refresh failed:', error)
    await logout()
    return null
  }
}
