// 행사 앨범 훅 (Single Responsibility: 행사 앨범 데이터 조회/변경)
// 새가족 훅(useNewFamily)을 미러링하되, 목록은 연도·태그 필터별로 캐시가 갈라진다.
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  createEventAlbumComment,
  deleteEventAlbumComment,
  fetchEventAlbumComments,
  fetchEventAlbumOnThisDay,
  fetchEventAlbumPosts,
  fetchEventAlbumStats,
  fetchEventAlbumsByEvent,
  toggleEventAlbumReaction,
  updateEventAlbumComment,
  type EventAlbumListFilter,
} from '../api/eventAlbum'
import { showToast } from '../utils/toast'
import type {
  EventAlbumComment,
  EventAlbumCommentListResponse,
  EventAlbumListResponse,
  EventAlbumPost,
} from '../types/eventAlbum'
import type { InfiniteData } from '@tanstack/react-query'

type PostsCache = InfiniteData<EventAlbumListResponse>
type CommentsCache = InfiniteData<EventAlbumCommentListResponse>

const ROOT_KEY = ['event-album']
const POSTS_KEY = ['event-album', 'posts']
const STATS_KEY = ['event-album', 'stats']
const ON_THIS_DAY_KEY = ['event-album', 'on-this-day']
const postsKey = (filter: EventAlbumListFilter) => [
  ...POSTS_KEY,
  { year: filter.year ?? null, tag: filter.tag ?? null },
]
const commentsKey = (postId: number) => ['event-album', postId, 'comments']
export const eventAlbumByEventKey = (eventId: number) => [
  'event-album',
  'by-event',
  eventId,
]

/**
 * 필터별로 갈라진 모든 목록 캐시에서 해당 포스트를 한 번에 수정하는 헬퍼.
 * (연도/태그 조합마다 쿼리가 따로 살아 있어 partial key로 전부 훑는다)
 */
const patchPostInCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  postId: number,
  patch: (post: EventAlbumPost) => EventAlbumPost,
) => {
  queryClient.setQueriesData<PostsCache>({ queryKey: POSTS_KEY }, (old) => {
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

// ── 목록 ─────────────────────────────────────────────
export const useEventAlbumPosts = (
  filter: EventAlbumListFilter = {},
  limit = 10,
  enabled = true,
) => {
  const query = useInfiniteQuery({
    queryKey: postsKey(filter),
    queryFn: ({ pageParam = 1 }) => fetchEventAlbumPosts(pageParam, limit, filter),
    getNextPageParam: (lastPage) => {
      const { page, limit: pageLimit, items } = lastPage.data
      return items.length === pageLimit ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled,
    staleTime: 1000 * 60 * 2, // 2분
    // 전역 refetchOnMount:false(queryClient.ts) + 영속캐시의 예외.
    // 관리자 등록은 react-query 밖(raw fetch)이라 이 캐시를 안 건드린다 →
    // /news 진입/새로고침마다 항상 최신 목록을 다시 받아 새 앨범이 바로 뜨게 한다.
    refetchOnMount: 'always',
  })

  const posts: EventAlbumPost[] = query.data?.pages.flatMap((p) => p.data.items) ?? []
  const total = query.data?.pages[0]?.data.total ?? 0

  return { ...query, posts, total }
}

export const useEventAlbumStats = (enabled = true) =>
  useQuery({
    queryKey: STATS_KEY,
    queryFn: fetchEventAlbumStats,
    enabled,
    staleTime: 1000 * 60 * 2,
    // 목록과 같은 이유 — Hero 통계·연도 칩도 진입 시 최신화
    refetchOnMount: 'always',
  })

/** "N년 전 오늘" 회상 카드 — 결과 없으면 빈 배열 */
export const useEventAlbumOnThisDay = (enabled = true) =>
  useQuery({
    queryKey: ON_THIS_DAY_KEY,
    queryFn: fetchEventAlbumOnThisDay,
    enabled,
    staleTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
  })

/** 일정 상세(/events/:id)에서 연결된 앨범 포스트 조회 */
export const useEventAlbumsByEvent = (eventId: number, enabled = true) =>
  useQuery({
    queryKey: eventAlbumByEventKey(eventId),
    queryFn: () => fetchEventAlbumsByEvent(eventId),
    enabled: enabled && Number.isFinite(eventId) && eventId > 0,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: 'always',
  })

/** 목록·통계 전체 무효화 — 관리자 화면 mutation 뒤 사용 (refetchType:'all'로 비활성 쿼리까지) */
export const invalidateEventAlbum = (
  queryClient: ReturnType<typeof useQueryClient>,
) => queryClient.invalidateQueries({ queryKey: ROOT_KEY, refetchType: 'all' })

// ── 리액션 ───────────────────────────────────────────
/**
 * 같은 이모지 재클릭 = 취소, 다른 이모지 = 교체.
 * 낙관적 업데이트로 탭하는 즉시 카운트가 움직인다. (useToggleWelcome 패턴)
 */
export const useToggleEventAlbumReaction = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ postId, emoji }: { postId: number; emoji: string }) =>
      toggleEventAlbumReaction(postId, emoji),
    onMutate: async ({ postId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: POSTS_KEY })
      // 필터별 쿼리 전부 스냅샷 → 실패 시 그대로 복원
      const previous = queryClient.getQueriesData<PostsCache>({ queryKey: POSTS_KEY })

      patchPostInCache(queryClient, postId, (post) => {
        const breakdown = { ...post.reaction_breakdown }
        const prev = post.my_reaction

        // 이전 선택 해제
        if (prev) {
          breakdown[prev] = Math.max(0, (breakdown[prev] ?? 1) - 1)
          if (breakdown[prev] === 0) delete breakdown[prev]
        }

        const isCancel = prev === emoji
        if (!isCancel) breakdown[emoji] = (breakdown[emoji] ?? 0) + 1

        // 총 카운트: 신규 +1, 취소 -1, 교체는 변화 없음
        let count = post.reaction_count
        if (!prev) count += 1
        else if (isCancel) count = Math.max(0, count - 1)

        return {
          ...post,
          my_reaction: isCancel ? null : emoji,
          reaction_breakdown: breakdown,
          reaction_count: count,
        }
      })

      return { previous }
    },
    onError: (error: Error, _vars, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
      showToast(error.message, 'error')
    },
    onSuccess: (response, { postId }) => {
      // 서버 실제 집계로 정렬 (동시 클릭으로 어긋난 값 교정)
      patchPostInCache(queryClient, postId, (post) => ({
        ...post,
        my_reaction: response.my_reaction,
        reaction_count: response.reaction_count,
        reaction_breakdown: response.reaction_breakdown,
      }))
    },
  })

  return { toggleReaction: mutation.mutate, isToggling: mutation.isPending }
}

// ── 댓글 ─────────────────────────────────────────────
export const useEventAlbumComments = (postId: number, enabled = true, limit = 50) => {
  const query = useInfiniteQuery({
    queryKey: commentsKey(postId),
    queryFn: ({ pageParam = 1 }) => fetchEventAlbumComments(postId, pageParam, limit),
    getNextPageParam: (lastPage) => {
      const { page, limit: pageLimit, items } = lastPage.data
      return items.length === pageLimit ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled,
  })

  const comments: EventAlbumComment[] =
    query.data?.pages.flatMap((p) => p.data.items) ?? []

  return {
    comments,
    isLoading: query.isLoading,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}

export const useCreateEventAlbumComment = (postId: number) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (content: string) => createEventAlbumComment(postId, content),
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

export const useUpdateEventAlbumComment = (postId: number) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      updateEventAlbumComment(postId, commentId, content),
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
      showToast(error.message, 'error')
    },
    onSuccess: (response) => {
      showToast(response.message, 'success')
      queryClient.invalidateQueries({ queryKey: commentsKey(postId) })
    },
  })

  return { updateComment: mutation.mutate, isUpdating: mutation.isPending }
}

export const useDeleteEventAlbumComment = (postId: number) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (commentId: number) => deleteEventAlbumComment(postId, commentId),
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
      showToast(error.message, 'error')
    },
    onSuccess: (response) => {
      showToast(response.message, 'success')
      queryClient.invalidateQueries({ queryKey: commentsKey(postId) })
    },
  })

  return { deleteComment: mutation.mutate, isDeleting: mutation.isPending }
}
