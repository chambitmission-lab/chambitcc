// 인증 관련 유틸리티 함수
import { queryClient } from '../config/queryClient'

/**
 * 로그아웃 처리
 * - localStorage 정리
 * - React Query 캐시 초기화
 */
export const logout = () => {
  // 토큰 및 사용자 정보 제거
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  localStorage.removeItem('user_username')
  localStorage.removeItem('user_full_name')
  
  // React Query 캐시 초기화
  queryClient.clear()
  
  // 페이지 새로고침하여 모든 상태 초기화
  window.location.href = '/'
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
