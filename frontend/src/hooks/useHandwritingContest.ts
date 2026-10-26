import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createContest,
  deleteContest,
  getAdminContests,
  getContest,
  getContestEntries,
  getContestEntry,
  getContestEntryInk,
  getContests,
  hideContestEntry,
  publishContest,
  submitContestEntry,
  updateContest,
  updateContestConsent,
  voteContestEntry,
  withdrawContestEntry,
} from '../api/handwritingContest'
import type { ContestDetail, ContestEntry, ContestWrite, EntryPage, EntrySort, EntrySubmit } from '../types/handwritingContest'
import type { InfiniteData } from '@tanstack/react-query'
import type { MutationFeedback } from './mutationFeedback'

export const contestKeys = {
  all: ['handwriting-contest'] as const,
  list: () => [...contestKeys.all, 'list'] as const,
  adminList: () => [...contestKeys.all, 'admin'] as const,
  detail: (id: number) => [...contestKeys.all, 'detail', id] as const,
  entriesPrefix: (id: number) => [...contestKeys.all, 'entries', id] as const,
  entries: (id: number, sort: EntrySort) => [...contestKeys.entriesPrefix(id), sort] as const,
  entry: (id: number, entryId: number) => [...contestKeys.all, 'entry', id, entryId] as const,
  ink: (id: number, entryId: number) => [...contestKeys.all, 'ink', id, entryId] as const,
}

const PAGE = 24

export const useContests = () =>
  useQuery({ queryKey: contestKeys.list(), queryFn: getContests, staleTime: 1000 * 60 })

// 남은 표·내 작품은 다른 기기에서도 바뀌므로 재진입 때 갱신한다(전역 refetchOnMount:false 의 예외)
export const useContest = (id: number) =>
  useQuery({
    queryKey: contestKeys.detail(id),
    queryFn: () => getContest(id),
    enabled: id > 0,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  })

export const useContestEntries = (id: number, sort: EntrySort) =>
  useInfiniteQuery({
    queryKey: contestKeys.entries(id, sort),
    queryFn: ({ pageParam }) => getContestEntries(id, sort, pageParam, PAGE),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.has_more ? pages.length * PAGE : undefined),
    enabled: id > 0,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  })

export const useContestEntry = (id: number, entryId: number) =>
  useQuery({
    queryKey: contestKeys.entry(id, entryId),
    queryFn: () => getContestEntry(id, entryId),
    enabled: id > 0 && entryId > 0,
    staleTime: 1000 * 30,
  })

/** 획 JSON 원문 — 한 번 받은 글씨는 바뀌지 않는다(거두고 다시 내면 새 작품 id) */
export const useContestEntryInk = (id: number, entryId: number, enabled = true) =>
  useQuery({
    queryKey: contestKeys.ink(id, entryId),
    queryFn: () => getContestEntryInk(id, entryId),
    enabled: enabled && id > 0 && entryId > 0,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 10,
  })

/** 갤러리 캐시 안의 작품 하나를 고친다 — 투표 직후 하트·표 수를 다시 받지 않고 바로 바꾼다 */
const patchEntryEverywhere = (
  qc: ReturnType<typeof useQueryClient>,
  contestId: number,
  entryId: number,
  patch: (e: ContestEntry) => ContestEntry,
) => {
  qc.setQueriesData<InfiniteData<EntryPage>>({ queryKey: contestKeys.entriesPrefix(contestId) }, (data) =>
    data
      ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((e) => (e.id === entryId ? patch(e) : e)) })) }
      : data,
  )
  qc.setQueryData<ContestEntry>(contestKeys.entry(contestId, entryId), (e) => (e ? patch(e) : e))
}

export const useVoteEntry = (contestId: number, feedback?: MutationFeedback) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entryId, on }: { entryId: number; on: boolean }) => voteContestEntry(contestId, entryId, on),
    onSuccess: (detail: ContestDetail, vars) => {
      const { entryId, on } = vars
      qc.setQueryData(contestKeys.detail(contestId), detail)
      patchEntryEverywhere(qc, contestId, entryId, (e) => ({
        ...e,
        voted_by_me: on,
        vote_count: e.vote_count == null ? null : Math.max(0, e.vote_count + (on === e.voted_by_me ? 0 : on ? 1 : -1)),
      }))
      feedback?.onSuccess?.(detail, vars)
    },
    onError: (error, vars) => feedback?.onError?.(error, vars),
  })
}

export const useSubmitEntry = (contestId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: EntrySubmit) => submitContestEntry(contestId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contestKeys.detail(contestId) })
      void qc.invalidateQueries({ queryKey: contestKeys.entriesPrefix(contestId) })
      void qc.invalidateQueries({ queryKey: contestKeys.list() })
    },
  })
}

export const useWithdrawEntry = (contestId: number, feedback?: MutationFeedback) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => withdrawContestEntry(contestId),
    onSuccess: (data, vars) => {
      void qc.invalidateQueries({ queryKey: contestKeys.detail(contestId) })
      void qc.invalidateQueries({ queryKey: contestKeys.entriesPrefix(contestId) })
      void qc.invalidateQueries({ queryKey: contestKeys.list() })
      feedback?.onSuccess?.(data, vars)
    },
    onError: (error, vars) => feedback?.onError?.(error, vars),
  })
}

export const useUpdateConsent = (contestId: number, feedback?: MutationFeedback) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (on: boolean) => updateContestConsent(contestId, on),
    onSuccess: (entry, vars) => {
      qc.setQueryData<ContestDetail>(contestKeys.detail(contestId), (d) => (d ? { ...d, my_entry: entry } : d))
      patchEntryEverywhere(qc, contestId, entry.id, (e) => ({ ...e, card_consent: entry.card_consent }))
      feedback?.onSuccess?.(entry, vars)
    },
    onError: (error, vars) => feedback?.onError?.(error, vars),
  })
}

// ── 관리자 ──
export const useAdminContests = () =>
  useQuery({ queryKey: contestKeys.adminList(), queryFn: getAdminContests, refetchOnMount: true })

export const useSaveContest = (feedback?: MutationFeedback) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: ContestWrite }) =>
      id ? updateContest(id, payload) : createContest(payload),
    onSuccess: (data, vars) => {
      void qc.invalidateQueries({ queryKey: contestKeys.all })
      feedback?.onSuccess?.(data, vars)
    },
    onError: (error, vars) => feedback?.onError?.(error, vars),
  })
}

export const useDeleteContest = (feedback?: MutationFeedback) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteContest(id),
    onSuccess: (data, vars) => {
      void qc.invalidateQueries({ queryKey: contestKeys.all })
      feedback?.onSuccess?.(data, vars)
    },
    onError: (error, vars) => feedback?.onError?.(error, vars),
  })
}

export const usePublishContest = (feedback?: MutationFeedback) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, on }: { id: number; on: boolean }) => publishContest(id, on),
    onSuccess: (data, vars) => {
      void qc.invalidateQueries({ queryKey: contestKeys.all })
      feedback?.onSuccess?.(data, vars)
    },
    onError: (error, vars) => feedback?.onError?.(error, vars),
  })
}

export const useHideEntry = (contestId: number, feedback?: MutationFeedback) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entryId, hidden }: { entryId: number; hidden: boolean }) => hideContestEntry(entryId, hidden),
    onSuccess: (data, vars) => {
      void qc.invalidateQueries({ queryKey: contestKeys.entriesPrefix(contestId) })
      void qc.invalidateQueries({ queryKey: contestKeys.detail(contestId) })
      feedback?.onSuccess?.(data, vars)
    },
    onError: (error, vars) => feedback?.onError?.(error, vars),
  })
}
