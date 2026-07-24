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
import { showToast } from '../utils/toast'
import type {
  NewFamilyComment,
  NewFamilyListResponse,
  NewFamilyPost,
} from '../types/newFamily'

const POSTS_KEY = ['new-family', 'posts']
const STATS_KEY = ['new-family', 'stats']
const commentsKey = (postId: number) => ['new-family', postId, 'comments']

/** 캐시에 흩어진 포스트를 한 번에 수정하는 헬퍼 (무한 목록 구조 유지) */
const patchPostInCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  postId: number,
  patch: (post: NewFamilyPost) => NewFamilyPost,
) => {
  queryClient.setQueryData(POSTS_KEY, (old: any) => {
    if (!old) return old
    return {
      ...old,
      pages: old.pages.map((page: NewFamilyListResponse) => ({
        ...page,
        data: {
          ...page.data,
          items: page.data.items.map((p) => (p.id === postId ? patch(p) : p)),
        },
      })),
    }
  })
}

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
    staleTime: 1000 * 60 * 2, // 2분
    // 전역 refetchOnMount:false(queryClient.ts) + 영속캐시의 예외.
    // 관리자 등록은 react-query 밖(raw fetch)이라 이 캐시를 안 건드린다 →
    // /news 진입/새로고침마다 항상 최신 목록을 다시 받아 새 새가족이 바로 뜨게 한다.
    refetchOnMount: 'always',
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
    // 목록과 같은 이유 — Hero 통계(이번 달/올해/전체)도 진입 시 최신화
    refetchOnMount: 'always',
  })

// ── 환영 리액션 ───────────────────────────────────────
/**
 * 같은 이모지 재클릭 = 취소, 다른 이모지 = 교체.
 * 낙관적 업데이트로 탭하는 즉시 카운트가 움직인다.
 */
export const useToggleWelcome = () => {
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
      showToast(error.message, 'error')
    },
    onSuccess: (response, { postId }) => {
      // 서버 실제 집계로 정렬 (동시 클릭으로 어긋난 값 교정)
      patchPostInCache(queryClient, postId, (post) => ({
        ...post,
        my_welcome: response.my_welcome,
        welcome_count: response.welcome_count,
        welcome_breakdown: response.welcome_breakdown,
      }))
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

export const useCreateNewFamilyComment = (postId: number) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (content: string) => createNewFamilyComment(postId, content),
    onSuccess: (response) => {
      showToast(response.message, 'success')
      queryClient.invalidateQueries({ queryKey: commentsKey(postId) })
      patchPostInCache(queryClient, postId, (post) => ({
        ...post,
        comment_count: post.comment_count + 1,
      }))
    },
    onError: (error: Error) => showToast(error.message, 'error'),
  })

  return { createComment: mutation.mutate, isCreating: mutation.isPending }
}

export const useUpdateNewFamilyComment = (postId: number) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      updateNewFamilyComment(postId, commentId, content),
    onMutate: async ({ commentId, content }) => {
      const key = commentsKey(postId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)

      queryClient.setQueryData(key, (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: {
              ...page.data,
              items: page.data.items.map((c: NewFamilyComment) =>
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
      showToast(error.message, 'error')
    },
    onSuccess: (response) => {
      showToast(response.message, 'success')
      queryClient.invalidateQueries({ queryKey: commentsKey(postId) })
    },
  })

  return { updateComment: mutation.mutate, isUpdating: mutation.isPending }
}

export const useDeleteNewFamilyComment = (postId: number) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (commentId: number) => deleteNewFamilyComment(postId, commentId),
    onMutate: async (commentId) => {
      const key = commentsKey(postId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)

      queryClient.setQueryData(key, (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: {
              ...page.data,
              items: page.data.items.filter((c: NewFamilyComment) => c.id !== commentId),
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
      showToast(error.message, 'error')
    },
    onSuccess: (response) => {
      showToast(response.message, 'success')
      queryClient.invalidateQueries({ queryKey: commentsKey(postId) })
    },
  })

  return { deleteComment: mutation.mutate, isDeleting: mutation.isPending }
}
