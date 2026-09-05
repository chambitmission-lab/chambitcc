// 새가족 등록 앨범 훅 (Single Responsibility: 새가족 데이터 조회/변경)
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  createNewFamilyComment,
  deleteNewFamilyComment,
  fetchNewFamilyComments,
  fetchNewFamilyPosts,
  fetchNewFamilyStats,
  toggleWelcome,
  updateNewFamilyComment,
} from '../api/newFamily'
import type {
  NewFamilyComment,
  NewFamilyCommentListResponse,
  NewFamilyListResponse,
  NewFamilyPost,
} from '../types/newFamily'
import type { InfiniteData } from '@tanstack/react-query'
import type { MutationFeedback } from './mutationFeedback'

type PostsCache = InfiniteData<NewFamilyListResponse>
type CommentsCache = InfiniteData<NewFamilyCommentListResponse>

const ROOT_KEY = ['new-family']
const POSTS_KEY = ['new-family', 'posts']
const STATS_KEY = ['new-family', 'stats']
const commentsKey = (postId: number) => ['new-family', postId, 'comments']

/** 캐시에 흩어진 포스트를 한 번에 수정하는 헬퍼 (무한 목록 구조 유지) */
const patchPostInCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  postId: number,
  patch: (post: NewFamilyPost) => NewFamilyPost,
) => {
  queryClient.setQueryData<PostsCache>(POSTS_KEY, (old) => {
    if (!old) return old
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        data: {
          ...page.data,
          items: page.data.items.map((p) => (p.id === postId ? patch(p) : p)),
        },
      })),
    }
  })
}

/** 목록·통계 전체 무효화 — 관리자 화면 mutation 뒤 사용 (refetchType:'all'로 비활성 쿼리까지) */
export const invalidateNewFamily = (
  queryClient: ReturnType<typeof useQueryClient>,
) => queryClient.invalidateQueries({ queryKey: ROOT_KEY })

// ── 목록 ─────────────────────────────────────────────
export const useNewFamilyPosts = (limit = 10, enabled = true) => {
  const query = useInfiniteQuery({
    queryKey: POSTS_KEY,
    queryFn: ({ pageParam = 1 }) => fetchNewFamilyPosts(pageParam, limit),
    getNextPageParam: (lastPage) => {
      const { page, limit: pageLimit, items } = lastPage.data
      return items.length === pageLimit ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled,
    staleTime: 1000 * 60 * 2, // 2분 — 관리자 등록/수정/삭제는 invalidateNewFamily로 즉시 무효화된다
    refetchOnMount: true,
  })

  const posts: NewFamilyPost[] = query.data?.pages.flatMap((p) => p.data.items) ?? []
  const total = query.data?.pages[0]?.data.total ?? 0

  return { ...query, posts, total }
}

export const useNewFamilyStats = (enabled = true) =>
  useQuery({
    queryKey: STATS_KEY,
    queryFn: fetchNewFamilyStats,
    enabled,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: true,
  })

// ── 환영 리액션 ───────────────────────────────────────
/**
 * 같은 이모지 재클릭 = 취소, 다른 이모지 = 교체.
 * 낙관적 업데이트로 탭하는 즉시 카운트가 움직인다.
 */
export const useToggleWelcome = (feedback?: MutationFeedback) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ postId, emoji }: { postId: number; emoji: string }) =>
      toggleWelcome(postId, emoji),
    onMutate: async ({ postId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: POSTS_KEY })
      const previous = queryClient.getQueryData(POSTS_KEY)

      patchPostInCache(queryClient, postId, (post) => {
        const breakdown = { ...post.welcome_breakdown }
        const prev = post.my_welcome

        // 이전 선택 해제
        if (prev) {
          breakdown[prev] = Math.max(0, (breakdown[prev] ?? 1) - 1)
          if (breakdown[prev] === 0) delete breakdown[prev]
        }

        const isCancel = prev === emoji
        if (!isCancel) breakdown[emoji] = (breakdown[emoji] ?? 0) + 1

        // 총 카운트: 신규 +1, 취소 -1, 교체는 변화 없음
        let count = post.welcome_count
        if (!prev) count += 1
        else if (isCancel) count = Math.max(0, count - 1)

        return {
          ...post,
          my_welcome: isCancel ? null : emoji,
          welcome_breakdown: breakdown,
          welcome_count: count,
        }
      })

      return { previous }
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(POSTS_KEY, context.previous)
      feedback?.onError?.(error, _vars)
    },
    onSuccess: (response, variables) => {
      // 서버 실제 집계로 정렬 (동시 클릭으로 어긋난 값 교정)
      patchPostInCache(queryClient, variables.postId, (post) => ({
        ...post,
        my_welcome: response.my_welcome,
        welcome_count: response.welcome_count,
        welcome_breakdown: response.welcome_breakdown,
      }))
      feedback?.onSuccess?.(response, variables)
    },
  })

  return { toggleWelcome: mutation.mutate, isToggling: mutation.isPending }
}

