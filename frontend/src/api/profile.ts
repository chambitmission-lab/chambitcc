import { API_V1 } from '../config/api'
import type { ProfileStats, ProfileDetail, MyPrayer, PrayingFor, MyReply } from '../types/profile'
import { request } from './utils/request'

const PROFILE_BASE = `${API_V1}/profile`


// 프로필 통계 조회
export const getProfileStats = async (): Promise<ProfileStats> => {
  return request<ProfileStats>(`${PROFILE_BASE}/stats`, { auth: 'required', errorMessage: '프로필 통계를 불러오는데 실패했습니다' })
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

  return request<ProfileDetail>(url, { auth: 'required', errorMessage: '프로필 정보를 불러오는데 실패했습니다' })
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

  return request<MyPrayer[]>(url, { auth: 'required', errorMessage: '내 기도 목록을 불러오는데 실패했습니다' })
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

  return request<PrayingFor[]>(url, { auth: 'required', errorMessage: '기도중인 목록을 불러오는데 실패했습니다' })
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

  return request<MyReply[]>(url, { auth: 'required', errorMessage: '내 댓글 목록을 불러오는데 실패했습니다' })
}

// 프로필 사진 업로드/교체 — FormData 전송이므로 Content-Type은 브라우저가 지정
export const uploadProfileAvatar = async (
  file: Blob,
): Promise<{ avatar_url: string }> => {
  const formData = new FormData()
  formData.append('file', file, 'avatar.jpg')

  return request<{ avatar_url: string }>(`${PROFILE_BASE}/avatar`, {
    auth: 'required',
    method: 'POST',
    body: formData,
    errorMessage: '프로필 사진 업로드에 실패했습니다',
  })
}

// 프로필 사진 삭제 (이니셜 아바타로 복귀)
export const deleteProfileAvatar = async (): Promise<{ avatar_url: null }> => {
  return request<{ avatar_url: null }>(`${PROFILE_BASE}/avatar`, { auth: 'required', method: 'DELETE', errorMessage: '프로필 사진 삭제에 실패했습니다' })
}
