// 누군가의 기도 React Query 훅 — 캐시만 다루고 토스트는 호출부(feedback)에 맡긴다
//
// 모든 성도용 뮤테이션은 서버가 갱신된 내 상태(IntercessionState)를 돌려주므로
// 재조회 없이 setQueryData 로 바로 반영한다.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getIntercessionAdminOverview,
  getIntercessionSummary,
  getMyIntercession,
  joinIntercession,
  pauseIntercession,
  prayIntercession,
  setIntercessionOpen,
  startIntercessionNow,
  updateIntercessionLine,
  type IntercessionAdminOverview,
  type IntercessionState,
} from '../api/intercession'
import type { MutationFeedback } from './mutationFeedback'

export const intercessionKeys = {
  all: ['intercession'] as const,
  summary: () => [...intercessionKeys.all, 'summary'] as const,
  me: () => [...intercessionKeys.all, 'me'] as const,
  admin: () => [...intercessionKeys.all, 'admin'] as const,
}

/** 교회 전체 합계 + 열림 여부 — 메뉴·홈 카드 노출 판단에도 쓴다 */
export const useIntercessionSummary = (enabled = true) =>
  useQuery({
    queryKey: intercessionKeys.summary(),
    queryFn: getIntercessionSummary,
    enabled,
    staleTime: 1000 * 60 * 5,
  })

/** 내 상태 — 기도할 분·나를 위한 등불. 다른 기기에서 누른 기도도 보이게 매번 새로 받는다 */
export const useMyIntercession = (enabled = true) =>
  useQuery({
    queryKey: intercessionKeys.me(),
    queryFn: getMyIntercession,
    enabled,
    staleTime: 1000 * 30,
    refetchOnMount: 'always',
  })

const useStateMutation = <TVars>(
  fn: (vars: TVars) => Promise<IntercessionState>,
  feedback?: MutationFeedback<IntercessionState, TVars>,
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (data, vars) => {
      qc.setQueryData(intercessionKeys.me(), data)
      // 참여 인원·기도 수 합계가 바뀐다
      void qc.invalidateQueries({ queryKey: intercessionKeys.summary(), refetchType: 'all' })
      feedback?.onSuccess?.(data, vars)
    },
    onError: (error, vars) => feedback?.onError?.(error, vars),
  })
}

export const useJoinIntercession = (feedback?: MutationFeedback<IntercessionState, string | null>) =>
  useStateMutation((line: string | null) => joinIntercession(line), feedback)

export const useUpdateIntercessionLine = (
  feedback?: MutationFeedback<IntercessionState, string | null>,
) => useStateMutation((line: string | null) => updateIntercessionLine(line), feedback)

export const usePauseIntercession = (feedback?: MutationFeedback<IntercessionState, void>) =>
  useStateMutation(() => pauseIntercession(), feedback)

export const usePrayIntercession = (feedback?: MutationFeedback<IntercessionState, void>) =>
  useStateMutation(() => prayIntercession(), feedback)

// ── 관리자 ────────────────────────────────────────────────────────────

export const useIntercessionAdmin = (enabled = true) =>
  useQuery({
    queryKey: intercessionKeys.admin(),
    queryFn: getIntercessionAdminOverview,
    enabled,
    refetchOnMount: 'always',
  })

const useAdminMutation = <TVars>(
  fn: (vars: TVars) => Promise<IntercessionAdminOverview>,
  feedback?: MutationFeedback<IntercessionAdminOverview, TVars>,
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (data, vars) => {
      qc.setQueryData(intercessionKeys.admin(), data)
      void qc.invalidateQueries({ queryKey: intercessionKeys.summary(), refetchType: 'all' })
      void qc.invalidateQueries({ queryKey: intercessionKeys.me(), refetchType: 'all' })
      feedback?.onSuccess?.(data, vars)
    },
    onError: (error, vars) => feedback?.onError?.(error, vars),
  })
}

export const useSetIntercessionOpen = (
  feedback?: MutationFeedback<IntercessionAdminOverview, boolean>,
) => useAdminMutation((open: boolean) => setIntercessionOpen(open), feedback)

export const useStartIntercessionNow = (feedback?: MutationFeedback<IntercessionAdminOverview, void>) =>
  useAdminMutation(() => startIntercessionNow(), feedback)
