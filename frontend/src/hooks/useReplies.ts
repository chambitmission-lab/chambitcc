// 댓글 관련 로직을 담당하는 커스텀 훅 (Single Responsibility)
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchReplies, createReply, updateReply, deleteReply } from '../api/prayer'
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
      // 익명이 아니면 프로필 사진도 미리 반영 (재조회 후 아바타가 바뀌는 깜빡임 방지)
      const isAnonReply =
        !data.display_name || data.display_name === '익명' || data.display_name === 'Anonymous'
      const cachedProfile: any = queryClient.getQueryData(['profile', 'detail'])
      const tempReply: Reply = {
        id: Date.now(), // 임시 ID
        display_name: data.display_name || '익명',
        content: data.content,
        created_at: new Date().toISOString(),
        time_ago: '방금 전',
        avatar_url: isAnonReply ? null : cachedProfile?.stats?.avatar_url ?? null,
      }

      // 서버가 오래된 순으로 내려주므로 임시 댓글도 마지막 페이지 끝에 붙인다
      // (맨 앞에 넣으면 재조회 시 맨 아래로 점프해 새로고침처럼 보인다)
      queryClient.setQueryData(repliesQueryKey, (old: any) => {
        if (!old) return old

        const lastIndex = old.pages.length - 1
        return {
          ...old,
          pages: old.pages.map((page: any, i: number) =>
            i === lastIndex
              ? {
                  ...page,
                  data: {
                    ...page.data,
                    items: [...page.data.items, tempReply],
                  },
                }
              : page
          ),
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

      // 프로필 댓글 수 증가 (Optimistic) - 포인트 즉시 반영
      queryClient.setQueryData(['profile', 'detail'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          stats: {
            ...old.stats,
            content: {
              ...old.stats.content,
              my_replies: (old.stats.content.my_replies || 0) + 1,
            },
          },
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

        // 프로필 캐시 무효화 및 자동 갱신 (내 댓글 +1, 포인트 +3)
        // 'profile' 전체 — 프로필 탭 무한 목록(my-replies 등)도 stale 처리
        queryClient.invalidateQueries({
          queryKey: ['profile'],
        })
      }, 0)
    },
  })

  return {
    createReply: mutation.mutate,
    isCreating: mutation.isPending,
  }
}

interface UseUpdateReplyOptions {
  prayerId: number
  onSuccess?: () => void
}

/**
 * 댓글 수정 훅 (본인 댓글만)
 * - Optimistic Update로 즉각적인 UI 반응, 실패 시 롤백
 */
export const useUpdateReply = ({ prayerId, onSuccess }: UseUpdateReplyOptions) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ replyId, content }: { replyId: number; content: string }) =>
      updateReply(prayerId, replyId, { content }),
    onMutate: async ({ replyId, content }) => {
      const repliesQueryKey = ['prayers', prayerId, 'replies']
      await queryClient.cancelQueries({ queryKey: repliesQueryKey })

      const previousReplies = queryClient.getQueryData(repliesQueryKey)

      // Optimistic Update - 해당 댓글 내용 즉시 교체 + 수정됨 표시
      queryClient.setQueryData(repliesQueryKey, (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: {
              ...page.data,
              items: page.data.items.map((item: Reply) =>
                item.id === replyId ? { ...item, content, is_edited: true } : item
              ),
            },
          })),
        }
      })

      return { previousReplies }
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousReplies) {
        queryClient.setQueryData(['prayers', prayerId, 'replies'], context.previousReplies)
      }
      showToast(error.message, 'error')
    },
    onSuccess: (response) => {
      showToast(response.message, 'success')
      onSuccess?.()
      queryClient.invalidateQueries({ queryKey: ['prayers', prayerId, 'replies'] })
      // 프로필 탭 '내 댓글' 목록에도 수정된 본문이 반영되도록
      queryClient.invalidateQueries({ queryKey: ['profile'], refetchType: 'none' })
    },
  })

  return {
    updateReply: mutation.mutate,
    isUpdating: mutation.isPending,
  }
}

interface UseDeleteReplyOptions {
  prayerId: number
  onSuccess?: () => void
}

/**
 * 댓글 삭제 훅 (본인 댓글만)
 * - Optimistic Update로 목록에서 즉시 제거, 실패 시 롤백
 */
export const useDeleteReply = ({ prayerId, onSuccess }: UseDeleteReplyOptions) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (replyId: number) => deleteReply(prayerId, replyId),
    onMutate: async (replyId) => {
      const repliesQueryKey = ['prayers', prayerId, 'replies']
      await queryClient.cancelQueries({ queryKey: repliesQueryKey })

      const previousReplies = queryClient.getQueryData(repliesQueryKey)
      const previousDetail = queryClient.getQueryData(['prayers', 'detail', prayerId])

      // Optimistic Update - 목록에서 즉시 제거
      queryClient.setQueryData(repliesQueryKey, (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: {
              ...page.data,
              items: page.data.items.filter((item: Reply) => item.id !== replyId),
            },
          })),
        }
      })

      // 기도 상세의 댓글 수 감소 (Optimistic)
      queryClient.setQueryData(['prayers', 'detail', prayerId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          reply_count: Math.max((old.reply_count || 0) - 1, 0),
        }
      })

      return { previousReplies, previousDetail }
    },
    onError: (error: Error, _replyId, context) => {
      if (context?.previousReplies) {
        queryClient.setQueryData(['prayers', prayerId, 'replies'], context.previousReplies)
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(['prayers', 'detail', prayerId], context.previousDetail)
      }
      showToast(error.message, 'error')
    },
    onSuccess: (response) => {
      showToast(response.message, 'success')
      onSuccess?.()

      queryClient.invalidateQueries({ queryKey: ['prayers', prayerId, 'replies'] })

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['prayers', 'list'] })
        queryClient.invalidateQueries({ queryKey: ['prayers', 'detail', prayerId] })
        // 'profile' 전체 — 프로필 탭 무한 목록(my-replies 등)도 stale 처리
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      }, 0)
    },
  })

  return {
    deleteReply: mutation.mutate,
    isDeleting: mutation.isPending,
  }
}
