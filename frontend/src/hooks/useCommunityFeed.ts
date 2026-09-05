// 커뮤니티 피드 데이터 관리 커스텀 훅 with React Query
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPosts, createPost, type Post } from '../api/community'
import type { CommunityPostsCache } from '../types/queryCache'
import type { MutationFeedback } from './mutationFeedback'

// Query Keys
export const communityKeys = {
  all: ['community'] as const,
  posts: (sort: string) => [...communityKeys.all, 'posts', sort] as const,
}

export const useCommunityFeed = (initialSort: string = 'latest', feedback?: MutationFeedback) => {
  const queryClient = useQueryClient()

  // 무한 스크롤 쿼리
  const query = useInfiniteQuery({
    queryKey: communityKeys.posts(initialSort),
    queryFn: async ({ pageParam = 1 }) => {
      return await getPosts(pageParam, 10, initialSort)
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.pagination.hasNext 
        ? lastPage.data.pagination.currentPage + 1 
        : undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 3, // 3분간 fresh (커뮤니티는 기도보다 자주 바뀜)
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
  })

  // 게시물 생성 Mutation
  const createMutation = useMutation({
    mutationFn: ({ content, image }: { content: string; image?: string }) => 
      createPost(content, image),
    onMutate: async ({ content, image }) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: communityKeys.posts(initialSort) })

      // 이전 데이터 백업
      const previousData = queryClient.getQueryData(communityKeys.posts(initialSort))

      // Optimistic Update - 임시 게시물 추가
      const tempPost: Post = {
        id: Date.now(), // 임시 ID
        author: {
          id: 0,
          name: '나',
          username: 'me',
          avatar: '',
        },
        content,
        image: image || null,
        createdAt: new Date().toISOString(),
        likes: 0,
        retweets: 0,
        replies: 0,
        isLiked: false,
        isRetweeted: false,
      }

      queryClient.setQueryData<CommunityPostsCache>(communityKeys.posts(initialSort), (old) => {
        if (!old) return old

        const firstPage = old.pages[0]
        return {
          ...old,
          pages: [
            {
              ...firstPage,
              data: {
                ...firstPage.data,
                posts: [tempPost, ...firstPage.data.posts],
              },
            },
            ...old.pages.slice(1),
          ],
        }
      })

      return { previousData }
    },
    onError: (error: Error, _variables, context) => {
      // 에러 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(communityKeys.posts(initialSort), context.previousData)
      }
      feedback?.onError?.(error, _variables)
    },
    onSuccess: (data, variables) => {
      // 모든 sort의 캐시를 무효화 (다른 탭에서도 새 글 반영)
      queryClient.invalidateQueries({ queryKey: communityKeys.all })
      feedback?.onSuccess?.(data, variables)
    },
  })

  // 모든 페이지의 posts를 flat하게 변환
  const posts = query.data?.pages.flatMap(page => page.data.posts) ?? []

  return {
    posts,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    hasMore: query.hasNextPage,
    sort: initialSort,
    loadMore: query.fetchNextPage,
    isFetchingMore: query.isFetchingNextPage,
    addPost: (content: string, image?: string) => 
      createMutation.mutateAsync({ content, image }),
    isCreating: createMutation.isPending,
    refresh: () => queryClient.invalidateQueries({
      queryKey: communityKeys.posts(initialSort)
    }),
  }
}