// ── 댓글 ─────────────────────────────────────────────
export const useNewFamilyComments = (postId: number, enabled = true, limit = 50) => {
  const query = useInfiniteQuery({
    queryKey: commentsKey(postId),
    queryFn: ({ pageParam = 1 }) => fetchNewFamilyComments(postId, pageParam, limit),
    getNextPageParam: (lastPage) => {
      const { page, limit: pageLimit, items } = lastPage.data
      return items.length === pageLimit ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled,
  })

  const comments: NewFamilyComment[] = query.data?.pages.flatMap((p) => p.data.items) ?? []

  return {
    comments,
    isLoading: query.isLoading,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}

export const useCreateNewFamilyComment = (postId: number, feedback?: MutationFeedback) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (content: string) => createNewFamilyComment(postId, content),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: commentsKey(postId) })
      patchPostInCache(queryClient, postId, (post) => ({
        ...post,
        comment_count: post.comment_count + 1,
      }))
      feedback?.onSuccess?.(response, variables)
    },
    onError: (error: Error, variables) => feedback?.onError?.(error, variables),
  })

  return { createComment: mutation.mutate, isCreating: mutation.isPending }
}

export const useUpdateNewFamilyComment = (postId: number, feedback?: MutationFeedback) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      updateNewFamilyComment(postId, commentId, content),
    onMutate: async ({ commentId, content }) => {
      const key = commentsKey(postId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)

      queryClient.setQueryData<CommentsCache>(key, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              items: page.data.items.map((c) =>
                c.id === commentId ? { ...c, content, is_edited: true } : c,
              ),
            },
          })),
        }
      })

      return { previous }
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(commentsKey(postId), context.previous)
      feedback?.onError?.(error, _vars)
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: commentsKey(postId) })
      feedback?.onSuccess?.(response, variables)
    },
  })

  return { updateComment: mutation.mutate, isUpdating: mutation.isPending }
}

export const useDeleteNewFamilyComment = (postId: number, feedback?: MutationFeedback) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (commentId: number) => deleteNewFamilyComment(postId, commentId),
    onMutate: async (commentId) => {
      const key = commentsKey(postId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)

      queryClient.setQueryData<CommentsCache>(key, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              items: page.data.items.filter((c) => c.id !== commentId),
            },
          })),
        }
      })
      patchPostInCache(queryClient, postId, (post) => ({
        ...post,
        comment_count: Math.max(0, post.comment_count - 1),
      }))

      return { previous }
    },
    onError: (error: Error, _commentId, context) => {
      if (context?.previous) queryClient.setQueryData(commentsKey(postId), context.previous)
      feedback?.onError?.(error, _commentId)
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: commentsKey(postId) })
      feedback?.onSuccess?.(response, variables)
    },
  })

  return { deleteComment: mutation.mutate, isDeleting: mutation.isPending }
}
