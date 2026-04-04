import { API_V1, apiFetch } from '../config/api'

export interface User {
  id: number
  username: string
  full_name?: string
  is_admin: boolean
  is_active: boolean
  created_at: string
  last_login?: string
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
