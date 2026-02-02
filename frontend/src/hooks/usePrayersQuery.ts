// React Query를 사용한 Prayer 데이터 관리
import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchPrayers, createPrayer, fetchPrayerDetail } from '../api/prayer'
import { usePrayerToggle } from './usePrayerToggle'
import { getStoredFingerprint } from '../utils/fingerprint'
import type { SortType } from '../types/prayer'

// Query Keys
export const prayerKeys = {
  all: ['prayers'] as const,
  lists: () => [...prayerKeys.all, 'list'] as const,
  list: (sort: SortType, fingerprint?: string) => 
    [...prayerKeys.lists(), sort, fingerprint] as const,
  details: () => [...prayerKeys.all, 'detail'] as const,
  detail: (prayerId: number, fingerprint?: string) => 
    [...prayerKeys.details(), prayerId, fingerprint] as const,
}

// Infinite Query Hook
export const usePrayersInfinite = (sort: SortType = 'popular') => {
  const queryClient = useQueryClient()
  const fingerprint = getStoredFingerprint() || undefined

  // 무한 스크롤 쿼리
  const query = useInfiniteQuery({
    queryKey: prayerKeys.list(sort, fingerprint),
    queryFn: ({ pageParam = 1 }) => fetchPrayers(pageParam, 20, sort),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.items.length < 20) return undefined
      return allPages.length + 1
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5분간 fresh (기도 목록은 자주 안 바뀜)
  })

  // 기도 토글 훅 사용 (Dependency Inversion)
  const { togglePrayer: handleToggle, isToggling } = usePrayerToggle({
    sort,
    fingerprint,
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
  const fingerprint = getStoredFingerprint() || undefined

  // 기도 상세 조회
  const query = useQuery({
    queryKey: prayerKeys.detail(prayerId, fingerprint),
    queryFn: () => fetchPrayerDetail(prayerId),
    enabled: !!prayerId,
    staleTime: 1000 * 60 * 5, // 5분
  })

  // 기도 토글 훅 사용 (Dependency Inversion)
  const { togglePrayer: handleToggle, isToggling } = usePrayerToggle({
    fingerprint,
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
      queryKey: prayerKeys.detail(prayerId, fingerprint) 
    }),
  }
}
