import { useEffect } from 'react'
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
import type { ContestDetail, ContestEntry, ContestSummary, ContestWrite, EntryPage, EntrySort, EntrySubmit } from '../types/handwritingContest'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { MutationFeedback } from './mutationFeedback'
import { notificationStream } from '../utils/notificationStream'
import { tokenStore } from '../utils/tokenStore'

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

const LIST_STALE = 1000 * 60

/** 대회 목록. 허브 카드처럼 묶음 요청이 끝난 뒤에 받아야 하는 자리는 enabled 로 미룬다 */
export const useContests = (enabled = true) =>
  useQuery({ queryKey: contestKeys.list(), queryFn: getContests, enabled, staleTime: LIST_STALE })

// 남은 표·내 작품은 다른 기기에서도 바뀌므로 재진입 때 갱신한다(전역 refetchOnMount:false 의 예외)
export const useContest = (id: number) =>
  useQuery({
    queryKey: contestKeys.detail(id),
    queryFn: () => getContest(id),
    enabled: id > 0,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  })

/** 갤러리. sort 가 아직 정해지지 않았으면(null — 대회 단계를 모를 때) 기다린다 */
export const useContestEntries = (id: number, sort: EntrySort | null) => {
  const effective: EntrySort = sort ?? 'shuffle'
  return useInfiniteQuery({
    queryKey: contestKeys.entries(id, effective),
    queryFn: ({ pageParam }) => getContestEntries(id, effective, pageParam, PAGE),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.has_more ? pages.length * PAGE : undefined),
    enabled: id > 0 && sort != null,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  })
}

/**
 * /handwriting 선요청 — 메뉴 호버·라우트 진입 때 청크와 나란히 목록을, 목록이 오면 첫 대회(id 없이 들어오면
 * 화면이 보여 주는 대회) 상세까지 받아 둔다. 예전엔 청크 → 목록 → 상세 → 갤러리가 직렬이었다.
 * coldOnly: 캐시가 아예 없을 때만(메뉴 호버용). id 가 있으면(딥링크) 목록을 기다리지 않고 그 상세를 바로 띄운다.
 */
export const prefetchContestPage = (qc: QueryClient, coldOnly = false, id?: number): Promise<void> => {
  const detailStale = coldOnly ? Infinity : 1000 * 30
  const prefetchDetail = (contestId: number) =>
    qc.prefetchQuery({ queryKey: contestKeys.detail(contestId), queryFn: () => getContest(contestId), staleTime: detailStale })
  const list = qc
    .prefetchQuery({ queryKey: contestKeys.list(), queryFn: getContests, staleTime: coldOnly ? Infinity : LIST_STALE })
    .then(() => {
      if (id) return
      const first = qc.getQueryData<{ items: ContestSummary[] }>(contestKeys.list())?.items[0]
      if (first) return prefetchDetail(first.id)
    })
  return Promise.all([list, id ? prefetchDetail(id) : undefined]).then(() => undefined)
}

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
  // 바뀐 작품이 없는 쪽·바뀌지 않은 쪽은 원래 배열을 그대로 돌려준다 — 참조가 유지돼야 memo 된 카드가 다시 그리지 않는다
  qc.setQueriesData<InfiniteData<EntryPage>>({ queryKey: contestKeys.entriesPrefix(contestId) }, (data) => {
    if (!data) return data
    let pagesChanged = false
    const pages = data.pages.map((p) => {
      let itemsChanged = false
      const items = p.items.map((e) => {
        if (e.id !== entryId) return e
        const next = patch(e)
        if (next !== e) itemsChanged = true
        return next
      })
      if (!itemsChanged) return p
      pagesChanged = true
      return { ...p, items }
    })
    return pagesChanged ? { ...data, pages } : data
  })
  qc.setQueryData<ContestEntry>(contestKeys.entry(contestId, entryId), (e) => (e ? patch(e) : e))
}

