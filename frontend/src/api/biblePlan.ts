import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import type {
  GenerateScheduleResponse,
  PlanCreateRequest,
  PlanDetail,
  PlanListResponse,
  PlanProgress,
  PlanReflection,
  PlanReflectionUpdateRequest,
  PlanUpdateRequest,
  TodayResponse,
} from '../types/biblePlan'

const BASE = `${API_V1}/bible-plans`

// ── 사용자 ──
export const listPlans = async (): Promise<PlanListResponse> => {
  const response = await apiFetch(BASE, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('읽기 플랜을 불러오지 못했습니다')
  return response.json()
}

export const getPlan = async (planId: number): Promise<PlanDetail> => {
  const response = await apiFetch(`${BASE}/${planId}`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('플랜을 불러오지 못했습니다')
  return response.json()
}

export const getTodayReadings = async (): Promise<TodayResponse> => {
  const response = await apiFetch(`${BASE}/today`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('오늘의 읽기를 불러오지 못했습니다')
  return response.json()
}

export const subscribePlan = async (
  planId: number,
  startDate?: string,
): Promise<PlanProgress> => {
  const response = await apiFetch(`${BASE}/${planId}/subscribe`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ start_date: startDate ?? null }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '플랜 시작에 실패했습니다')
  }
  return response.json()
}

export const unsubscribePlan = async (planId: number): Promise<void> => {
  const response = await apiFetch(`${BASE}/${planId}/subscribe`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok && response.status !== 204) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '플랜 그만두기에 실패했습니다')
  }
}

export const restartPlan = async (planId: number): Promise<PlanProgress> => {
  const response = await apiFetch(`${BASE}/${planId}/restart`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '다시 시작에 실패했습니다')
  }
  return response.json()
}

export const completeDay = async (
  planId: number,
  dayNumber: number,
): Promise<PlanProgress> => {
  const response = await apiFetch(`${BASE}/${planId}/days/${dayNumber}/complete`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '완료 처리에 실패했습니다')
  }
  return response.json()
}

export const uncompleteDay = async (
  planId: number,
  dayNumber: number,
): Promise<PlanProgress> => {
  const response = await apiFetch(`${BASE}/${planId}/days/${dayNumber}/complete`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '완료 취소에 실패했습니다')
  }
  return response.json()
}

export const generateReflection = async (
  planId: number,
  dayNumber: number,
  force = false,
): Promise<PlanReflection> => {
  const query = force ? '?force=true' : ''
  const response = await apiFetch(
    `${BASE}/${planId}/days/${dayNumber}/reflection${query}`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    },
  )
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'AI 묵상 생성에 실패했습니다')
  }
  return response.json()
}

// 관리자 — AI 묵상 직접 수정
export const updateReflection = async (
  planId: number,
  dayNumber: number,
  payload: PlanReflectionUpdateRequest,
): Promise<PlanReflection> => {
  const response = await apiFetch(`${BASE}/${planId}/days/${dayNumber}/reflection`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '묵상 수정에 실패했습니다')
  }
  return response.json()
}

// ── 관리자 ──
export const listAllPlans = async (): Promise<PlanListResponse> => {
  const response = await apiFetch(`${BASE}/admin`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('플랜 목록을 불러오지 못했습니다')
  return response.json()
}

export const createPlan = async (payload: PlanCreateRequest): Promise<PlanDetail> => {
  const response = await apiFetch(BASE, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '플랜 등록에 실패했습니다')
  }
  const data = await response.json()
  return data.plan as PlanDetail
}

export const updatePlan = async (
  planId: number,
  payload: PlanUpdateRequest,
): Promise<PlanDetail> => {
  const response = await apiFetch(`${BASE}/${planId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '플랜 수정에 실패했습니다')
  }
  const data = await response.json()
  return data.plan as PlanDetail
}

export const deletePlan = async (planId: number): Promise<void> => {
  const response = await apiFetch(`${BASE}/${planId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok && response.status !== 204) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '플랜 삭제에 실패했습니다')
  }
}

export const generateSchedule = async (
  bookNumbers: number[],
  totalDays: number,
): Promise<GenerateScheduleResponse> => {
  const response = await apiFetch(`${BASE}/generate-schedule`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ book_numbers: bookNumbers, total_days: totalDays }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '일정 자동 생성에 실패했습니다')
  }
  return response.json()
}
