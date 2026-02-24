// 인증 관련 유틸리티 함수
import { clearAllPersistedCache } from '../config/persister'

/**
 * 로그아웃 처리
 * - localStorage 정리 (토큰, 사용자 정보, React Query 캐시)
 * 
 * 참고: React Query 캐시는 자동으로 무효화됩니다.
 * 로그인 시 queryClient.invalidateQueries()가 호출되어
 * 새 사용자의 데이터로 갱신됩니다.
 */
export const logout = () => {
  // 토큰 및 사용자 정보 제거
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  localStorage.removeItem('user_username')
  localStorage.removeItem('user_full_name')
  localStorage.removeItem('user_fingerprint')
  localStorage.removeItem('last_cached_username')
  
  // React Query 캐시 제거 (모든 사용자의 캐시)
  clearAllPersistedCache()
  
  // 프로필 캐시도 제거
  localStorage.removeItem('profile_detail_cache')
  localStorage.removeItem('profile_detail_cache_timestamp')
}

/**
 * 로그인 상태 확인
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token')
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
      logout()
      return null
    }

    const data = await response.json()
    const newAccessToken = data.access_token
    
    // 새 access token 저장
    localStorage.setItem('access_token', newAccessToken)
    
    return newAccessToken
  } catch (error) {
    console.error('Token refresh failed:', error)
    logout()
    return null
  }
}
