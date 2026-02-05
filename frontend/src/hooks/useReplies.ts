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
    onMutate: async (data) => {
      // 진행 중인 쿼리 취소
      const repliesQueryKey = ['prayers', prayerId, 'replies']
      await queryClient.cancelQueries({ queryKey: repliesQueryKey })

      // 이전 데이터 백업
      const previousReplies = queryClient.getQueryData(repliesQueryKey)

      // Optimistic Update - 임시 댓글 추가
      const tempReply: Reply = {
        id: Date.now(), // 임시 ID
        display_name: data.display_name || '익명',
        content: data.content,
        created_at: new Date().toISOString(),
        time_ago: '방금 전',
      }

      queryClient.setQueryData(repliesQueryKey, (old: any) => {
        if (!old) return old

        const firstPage = old.pages[0]
        return {
          ...old,
          pages: [
            {
              ...firstPage,
              data: {
                ...firstPage.data,
                items: [tempReply, ...firstPage.data.items],
              },
            },
            ...old.pages.slice(1),
          ],
        }
      })

      // 기도 상세의 댓글 수 증가 (Optimistic)
      queryClient.setQueryData(['prayers', 'detail', prayerId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          reply_count: (old.reply_count || 0) + 1,
        }
      })

      return { previousReplies }
    },
    onError: (error: Error, _variables, context) => {
      // 에러 시 롤백
      if (context?.previousReplies) {
        queryClient.setQueryData(['prayers', prayerId, 'replies'], context.previousReplies)
      }
      showToast(error.message, 'error')
    },
    onSuccess: (response) => {
      // 즉시 성공 처리
      showToast(response.message, 'success')
      onSuccess?.()
      
      // 실제 데이터로 갱신
      queryClient.invalidateQueries({ queryKey: ['prayers', prayerId, 'replies'] })
      
      // 캐시 무효화 (비동기, 백그라운드)
      setTimeout(() => {
        // 기도 목록의 댓글 수 갱신
        queryClient.invalidateQueries({ queryKey: ['prayers', 'list'] })
        queryClient.invalidateQueries({ queryKey: ['prayers', 'detail', prayerId] })

        // 프로필 캐시 무효화 (내 댓글 +1)
        queryClient.invalidateQueries({
          queryKey: ['profile', 'detail'],
          refetchType: 'none',
        })
      }, 0)
    },
  })

  return {
    createReply: mutation.mutate,
    isCreating: mutation.isPending,
  }
}