/** 갤러리 캐시에서 작품 하나를 뺀다(출품 거두기). 없는 쪽은 그대로 — 두 번 불려도(SSE·내 응답) 한 번만 줄어든다 */
const removeEntryEverywhere = (qc: ReturnType<typeof useQueryClient>, contestId: number, entryId: number) => {
  qc.setQueriesData<InfiniteData<EntryPage>>({ queryKey: contestKeys.entriesPrefix(contestId) }, (data) => {
    if (!data || !data.pages.some((p) => p.items.some((e) => e.id === entryId))) return data
    return {
      ...data,
      pages: data.pages.map((p) => ({ ...p, items: p.items.filter((e) => e.id !== entryId), total: Math.max(0, p.total - 1) })),
    }
  })
  qc.removeQueries({ queryKey: contestKeys.entry(contestId, entryId), exact: true })
  qc.removeQueries({ queryKey: contestKeys.ink(contestId, entryId), exact: true })
}

/** 빠진 작품에 내가 줬던 표를 돌려받는다(서버는 표를 지웠다). 이미 돌려받았으면 그대로 */
const refundVote = (d: ContestDetail, entryId: number): ContestDetail =>
  d.my_vote_entry_ids.includes(entryId)
    ? { ...d, my_vote_entry_ids: d.my_vote_entry_ids.filter((id) => id !== entryId), votes_left: d.votes_left + 1 }
    : d

/** 하트 누르기 — 서버 응답을 기다리지 않고 캐시에 먼저 반영한다(낙관적).
 *  표 수 ±1 은 여기(onMutate)서만 한다. 커밋 직후 서버가 contest_vote SSE 로 보내는 정확한 표 수는
 *  HTTP 응답보다 먼저 올 수 있어, onSuccess 에서 다시 더하면 두 번 센다. 실패하면 서버 값으로 되돌린다. */
export const useVoteEntry = (contestId: number, feedback?: MutationFeedback) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entryId, on }: { entryId: number; on: boolean }) => voteContestEntry(contestId, entryId, on),
    onMutate: ({ entryId, on }) => {
      patchEntryEverywhere(qc, contestId, entryId, (e) => ({
        ...e,
        voted_by_me: on,
        vote_count: e.vote_count == null || on === e.voted_by_me ? e.vote_count : Math.max(0, e.vote_count + (on ? 1 : -1)),
      }))
    },
    onSuccess: (detail: ContestDetail, vars) => {
      qc.setQueryData(contestKeys.detail(contestId), detail)
      patchEntryEverywhere(qc, contestId, vars.entryId, (e) => ({ ...e, voted_by_me: vars.on }))
      feedback?.onSuccess?.(detail, vars)
    },
    onError: (error, vars) => {
      void qc.invalidateQueries({ queryKey: contestKeys.detail(contestId) })
      void qc.invalidateQueries({ queryKey: contestKeys.entriesPrefix(contestId) })
      void qc.invalidateQueries({ queryKey: contestKeys.entry(contestId, vars.entryId) })
      feedback?.onError?.(error, vars)
    },
  })
}

interface ContestVoteEvent {
  contest_id: number
  entry_id: number
  /** 표 수가 모두에게 공개된 대회(발표 뒤·show_ranking)에만 실려 온다 */
  vote_count: number | null
  voter_count: number
}

/** 관리자처럼 표 수는 보이는데 이벤트엔 없을 때 다시 받는 최소 간격 — 표가 몰려도 이 주기로 한 번 */
const LIVE_REFETCH_THROTTLE_MS = 2500
const liveRefetchTimers = new Map<number, ReturnType<typeof setTimeout>>()

/**
 * 다른 성도의 표가 들어오고 빠지는 것을 새로고침 없이 비춘다.
 * 로그인 사용자가 이미 물고 있는 전역 SSE(/notifications/stream)의 contest_vote 이벤트를 구독해
 * 갤러리·작품 상세 캐시의 표 수와 대회의 투표 참여 인원만 서버 값으로 덮어쓴다(요청 0).
 * 정렬은 바꾸지 않는다 — 보고 있는 갤러리가 갑자기 자리를 바꾸면 오히려 방해라서 다음 재조회에 맡긴다.
 * 끊겼다 다시 붙으면 놓친 표가 있을 수 있어 대회·갤러리를 한 번 새로 받는다.
 */
