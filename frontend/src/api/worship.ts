// 예배 시간 관리 API
import { API_V1, apiFetch } from '../config/api'
import type { WorshipService, CreateWorshipServiceRequest, UpdateWorshipServiceRequest } from '../types/worship'

// 주일 예배 시간 목록 조회
export const getSundayServices = async (): Promise<WorshipService[]> => {
  const response = await apiFetch(`${API_V1}/worship/sunday`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch sunday services')
  }
  
  return response.json()
}

// 평일 예배 시간 목록 조회
export const getWeekdayServices = async (): Promise<WorshipService[]> => {
  const response = await apiFetch(`${API_V1}/worship/weekday`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch weekday services')
  }
  
  return response.json()
}

// 예배 시간 생성 (관리자)
export const createWorshipService = async (data: CreateWorshipServiceRequest): Promise<WorshipService> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/worship`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create worship service')
  }
  
  return response.json()
}

// 예배 시간 수정 (관리자)
export const updateWorshipService = async (id: number, data: UpdateWorshipServiceRequest): Promise<WorshipService> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/worship/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to update worship service')
  }
  
  return response.json()
}

// 예배 시간 삭제 (관리자)
export const deleteWorshipService = async (id: number): Promise<void> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/worship/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete worship service')
  }
}
