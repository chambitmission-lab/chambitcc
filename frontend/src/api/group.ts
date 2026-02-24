// Prayer Group API
import { API_V1, apiFetch } from '../config/api'
import type { 
  PrayerGroup, 
  GroupListResponse,
  CreateGroupRequest,
  JoinGroupRequest,
  GroupMembersResponse
} from '../types/prayer'

// 내가 속한 그룹 목록 조회
export const fetchMyGroups = async (): Promise<GroupListResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayer-groups/my`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('그룹 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 전체 그룹 목록 조회 (검색/탐색용)
export const fetchAllGroups = async (): Promise<GroupListResponse> => {
  const headers: HeadersInit = {}
  const token = localStorage.getItem('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await apiFetch(`${API_V1}/prayer-groups`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('그룹 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 그룹 생성
export const createGroup = async (
  data: CreateGroupRequest
): Promise<{ success: boolean; data: PrayerGroup }> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayer-groups`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '그룹 생성에 실패했습니다')
  }

  return response.json()
}

// 그룹 가입 (초대 코드)
export const joinGroup = async (
  data: JoinGroupRequest
): Promise<{ success: boolean; data: PrayerGroup }> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayer-groups/join`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '그룹 가입에 실패했습니다')
  }

  return response.json()
}

// 그룹 탈퇴
export const leaveGroup = async (
  groupId: number
): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}/leave`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '그룹 탈퇴에 실패했습니다')
  }

  return response.json()
}

// 그룹 멤버 목록 조회
export const fetchGroupMembers = async (
  groupId: number
): Promise<GroupMembersResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}/members`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('멤버 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}
