// 주보 API
import { API_V1, apiFetch } from '../config/api'
import type { Bulletin, BulletinsResponse } from '../types/bulletin'

/**
 * 주보 목록 조회
 */
export const getBulletins = async (): Promise<BulletinsResponse> => {
  const response = await apiFetch(`${API_V1}/bulletins`)
  
  if (!response.ok) {
    throw new Error('주보 목록을 불러오는데 실패했습니다')
  }
  
  const data = await response.json()
  
  // 응답 형식 처리
  if (Array.isArray(data)) {
    return { bulletins: data, total: data.length }
  } else if (data && Array.isArray(data.bulletins)) {
    return { bulletins: data.bulletins, total: data.total || data.bulletins.length }
  }
  
  return { bulletins: [], total: 0 }
}

/**
 * 주보 상세 조회
 */
export const getBulletinDetail = async (id: number): Promise<Bulletin> => {
  const response = await apiFetch(`${API_V1}/bulletins/${id}`)
  
  if (!response.ok) {
    throw new Error('주보를 불러오는데 실패했습니다')
  }
  
  return response.json()
}

/**
 * 주보 생성 (관리자 전용) - multipart/form-data 사용
 */
export const createBulletin = async (
  title: string,
  bulletinDate: string,
  description: string,
  files: File[]
): Promise<Bulletin> => {
  const token = localStorage.getItem('access_token')
  
  const formData = new FormData()
  formData.append('title', title)
  formData.append('bulletin_date', bulletinDate)
  if (description) {
    formData.append('description', description)
  }
  
  // 파일들 추가
  files.forEach((file) => {
    formData.append('files', file)
  })
  
  const response = await apiFetch(`${API_V1}/bulletins`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Content-Type은 자동으로 설정됨 (multipart/form-data; boundary=...)
    },
    body: formData
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '주보 생성에 실패했습니다')
  }
  
  return response.json()
}

/**
 * 주보 삭제 (관리자 전용)
 */
export const deleteBulletin = async (id: number): Promise<void> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/bulletins/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '주보 삭제에 실패했습니다')
  }
}
