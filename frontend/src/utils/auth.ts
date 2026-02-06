// 인증 관련 유틸리티 함수

/**
 * 로그아웃 처리
 * - localStorage 정리
 * - 페이지 리로드로 상태 초기화
 */
export const logout = () => {
  // 토큰 및 사용자 정보 제거
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  localStorage.removeItem('user_username')
  localStorage.removeItem('user_full_name')
  
  // 더 이상 사용하지 않는 fingerprint 제거
  localStorage.removeItem('user_fingerprint')
  
  // 페이지 리로드 (캐시는 자동으로 정리됨)
  // origin + basename으로 이동 (Vite base와 일치)
  const basename = import.meta.env.PROD ? '/chambitcc' : ''
  window.location.href = window.location.origin + basename + '/'
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