export const useContestLive = (contestId: number) => {
  const qc = useQueryClient()
  useEffect(() => {
    if (contestId <= 0 || !tokenStore.getAccess()) return
    const refetchEntries = () => {
      if (liveRefetchTimers.has(contestId)) return
      liveRefetchTimers.set(
        contestId,
        setTimeout(() => {
          liveRefetchTimers.delete(contestId)
          void qc.invalidateQueries({ queryKey: contestKeys.entriesPrefix(contestId) })
          void qc.invalidateQueries({ queryKey: [...contestKeys.all, 'entry', contestId] })
        }, LIVE_REFETCH_THROTTLE_MS),
      )
    }
    const offVote = notificationStream.on('contest_vote', (raw) => {
      let ev: ContestVoteEvent
      try {
        ev = JSON.parse(raw) as ContestVoteEvent
      } catch {
        return
      }
      if (ev.contest_id !== contestId || typeof ev.entry_id !== 'number') return

      qc.setQueryData<ContestDetail>(contestKeys.detail(contestId), (d) => {
        if (!d) return d
        const mine =
          d.my_entry && d.my_entry.id === ev.entry_id && d.my_entry.vote_count != null && ev.vote_count != null
            ? { ...d.my_entry, vote_count: ev.vote_count }
            : d.my_entry
        return d.voter_count === ev.voter_count && mine === d.my_entry ? d : { ...d, voter_count: ev.voter_count, my_entry: mine }
      })

      if (ev.vote_count != null) {
        const count = ev.vote_count
        patchEntryEverywhere(qc, contestId, ev.entry_id, (e) => (e.vote_count === count ? e : { ...e, vote_count: count }))
        return
      }
      // 이벤트엔 표 수가 없는데 내 화면엔 보인다(관리자) — 몰아서 다시 받는다
      const pages = qc.getQueriesData<InfiniteData<EntryPage>>({ queryKey: contestKeys.entriesPrefix(contestId) })
      const showsCounts = pages.some(([, data]) =>
        data?.pages.some((p) => p.items.some((e) => e.id === ev.entry_id && e.vote_count != null)),
      )
      if (showsCounts) refetchEntries()
    })
    // 누군가 출품을 거뒀다 — 갤러리에서 빼고, 내가 표를 줬던 작품이면 표를 돌려받는다. 참여 수는 상세를 다시 받아 맞춘다
    const offWithdrawn = notificationStream.on('contest_entry_withdrawn', (raw) => {
      let ev: { contest_id: number; entry_id: number; voter_count: number }
      try {
        ev = JSON.parse(raw)
      } catch {
        return
      }
      if (ev.contest_id !== contestId || typeof ev.entry_id !== 'number') return
      removeEntryEverywhere(qc, contestId, ev.entry_id)
      qc.setQueryData<ContestDetail>(contestKeys.detail(contestId), (d) => (d ? refundVote(d, ev.entry_id) : d))
      void qc.invalidateQueries({ queryKey: contestKeys.detail(contestId) })
    })
    const offReconnect = notificationStream.on('reconnected', () => {
      void qc.invalidateQueries({ queryKey: contestKeys.detail(contestId) })
      void qc.invalidateQueries({ queryKey: contestKeys.entriesPrefix(contestId) })
    })
    return () => {
      offVote()
      offWithdrawn()
      offReconnect()
    }
  }, [qc, contestId])
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

/** 출품 거두기 — 응답이 오면 내 작품 카드·갤러리·참여 수를 캐시에서 바로 지운다.
 *  예전엔 무효화만 해서, 갤러리 전 페이지를 다시 받을 때까지 '거뒀어요' 토스트 뒤에도 카드가 남아 느려 보였다.
 *  표 참여 인원(voter_count)만 상세를 뒤에서 다시 받아 맞춘다 */
export const useWithdrawEntry = (contestId: number, feedback?: MutationFeedback) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => withdrawContestEntry(contestId),
    onSuccess: (data, vars) => {
      const mineId = qc.getQueryData<ContestDetail>(contestKeys.detail(contestId))?.my_entry?.id
      qc.setQueryData<ContestDetail>(contestKeys.detail(contestId), (d) =>
        d && d.my_entry ? { ...d, my_entry: null, entry_count: Math.max(0, d.entry_count - 1) } : d,
      )
      qc.setQueryData<{ items: ContestSummary[] }>(contestKeys.list(), (l) =>
        l ? { ...l, items: l.items.map((c) => (c.id === contestId ? { ...c, entry_count: Math.max(0, c.entry_count - 1) } : c)) } : l,
      )
      if (mineId) removeEntryEverywhere(qc, contestId, mineId)
      void qc.invalidateQueries({ queryKey: contestKeys.detail(contestId) })
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
