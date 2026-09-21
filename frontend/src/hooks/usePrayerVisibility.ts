// 기도 공개 범위 전환 (나만 보기 ↔ 목사님과 함께 ↔ 전체 공개)
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updatePrayerVisibility } from '../api/prayer'
import { getCurrentUser } from '../utils/auth'
import { prayerKeys } from './usePrayersQuery'
import { profileKeys } from './queryKeys'
import type { Prayer } from '../types/prayer'
import type { PrayerListCache } from '../types/queryCache'

interface UsePrayerVisibilityOptions {
  onSuccess?: (prayer: Prayer) => void
  onError?: (error: Error) => void
}

/**
 * 비밀기도 → 전체 공개(또는 그 반대) 전환.
 *
 * - 캐시된 모든 목록·상세의 is_private 를 즉시 갱신하고
 * - 목록은 전부 다시 받는다 — 공개로 바뀐 기도는 전체 피드에 새로 나타나야 하는데
 *   refetchOnMount:false 전역 설정 탓에 비활성 쿼리는 refetchType:'all' 로 강제해야 반영된다
 */
export const usePrayerVisibility = ({ onSuccess, onError }: UsePrayerVisibilityOptions = {}) => {
  const queryClient = useQueryClient()
  const currentUser = getCurrentUser()

  const mutation = useMutation({
    mutationFn: ({ prayerId, isPrivate, sharedWithPastor }: { prayerId: number; isPrivate: boolean; sharedWithPastor: boolean }) =>
      updatePrayerVisibility(prayerId, isPrivate, sharedWithPastor),
    onSuccess: (response, { prayerId, isPrivate: wantPrivate, sharedWithPastor }) => {
      const updated = response.data
      // '목사님과 함께'는 나만 보기의 한 종류다 (성도에게는 없는 글)
      const isPrivate = wantPrivate || sharedWithPastor

      queryClient.setQueriesData<PrayerListCache>({ queryKey: prayerKeys.lists() }, (old) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              items: page.data.items.map((p) =>
                p.id === prayerId ? { ...p, is_private: isPrivate, shared_with_pastor: sharedWithPastor, group_id: undefined, group: undefined } : p,
              ),
            },
          })),
        }
      })

      queryClient.setQueryData<Prayer>(prayerKeys.detail(prayerId, currentUser.username), (old) =>
        old ? { ...old, ...updated, is_private: isPrivate, shared_with_pastor: sharedWithPastor } : old,
      )

      queryClient.invalidateQueries({ queryKey: prayerKeys.lists(), refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: profileKeys.all })

      onSuccess?.(updated)
    },
    onError: (error: Error) => onError?.(error),
  })

  return {
    setVisibility: (prayerId: number, isPrivate: boolean, sharedWithPastor: boolean = false) =>
      mutation.mutateAsync({ prayerId, isPrivate, sharedWithPastor }),
    isUpdating: mutation.isPending,
  }
}
