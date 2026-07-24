// 기도 토글 로직을 담당하는 커스텀 훅 (Single Responsibility)
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addPrayer, removePrayer } from '../api/prayer'
import { showToast } from '../utils/toast'
import { prayerKeys } from './usePrayersQuery'
import { groupKeys } from './useGroups'
import type { Prayer, SortType } from '../types/prayer'

interface UsePrayerToggleOptions {
  prayerId?: number // 상세 페이지용
  username?: string | null // 사용자별 캐시 키용
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

interface PrayerToggleResult {
  togglePrayer: (prayerId: number, isPrayed: boolean, durationMinutes?: number) => void
  isToggling: boolean
}

/**
 * 기도 토글 기능을 제공하는 훅 (로그인 필수)
 * - 기도 추가/취소를 처리
 * - Optimistic Update로 즉각적인 UI 반응
 * - 목록과 상세 페이지 캐시 동시 업데이트
 * - 에러 시 자동 롤백
 * - 기도 시간 추적 지원
 */
export const usePrayerToggle = ({
  prayerId: detailPrayerId,
  username = null,
  onSuccess,
  onError,
}: UsePrayerToggleOptions = {}): PrayerToggleResult => {
  const queryClient = useQueryClient()

  // 기도 추가 Mutation (기도 시간 포함)
  const addMutation = useMutation({
    mutationFn: ({ prayerId, durationMinutes }: { prayerId: number; durationMinutes?: number }) => 
      addPrayer(prayerId, durationMinutes),
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

  // 통합 토글 함수 (기도 시간 파라미터 추가)
  const togglePrayer = async (prayerId: number, isPrayed: boolean, durationMinutes?: number) => {
    const detailQueryKey = detailPrayerId
      ? prayerKeys.detail(detailPrayerId, username)
      : null

    // Optimistic Update - 캐시에 있는 모든 목록 (정렬·그룹·필터 불문)
    // 상세 모달에서 토글하면 토글 훅이 지금 보고 있는 목록의 정렬/필터를
    // 알 수 없다 — 특정 키 하나만 찍어 갱신하면 다른 키로 떠 있는 목록은
    // 새로고침 전까지 is_prayed 체크가 안 바뀐다. 그래서 전체를 순회한다.
    await queryClient.cancelQueries({ queryKey: prayerKeys.lists() })
    const previousListEntries = queryClient.getQueriesData({ queryKey: prayerKeys.lists() })

    previousListEntries.forEach(([listKey]) => {
      // prayerKeys.list 구조: ['prayers', 'list', sort, groupId, filter, username, answered]
      const listSort = listKey[2] as SortType | undefined

      queryClient.setQueryData(listKey, (old: any) => {
        if (!old) return old

        // 기도 수 업데이트
        const updatedPages = old.pages.map((page: any) => ({
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
        }))

        // 따뜻한 관심순일 때만 정렬 (prayer_count 내림차순)
        if (listSort === 'popular') {
          updatedPages.forEach((page: any) => {
            page.data.items.sort((a: Prayer, b: Prayer) => b.prayer_count - a.prayer_count)
          })
        }

        return {
          ...old,
          pages: updatedPages,
        }
      })
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

    // Optimistic Update - 프로필 캐시 (기도 횟수 + 기도중 개수 즉시 반영)
    const previousProfileData = queryClient.getQueryData(['profile', 'detail'])
    if (!isPrayed) {
      // 기도 추가 시 total_count +1, praying_for +1
      queryClient.setQueryData(['profile', 'detail'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          stats: {
            ...old.stats,
            activity: {
              ...old.stats.activity,
              total_count: (old.stats.activity.total_count || 0) + 1,
              this_week_count: (old.stats.activity.this_week_count || 0) + 1,
            },
            content: {
              ...old.stats.content,
              praying_for: (old.stats.content?.praying_for || 0) + 1,
            },
          },
        }
      })
    } else {
      // 기도 취소 시 total_count -1, praying_for -1
      queryClient.setQueryData(['profile', 'detail'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          stats: {
            ...old.stats,
            activity: {
              ...old.stats.activity,
              total_count: Math.max(0, (old.stats.activity.total_count || 0) - 1),
              this_week_count: Math.max(0, (old.stats.activity.this_week_count || 0) - 1),
            },
            content: {
              ...old.stats.content,
              praying_for: Math.max(0, (old.stats.content?.praying_for || 0) - 1),
            },
          },
        }
      })
    }

    try {
      // 실제 API 호출
      if (isPrayed) {
        await removeMutation.mutateAsync(prayerId)
      } else {
        await addMutation.mutateAsync({ prayerId, durationMinutes })
      }

      // 모든 목록을 백그라운드 stale 처리 — 낙관적 갱신은 이미 반영됐고,
      // 다음 포커스/마운트 때 서버 진실로 조용히 재동기화된다
      queryClient.invalidateQueries({
        queryKey: prayerKeys.lists(),
        refetchType: 'none',
      })

      // 다른 상세 캐시들도 백그라운드 무효화
      if (!detailPrayerId) {
        queryClient.invalidateQueries({
          queryKey: prayerKeys.details(),
          refetchType: 'none',
        })
      }

      // 프로필 캐시 무효화 및 자동 갱신 (기도 통계 업데이트)
      // 'profile' 전체 — 프로필 탭 무한 목록(praying-for 등)도 stale 처리
      queryClient.invalidateQueries({
        queryKey: ['profile'],
      })

      // 기도방 통계('함께 기도한 횟수') 캐시 무효화
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    } catch (error) {
      // 에러 시 롤백 — 순회하며 갱신했던 모든 목록 캐시를 스냅샷으로 복원
      previousListEntries.forEach(([listKey, previousData]) => {
        queryClient.setQueryData(listKey, previousData)
      })
      if (detailQueryKey && previousDetailData) {
        queryClient.setQueryData(detailQueryKey, previousDetailData)
      }
      if (previousProfileData) {
        queryClient.setQueryData(['profile', 'detail'], previousProfileData)
      }
      // 롤백한 캐시 자체가 서버와 어긋나 있을 수 있다(어긋남이 이 에러의
      // 원인일 가능성이 높다) — 서버 진실로 강제 재동기화해서 잘못된
      // is_prayed에 갇히지 않게 한다.
      queryClient.invalidateQueries({ queryKey: prayerKeys.lists() })
      if (detailQueryKey) {
        queryClient.invalidateQueries({ queryKey: detailQueryKey })
      }
      throw error
    }
  }

  return {
    togglePrayer,
    isToggling: addMutation.isPending || removeMutation.isPending,
  }
}
