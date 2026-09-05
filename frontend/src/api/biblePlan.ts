import { API_V1 } from '../config/api'
import { streamSSE } from './sse'
import type {
  GenerateScheduleResponse,
  PersonalPlanCreateRequest,
  PersonalPlanUpdateRequest,
  PlanCreateRequest,
  PlanDetail,
  PlanInvitePreview,
  PlanListResponse,
  PlanProgress,
  PlanReflection,
  PlanReflectionUpdateRequest,
  PlanUpdateRequest,
  TodayResponse,
} from '../types/biblePlan'
import { request, requestRaw, type UntypedJson } from './utils/request'

const BASE = `${API_V1}/bible-plans`

// ── 사용자 ──
export const listPlans = async (): Promise<PlanListResponse> => {
  return request<PlanListResponse>(BASE, { errorMessage: '읽기 플랜을 불러오지 못했습니다' })
}

export const getPlan = async (planId: number): Promise<PlanDetail> => {
  return request<PlanDetail>(`${BASE}/${planId}`, { errorMessage: '플랜을 불러오지 못했습니다' })
}

export const getTodayReadings = async (): Promise<TodayResponse> => {
  return request<TodayResponse>(`${BASE}/today`, { errorMessage: '오늘의 읽기를 불러오지 못했습니다' })
}

export const subscribePlan = async (
  planId: number,
  startDate?: string,
): Promise<PlanProgress> => {
  return request<PlanProgress>(`${BASE}/${planId}/subscribe`, {
    method: 'POST',
    json: { start_date: startDate ?? null },
    errorMessage: '플랜 시작에 실패했습니다',
  })
}

export const unsubscribePlan = async (planId: number): Promise<void> => {
  await requestRaw(`${BASE}/${planId}/subscribe`, { method: 'DELETE', errorMessage: '플랜 그만두기에 실패했습니다' })
}

export const restartPlan = async (planId: number): Promise<PlanProgress> => {
  return request<PlanProgress>(`${BASE}/${planId}/restart`, { method: 'POST', errorMessage: '다시 시작에 실패했습니다' })
}

export const completeDay = async (
  planId: number,
  dayNumber: number,
): Promise<PlanProgress> => {
  return request<PlanProgress>(`${BASE}/${planId}/days/${dayNumber}/complete`, { method: 'POST', errorMessage: '완료 처리에 실패했습니다' })
}

export const uncompleteDay = async (
  planId: number,
  dayNumber: number,
): Promise<PlanProgress> => {
  return request<PlanProgress>(`${BASE}/${planId}/days/${dayNumber}/complete`, { method: 'DELETE', errorMessage: '완료 취소에 실패했습니다' })
}

export const generateReflection = async (
  planId: number,
  dayNumber: number,
  force = false,
): Promise<PlanReflection> => {
  const query = force ? '?force=true' : ''
  return request<PlanReflection>(`${BASE}/${planId}/days/${dayNumber}/reflection${query}`, { method: 'POST', errorMessage: 'AI 묵상 생성에 실패했습니다' })
}

/**
 * AI 묵상 SSE 스트리밍 생성 — 토큰이 도착하는 대로 onDelta로 전달된다.
 * 캐시 적중 시엔 delta 없이 곧바로 onDone이 호출된다.
 * 스트림 도중 서버가 error 이벤트를 보내면 해당 메시지로 throw.
 */
export const streamReflection = async (
  planId: number,
  dayNumber: number,
  force: boolean,
  handlers: {
    onDelta: (text: string) => void
    onDone: (data: PlanReflection) => void
  },
  signal?: AbortSignal,
): Promise<void> => {
  const query = force ? '?force=true' : ''
  await streamSSE(
    `${BASE}/${planId}/days/${dayNumber}/reflection/stream${query}`,
    { method: 'POST', signal },
    (event, data) => {
      if (event === 'delta') {
        handlers.onDelta(JSON.parse(data).text as string)
      } else if (event === 'done' || event === 'cached') {
        handlers.onDone(JSON.parse(data) as PlanReflection)
      } else if (event === 'error') {
        throw new Error(
          (JSON.parse(data).detail as string) || 'AI 묵상 생성에 실패했습니다',
        )
      }
    },
  )
}

