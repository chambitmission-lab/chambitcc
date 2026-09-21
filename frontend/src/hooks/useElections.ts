// 선거 React Query 훅 — 캐시만 다루고 토스트는 호출부(feedback)에 맡긴다.
//
// 실시간 갱신은 두 겹이다: 서버가 표·회차 변화를 SSE(election_update)로 알리면
// utils/notificationStream.ts 가 electionKeys.all 을 무효화하고, 스트림이 끊긴 동안을
// 대비해 보고 있는 화면은 짧은 주기로 조용히 다시 받는다.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addPaperBallots,
  castVote,
  closeElectionRound,
  createElection,
  deleteElection,
  deletePaperBallot,
  finishElection,
  getAllElections,
  getDefaultElectionRules,
  getElection,
  getElectionAdmin,
  getElections,
  openElectionRound,
  reopenElectionRound,
  updateElection,
} from '../api/election'
import type {
  ElectionAdminDetail,
  ElectionDetail,
  ElectionPayload,
  OpenRoundPayload,
} from '../types/election'
import type { MutationFeedback } from './mutationFeedback'

export const electionKeys = {
  all: ['elections'] as const,
  list: () => [...electionKeys.all, 'list'] as const,
  adminList: () => [...electionKeys.all, 'admin'] as const,
  detail: (id: number) => [...electionKeys.all, 'detail', id] as const,
  adminDetail: (id: number) => [...electionKeys.all, 'admin-detail', id] as const,
  defaultRules: () => [...electionKeys.all, 'default-rules'] as const,
}

// ── 성도 ──────────────────────────────────────────────────────────────

/** 내가 선거인인 선거 — 홈 배너도 이 목록을 쓴다 (명부 밖이면 빈 배열) */
export const useElections = (enabled = true) =>
  useQuery({
    queryKey: electionKeys.list(),
    queryFn: getElections,
    enabled,
    staleTime: 1000 * 60,
  })

export const useElection = (id: number) =>
  useQuery({
    queryKey: electionKeys.detail(id),
    queryFn: () => getElection(id),
    enabled: id > 0,
    staleTime: 1000 * 5,
    refetchInterval: 1000 * 15,
    refetchIntervalInBackground: false,
    retry: false, // 명부 밖(403)·없는 선거(404)는 다시 물어도 같다
  })

export const useCastVote = (
  feedback?: MutationFeedback<ElectionDetail, { id: number; candidateIds: number[] }>
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, candidateIds }: { id: number; candidateIds: number[] }) =>
      castVote(id, candidateIds),
    onSuccess: (result, variables) => {
      qc.setQueryData(electionKeys.detail(variables.id), result)
      void qc.invalidateQueries({ queryKey: electionKeys.list() })
      feedback?.onSuccess?.(result, variables)
    },
    onError: (error: Error, variables) => {
      // 이미 투표함(409)·방금 마감됨(400) — 최신 상태로 다시 그린다
      void qc.invalidateQueries({ queryKey: electionKeys.detail(variables.id) })
      feedback?.onError?.(error, variables)
    },
  })
}

// ── 관리자 ────────────────────────────────────────────────────────────

export const useAdminElections = () =>
  useQuery({
    queryKey: electionKeys.adminList(),
    queryFn: getAllElections,
    staleTime: 0,
  })

/** 현황판 — live 면 5초마다 새로 받는다(SSE 가 끊겨도 득표가 멈춰 보이지 않게) */
export const useElectionAdmin = (id: number, live = false) =>
  useQuery({
    queryKey: electionKeys.adminDetail(id),
    queryFn: () => getElectionAdmin(id),
    enabled: id > 0,
    staleTime: 0,
    refetchInterval: live ? 1000 * 5 : false,
    refetchIntervalInBackground: false,
  })

/** 새 선거 폼의 출발값 (서버 기본 기준) */
export const useDefaultElectionRules = (enabled = true) =>
  useQuery({
    queryKey: electionKeys.defaultRules(),
    queryFn: getDefaultElectionRules,
    enabled,
    staleTime: 1000 * 60 * 10,
  })

const applyAdminDetail = (qc: ReturnType<typeof useQueryClient>, result: ElectionAdminDetail) => {
  qc.setQueryData(electionKeys.adminDetail(result.id), result)
  void qc.invalidateQueries({ queryKey: electionKeys.adminList() })
  void qc.invalidateQueries({ queryKey: electionKeys.list() })
  void qc.invalidateQueries({ queryKey: electionKeys.detail(result.id) })
}

export const useSaveElection = (
  feedback?: MutationFeedback<ElectionAdminDetail, { id?: number; data: Partial<ElectionPayload> }>
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Partial<ElectionPayload> }) =>
      id ? updateElection(id, data) : createElection(data as ElectionPayload),
    onSuccess: (result, variables) => {
      applyAdminDetail(qc, result)
      feedback?.onSuccess?.(result, variables)
    },
    onError: (error: Error, variables) => feedback?.onError?.(error, variables),
  })
}

export const useDeleteElection = (feedback?: MutationFeedback<void, number>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteElection(id),
    onSuccess: (_r, id) => {
      void qc.invalidateQueries({ queryKey: electionKeys.all })
      feedback?.onSuccess?.(undefined, id)
    },
    onError: (error: Error, id) => feedback?.onError?.(error, id),
  })
}

/** 회차·종이 표 조작 공통 — 서버가 돌려준 최신 현황으로 캐시를 바로 맞춘다 */
export type ElectionAdminAction =
  | { kind: 'open'; id: number; data?: OpenRoundPayload }
  | { kind: 'close'; id: number }
  | { kind: 'reopen'; id: number }
  | { kind: 'finish'; id: number }
  | { kind: 'paper-add'; id: number; candidateIds: number[]; count?: number }
  | { kind: 'paper-delete'; id: number; ballotId: number }

export const useElectionAdminAction = (
  feedback?: MutationFeedback<ElectionAdminDetail, ElectionAdminAction>
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (action: ElectionAdminAction) => {
      switch (action.kind) {
        case 'open':
          return openElectionRound(action.id, action.data)
        case 'close':
          return closeElectionRound(action.id)
        case 'reopen':
          return reopenElectionRound(action.id)
        case 'finish':
          return finishElection(action.id)
        case 'paper-add':
          return addPaperBallots(action.id, action.candidateIds, action.count)
        case 'paper-delete':
          return deletePaperBallot(action.id, action.ballotId)
      }
    },
    onSuccess: (result, action) => {
      applyAdminDetail(qc, result)
      feedback?.onSuccess?.(result, action)
    },
    onError: (error: Error, action) => {
      void qc.invalidateQueries({ queryKey: electionKeys.adminDetail(action.id) })
      feedback?.onError?.(error, action)
    },
  })
}
