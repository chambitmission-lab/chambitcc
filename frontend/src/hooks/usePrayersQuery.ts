// React Query를 사용한 Prayer 데이터 관리
import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchPrayers, createPrayer, fetchPrayerDetail } from '../api/prayer'
import { usePrayerToggle } from './usePrayerToggle'
import { showToast } from '../utils/toast'
import type { SortType, Prayer, CreatePrayerRequest } from '../types/prayer'

// Query Keys
export const prayerKeys = {
  all: ['prayers'] as const,
  lists: () => [...prayerKeys.all, 'list'] as const,
  list: (sort: SortType) => 
    [...prayerKeys.lists(), sort] as const,
  details: () => [...prayerKeys.all, 'detail'] as const,
  detail: (prayerId: number) => 
    [...prayerKeys.details(), prayerId] as const,
}

// Infinite Query Hook
export const usePrayersInfinite = (sort: SortType = 'popular') => {
  const queryClient = useQueryClient()

  // 무한 스크롤 쿼리
  const query = useInfiniteQuery({
    queryKey: prayerKeys.list(sort),
    queryFn: async ({ pageParam = 1 }) => {
      return await fetchPrayers(pageParam, 20, sort)
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.items.length < 20) return undefined
      return allPages.length + 1
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5분간 fresh (기도 목록은 자주 안 바뀜)
    refetchOnMount: true, // 마운트 시 항상 새로운 데이터 가져오기
    refetchOnWindowFocus: false, // 윈도우 포커스 시에는 가져오지 않음
    retry: 2, // 실패 시 2번 재시도
  })

  // 기도 토글 훅 사용 (Dependency Inversion)
  const { togglePrayer: handleToggle, isToggling } = usePrayerToggle({
    sort,
  })

  // 기도 생성 Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePrayerRequest) => createPrayer(data),
    onMutate: async (data) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: prayerKeys.list(sort) })

      // 이전 데이터 백업
      const previousData = queryClient.getQueryData(prayerKeys.list(sort))

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
      }

      queryClient.setQueryData(prayerKeys.list(sort), (old: any) => {
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
        queryClient.setQueryData(prayerKeys.list(sort), context.previousData)
      }
      showToast(error.message || '기도 요청 등록에 실패했습니다.', 'error')
    },
    onSuccess: () => {
      showToast('기도 요청이 등록되었습니다.', 'success')
      
      // 실제 데이터로 갱신
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
    refresh: () => queryClient.invalidateQueries({ queryKey: prayerKeys.list(sort) }),
  }
}


// 기도 상세 조회 Hook
export const usePrayerDetail = (prayerId: number, initialData?: Prayer) => {
  const queryClient = useQueryClient()

  // 기도 상세 조회
  const query = useQuery({
    queryKey: prayerKeys.detail(prayerId),
    queryFn: () => fetchPrayerDetail(prayerId),
    enabled: !!prayerId,
    staleTime: 1000 * 60 * 3, // 3분간 fresh (너무 자주 호출 방지)
    initialData, // 목록에서 가져온 데이터를 초기값으로 사용
  })

  // 기도 토글 훅 사용 (Dependency Inversion)
  const { togglePrayer: handleToggle, isToggling } = usePrayerToggle({
    prayerId, // 상세 페이지용
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
      queryKey: prayerKeys.detail(prayerId) 
    }),
  }
}
