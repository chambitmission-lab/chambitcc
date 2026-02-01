// 기도 토글 로직을 담당하는 커스텀 훅 (Single Responsibility)
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addPrayer, removePrayer } from '../api/prayer'
import { showToast } from '../utils/toast'
import type { Prayer, SortType } from '../types/prayer'

interface UsePrayerToggleOptions {
  fingerprint: string
  sort?: SortType
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

interface PrayerToggleResult {
  togglePrayer: (prayerId: number, isPrayed: boolean) => void
  isToggling: boolean
}

/**
 * 기도 토글 기능을 제공하는 훅
 * - 기도 추가/취소를 처리
 * - Optimistic Update로 즉각적인 UI 반응
 * - 에러 시 자동 롤백
 */
export const usePrayerToggle = ({
  fingerprint,
  sort = 'popular',
  onSuccess,
  onError,
}: UsePrayerToggleOptions): PrayerToggleResult => {
  const queryClient = useQueryClient()

  // 기도 추가 Mutation
  const addMutation = useMutation({
    mutationFn: (prayerId: number) => addPrayer(prayerId, fingerprint),
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
    const queryKey = ['prayers', 'list', sort, fingerprint]

    // Optimistic Update
    await queryClient.cancelQueries({ queryKey })
    const previousData = queryClient.getQueryData(queryKey)

    // UI 즉시 업데이트
    queryClient.setQueryData(queryKey, (old: any) => {
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

    try {
      // 실제 API 호출
      if (isPrayed) {
        await removeMutation.mutateAsync(prayerId)
      } else {
        await addMutation.mutateAsync(prayerId)
      }

      // 성공 시 데이터 새로고침
      queryClient.invalidateQueries({ queryKey: ['prayers', 'list'] })
    } catch (error) {
      // 에러 시 롤백
      queryClient.setQueryData(queryKey, previousData)
      throw error
    }
  }

  return {
    togglePrayer,
    isToggling: addMutation.isPending || removeMutation.isPending,
  }
}
