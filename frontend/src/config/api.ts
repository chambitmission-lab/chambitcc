import { isTokenExpired, refreshAccessToken } from '../utils/auth'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const API_V1 = `${API_URL}/api/v1`

// Token refresh 중복 방지 — 동시에 여러 요청이 만료를 감지해도 갱신은 한 번만 수행
let refreshPromise: Promise<string | null> | null = null

const refreshOnce = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

const withNewToken = (options: RequestInit, token: string): RequestInit => ({
  ...options,
  headers: {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  } as HeadersInit,
})

// 401 자동 토큰 갱신 + 만료 토큰 선제 갱신 fetch wrapper
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const authHeader = (options.headers as Record<string, string> | undefined)?.['Authorization']

  // 선제 갱신: 만료된 access token 을 그대로 실어 보내지 않는다.
  // optional-auth 가 아닌 엔드포인트라도 불필요한 401 왕복을 줄이고,
  // 만료 토큰이 익명(200) 응답으로 처리되는 계열의 버그를 요청 전에 차단한다.
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (isTokenExpired(token)) {
      const newToken = await refreshOnce()
      if (newToken) {
        options = withNewToken(options, newToken)
      }
    }
  }

  let response = await fetch(url, options)

  // 401 Unauthorized — Authorization 헤더가 있던 요청만 갱신 후 재시도
  if (response.status === 401 && authHeader) {
    const newToken = await refreshOnce()

    if (newToken) {
      response = await fetch(url, withNewToken(options, newToken))
    } else {
      // Refresh token도 만료됨 - 로그인 페이지로
      const currentPath = window.location.pathname + window.location.search
      if (currentPath !== '/login' && currentPath !== '/register') {
        sessionStorage.setItem('redirect_after_login', currentPath)
      }

      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.')
    }
  }

  return response
}
