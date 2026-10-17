import { API_V1 } from '../config/api'
import { request, isApiError } from './utils/request'
import { tokenStore } from '../utils/tokenStore'

const AUTH_BASE = `${API_V1}/auth`


// 현재 로그인 사용자 정보
export interface MeResponse {
  id: number
  username: string
  full_name: string | null
  email: string | null
  is_active: boolean
  is_admin: boolean
  created_at: string
}

// 현재 로그인한 사용자 정보 조회
export const getMe = async (): Promise<MeResponse> => {
  return request<MeResponse>(`${AUTH_BASE}/me`, { auth: 'required', errorMessage: '내 정보를 불러오는데 실패했습니다' })
}

// 이름(프로필) 변경 실패 종류
export type UpdateNameError = 'invalid' | 'duplicate' | 'failed'

// 이름(full_name) 변경
export const updateName = async (fullName: string): Promise<MeResponse> => {
  // 400은 이름 중복 (백엔드 detail은 한국어 고정 → 종류만 구분해 번역)
  const failed: UpdateNameError = 'failed'
  try {
    return await request<MeResponse>(`${AUTH_BASE}/me`, {
      auth: 'required',
      method: 'PATCH',
      json: { full_name: fullName },
      errorMessage: failed,
      ignoreServerDetail: true,
    })
  } catch (error) {
    const kind: UpdateNameError =
      isApiError(error, 422) ? 'invalid'
        : isApiError(error, 400) ? 'duplicate'
          : failed
    throw new Error(kind)
  }
}

// 비밀번호 변경 실패 종류 (프론트에서 번역 메시지로 매핑)
export type ChangePasswordError = 'wrong_current' | 'too_short' | 'failed'

// 비밀번호 변경 응답 — 변경과 함께 기존 토큰이 전부 폐기되므로(백엔드 users.token_version)
// 현재 기기에서 계속 쓸 새 토큰이 같이 온다. 구버전 백엔드는 message 만 준다.
interface ChangePasswordResponse {
  message: string
  access_token?: string
  refresh_token?: string
}

// 비밀번호 변경
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  // 백엔드 detail은 한국어로 고정이므로 상태 코드로 종류만 구분하고,
  // 실제 메시지는 화면에서 현재 언어에 맞게 번역한다.
  const failed: ChangePasswordError = 'failed'
  try {
    const data = await request<ChangePasswordResponse | undefined>(`${AUTH_BASE}/change-password`, {
      auth: 'required',
      method: 'POST',
      json: { current_password: currentPassword, new_password: newPassword },
      errorMessage: failed,
      ignoreServerDetail: true,
    })
    // 새 토큰을 저장하지 않으면 다음 요청이 401 → refresh 도 거부되어 로그아웃된다
    if (data?.access_token) {
      tokenStore.setTokens(data.access_token, data.refresh_token ?? tokenStore.getRefresh())
    }
  } catch (error) {
    const kind: ChangePasswordError =
      isApiError(error, 400) ? 'wrong_current'
        : isApiError(error, 422) ? 'too_short'
          : failed
    throw new Error(kind)
  }
}
