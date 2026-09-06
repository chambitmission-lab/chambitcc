// 설문조사 React Query 훅 — 캐시만 다루고 토스트는 호출부(feedback)에 맡긴다
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSurvey,
  deleteSurvey,
  deleteSurveyResponse,
  getAllSurveys,
  getSurvey,
  getSurveyHomeBanner,
  getSurveyResponses,
  getSurveyStats,
  getSurveys,
  submitSurveyResponse,
  updateSurvey,
  updateSurveyStatus,
} from '../api/survey'
import type {
  CreateSurveyRequest,
  SubmitSurveyRequest,
  SurveyDetail,
  SurveyResponseResult,
  SurveyStatus,
  UpdateSurveyRequest,
} from '../types/survey'
import type { MutationFeedback } from './mutationFeedback'

export const surveyKeys = {
  all: ['surveys'] as const,
  list: () => [...surveyKeys.all, 'list'] as const,
  adminList: () => [...surveyKeys.all, 'admin'] as const,
  homeBanner: () => [...surveyKeys.all, 'home-banner'] as const,
  detail: (id: number) => [...surveyKeys.all, 'detail', id] as const,
  stats: (id: number) => [...surveyKeys.all, 'stats', id] as const,
  responses: (id: number) => [...surveyKeys.all, 'responses', id] as const,
}

// ── 성도 ──────────────────────────────────────────────────────────────

export const useSurveys = (enabled = true) =>
  useQuery({
    queryKey: surveyKeys.list(),
    queryFn: getSurveys,
    enabled,
    staleTime: 1000 * 60 * 5,
  })

/** 홈 배너 — 참여 여부가 바뀌면 바로 사라져야 하므로 짧게 잡는다 */
export const useSurveyHomeBanner = (enabled = true) =>
  useQuery({
    queryKey: surveyKeys.homeBanner(),
    queryFn: getSurveyHomeBanner,
    enabled,
    staleTime: 1000 * 60 * 3,
  })

export const useSurvey = (id: number, enabled = true) =>
  useQuery({
    queryKey: surveyKeys.detail(id),
    queryFn: () => getSurvey(id),
    enabled: enabled && id > 0,
    staleTime: 1000 * 60,
  })

export const useSurveyStats = (id: number, enabled = true) =>
  useQuery({
    queryKey: surveyKeys.stats(id),
    queryFn: () => getSurveyStats(id),
    enabled: enabled && id > 0,
    staleTime: 1000 * 30,
  })

export const useSubmitSurvey = (
  feedback?: MutationFeedback<SurveyResponseResult, { id: number; data: SubmitSurveyRequest }>
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SubmitSurveyRequest }) =>
      submitSurveyResponse(id, data),
    onSuccess: (result, variables) => {
      // 참여 표시(목록·배너)와 통계가 함께 바뀐다
      void qc.invalidateQueries({ queryKey: surveyKeys.detail(variables.id) })
      void qc.invalidateQueries({ queryKey: surveyKeys.stats(variables.id) })
      void qc.invalidateQueries({ queryKey: surveyKeys.list() })
      void qc.invalidateQueries({ queryKey: surveyKeys.homeBanner() })
      void qc.invalidateQueries({ queryKey: surveyKeys.adminList() })
      feedback?.onSuccess?.(result, variables)
    },
    onError: (error: Error, variables) => feedback?.onError?.(error, variables),
  })
}

// ── 관리자 ────────────────────────────────────────────────────────────

export const useAdminSurveys = () =>
  useQuery({
    queryKey: surveyKeys.adminList(),
    queryFn: getAllSurveys,
    staleTime: 0,
  })

export const useSurveyResponses = (id: number, enabled = true) =>
  useQuery({
    queryKey: surveyKeys.responses(id),
    queryFn: () => getSurveyResponses(id),
    enabled: enabled && id > 0,
    staleTime: 1000 * 30,
  })

export const useCreateSurvey = (feedback?: MutationFeedback<SurveyDetail, CreateSurveyRequest>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSurveyRequest) => createSurvey(data),
    onSuccess: (result, variables) => {
      void qc.invalidateQueries({ queryKey: surveyKeys.all })
      feedback?.onSuccess?.(result, variables)
    },
    onError: (error: Error, variables) => feedback?.onError?.(error, variables),
  })
}

export const useUpdateSurvey = (
  feedback?: MutationFeedback<SurveyDetail, { id: number; data: UpdateSurveyRequest }>
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSurveyRequest }) => updateSurvey(id, data),
    onSuccess: (result, variables) => {
      void qc.invalidateQueries({ queryKey: surveyKeys.all })
      feedback?.onSuccess?.(result, variables)
    },
    onError: (error: Error, variables) => feedback?.onError?.(error, variables),
  })
}

export const useUpdateSurveyStatus = (
  feedback?: MutationFeedback<SurveyDetail, { id: number; status: SurveyStatus }>
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: SurveyStatus }) =>
      updateSurveyStatus(id, status),
    onSuccess: (result, variables) => {
      void qc.invalidateQueries({ queryKey: surveyKeys.all })
      feedback?.onSuccess?.(result, variables)
    },
    onError: (error: Error, variables) => feedback?.onError?.(error, variables),
  })
}

export const useDeleteSurvey = (feedback?: MutationFeedback<void, number>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSurvey(id),
    onSuccess: (_result, id) => {
      void qc.invalidateQueries({ queryKey: surveyKeys.all })
      feedback?.onSuccess?.(undefined, id)
    },
    onError: (error: Error, id) => feedback?.onError?.(error, id),
  })
}

export const useDeleteSurveyResponse = (
  feedback?: MutationFeedback<void, { surveyId: number; responseId: number }>
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ surveyId, responseId }: { surveyId: number; responseId: number }) =>
      deleteSurveyResponse(surveyId, responseId),
    onSuccess: (_result, variables) => {
      void qc.invalidateQueries({ queryKey: surveyKeys.responses(variables.surveyId) })
      void qc.invalidateQueries({ queryKey: surveyKeys.stats(variables.surveyId) })
      void qc.invalidateQueries({ queryKey: surveyKeys.adminList() })
      feedback?.onSuccess?.(undefined, variables)
    },
    onError: (error: Error, variables) => feedback?.onError?.(error, variables),
  })
}
