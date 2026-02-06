// 인증 관련 유틸리티 함수

/**
 * 로그아웃 처리
 * - localStorage 정리 (토큰, 사용자 정보, React Query 캐시)
 */
export const logout = () => {
  // 토큰 및 사용자 정보 제거
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  localStorage.removeItem('user_username')
  localStorage.removeItem('user_full_name')
  localStorage.removeItem('user_fingerprint')
  
  // React Query 캐시 제거 (persister가 localStorage 사용)
  localStorage.removeItem('REACT_QUERY_CACHE')
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
