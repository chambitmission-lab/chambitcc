// React Query를 사용한 Prayer 데이터 관리
import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  fetchPrayers,
  createPrayer,
  fetchPrayerDetail,
  answerPrayer,
  updatePrayerAnswer,
  cancelPrayerAnswer,
} from '../api/prayer'
import { usePrayerToggle } from './usePrayerToggle'
import { showToast } from '../utils/toast'
import { getCurrentUser } from '../utils/auth'
import { createRetry } from '../config/queryClient'
import type { SortType, Prayer, CreatePrayerRequest, PrayerFilterType } from '../types/prayer'

// Query Keys - 사용자별로 다른 캐시 사용
export const prayerKeys = {
  all: ['prayers'] as const,
  lists: () => [...prayerKeys.all, 'list'] as const,
  list: (
    sort: SortType,
    groupId?: number | null,
    filter?: PrayerFilterType | null,
    username?: string | null,
    isAnswered?: boolean,
  ) =>
    [
      ...prayerKeys.lists(),
      sort,
      groupId ?? 'all',
      filter ?? 'all',
      username || 'anonymous',
      isAnswered === undefined ? 'any' : isAnswered ? 'answered' : 'unanswered',
    ] as const,
  details: () => [...prayerKeys.all, 'detail'] as const,
  detail: (prayerId: number, username?: string | null) =>
    [...prayerKeys.details(), prayerId, username || 'anonymous'] as const,
}

// Infinite Query Hook
export const usePrayersInfinite = (
  sort: SortType = 'popular',
  groupId?: number | null,
  filter?: PrayerFilterType | null,
  isAnswered?: boolean,
) => {
  const queryClient = useQueryClient()
  // 매 렌더링마다 최신 사용자 정보 가져오기 (장시간 후 재접속 대응)
  const currentUser = getCurrentUser()

  // 로그인 필요한 필터인지 확인
  const requiresAuth = filter === 'my_prayers' || filter === 'prayed_by_me'
  const isAuthenticated = !!currentUser.username

  // 무한 스크롤 쿼리
  const query = useInfiniteQuery({
    queryKey: prayerKeys.list(sort, groupId, filter, currentUser.username, isAnswered),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchPrayers(pageParam, 20, sort, groupId, filter, isAnswered)
      
      // 클라이언트에서 is_owner 재계산 (보안 강화)
      const itemsWithRecalculatedOwner = response.data.items.map((prayer: Prayer) => ({
        ...prayer,
        is_owner: currentUser.username ? prayer.is_owner : false,
      }))
      
      return {
        ...response,
        data: {
          ...response.data,
          items: itemsWithRecalculatedOwner,
        },
      }
    },
    enabled: !requiresAuth || isAuthenticated, // 로그인 필요한 필터는 로그인 시에만 활성화
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.items.length < 20) return undefined
      return allPages.length + 1
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5분간 fresh (캐시 활용)
    gcTime: 1000 * 60 * 60 * 2, // 2시간 메모리 유지 (무한스크롤 데이터 누적 방지)
    refetchOnMount: false, // 캐시 우선
    refetchOnWindowFocus: false,
    retry: createRetry(2), // 전역(1회)보다 여유 있게 재시도
  })

  // 기도 토글 훅 사용 (Dependency Inversion)
  const { togglePrayer: handleToggle, isToggling } = usePrayerToggle({
    sort,
    groupId,
    filter,
    username: currentUser.username,
  })

  // 기도 생성 Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePrayerRequest) => createPrayer(data),
    onMutate: async (data) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: prayerKeys.list(sort, groupId, filter) })

      // 이전 데이터 백업
      const previousData = queryClient.getQueryData(prayerKeys.list(sort, groupId, filter))

      // Optimistic Update - 임시 기도 추가
      const tempPrayer: Prayer = {
        id: Date.now(), // 임시 ID
        display_name: data.display_name || '익명',
        title: data.title,
        content: data.content,
        created_at: new Date().toISOString(),
        time_ago: '방금 전',
        prayer_count: 0,
        reply_count: 0,
        is_prayed: false,
        is_owner: true,
        group_id: data.group_id,
      }

      queryClient.setQueryData(prayerKeys.list(sort, groupId, filter), (old: any) => {
        if (!old) return old

        const firstPage = old.pages[0]
        return {
          ...old,
          pages: [
            {
              ...firstPage,
              data: {
                ...firstPage.data,
                items: [tempPrayer, ...firstPage.data.items],
              },
            },
            ...old.pages.slice(1),
          ],
        }
      })

      return { previousData }
    },
    onError: (error: Error, _variables, context) => {
      // 에러 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(prayerKeys.list(sort, groupId, filter), context.previousData)
      }
      showToast(error.message || '기도 요청 등록에 실패했습니다.', 'error')
    },
    onSuccess: () => {
      showToast('기도 요청이 등록되었습니다.', 'success')

      // 실제 데이터로 갱신 (모든 사용자의 캐시)
      queryClient.invalidateQueries({ queryKey: prayerKeys.lists() })

      // 프로필 캐시 무효화 (내 기도 +1)
      queryClient.invalidateQueries({
        queryKey: ['profile', 'detail'],
        refetchType: 'none',
      })
    },
  })

  // 응답 등록 Mutation (응답의 전당)
  // - 등록/수정 모두 처리: 이미 응답된 기도면 PUT, 아니면 POST
  const answerMutation = useMutation({
    mutationFn: async ({
      prayerId,
      testimony,
      isUpdate,
    }: {
      prayerId: number
      testimony: string
      isUpdate?: boolean
    }) => {
      if (isUpdate) {
        return updatePrayerAnswer(prayerId, testimony)
      }
      return answerPrayer(prayerId, testimony)
    },
    onSuccess: (_data, variables) => {
      showToast(
        variables.isUpdate ? '응답 간증이 수정되었습니다.' : '✨ 응답이 등록되었습니다',
        'success',
      )

      // 모든 기도 목록 캐시 무효화 (응답의 전당 포함)
      // refetchType: 'all' — 비활성 list 쿼리(예: 응답의 전당에서 액션한
      //   뒤 진입할 메인 홈 피드)도 함께 refetch 시켜야 응답 상태가
      //   페이지 간 동기화된다. 기본값 'active'는 현재 마운트된 쿼리만
      //   refetch하고 비활성 쿼리는 stale 마크만 되며, useInfiniteQuery
      //   의 refetchOnMount:false 와 결합되면 다음 마운트에도 옛 캐시가
      //   그대로 노출되는 문제가 있었다.
      queryClient.invalidateQueries({
        queryKey: prayerKeys.lists(),
        refetchType: 'all',
      })

      // 상세 캐시도 무효화 (해당 기도 카드)
      queryClient.invalidateQueries({
        queryKey: prayerKeys.detail(variables.prayerId, currentUser.username),
      })

      // 프로필 캐시도 무효화 (응답한 기도 수가 통계에 영향)
      queryClient.invalidateQueries({
        queryKey: ['profile', 'detail'],
        refetchType: 'none',
      })
    },
    onError: (error: Error) => {
      showToast(error.message || '응답 등록에 실패했습니다.', 'error')
    },
  })

  // 응답 취소 Mutation
  const cancelAnswerMutation = useMutation({
    mutationFn: ({ prayerId }: { prayerId: number }) => cancelPrayerAnswer(prayerId),
    onSuccess: (_data, variables) => {
      showToast('응답 등록이 취소되었습니다.', 'success')

      // refetchType: 'all' — answerMutation 참조. 응답 취소 후
      // 다른 페이지(메인 홈/응답의 전당)로 이동했을 때도 즉시 반영되도록.
      queryClient.invalidateQueries({
        queryKey: prayerKeys.lists(),
        refetchType: 'all',
      })
      queryClient.invalidateQueries({
        queryKey: prayerKeys.detail(variables.prayerId, currentUser.username),
      })
      queryClient.invalidateQueries({
        queryKey: ['profile', 'detail'],
        refetchType: 'none',
      })
    },
    onError: (error: Error) => {
      showToast(error.message || '응답 취소에 실패했습니다.', 'error')
    },
  })

  // 모든 페이지의 prayers를 flat하게 변환
  const prayers = query.data?.pages.flatMap(page => page.data.items) ?? []

  // 기도 토글 핸들러 (Open/Closed: 기존 인터페이스 유지하면서 새 구현 사용)
  const handlePrayerToggle = async (prayerId: number): Promise<void> => {
    const prayer = prayers.find(p => p.id === prayerId)
    if (prayer) {
      await handleToggle(prayerId, prayer.is_prayed)
    }
  }

  return {
    prayers,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    hasMore: query.hasNextPage,
    sort,
    loadMore: query.fetchNextPage,
    isFetchingMore: query.isFetchingNextPage,
    handlePrayerToggle,
    isToggling,
    createPrayer: (data: CreatePrayerRequest) => createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    answerPrayer: (prayerId: number, testimony: string) =>
      answerMutation.mutateAsync({ prayerId, testimony }),
    updatePrayerAnswer: (prayerId: number, testimony: string) =>
      answerMutation.mutateAsync({ prayerId, testimony, isUpdate: true }),
    cancelPrayerAnswer: (prayerId: number) =>
      cancelAnswerMutation.mutateAsync({ prayerId }),
    isAnswering: answerMutation.isPending,
    isCancellingAnswer: cancelAnswerMutation.isPending,
    refresh: () =>
      queryClient.invalidateQueries({
        queryKey: prayerKeys.list(sort, groupId, filter, currentUser.username, isAnswered),
      }),
  }
}


