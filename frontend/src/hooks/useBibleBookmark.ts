import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  list: (params?: object) => [...bookmarkKeys.all, 'list', params] as const,
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

      queryClient.invalidateQueries({ queryKey: bookmarkKeys.list() })
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

      queryClient.invalidateQueries({ queryKey: bookmarkKeys.list() })
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
