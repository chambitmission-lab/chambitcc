// 커뮤니티 게시물 액션(좋아요, 리트윗) 관리 훅 with Optimistic Update
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleLike, toggleRetweet } from '../api/community'
import type { MutationFeedback } from './mutationFeedback'
import type { CommunityPostsCache } from '../types/queryCache'
import { communityKeys } from './useCommunityFeed'

interface UseCommunityActionsOptions {
  /** 화면 피드백 — 훅은 캐시만 다루고 문구는 호출부가 정한다 */
  feedback?: { like?: MutationFeedback<{ message?: string }, number>; retweet?: MutationFeedback<{ message?: string }, number> }
  sort?: string
}

/**
 * 커뮤니티 게시물 액션 훅
 * - Optimistic Update로 즉각적인 UI 반응
 * - 에러 시 자동 롤백
 * - 자동 캐시 갱신
 */
export const useCommunityActions = ({ sort = 'latest', feedback }: UseCommunityActionsOptions = {}) => {
  const queryClient = useQueryClient()

  // 좋아요 토글 Mutation
  const likeMutation = useMutation({
    mutationFn: (postId: number) => toggleLike(postId),
    onMutate: async (postId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: communityKeys.posts(sort) })

      // 이전 데이터 백업
      const previousData = queryClient.getQueryData(communityKeys.posts(sort))

      // Optimistic Update
      queryClient.setQueryData<CommunityPostsCache>(communityKeys.posts(sort), (old) => {
        if (!old) return old

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              posts: page.data.posts.map((post) =>
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
    onError: (error: Error, _postId, context) => {
      // 에러 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(communityKeys.posts(sort), context.previousData)
      }

      feedback?.like?.onError?.(error, _postId)
    },
    onSuccess: (data, postId) => {
      feedback?.like?.onSuccess?.(data, postId)
    },
  })

  // 리트윗 토글 Mutation
  const retweetMutation = useMutation({
    mutationFn: (postId: number) => toggleRetweet(postId),
    onMutate: async (postId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: communityKeys.posts(sort) })

      // 이전 데이터 백업
      const previousData = queryClient.getQueryData(communityKeys.posts(sort))

      // Optimistic Update
      queryClient.setQueryData<CommunityPostsCache>(communityKeys.posts(sort), (old) => {
        if (!old) return old

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              posts: page.data.posts.map((post) =>
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
    onError: (error: Error, _postId, context) => {
      // 에러 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(communityKeys.posts(sort), context.previousData)
      }

      feedback?.retweet?.onError?.(error, _postId)
    },
    onSuccess: (data, postId) => {
      feedback?.retweet?.onSuccess?.(data, postId)
    },
  })

  return {
    handleLike: likeMutation.mutate,
    handleRetweet: retweetMutation.mutate,
    isProcessing: likeMutation.isPending || retweetMutation.isPending,
  }
}
