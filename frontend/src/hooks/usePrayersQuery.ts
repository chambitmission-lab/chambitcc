// React Query를 사용한 Prayer 데이터 관리
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { fetchPrayers, togglePrayer, createPrayer } from '../api/prayer'
import { getOrCreateFingerprint } from '../utils/fingerprint'
import type { Prayer, SortType } from '../types/prayer'

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

  // 기도했어요 토글 Mutation
  const toggleMutation = useMutation({
    mutationFn: (prayerId: number) => togglePrayer(prayerId, fingerprint),
    onMutate: async (prayerId) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: prayerKeys.list(sort, fingerprint) })
      
      const previousData = queryClient.getQueryData(prayerKeys.list(sort, fingerprint))
      
      queryClient.setQueryData(prayerKeys.list(sort, fingerprint), (old: any) => {
        if (!old) return old
        
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: {
              ...page.data,
              items: page.data.items.map((prayer: Prayer) =>
                prayer.id === prayerId
                  ? {
                      ...prayer,
                      is_prayed: !prayer.is_prayed,
                      prayer_count: prayer.is_prayed 
                        ? prayer.prayer_count - 1 
                        : prayer.prayer_count + 1,
                    }
                  : prayer
              ),
            },
          })),
        }
      })
      
      return { previousData }
    },
    onError: (_err, _prayerId, context) => {
      // 에러 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(
          prayerKeys.list(sort, fingerprint),
          context.previousData
        )
      }
    },
    onSuccess: (data, prayerId) => {
      // 서버 응답으로 정확한 값 업데이트
      queryClient.setQueryData(prayerKeys.list(sort, fingerprint), (old: any) => {
        if (!old) return old
        
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: {
              ...page.data,
              items: page.data.items.map((prayer: Prayer) =>
                prayer.id === prayerId
                  ? {
                      ...prayer,
                      is_prayed: data.is_prayed,
                      prayer_count: data.prayer_count,
                    }
                  : prayer
              ),
            },
          })),
        }
      })
    },
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

  return {
    prayers,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    hasMore: query.hasNextPage,
    sort,
    fingerprint,
    loadMore: query.fetchNextPage,
    isFetchingMore: query.isFetchingNextPage,
    handlePrayerToggle: toggleMutation.mutate,
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

  // 목록 캐시에서 해당 기도 찾기 (초기 데이터로 사용)
  const getInitialData = (): Prayer | undefined => {
    // 모든 목록 캐시를 순회하며 해당 기도 찾기
    const queryCache = queryClient.getQueryCache()
    const queries = queryCache.findAll({ queryKey: prayerKeys.lists() })
    
    for (const query of queries) {
      const data = query.state.data as any
      if (data?.pages) {
        for (const page of data.pages) {
          const prayer = page.data.items.find((p: Prayer) => p.id === prayerId)
          if (prayer) return prayer
        }
      }
    }
    return undefined
  }

  // 기도 상세 조회
  const query = useQuery({
    queryKey: [...prayerKeys.all, 'detail', prayerId, fingerprint],
    queryFn: async () => {
      const { fetchPrayerDetail } = await import('../api/prayer')
      return fetchPrayerDetail(prayerId, fingerprint)
    },
    initialData: getInitialData, // 목록에서 가져온 데이터를 먼저 표시
    enabled: !!fingerprint && !!prayerId,
    staleTime: 1000 * 60 * 5, // 5분으로 증가
    gcTime: 1000 * 60 * 30, // 30분간 캐시 유지
  })

  // 기도했어요 토글 Mutation
  const toggleMutation = useMutation({
    mutationFn: (prayerId: number) => togglePrayer(prayerId, fingerprint),
    onMutate: async (prayerId) => {
      // Optimistic Update
      await queryClient.cancelQueries({ 
        queryKey: [...prayerKeys.all, 'detail', prayerId, fingerprint] 
      })
      
      const previousData = queryClient.getQueryData([...prayerKeys.all, 'detail', prayerId, fingerprint])
      
      queryClient.setQueryData([...prayerKeys.all, 'detail', prayerId, fingerprint], (old: Prayer | undefined) => {
        if (!old) return old
        
        return {
          ...old,
          is_prayed: !old.is_prayed,
          prayer_count: old.is_prayed 
            ? old.prayer_count - 1 
            : old.prayer_count + 1,
        }
      })
      
      return { previousData }
    },
    onError: (_err, prayerId, context) => {
      // 에러 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(
          [...prayerKeys.all, 'detail', prayerId, fingerprint],
          context.previousData
        )
      }
    },
    onSuccess: (data, prayerId) => {
      // 서버 응답으로 정확한 값 업데이트
      queryClient.setQueryData([...prayerKeys.all, 'detail', prayerId, fingerprint], (old: Prayer | undefined) => {
        if (!old) return old
        
        return {
          ...old,
          is_prayed: data.is_prayed,
          prayer_count: data.prayer_count,
        }
      })

      // 목록 캐시도 업데이트
      queryClient.invalidateQueries({ queryKey: prayerKeys.lists() })
    },
  })

  return {
    prayer: query.data,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    fingerprint,
    handlePrayerToggle: () => toggleMutation.mutate(prayerId),
    isToggling: toggleMutation.isPending,
    refresh: () => queryClient.invalidateQueries({ 
      queryKey: [...prayerKeys.all, 'detail', prayerId, fingerprint] 
    }),
  }
}
