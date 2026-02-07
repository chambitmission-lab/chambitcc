import { logout, refreshAccessToken } from '../utils/auth'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const API_V1 = `${API_URL}/api/v1`

// Token refresh 중복 방지를 위한 플래그
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

// 401 에러 처리 및 자동 토큰 갱신을 위한 fetch wrapper
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let response = await fetch(url, options)

  // 401 Unauthorized 에러 처리
  if (response.status === 401) {
    // Authorization 헤더가 있는 요청만 토큰 갱신 시도
    const hasAuthHeader = options.headers && 
      (options.headers as Record<string, string>)['Authorization']
    
    if (hasAuthHeader) {
      // 이미 refresh 중이면 기다림
      if (isRefreshing && refreshPromise) {
        const newToken = await refreshPromise
        if (newToken) {
          // 새 토큰으로 재시도
          const newHeaders = {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
          } as HeadersInit
          
          return fetch(url, { ...options, headers: newHeaders })
        }
      }

      // Token refresh 시도
      if (!isRefreshing) {
        isRefreshing = true
        refreshPromise = refreshAccessToken()
        
        const newToken = await refreshPromise
        
        isRefreshing = false
        refreshPromise = null

        if (newToken) {
          // 새 토큰으로 원래 요청 재시도
          const newHeaders = {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
          } as HeadersInit
          
          response = await fetch(url, { ...options, headers: newHeaders })
          return response
        } else {
          // Refresh token도 만료됨 - 로그인 페이지로
          const currentPath = window.location.pathname + window.location.search
          if (currentPath !== '/login' && currentPath !== '/register') {
            sessionStorage.setItem('redirect_after_login', currentPath)
          }
          
          throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.')
        }
      }
    }
  }

  return response
}