// 기도 상세 조회 Hook
export const usePrayerDetail = (prayerId: number, initialData?: Prayer) => {
  const queryClient = useQueryClient()
  const currentUser = getCurrentUser()

  // 기도 상세 조회 - 사용자별 캐시 키 사용
  const query = useQuery({
    queryKey: prayerKeys.detail(prayerId, currentUser.username),
    queryFn: async () => {
      const data = await fetchPrayerDetail(prayerId)
      
      // 클라이언트에서 is_owner 재계산 (보안 강화)
      // 백엔드 응답을 신뢰하되, 클라이언트에서도 검증
      const recalculatedIsOwner = currentUser.username 
        ? data.is_owner 
        : false
      
      return {
        ...data,
        is_owner: recalculatedIsOwner,
      }
    },
    enabled: !!prayerId,
    staleTime: 1000 * 60 * 10, // 10분간 fresh (사용자별 캐시로 is_owner 문제 해결)
    gcTime: 1000 * 60 * 30, // 30분간 메모리 유지 (가비지 컬렉션 시간)
    initialData: initialData ? {
      ...initialData,
      // initialData의 is_owner도 재계산
      is_owner: currentUser.username ? initialData.is_owner : false,
    } : undefined,
  })

  // 기도 토글 훅 사용 (Dependency Inversion)
  const { togglePrayer: handleToggle, isToggling } = usePrayerToggle({
    prayerId, // 상세 페이지용
    username: currentUser.username,
  })

  // 기도 토글 핸들러
  const handlePrayerToggle = () => {
    if (query.data) {
      handleToggle(prayerId, query.data.is_prayed)
    }
  }

  return {
    prayer: query.data,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    handlePrayerToggle,
    isToggling,
    refresh: () => queryClient.invalidateQueries({ 
      queryKey: prayerKeys.detail(prayerId, currentUser.username) 
    }),
  }
}
