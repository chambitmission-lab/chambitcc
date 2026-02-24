// 기도 삭제 로직을 담당하는 커스텀 훅 with Optimistic Update
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deletePrayer } from '../api/prayer'
import { showToast } from '../utils/toast'
import { getCurrentUser } from '../utils/auth'
import { prayerKeys } from './usePrayersQuery'

interface UsePrayerDeleteOptions {
  onSuccess?: () => void
  onError?: (error: string) => void
}

/**
 * 기도 삭제 기능을 제공하는 훅
 * - Optimistic Update로 즉각적인 UI 반응
 * - 목록과 상세 페이지 캐시 동시 업데이트 (사용자별 캐시 포함)
 * - 에러 시 자동 롤백
 */
export const usePrayerDelete = ({ onSuccess, onError }: UsePrayerDeleteOptions = {}) => {
  const queryClient = useQueryClient()
  const currentUser = getCurrentUser()

  const mutation = useMutation({
    mutationFn: (prayerId: number) => deletePrayer(prayerId),
    onMutate: async (prayerId) => {
      // 모든 기도 목록 쿼리 취소
      await queryClient.cancelQueries({ queryKey: prayerKeys.lists() })

      // 이전 데이터 백업
      const previousListsData: any = {}
      const sorts = ['popular', 'latest'] as const
      
      for (const sort of sorts) {
        const queryKey = prayerKeys.list(sort, null, null, currentUser.username)
        previousListsData[sort] = queryClient.getQueryData(queryKey)

        // Optimistic Update - 목록에서 제거
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: {
                ...page.data,
                items: page.data.items.filter((prayer: any) => prayer.id !== prayerId),
              },
            })),
          }
        })
      }

      // 상세 캐시 제거 - 사용자별 캐시 키 사용
      queryClient.removeQueries({ 
        queryKey: prayerKeys.detail(prayerId, currentUser.username) 
      })

      return { previousListsData }
    },
    onError: (error: Error, _prayerId, context) => {
      // 에러 시 롤백
      if (context?.previousListsData) {
        const sorts = ['popular', 'latest'] as const
        for (const sort of sorts) {
          if (context.previousListsData[sort]) {
            queryClient.setQueryData(
              prayerKeys.list(sort, null, null, currentUser.username), 
              context.previousListsData[sort]
            )
          }
        }
      }

      const errorMsg = error.message || '기도 요청 삭제에 실패했습니다.'
      showToast(errorMsg, 'error')
      onError?.(errorMsg)
    },
    onSuccess: (data) => {
      showToast(data.message || '기도 요청이 삭제되었습니다.', 'success')
      
      // 백그라운드에서 프로필 캐시 무효화 (내 기도 -1)
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['profile', 'detail'],
          refetchType: 'none',
        })
      }, 0)

      onSuccess?.()
    },
  })

  return {
    deletePrayer: mutation.mutate,
    isDeleting: mutation.isPending,
  }
}
