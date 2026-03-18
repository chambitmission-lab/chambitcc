// 목양컬럼 API
import { API_V1, apiFetch } from '../config/api'
import type { Column, CreateColumnRequest, UpdateColumnRequest } from '../types/column'

// 목양컬럼 목록 조회 (인증 불필요)
export const getColumns = async (): Promise<Column[]> => {
  const response = await apiFetch(`${API_V1}/columns`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch columns')
  }
  
  return response.json()
}

// 목양컬럼 상세 조회 (인증 불필요)
export const getColumn = async (id: number): Promise<Column> => {
  const response = await apiFetch(`${API_V1}/columns/${id}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch column')
  }
  
  return response.json()
}

// 목양컬럼 생성 (관리자)
export const createColumn = async (data: CreateColumnRequest): Promise<Column> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/columns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create column')
  }
  
  return response.json()
}

// 목양컬럼 수정 (관리자)
export const updateColumn = async (id: number, data: UpdateColumnRequest): Promise<Column> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/columns/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to update column')
  }
  
  return response.json()
}

// 목양컬럼 삭제 (관리자)
export const deleteColumn = async (id: number): Promise<void> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/columns/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete column')
  }
}
