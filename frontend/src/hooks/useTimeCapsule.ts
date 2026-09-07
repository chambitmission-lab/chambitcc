import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import {
  claimCapsule,
  createCapsule,
  deleteCapsule,
  getCapsule,
  listMyCapsules,
  openCapsule,
  previewCapsule,
} from '../api/timeCapsule'
import type {
  CapsuleCreateRequest,
  CapsuleDetail,
  CapsuleListResponse,
  CapsuleSummary,
} from '../types/timeCapsule'

export const capsuleKeys = {
  all: ['timeCapsule'] as const,
  // list()는 '모든 캡슐함 쿼리'의 접두사다. 실제 쿼리 키는 검색어까지 붙인
  // listQuery(q) — 무효화는 접두사로 하므로 검색 결과 캐시까지 함께 갱신된다.
  list: () => [...capsuleKeys.all, 'list'] as const,
  listQuery: (q = '') => [...capsuleKeys.list(), q] as const,
  detail: (id: number) => [...capsuleKeys.all, 'detail', id] as const,
  preview: (code: string) => [...capsuleKeys.all, 'preview', code] as const,
}

/** 여러 페이지를 하나의 캡슐함으로 — 화면은 페이지를 알 필요가 없다 */
export interface CapsuleMailboxData {
  sealed: CapsuleSummary[]
  arrived: CapsuleSummary[]
  arrivedTotal: number // 서버가 세어 준 전체 수 (받아 온 페이지 수가 아니다)
  unreadTotal: number
}

/** 내가 받은 편지 중 아직 열지 않은 것 — 구버전 백엔드 폴백용 로컬 집계 */
const countUnread = (list: CapsuleSummary[]) =>
  list.filter((c) => c.role !== 'sender' && !c.opened_at).length

const flattenPages = (pages: CapsuleListResponse[]): CapsuleMailboxData => {
  const sealed = pages.flatMap((p) => p.sealed) // 봉인함은 첫 페이지에만 실려 온다
  const arrived = pages.flatMap((p) => p.arrived)
  const head = pages[0]
  return {
    sealed,
    arrived,
    // 총계는 페이지마다 같은 값이라 첫 페이지 것을 쓴다.
    // 구버전 백엔드(총계 필드 없음)에서는 받아 온 목록으로 대신한다.
    arrivedTotal: head?.arrived_total ?? arrived.length,
    unreadTotal: head?.arrived_unread ?? countUnread(arrived),
  }
}

/**
 * 캡슐함 한 화면치씩. 도착함만 페이지가 나뉘고, '더 보기'는 fetchNextPage로 이어 붙인다.
 * q를 주면 같은 형태로 걸러진 결과가 온다 (검색도 같은 방식으로 이어 받는다).
 */
const useCapsuleList = (q: string, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: capsuleKeys.listQuery(q),
    queryFn: ({ pageParam }) => listMyCapsules({ q: q || undefined, before: pageParam }),
    initialPageParam: undefined as string | undefined,
    // 커서가 null이면 끝 — undefined를 돌려줘야 hasNextPage가 false가 된다
    getNextPageParam: (last: CapsuleListResponse) => last.arrived_cursor ?? undefined,
    enabled,
    staleTime: 1000 * 60,
    // openable(개봉 가능 여부)이 시간에 따라 바뀌는 목록 — 재진입 시 갱신
    refetchOnMount: true,
    // 검색어를 지우는 동안 목록이 비었다 채워지지 않도록
    placeholderData: keepPreviousData,
    select: (data) => flattenPages(data.pages),
  })

export const useMyCapsules = (enabled = true) => useCapsuleList('', enabled)

/** 캡슐함 검색 — 봉인 중인 캡슐은 본문을 검색하지 않는다(개봉 전 비공개) */
export const useCapsuleSearch = (q: string, enabled = true) =>
  useCapsuleList(q, enabled && q.length > 0)

export const useCapsule = (capsuleId: number, enabled = true) =>
  useQuery({
    queryKey: capsuleKeys.detail(capsuleId),
    queryFn: () => getCapsule(capsuleId),
    enabled: enabled && capsuleId > 0,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  })

/**
 * 알림 '바로가기'처럼 진입이 예정된 캡슐의 상세를 미리 받아둔다.
 * useCapsule과 staleTime을 맞춰야 진입 직후 refetchOnMount가 다시 돌지 않는다
 * (안 맞추면 미리 받아두고도 스켈레톤이 한 번 깜빡인다).
 */
export const prefetchCapsule = (qc: QueryClient, capsuleId: number) =>
  qc.prefetchQuery({
    queryKey: capsuleKeys.detail(capsuleId),
    queryFn: () => getCapsule(capsuleId),
    staleTime: 1000 * 30,
  })

export const useCapsulePreview = (inviteCode: string) =>
  useQuery({
    queryKey: capsuleKeys.preview(inviteCode),
    queryFn: () => previewCapsule(inviteCode),
    enabled: inviteCode.length >= 8,
    retry: false,
  })

export const useCreateCapsule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CapsuleCreateRequest) => createCapsule(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: capsuleKeys.all }),
  })
}

export const useOpenCapsule = (capsuleId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => openCapsule(capsuleId),
    onSuccess: (detail: CapsuleDetail) => {
      qc.setQueryData(capsuleKeys.detail(capsuleId), detail)
      qc.invalidateQueries({ queryKey: capsuleKeys.list() })
    },
  })
}

export const useClaimCapsule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteCode: string) => claimCapsule(inviteCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: capsuleKeys.all }),
  })
}

export const useDeleteCapsule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (capsuleId: number) => deleteCapsule(capsuleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: capsuleKeys.all }),
  })
}
