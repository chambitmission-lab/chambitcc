import { API_V1, apiFetch } from '../config/api'

const AUTH_BASE = `${API_V1}/auth`

// 인증 헤더 생성 헬퍼
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  return {
    'Authorization': `Bearer ${token}`,
  }
}

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
  const response = await apiFetch(`${AUTH_BASE}/me`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('내 정보를 불러오는데 실패했습니다')
  }

  return response.json()
}

// 이름(프로필) 변경 실패 종류
export type UpdateNameError = 'invalid' | 'failed'

// 이름(full_name) 변경
export const updateName = async (fullName: string): Promise<MeResponse> => {
  const response = await apiFetch(`${AUTH_BASE}/me`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ full_name: fullName }),
  })

  if (!response.ok) {
    const kind: UpdateNameError = response.status === 422 ? 'invalid' : 'failed'
    throw new Error(kind)
  }

  return response.json()
}

// 비밀번호 변경 실패 종류 (프론트에서 번역 메시지로 매핑)
export type ChangePasswordError = 'wrong_current' | 'too_short' | 'failed'

// 비밀번호 변경
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const response = await apiFetch(`${AUTH_BASE}/change-password`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  })

  if (!response.ok) {
    // 백엔드 detail은 한국어로 고정이므로 상태 코드로 종류만 구분하고,
    // 실제 메시지는 화면에서 현재 언어에 맞게 번역한다.
    const kind: ChangePasswordError =
      response.status === 400 ? 'wrong_current'
        : response.status === 422 ? 'too_short'
          : 'failed'
    throw new Error(kind)
  }
}
