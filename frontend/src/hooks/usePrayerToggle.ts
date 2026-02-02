// 기도 토글 로직을 담당하는 커스텀 훅 (Single Responsibility)
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addPrayer, removePrayer } from '../api/prayer'
import { showToast } from '../utils/toast'
import { prayerKeys } from './usePrayersQuery'
import type { Prayer, SortType } from '../types/prayer'

interface UsePrayerToggleOptions {
  sort?: SortType
  fingerprint?: string
  prayerId?: number // 상세 페이지용
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

interface PrayerToggleResult {
  togglePrayer: (prayerId: number, isPrayed: boolean) => void
  isToggling: boolean
}

/**
 * 기도 토글 기능을 제공하는 훅 (로그인 필수)
 * - 기도 추가/취소를 처리
 * - Optimistic Update로 즉각적인 UI 반응
 * - 목록과 상세 페이지 캐시 동시 업데이트
 * - 에러 시 자동 롤백
 */
export const usePrayerToggle = ({
  sort = 'popular',
  fingerprint,
  prayerId: detailPrayerId,
  onSuccess,
  onError,
}: UsePrayerToggleOptions): PrayerToggleResult => {
  const queryClient = useQueryClient()

  // 기도 추가 Mutation
  const addMutation = useMutation({
    mutationFn: (prayerId: number) => addPrayer(prayerId),
    onSuccess: (data) => {
      showToast(data.message, 'success')
      onSuccess?.(data.message)
    },
    onError: (error: Error) => {
      showToast(error.message, 'error')
      onError?.(error.message)
    },
  })

  // 기도 취소 Mutation
  const removeMutation = useMutation({
    mutationFn: (prayerId: number) => removePrayer(prayerId),
    onSuccess: (data) => {
      showToast(data.message, 'success')
      onSuccess?.(data.message)
    },
    onError: (error: Error) => {
      showToast(error.message, 'error')
      onError?.(error.message)
    },
  })

  // 통합 토글 함수 (Dependency Inversion: 추상화된 인터페이스 제공)
  const togglePrayer = async (prayerId: number, isPrayed: boolean) => {
    const listQueryKey = prayerKeys.list(sort, fingerprint)
    const detailQueryKey = detailPrayerId 
      ? prayerKeys.detail(detailPrayerId, fingerprint)
      : null

    // Optimistic Update - 목록 캐시
    await queryClient.cancelQueries({ queryKey: listQueryKey })
    const previousListData = queryClient.getQueryData(listQueryKey)

    queryClient.setQueryData(listQueryKey, (old: any) => {
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
                    is_prayed: !isPrayed,
                    prayer_count: isPrayed
                      ? prayer.prayer_count - 1
                      : prayer.prayer_count + 1,
                  }
                : prayer
            ),
          },
        })),
      }
    })

    // Optimistic Update - 상세 캐시 (있는 경우)
    let previousDetailData = null
    if (detailQueryKey) {
      await queryClient.cancelQueries({ queryKey: detailQueryKey })
      previousDetailData = queryClient.getQueryData(detailQueryKey)

      queryClient.setQueryData(detailQueryKey, (old: Prayer | undefined) => {
        if (!old || old.id !== prayerId) return old

        return {
          ...old,
          is_prayed: !isPrayed,
          prayer_count: isPrayed
            ? old.prayer_count - 1
            : old.prayer_count + 1,
        }
      })
    }

    try {
      // 실제 API 호출
      if (isPrayed) {
        await removeMutation.mutateAsync(prayerId)
      } else {
        await addMutation.mutateAsync(prayerId)
      }

      // 성공 시 다른 정렬의 목록도 업데이트 (백그라운드)
      // 현재 보고 있는 목록은 이미 Optimistic Update로 정확하게 반영됨
      const otherSorts: SortType[] = sort === 'popular' ? ['latest'] : ['popular']
      otherSorts.forEach(otherSort => {
        queryClient.invalidateQueries({ 
          queryKey: prayerKeys.list(otherSort, fingerprint),
          refetchType: 'none', // 백그라운드에서만, 즉시 리페치 안함
        })
      })

      // 상세 페이지가 아닌 다른 상세 캐시들도 무효화 (백그라운드)
      if (!detailPrayerId) {
        queryClient.invalidateQueries({
          queryKey: prayerKeys.details(),
          refetchType: 'none',
        })
      }
    } catch (error) {
      // 에러 시 롤백
      queryClient.setQueryData(listQueryKey, previousListData)
      if (detailQueryKey && previousDetailData) {
        queryClient.setQueryData(detailQueryKey, previousDetailData)
      }
      throw error
    }
  }

  return {
    togglePrayer,
    isToggling: addMutation.isPending || removeMutation.isPending,
  }
}