// 관리자 — AI 묵상 직접 수정
export const updateReflection = async (
  planId: number,
  dayNumber: number,
  payload: PlanReflectionUpdateRequest,
): Promise<PlanReflection> => {
  return request<PlanReflection>(`${BASE}/${planId}/days/${dayNumber}/reflection`, {
    method: 'PUT',
    json: payload,
    errorMessage: '묵상 수정에 실패했습니다',
  })
}

// ── 개인 플랜(나만의 플랜) / 초대 ──
export const createPersonalPlan = async (
  payload: PersonalPlanCreateRequest,
): Promise<PlanDetail> => {
  const data = await request<UntypedJson>(`${BASE}/mine`, {
    method: 'POST',
    json: payload,
    errorMessage: '플랜 만들기에 실패했습니다',
  })
  return data.plan as PlanDetail
}

export const updatePersonalPlan = async (
  planId: number,
  payload: PersonalPlanUpdateRequest,
): Promise<PlanDetail> => {
  const data = await request<UntypedJson>(`${BASE}/${planId}/personal`, {
    method: 'PATCH',
    json: payload,
    errorMessage: '플랜 수정에 실패했습니다',
  })
  return data.plan as PlanDetail
}

export const deletePersonalPlan = async (planId: number): Promise<void> => {
  await requestRaw(`${BASE}/${planId}/personal`, { method: 'DELETE', errorMessage: '플랜 삭제에 실패했습니다' })
}

export const previewPlanInvite = async (inviteCode: string): Promise<PlanInvitePreview> => {
  return request<PlanInvitePreview>(`${BASE}/invite/${encodeURIComponent(inviteCode)}`, { errorMessage: '초대장을 찾을 수 없어요' })
}

export const addPlanMembers = async (
  planId: number,
  userIds: number[],
): Promise<{ added_count: number }> => {
  return request<{ added_count: number }>(`${BASE}/${planId}/members`, {
    method: 'POST',
    json: { user_ids: userIds },
    errorMessage: '초대에 실패했습니다',
  })
}

export const joinPlanByCode = async (inviteCode: string): Promise<PlanDetail> => {
  const data = await request<UntypedJson>(`${BASE}/join`, {
    method: 'POST',
    json: { invite_code: inviteCode },
    errorMessage: '참여에 실패했습니다',
  })
  return data.plan as PlanDetail
}

// ── 관리자 ──
export const listAllPlans = async (): Promise<PlanListResponse> => {
  return request<PlanListResponse>(`${BASE}/admin`, { errorMessage: '플랜 목록을 불러오지 못했습니다' })
}

export const createPlan = async (payload: PlanCreateRequest): Promise<PlanDetail> => {
  const data = await request<UntypedJson>(BASE, {
    method: 'POST',
    json: payload,
    errorMessage: '플랜 등록에 실패했습니다',
  })
  return data.plan as PlanDetail
}

export const updatePlan = async (
  planId: number,
  payload: PlanUpdateRequest,
): Promise<PlanDetail> => {
  const data = await request<UntypedJson>(`${BASE}/${planId}`, {
    method: 'PATCH',
    json: payload,
    errorMessage: '플랜 수정에 실패했습니다',
  })
  return data.plan as PlanDetail
}

export const deletePlan = async (planId: number): Promise<void> => {
  await requestRaw(`${BASE}/${planId}`, { method: 'DELETE', errorMessage: '플랜 삭제에 실패했습니다' })
}

export const generateSchedule = async (
  bookNumbers: number[],
  totalDays: number,
): Promise<GenerateScheduleResponse> => {
  return request<GenerateScheduleResponse>(`${BASE}/generate-schedule`, {
    method: 'POST',
    json: { book_numbers: bookNumbers, total_days: totalDays },
    errorMessage: '일정 자동 생성에 실패했습니다',
  })
}
