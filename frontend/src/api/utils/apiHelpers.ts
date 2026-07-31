// API 공통 유틸리티 함수들

/**
 * HTTP 상태를 들고 다니는 에러.
 * 메시지만 던지면 호출부가 "재시도해도 소용없는 4xx"인지 알 수 없어서,
 * 삭제된 리소스(404) 같은 경우에도 React Query가 한 번 더 요청하고 그만큼
 * 빈 화면이 길어진다. (config/queryClient.ts의 createRetry가 이 status를 본다)
 */
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * 인증 토큰을 포함한 헤더 생성
 */
export const getAuthHeaders = (includeContentType = false): HeadersInit => {
  const headers: HeadersInit = {}
  
  const token = localStorage.getItem('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json'
  }
  
  return headers
}

/**
 * 인증 토큰 확인 (로그인 필수 API용)
 */
export const requireAuth = (): string => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  return token
}

/**
 * API 에러 처리
 */
export const handleApiError = async (response: Response, defaultMessage: string): Promise<never> => {
  if (!response.ok) {
    try {
      const error = await response.json()
      throw new Error(error.detail || defaultMessage)
    } catch {
      throw new Error(defaultMessage)
    }
  }
  throw new Error(defaultMessage)
}
