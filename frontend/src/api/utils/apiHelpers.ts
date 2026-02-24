// API 공통 유틸리티 함수들

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
