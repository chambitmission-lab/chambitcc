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
 * 인증 토큰 확인 (로그인 필수 API용)
 */
export const requireAuth = (): string => {
  const token = tokenStore.getAccess()
  if (!token) {
    throw new ApiError(401, '로그인이 필요합니다')
  }
  return token
}
