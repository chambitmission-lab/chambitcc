import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  upsertBookmark,
  deleteBookmark,
  getBookmark,
  listBookmarks,
  getBookmarkStats,
  type UpsertBookmarkPayload,
  type VerseBookmark,
  type HighlightColor,
} from '../api/bibleBookmark'

export const bookmarkKeys = {
  all: ['bookmark'] as const,
  detail: (verseId: number) => [...bookmarkKeys.all, 'detail', verseId] as const,
  // 무효화용 prefix. list(undefined)는 ['bookmark','list',undefined]가 되어
  // params가 있는 실제 쿼리 키와 부분 매칭이 안 되므로 반드시 이 키로 invalidate할 것
  lists: () => [...bookmarkKeys.all, 'list'] as const,
  list: (params?: object) => [...bookmarkKeys.lists(), params] as const,
  stats: () => [...bookmarkKeys.all, 'stats'] as const,
}

/**
 * 특정 구절 북마크 조회
 */
export const useVerseBookmark = (verseId: number, enabled: boolean = true) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return useQuery({
    queryKey: bookmarkKeys.detail(verseId),
    queryFn: () => getBookmark(verseId),
    enabled: enabled && !!token && verseId > 0,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * 북마크 생성/수정 (upsert)
 * - 프로필 캐시 optimistic 업데이트로 포인트 즉시 반영
 */
export const useUpsertBookmark = (verseId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpsertBookmarkPayload) => upsertBookmark(verseId, payload),
    onSuccess: (bookmark: VerseBookmark, variables) => {
      queryClient.setQueryData(bookmarkKeys.detail(verseId), bookmark)

      const previous = queryClient.getQueryData<VerseBookmark | null>(bookmarkKeys.detail(verseId))
      const wasExisting = previous != null

      queryClient.setQueryData(['profile', 'detail'], (old: any) => {
        if (!old) return old
        const bible = old.stats?.bible_reading ?? {}
        const prevBookmarks = bible.bookmarks_count || 0
        const prevNotes = bible.notes_count || 0
        const prevFavorites = bible.favorites_count || 0

        const hasNote = !!(variables.note && variables.note.trim().length > 0)
        const hadNote = !!(previous?.note && previous.note.trim().length > 0)
        const isFav = !!variables.is_favorite
        const wasFav = !!previous?.is_favorite

        return {
          ...old,
          stats: {
            ...old.stats,
            bible_reading: {
              ...bible,
              bookmarks_count: wasExisting ? prevBookmarks : prevBookmarks + 1,
              notes_count: prevNotes + (hasNote ? 1 : 0) - (hadNote ? 1 : 0),
              favorites_count: prevFavorites + (isFav ? 1 : 0) - (wasFav ? 1 : 0),
            },
          },
        }
      })

      // refetchType:'all' — 프로필의 북마크 목록은 성경 화면에서 저장/삭제하는 시점엔
      // 비활성 쿼리라, 기본값 'active'로는 stale 마크만 되고 전역 refetchOnMount:false
      // (queryClient.ts)와 결합되면 프로필 재진입 시에도 옛 캐시가 그대로 보인다
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists(), refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.stats() })
      queryClient.invalidateQueries({ queryKey: ['profile', 'detail'] })
    },
  })
}

/**
 * 북마크 삭제
 */
export const useDeleteBookmark = (verseId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteBookmark(verseId),
    onSuccess: () => {
      const previous = queryClient.getQueryData<VerseBookmark | null>(bookmarkKeys.detail(verseId))
      queryClient.setQueryData(bookmarkKeys.detail(verseId), null)

      queryClient.setQueryData(['profile', 'detail'], (old: any) => {
        if (!old) return old
        const bible = old.stats?.bible_reading ?? {}
        const hadNote = !!(previous?.note && previous.note.trim().length > 0)
        const wasFav = !!previous?.is_favorite
        return {
          ...old,
          stats: {
            ...old.stats,
            bible_reading: {
              ...bible,
              bookmarks_count: Math.max(0, (bible.bookmarks_count || 0) - 1),
              notes_count: Math.max(0, (bible.notes_count || 0) - (hadNote ? 1 : 0)),
              favorites_count: Math.max(0, (bible.favorites_count || 0) - (wasFav ? 1 : 0)),
            },
          },
        }
      })

      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists(), refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.stats() })
      queryClient.invalidateQueries({ queryKey: ['profile', 'detail'] })
    },
  })
}

/**
 * 북마크 목록 조회
 */
export const useMyBookmarks = (params?: {
  favorites_only?: boolean
  notes_only?: boolean
  color?: HighlightColor
  page?: number
  page_size?: number
}) => {
  return useQuery({
    queryKey: bookmarkKeys.list(params),
    queryFn: () => listBookmarks(params),
    staleTime: 1000 * 60 * 2,
    // 필터(전체/노트/즐겨찾기) 전환 시 이전 목록을 유지해 높이 붕괴로 인한 화면 흔들림 방지
    placeholderData: keepPreviousData,
  })
}

/**
 * 북마크 통계 조회
 */
export const useBookmarkStats = () => {
  return useQuery({
    queryKey: bookmarkKeys.stats(),
    queryFn: () => getBookmarkStats(),
    staleTime: 1000 * 60 * 5,
  })
}
