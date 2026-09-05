// API 공통 유틸리티 함수들
import { tokenStore } from '../../utils/tokenStore'

/**
 * HTTP 상태를 들고 다니는 에러.
 * 메시지만 던지면 호출부가 "재시도해도 소용없는 4xx"인지 알 수 없어서,
 * 삭제된 리소스(404) 같은 경우에도 React Query가 한 번 더 요청하고 그만큼
 * 빈 화면이 길어진다. (config/queryClient.ts의 createRetry가 이 status를 본다)
 */
export class ApiError extends Error {
  status: number
  /** 원본 응답 — 헤더(X-Auth-Reason 등)를 읽어야 하는 드문 경우에만 쓴다 */
  response?: Response

  constructor(status: number, message: string, response?: Response) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.response = response
  }
}

/**
 * 인증 토큰을 포함한 헤더 생성
 * (신규 코드는 api/utils/request 의 request()/requestRaw() 를 쓴다 — 헤더를 직접 만들 일이 없다)
 */
export const getAuthHeaders = (includeContentType = false): Record<string, string> => {
  const headers: Record<string, string> = {}

  const token = tokenStore.getAccess()
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
  const token = tokenStore.getAccess()
  if (!token) {
    throw new ApiError(401, '로그인이 필요합니다')
  }
  return token
}

/**
 * API 에러 처리 — 실패 응답을 status 가 담긴 ApiError 로 던진다.
 */
export const handleApiError = async (response: Response, defaultMessage: string): Promise<never> => {
  let message = defaultMessage
  try {
    const error = await response.json()
    if (typeof error?.detail === 'string' && error.detail) message = error.detail
  } catch {
    /* 본문이 JSON 이 아니면 기본 메시지 */
  }
  throw new ApiError(response.status, message)
}
