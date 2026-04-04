// 커뮤니티 게시물 액션(좋아요, 리트윗) 관리 훅 with Optimistic Update
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleLike, toggleRetweet, type Post } from '../api/community'
import { showToast } from '../utils/toast'

interface UseCommunityActionsOptions {
  sort?: string
}

/**
 * 커뮤니티 게시물 액션 훅
 * - Optimistic Update로 즉각적인 UI 반응
 * - 에러 시 자동 롤백
 * - 자동 캐시 갱신
 */
export const useCommunityActions = ({ sort = 'latest' }: UseCommunityActionsOptions = {}) => {
  const queryClient = useQueryClient()

  // 좋아요 토글 Mutation
  const likeMutation = useMutation({
    mutationFn: (postId: number) => toggleLike(postId),
    onMutate: async (postId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['community', 'posts', sort] })

      // 이전 데이터 백업
      const previousData = queryClient.getQueryData(['community', 'posts', sort])

      // Optimistic Update
      queryClient.setQueryData(['community', 'posts', sort], (old: any) => {
        if (!old) return old

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: {
              ...page.data,
              posts: page.data.posts.map((post: Post) =>
                post.id === postId
                  ? {
                      ...post,
                      isLiked: !post.isLiked,
                      likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                    }
                  : post
              ),
            },
          })),
        }
      })

      return { previousData }
    },
    onError: (error: any, _postId, context) => {
      // 에러 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(['community', 'posts', sort], context.previousData)
      }

      // 에러 메시지 표시
      const errorMsg = error.response?.data?.detail || error.message
      if (errorMsg?.includes('already liked')) {
        showToast('이미 좋아요를 누르셨습니다.', 'info')
      } else if (error.response?.status === 401) {
        showToast('로그인이 필요합니다.', 'error')
      } else {
        showToast('좋아요 처리 중 오류가 발생했습니다.', 'error')
      }
    },
    onSuccess: (data) => {
      showToast(data.message || '좋아요!', 'success')
    },
  })

  // 리트윗 토글 Mutation
  const retweetMutation = useMutation({
    mutationFn: (postId: number) => toggleRetweet(postId),
    onMutate: async (postId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['community', 'posts', sort] })

      // 이전 데이터 백업
      const previousData = queryClient.getQueryData(['community', 'posts', sort])

      // Optimistic Update
      queryClient.setQueryData(['community', 'posts', sort], (old: any) => {
        if (!old) return old

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: {
              ...page.data,
              posts: page.data.posts.map((post: Post) =>
                post.id === postId
                  ? {
                      ...post,
                      isRetweeted: !post.isRetweeted,
                      retweets: post.isRetweeted ? post.retweets - 1 : post.retweets + 1,
                    }
                  : post
              ),
            },
          })),
        }
      })

      return { previousData }
    },
    onError: (error: any, _postId, context) => {
      // 에러 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(['community', 'posts', sort], context.previousData)
      }

      // 에러 메시지 표시
      const errorMsg = error.response?.data?.detail || error.message
      if (errorMsg?.includes('already')) {
        showToast('이미 리트윗하셨습니다.', 'info')
      } else if (error.response?.status === 401) {
        showToast('로그인이 필요합니다.', 'error')
      } else {
        showToast('리트윗 처리 중 오류가 발생했습니다.', 'error')
      }
    },
    onSuccess: (data) => {
      showToast(data.message || '리트윗 완료!', 'success')
    },
  })

  return {
    handleLike: likeMutation.mutate,
    handleRetweet: retweetMutation.mutate,
    isProcessing: likeMutation.isPending || retweetMutation.isPending,
  }
}
