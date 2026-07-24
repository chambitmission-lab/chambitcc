import { API_V1, apiFetch } from '../config/api'

/** 가입 승인 상태 — is_active(운영 중 정지)와는 별개의 축 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: number
  username: string
  full_name?: string
  is_admin: boolean
  is_active: boolean
  approval_status: ApprovalStatus
  approved_at?: string | null
  created_at: string
  last_login?: string
}

/** 관리자만 볼 수 있는 전역 운영 설정 */
export interface AdminSettings {
  require_signup_approval: boolean
}

export interface UsersResponse {
  users: User[]
}

export interface UpdateUserRoleRequest {
  is_admin: boolean
}

export interface UpdateUserStatusRequest {
  is_active: boolean
}

// 회원 목록 조회
export const getUserList = async (): Promise<UsersResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/admin/users`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('회원 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 회원 권한 변경
export const updateUserRole = async (
  userId: number,
  isAdmin: boolean
): Promise<void> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ is_admin: isAdmin }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '권한 변경에 실패했습니다')
  }
}

// 회원 상태 변경
export const updateUserStatus = async (
  userId: number,
  isActive: boolean
): Promise<void> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ is_active: isActive }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '상태 변경에 실패했습니다')
  }
}

// 회원 가입 승인 / 거절
// 거절해도 계정은 rejected로 남는다 (재승인 가능, 같은 아이디 재가입 차단)
export const updateUserApproval = async (
  userId: number,
  approve: boolean
): Promise<void> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/admin/users/${userId}/approval`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ approve }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '승인 처리에 실패했습니다')
  }
}

// 전역 운영 설정 조회
export const getAdminSettings = async (): Promise<AdminSettings> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/admin/settings`, { headers })

  if (!response.ok) {
    throw new Error('설정을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 전역 운영 설정 변경 (보낸 항목만 반영)
export const updateAdminSettings = async (
  patch: Partial<AdminSettings>
): Promise<AdminSettings> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/admin/settings`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patch),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '설정 변경에 실패했습니다')
  }

  return response.json()
}
