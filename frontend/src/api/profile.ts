import { API_V1, apiFetch } from '../config/api'
import type { ProfileStats, ProfileDetail, MyPrayer, PrayingFor, MyReply } from '../types/profile'

const PROFILE_BASE = `${API_V1}/profile`

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

// 프로필 통계 조회
export const getProfileStats = async (): Promise<ProfileStats> => {
  const response = await apiFetch(`${PROFILE_BASE}/stats`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('프로필 통계를 불러오는데 실패했습니다')
  }

  return response.json()
}

// 프로필 전체 정보 조회 (통합 API)
export const getProfileDetail = async (params?: {
  prayers_limit?: number
  praying_limit?: number
  replies_limit?: number
}): Promise<ProfileDetail> => {
  const queryParams = new URLSearchParams()
  if (params?.prayers_limit) queryParams.append('prayers_limit', params.prayers_limit.toString())
  if (params?.praying_limit) queryParams.append('praying_limit', params.praying_limit.toString())
  if (params?.replies_limit) queryParams.append('replies_limit', params.replies_limit.toString())

  const url = queryParams.toString() 
    ? `${PROFILE_BASE}/detail?${queryParams}` 
    : `${PROFILE_BASE}/detail`

  const response = await apiFetch(url, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('프로필 정보를 불러오는데 실패했습니다')
  }

  return response.json()
}

// 내가 작성한 기도 목록
export const getMyPrayers = async (params?: {
  skip?: number
  limit?: number
}): Promise<MyPrayer[]> => {
  const queryParams = new URLSearchParams()
  if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())

  const url = queryParams.toString() 
    ? `${PROFILE_BASE}/my-prayers?${queryParams}` 
    : `${PROFILE_BASE}/my-prayers`

  const response = await apiFetch(url, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('내 기도 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 내가 기도중인 기도 목록
export const getPrayingFor = async (params?: {
  skip?: number
  limit?: number
}): Promise<PrayingFor[]> => {
  const queryParams = new URLSearchParams()
  if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())

  const url = queryParams.toString() 
    ? `${PROFILE_BASE}/praying-for?${queryParams}` 
    : `${PROFILE_BASE}/praying-for`

  const response = await apiFetch(url, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('기도중인 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 내 댓글 목록
export const getMyReplies = async (params?: {
  skip?: number
  limit?: number
}): Promise<MyReply[]> => {
  const queryParams = new URLSearchParams()
  if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())

  const url = queryParams.toString() 
    ? `${PROFILE_BASE}/my-replies?${queryParams}` 
    : `${PROFILE_BASE}/my-replies`

  const response = await apiFetch(url, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('내 댓글 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}
