// React Query를 사용한 Prayer 데이터 관리
import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchPrayers, createPrayer, fetchPrayerDetail } from '../api/prayer'
import { usePrayerToggle } from './usePrayerToggle'
import { showToast } from '../utils/toast'
import { getCurrentUser } from '../utils/auth'
import type { SortType, Prayer, CreatePrayerRequest, PrayerFilterType } from '../types/prayer'

// Query Keys - 사용자별로 다른 캐시 사용
export const prayerKeys = {
  all: ['prayers'] as const,
  lists: () => [...prayerKeys.all, 'list'] as const,
  list: (sort: SortType, groupId?: number | null, filter?: PrayerFilterType | null, username?: string | null) => 
    [...prayerKeys.lists(), sort, groupId ?? 'all', filter ?? 'all', username || 'anonymous'] as const,
  details: () => [...prayerKeys.all, 'detail'] as const,
  detail: (prayerId: number, username?: string | null) => 
    [...prayerKeys.details(), prayerId, username || 'anonymous'] as const,
}

// Infinite Query Hook
export const usePrayersInfinite = (sort: SortType = 'popular', groupId?: number | null, filter?: PrayerFilterType | null) => {
  const queryClient = useQueryClient()
  // 매 렌더링마다 최신 사용자 정보 가져오기 (장시간 후 재접속 대응)
  const currentUser = getCurrentUser()
  
  // 로그인 필요한 필터인지 확인
  const requiresAuth = filter === 'my_prayers' || filter === 'prayed_by_me'
  const isAuthenticated = !!currentUser.username

  // 무한 스크롤 쿼리
  const query = useInfiniteQuery({
    queryKey: prayerKeys.list(sort, groupId, filter, currentUser.username),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchPrayers(pageParam, 20, sort, groupId, filter)
      
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
    gcTime: 1000 * 60 * 60 * 24, // 24시간 메모리 유지
    refetchOnMount: false, // 캐시 우선
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // 네트워크 에러는 재시도하지 않고 캐시 사용
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('Network request failed') ||
          error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        return false
      }
      return failureCount < 2
    },
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
      
      // 백그라운드에서 프로필 캐시 무효화 (내 기도 +1)
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['profile', 'detail'],
          refetchType: 'none',
        })
      }, 0)
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
    error: query.error?.message ?? null,
    hasMore: query.hasNextPage,
    sort,
    loadMore: query.fetchNextPage,
    isFetchingMore: query.isFetchingNextPage,
    handlePrayerToggle,
    isToggling,
    createPrayer: (data: CreatePrayerRequest) => createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    refresh: () => queryClient.invalidateQueries({ queryKey: prayerKeys.list(sort, groupId, filter, currentUser.username) }),
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
