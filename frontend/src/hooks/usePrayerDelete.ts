// 기도 삭제 로직을 담당하는 커스텀 훅 with Optimistic Update
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deletePrayer } from '../api/prayer'
import { showToast } from '../utils/toast'
import { getCurrentUser } from '../utils/auth'
import { prayerKeys } from './usePrayersQuery'
import { groupKeys } from './useGroups'

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

      // 캐시된 모든 목록(전체·그룹방·필터·응답 여부 조합)에서 낙관적으로 제거.
      // 특정 키 조합만 골라 패치하면 그룹방처럼 키가 다른 목록이 갱신되지 않는다.
      const previousListsData = queryClient.getQueriesData({ queryKey: prayerKeys.lists() })

      queryClient.setQueriesData({ queryKey: prayerKeys.lists() }, (old: any) => {
        if (!old?.pages) return old

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

      // 상세 캐시 제거 - 사용자별 캐시 키 사용
      queryClient.removeQueries({
        queryKey: prayerKeys.detail(prayerId, currentUser.username)
      })

      return { previousListsData }
    },
    onError: (error: Error, _prayerId, context) => {
      // 에러 시 롤백
      context?.previousListsData?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })

      const errorMsg = error.message || '기도 요청 삭제에 실패했습니다.'
      showToast(errorMsg, 'error')
      onError?.(errorMsg)
    },
    onSuccess: (data) => {
      showToast(data.message || '기도 요청이 삭제되었습니다.', 'success')

      // 서버 기준으로 목록 재동기화 (활성 화면은 즉시 refetch)
      queryClient.invalidateQueries({ queryKey: prayerKeys.lists() })

      // 그룹 캐시 무효화 — 그룹방 기도 개수 등 (생성/응답 뮤테이션과 대칭)
      queryClient.invalidateQueries({ queryKey: groupKeys.all })

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
