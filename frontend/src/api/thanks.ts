// 오늘의 감사 API
import type {
  CreateThanksRequest,
  Thanks,
  ThanksAmenResponse,
  ThanksListResponse,
  ThanksWeeklyTopResponse,
} from '../types/thanks'
import { request, requestRaw, type UntypedJson } from './utils/request'

// 목록 조회 (인증 옵션 — 토큰 있으면 is_mine/is_amened 채워짐)
export const getThanksList = async (page = 1, limit = 10): Promise<ThanksListResponse['data']> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  const json: ThanksListResponse = await request<ThanksListResponse>(`/thanks?${params.toString()}`, { errorMessage: 'Failed to fetch thanks' })
  return json.data
}

// 이번 주 TOP 감사 (인증 옵션)
export const getThanksWeeklyTop = async (limit = 3): Promise<ThanksWeeklyTopResponse['data']> => {
  const json: ThanksWeeklyTopResponse = await request<ThanksWeeklyTopResponse>(`/thanks/weekly-top?limit=${limit}`, { errorMessage: 'Failed to fetch weekly top thanks' })
  return json.data
}

// 생성 (로그인 필수)
export const createThanks = async (data: CreateThanksRequest): Promise<Thanks> => {
  const json = await request<UntypedJson>('/thanks', {
    method: 'POST',
    json: data,
    errorMessage: 'Failed to create thanks',
  })
  return json.data as Thanks
}

// 삭제 (작성자 또는 관리자)
export const deleteThanks = async (id: number): Promise<void> => {
  await requestRaw(`/thanks/${id}`, { method: 'DELETE', errorMessage: 'Failed to delete thanks' })
}

// 아멘 토글 (로그인 필수)
export const toggleThanksAmen = async (id: number): Promise<ThanksAmenResponse> => {
  return request<ThanksAmenResponse>(`/thanks/${id}/amen`, { method: 'POST', errorMessage: 'Failed to toggle amen' })
}
