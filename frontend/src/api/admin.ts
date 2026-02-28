// Admin API
import { API_V1, apiFetch } from '../config/api'
import type { PrayerGroup } from '../types/prayer'

// 관리자용 그룹 목록 조회
export interface AdminGroupListResponse {
  success: boolean
  data: {
    items: Array<PrayerGroup & {
      creator_id: number
      creator_name: string
      updated_at: string
    }>
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export const fetchAdminGroups = async (
  page: number = 1,
  limit: number = 20
): Promise<AdminGroupListResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(
    `${API_V1}/admin/groups?page=${page}&limit=${limit}`,
    { headers }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '그룹 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 관리자용 그룹 삭제
export const deleteAdminGroup = async (groupId: number): Promise<void> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/admin/groups/${groupId}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '그룹 삭제에 실패했습니다')
  }
}
