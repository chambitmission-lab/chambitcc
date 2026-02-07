import { API_V1, apiFetch } from '../config/api'
import type { DailyVerseResponse, DailyVerse, CreateDailyVerseRequest, UpdateDailyVerseRequest } from '../types/dailyVerse'

// 오늘의 말씀 조회 (인증 불필요)
export const getTodayVerse = async (): Promise<DailyVerseResponse> => {
  const response = await apiFetch(`${API_V1}/daily-verse/today`)
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('NOT_FOUND')
    }
    throw new Error('Failed to fetch daily verse')
  }
  
  return response.json()
}

// 전체 목록 조회 (관리자 전용)
export const getAllDailyVerses = async (): Promise<DailyVerse[]> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/daily-verse/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch daily verses')
  }
  
  return response.json()
}

// 등록/수정 (관리자 전용)
export const createDailyVerse = async (data: CreateDailyVerseRequest): Promise<DailyVerse> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/daily-verse/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create daily verse')
  }
  
  return response.json()
}

// 특정 ID로 수정 (관리자 전용)
export const updateDailyVerse = async (id: number, data: UpdateDailyVerseRequest): Promise<DailyVerse> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/daily-verse/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to update daily verse')
  }
  
  return response.json()
}

// 삭제 (관리자 전용)
export const deleteDailyVerse = async (id: number): Promise<void> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/daily-verse/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete daily verse')
  }
}
