// 설교 API 함수
import { API_V1, apiFetch } from '../config/api'
import type { Sermon, SermonCreateRequest, AudioUploadResponse } from '../types/sermon'

/**
 * 설교 목록 조회 (인증 불필요)
 */
export const getSermons = async (skip = 0, limit = 10): Promise<Sermon[]> => {
  const response = await apiFetch(`${API_V1}/sermons/?skip=${skip}&limit=${limit}`)
  
  if (!response.ok) {
    throw new Error('설교 목록을 불러오는데 실패했습니다')
  }
  
  return response.json()
}

/**
 * 설교 상세 조회
 */
export const getSermon = async (id: number): Promise<Sermon> => {
  const response = await apiFetch(`${API_V1}/sermons/${id}`)
  
  if (!response.ok) {
    throw new Error('설교를 불러오는데 실패했습니다')
  }
  
  return response.json()
}

/**
 * 음성 파일 업로드 (관리자 전용)
 */
export const uploadAudio = async (file: File): Promise<AudioUploadResponse> => {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await apiFetch(`${API_V1}/sermons/upload-audio`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '음성 파일 업로드에 실패했습니다')
  }
  
  return response.json()
}

/**
 * 설교 생성 (관리자 전용)
 */
export const createSermon = async (data: SermonCreateRequest): Promise<Sermon> => {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  
  const response = await apiFetch(`${API_V1}/sermons/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '설교 생성에 실패했습니다')
  }
  
  return response.json()
}

/**
 * 설교 삭제 (관리자 전용) - 음성 파일도 자동 삭제됨
 */
export const deleteSermon = async (id: number): Promise<void> => {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  
  const response = await apiFetch(`${API_V1}/sermons/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '설교 삭제에 실패했습니다')
  }
}

/**
 * 음성 파일만 삭제 (관리자 전용)
 * 설교는 유지하고 음성 파일만 삭제할 때 사용
 */
export const deleteAudioOnly = async (audioUrl: string): Promise<void> => {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  
  const response = await apiFetch(
    `${API_V1}/sermons/audio?audio_url=${encodeURIComponent(audioUrl)}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '음성 파일 삭제에 실패했습니다')
  }
}
