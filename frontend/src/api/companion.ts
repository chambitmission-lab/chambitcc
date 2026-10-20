// 동행 API 클라이언트
import { API_V1 } from '../config/api'
import type { CompanionDetail, CompanionGoal, CompanionHome, CompanionSummary } from '../types/companion'
import { request, requestRaw } from './utils/request'

const BASE = `${API_V1}/companions`

export const getMyCompanions = (): Promise<CompanionHome> =>
  request<CompanionHome>(BASE, { errorMessage: '동행 목록을 불러오지 못했어요' })

export const getCompanion = (id: number): Promise<CompanionDetail> =>
  request<CompanionDetail>(`${BASE}/${id}`, { errorMessage: '동행을 불러오지 못했어요' })

export const inviteCompanion = (userId: number, goal: CompanionGoal): Promise<CompanionSummary> =>
  request<CompanionSummary>(BASE, {
    method: 'POST',
    json: { user_id: userId, ...goal },
    errorMessage: '초대를 보내지 못했어요',
  })

export const acceptCompanion = (id: number): Promise<CompanionDetail> =>
  request<CompanionDetail>(`${BASE}/${id}/accept`, { method: 'POST', errorMessage: '초대를 받지 못했어요' })

export const updateCompanionGoal = (id: number, goal: CompanionGoal): Promise<CompanionDetail> =>
  request<CompanionDetail>(`${BASE}/${id}/goal`, {
    method: 'PUT',
    json: goal,
    errorMessage: '목표를 바꾸지 못했어요',
  })

export const cheerCompanion = (id: number): Promise<CompanionDetail> =>
  request<CompanionDetail>(`${BASE}/${id}/cheer`, { method: 'POST', errorMessage: '전하지 못했어요' })

export const updateCompanionTopic = (id: number, content: string): Promise<CompanionDetail> =>
  request<CompanionDetail>(`${BASE}/${id}/topic`, {
    method: 'PUT',
    json: { content },
    errorMessage: '기도제목을 저장하지 못했어요',
  })

export const leaveCompanion = async (id: number): Promise<void> => {
  await requestRaw(`${BASE}/${id}`, { method: 'DELETE', errorMessage: '처리하지 못했어요' })
}
