// 인증 API — 로그인·회원가입은 토큰 없이 보내는 유일한 요청들이라 auth: false 를 명시한다
import { isApiError, request } from './utils/request'

export interface LoginResponse {
  access_token: string
  refresh_token?: string
  username?: string
  full_name?: string
}

export interface RegisterPayload {
  username: string
  password: string
  full_name: string | null
}

export interface RegisterResponse {
  approval_status?: 'pending' | 'approved' | string
  [key: string]: unknown
}

export interface SignupPolicy {
  require_approval: boolean
}

/** 로그인 사유 코드 — 403 일 때 백엔드가 X-Auth-Reason 헤더로 구분해 준다 */
export type AuthReason = 'pending_approval' | 'rejected' | 'inactive' | null

/**
 * 로그인. 백엔드 detail 문구는 언어가 고정돼 있어 화면에서 status/reason 으로
 * 번역 메시지를 고르므로, 서버 문구는 버리고 상태 코드만 전달한다.
 */
export const login = (username: string, password: string): Promise<LoginResponse> => {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
    errorMessage: 'LOGIN_FAILED',
    ignoreServerDetail: true,
  })
}

/** 403 응답의 사유 헤더. 로그인 에러가 아니면 null */
export const getAuthReason = (error: unknown): AuthReason => {
  if (!isApiError(error, 403)) return null
  const reason = error.response?.headers.get('X-Auth-Reason')
  if (reason === 'pending_approval' || reason === 'rejected') return reason
  return 'inactive'
}

export const register = (payload: RegisterPayload): Promise<RegisterResponse> =>
  request<RegisterResponse>('/auth/register', {
    method: 'POST',
    auth: false,
    json: payload,
    errorMessage: 'REGISTER_FAILED',
  })

export const getSignupPolicy = (): Promise<SignupPolicy> =>
  request<SignupPolicy>('/auth/signup-policy', { auth: false })
