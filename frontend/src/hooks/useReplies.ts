// 댓글 관련 로직을 담당하는 커스텀 훅 (Single Responsibility)
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchReplies, createReply } from '../api/prayer'
import { showToast } from '../utils/toast'
import type { CreateReplyRequest, Reply } from '../types/prayer'

interface UseRepliesOptions {
  prayerId: number
  limit?: number
}

/**
 * 댓글 목록 조회 훅
 * - 무한 스크롤 지원
 * - 자동 캐싱 및 갱신
 */
export const useReplies = ({ prayerId, limit = 50 }: UseRepliesOptions) => {
  const queryKey = ['prayers', prayerId, 'replies']

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => fetchReplies(prayerId, pageParam, limit),
    getNextPageParam: (lastPage) => {
      const { page, limit } = lastPage.data
      const totalItems = lastPage.data.items.length
      return totalItems === limit ? page + 1 : undefined
    },
    initialPageParam: 1,
  })

  // 모든 페이지의 댓글을 평탄화
  const replies: Reply[] = data?.pages.flatMap((page) => page.data.items) ?? []

  return {
    replies,
    isLoading,
    error: error?.message,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  }
}

interface UseCreateReplyOptions {
  prayerId: number
  onSuccess?: () => void
}

/**
 * 댓글 작성 훅
 * - Optimistic Update로 즉각적인 UI 반응
 * - 자동 캐시 갱신
 */
export const useCreateReply = ({ prayerId, onSuccess }: UseCreateReplyOptions) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateReplyRequest) => createReply(prayerId, data),
    onSuccess: (response) => {
      // 즉시 성공 처리
      showToast(response.message, 'success')
      onSuccess?.()
      
      // 캐시 무효화 (비동기, 백그라운드)
      setTimeout(() => {
        // 댓글 목록 갱신
        queryClient.invalidateQueries({ queryKey: ['prayers', prayerId, 'replies'] })
        
        // 기도 목록의 댓글 수 갱신
        queryClient.invalidateQueries({ queryKey: ['prayers', 'list'] })
        queryClient.invalidateQueries({ queryKey: ['prayers', prayerId] })

        // 프로필 캐시 무효화 (내 댓글 +1)
        queryClient.invalidateQueries({
          queryKey: ['profile', 'detail'],
          refetchType: 'none',
        })
      }, 0)
    },
    onError: (error: Error) => {
      showToast(error.message, 'error')
    },
  })

  return {
    createReply: mutation.mutate,
    isCreating: mutation.isPending,
  }
}
