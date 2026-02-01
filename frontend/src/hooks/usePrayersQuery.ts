// React Query를 사용한 Prayer 데이터 관리
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { fetchPrayers, createPrayer } from '../api/prayer'
import { getOrCreateFingerprint } from '../utils/fingerprint'
import { usePrayerToggle } from './usePrayerToggle'
import type { SortType } from '../types/prayer'

// Query Keys
export const prayerKeys = {
  all: ['prayers'] as const,
  lists: () => [...prayerKeys.all, 'list'] as const,
  list: (sort: SortType, fingerprint: string) => 
    [...prayerKeys.lists(), sort, fingerprint] as const,
}

// Infinite Query Hook
export const usePrayersInfinite = (sort: SortType = 'popular') => {
  const queryClient = useQueryClient()

  // Fingerprint 가져오기
  const { data: fingerprint = '' } = useQuery({
    queryKey: ['fingerprint'],
    queryFn: getOrCreateFingerprint,
    staleTime: Infinity, // 한 번 생성되면 계속 사용
  })

  // 무한 스크롤 쿼리
  const query = useInfiniteQuery({
    queryKey: prayerKeys.list(sort, fingerprint),
    queryFn: ({ pageParam = 1 }) => fetchPrayers(pageParam, 20, sort, fingerprint),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.items.length < 20) return undefined
      return allPages.length + 1
    },
    initialPageParam: 1,
    enabled: !!fingerprint, // fingerprint가 있을 때만 실행
    staleTime: 1000 * 60 * 2, // 2분간 fresh
  })

  // 기도 토글 훅 사용 (Dependency Inversion)
  const { togglePrayer: handleToggle, isToggling } = usePrayerToggle({
    fingerprint,
    sort,
  })

  // 기도 생성 Mutation
  const createMutation = useMutation({
    mutationFn: createPrayer,
    onSuccess: () => {
      // 모든 기도 목록 무효화하여 새로고침
      queryClient.invalidateQueries({ queryKey: prayerKeys.lists() })
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
    fingerprint,
    loadMore: query.fetchNextPage,
    isFetchingMore: query.isFetchingNextPage,
    handlePrayerToggle,
    isToggling,
    createPrayer: createMutation.mutate,
    isCreating: createMutation.isPending,
    refresh: () => queryClient.invalidateQueries({ queryKey: prayerKeys.list(sort, fingerprint) }),
  }
}


// 기도 상세 조회 Hook
export const usePrayerDetail = (prayerId: number) => {
  const queryClient = useQueryClient()

  // Fingerprint 가져오기
  const { data: fingerprint = '' } = useQuery({
    queryKey: ['fingerprint'],
    queryFn: getOrCreateFingerprint,
    staleTime: Infinity,
  })

  // 기도 상세 조회
  const query = useQuery({
    queryKey: [...prayerKeys.all, 'detail', prayerId, fingerprint],
    queryFn: async () => {
      const { fetchPrayerDetail } = await import('../api/prayer')
      return fetchPrayerDetail(prayerId, fingerprint)
    },
    enabled: !!fingerprint && !!prayerId,
    staleTime: 1000 * 60 * 2, // 2분
  })

  // 기도 토글 훅 사용 (Dependency Inversion)
  const { togglePrayer: handleToggle, isToggling } = usePrayerToggle({
    fingerprint,
    onSuccess: () => {
      // 상세 페이지 데이터 새로고침
      queryClient.invalidateQueries({ 
        queryKey: [...prayerKeys.all, 'detail', prayerId, fingerprint] 
      })
    },
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
    fingerprint,
    handlePrayerToggle,
    isToggling,
    refresh: () => queryClient.invalidateQueries({ 
      queryKey: [...prayerKeys.all, 'detail', prayerId, fingerprint] 
    }),
  }
}
