// 예배 시간 관리 API
import type { WorshipService, CreateWorshipServiceRequest, UpdateWorshipServiceRequest } from '../types/worship'
import { request, requestRaw } from './utils/request'

// 주일 예배 시간 목록 조회
export const getSundayServices = async (): Promise<WorshipService[]> => {
  return request<WorshipService[]>('/worship/sunday', { errorMessage: 'Failed to fetch sunday services' })
}

// 평일 예배 시간 목록 조회
export const getWeekdayServices = async (): Promise<WorshipService[]> => {
  return request<WorshipService[]>('/worship/weekday', { errorMessage: 'Failed to fetch weekday services' })
}

// 예배 시간 생성 (관리자)
export const createWorshipService = async (data: CreateWorshipServiceRequest): Promise<WorshipService> => {
  return request<WorshipService>('/worship', {
    method: 'POST',
    json: data,
    errorMessage: 'Failed to create worship service',
  })
}

// 예배 시간 수정 (관리자)
export const updateWorshipService = async (id: number, data: UpdateWorshipServiceRequest): Promise<WorshipService> => {
  return request<WorshipService>(`/worship/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: 'Failed to update worship service',
  })
}

// 예배 시간 삭제 (관리자)
export const deleteWorshipService = async (id: number): Promise<void> => {
  await requestRaw(`/worship/${id}`, { method: 'DELETE', errorMessage: 'Failed to delete worship service' })
}
