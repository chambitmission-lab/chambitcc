// 예배 시간 관리 API
import type { WorshipService, UpdateWorshipServiceRequest } from '../types/worship'
import { request } from './utils/request'

// 주일 예배 시간 목록 조회
export const getSundayServices = async (): Promise<WorshipService[]> => {
  return request<WorshipService[]>('/worship/sunday', { errorMessage: 'Failed to fetch sunday services' })
}

// 평일 예배 시간 목록 조회
export const getWeekdayServices = async (): Promise<WorshipService[]> => {
  return request<WorshipService[]>('/worship/weekday', { errorMessage: 'Failed to fetch weekday services' })
}

// 예배 시간 수정 (관리자)
export const updateWorshipService = async (id: number, data: UpdateWorshipServiceRequest): Promise<WorshipService> => {
  return request<WorshipService>(`/worship/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: 'Failed to update worship service',
  })
}
