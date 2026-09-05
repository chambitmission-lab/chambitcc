import type {
  WeeklyPrayer,
  WeeklyPrayerListItem,
  WeeklyPrayerItem,
  WeeklyPrayerAmenResponse,
  WeeklyPrayerCreateRequest,
  WeeklyPrayerUpdateRequest,
} from '../types/weeklyPrayer'
import { request, requestRaw, withStatusMessages, type UntypedJson } from './utils/request'

// 이번 주 기도제목 조회 (인증 불필요, 로그인 시 is_amened 포함)
export const getCurrentWeeklyPrayer = async (): Promise<WeeklyPrayer> => {
  return withStatusMessages(
    request<WeeklyPrayer>('/weekly-prayers/current', { errorMessage: 'Failed to fetch current weekly prayer' }),
    { 404: 'NOT_FOUND' }
  )
}

// 아카이브 목록 (인증 불필요, 공개된 것만)
export const getWeeklyPrayerList = async (limit = 52): Promise<WeeklyPrayerListItem[]> => {
  return request<WeeklyPrayerListItem[]>(`/weekly-prayers?limit=${limit}`, { errorMessage: 'Failed to fetch weekly prayer list' })
}

// 특정 주차 상세 (인증 불필요, 로그인 시 is_amened 포함)
export const getWeeklyPrayer = async (id: number): Promise<WeeklyPrayer> => {
  return request<WeeklyPrayer>(`/weekly-prayers/${id}`, { errorMessage: 'Failed to fetch weekly prayer' })
}

// 함께 기도했어요 토글 (로그인 필요)
export const toggleWeeklyPrayerAmen = async (
  itemId: number,
): Promise<WeeklyPrayerAmenResponse> => {
  return request<WeeklyPrayerAmenResponse>(`/weekly-prayers/items/${itemId}/amen`, { method: 'POST', errorMessage: 'Failed to toggle amen' })
}

// 전체 목록 — 미공개 포함 (관리자)
export const getAllWeeklyPrayers = async (): Promise<WeeklyPrayerListItem[]> => {
  return request<WeeklyPrayerListItem[]>('/weekly-prayers/admin/all', { errorMessage: 'Failed to fetch all weekly prayers' })
}

// 등록 (관리자)
export const createWeeklyPrayer = async (
  data: WeeklyPrayerCreateRequest,
): Promise<WeeklyPrayer> => {
  return withStatusMessages(
    request<WeeklyPrayer>('/weekly-prayers', { method: 'POST', json: data, errorMessage: 'Failed to create weekly prayer' }),
    { 409: 'DUPLICATE_WEEK' }
  )
}

// 수정 (관리자)
export const updateWeeklyPrayer = async (
  id: number,
  data: WeeklyPrayerUpdateRequest,
): Promise<WeeklyPrayer> => {
  return withStatusMessages(
    request<WeeklyPrayer>(`/weekly-prayers/${id}`, { method: 'PUT', json: data, errorMessage: 'Failed to update weekly prayer' }),
    { 409: 'DUPLICATE_WEEK' }
  )
}

// 삭제 (관리자)
export const deleteWeeklyPrayer = async (id: number): Promise<void> => {
  await requestRaw(`/weekly-prayers/${id}`, { method: 'DELETE', errorMessage: 'Failed to delete weekly prayer' })
}

// 붙여넣은 원문 파싱 (관리자, 저장 안 함)
export const parseWeeklyPrayerText = async (
  text: string,
): Promise<WeeklyPrayerItem[]> => {
  const data = await request<UntypedJson>('/weekly-prayers/parse', {
    method: 'POST',
    json: { text },
    errorMessage: 'Failed to parse text',
  })
  return data.items
}
