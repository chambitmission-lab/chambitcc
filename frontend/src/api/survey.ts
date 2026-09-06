// 설문조사 API
import type {
  CreateSurveyRequest,
  SubmitSurveyRequest,
  SurveyDetail,
  SurveyResponseResult,
  SurveyStats,
  SurveyStatus,
  SurveySummary,
  UpdateSurveyRequest,
} from '../types/survey'
import { request, requestRaw } from './utils/request'

// ── 성도 ──────────────────────────────────────────────────────────────

/** 참여 가능한 설문 + 내가 참여했던 설문 */
export const getSurveys = async (): Promise<SurveySummary[]> =>
  request<SurveySummary[]>('/surveys', {
    auth: 'required',
    errorMessage: '설문 목록을 불러오지 못했습니다',
  })

/** 홈 배너용 — 아직 참여하지 않은 진행 중 설문 1건 (없으면 null) */
export const getSurveyHomeBanner = async (): Promise<SurveySummary | null> =>
  request<SurveySummary | null>('/surveys/home-banner', {
    auth: 'required',
    errorMessage: '설문 정보를 불러오지 못했습니다',
  })

export const getSurvey = async (id: number): Promise<SurveyDetail> =>
  request<SurveyDetail>(`/surveys/${id}`, {
    auth: 'required',
    errorMessage: '설문을 불러오지 못했습니다',
  })

export const submitSurveyResponse = async (
  id: number,
  data: SubmitSurveyRequest
): Promise<SurveyResponseResult> =>
  request<SurveyResponseResult>(`/surveys/${id}/responses`, {
    method: 'POST',
    auth: 'required',
    json: data,
    errorMessage: '응답을 제출하지 못했습니다',
  })

/** 문항별 통계 — 관리자는 항상, 성도는 결과 공개 설문에 참여한 경우 */
export const getSurveyStats = async (id: number): Promise<SurveyStats> =>
  request<SurveyStats>(`/surveys/${id}/stats`, {
    auth: 'required',
    errorMessage: '통계를 불러오지 못했습니다',
  })

// ── 관리자 ────────────────────────────────────────────────────────────

export const getAllSurveys = async (): Promise<SurveySummary[]> =>
  request<SurveySummary[]>('/surveys/admin/all', {
    auth: 'required',
    errorMessage: '설문 목록을 불러오지 못했습니다',
  })

export const createSurvey = async (data: CreateSurveyRequest): Promise<SurveyDetail> =>
  request<SurveyDetail>('/surveys', {
    method: 'POST',
    auth: 'required',
    json: data,
    errorMessage: '설문 생성에 실패했습니다',
  })

export const updateSurvey = async (
  id: number,
  data: UpdateSurveyRequest
): Promise<SurveyDetail> =>
  request<SurveyDetail>(`/surveys/${id}`, {
    method: 'PUT',
    auth: 'required',
    json: data,
    errorMessage: '설문 수정에 실패했습니다',
  })

export const updateSurveyStatus = async (
  id: number,
  status: SurveyStatus
): Promise<SurveyDetail> =>
  request<SurveyDetail>(`/surveys/${id}/status`, {
    method: 'PATCH',
    auth: 'required',
    json: { status },
    errorMessage: '상태 변경에 실패했습니다',
  })

export const deleteSurvey = async (id: number): Promise<void> => {
  await requestRaw(`/surveys/${id}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '설문 삭제에 실패했습니다',
  })
}

export const getSurveyResponses = async (id: number): Promise<SurveyResponseResult[]> =>
  request<SurveyResponseResult[]>(`/surveys/${id}/responses`, {
    auth: 'required',
    errorMessage: '응답 목록을 불러오지 못했습니다',
  })

export const deleteSurveyResponse = async (
  surveyId: number,
  responseId: number
): Promise<void> => {
  await requestRaw(`/surveys/${surveyId}/responses/${responseId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '응답 삭제에 실패했습니다',
  })
}

/**
 * 응답 CSV 내려받기.
 * 다운로드도 Authorization 헤더가 필요하므로 <a href> 가 아니라 blob 으로 받아 저장한다.
 */
export const downloadSurveyCsv = async (id: number, filename: string): Promise<void> => {
  const response = await requestRaw(`/surveys/${id}/export`, {
    auth: 'required',
    errorMessage: 'CSV 내려받기에 실패했습니다',
  })
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
