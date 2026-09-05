import type { DailyVerseResponse, DailyVerse, CreateDailyVerseRequest, UpdateDailyVerseRequest } from '../types/dailyVerse'
import { request, requestRaw, withStatusMessages } from './utils/request'

// 오늘의 말씀 조회 (인증 불필요)
export const getTodayVerse = async (): Promise<DailyVerseResponse> => {
  return withStatusMessages(
    request<DailyVerseResponse>('/daily-verse/current', { errorMessage: 'Failed to fetch daily verse' }),
    { 404: 'NOT_FOUND' }
  )
}

// 전체 목록 조회 (관리자 전용)
export const getAllDailyVerses = async (): Promise<DailyVerse[]> => {
  return request<DailyVerse[]>('/daily-verse/', { errorMessage: 'Failed to fetch daily verses' })
}

// 등록/수정 (관리자 전용)
export const createDailyVerse = async (data: CreateDailyVerseRequest): Promise<DailyVerse> => {
  return request<DailyVerse>('/daily-verse/', {
    method: 'POST',
    json: data,
    errorMessage: 'Failed to create daily verse',
  })
}

// 특정 ID로 수정 (관리자 전용)
export const updateDailyVerse = async (id: number, data: UpdateDailyVerseRequest): Promise<DailyVerse> => {
  return request<DailyVerse>(`/daily-verse/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: 'Failed to update daily verse',
  })
}

// 삭제 (관리자 전용)
export const deleteDailyVerse = async (id: number): Promise<void> => {
  await requestRaw(`/daily-verse/${id}`, { method: 'DELETE', errorMessage: 'Failed to delete daily verse' })
}
