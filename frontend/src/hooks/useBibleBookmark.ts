import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  upsertBookmark,
  deleteBookmark,
  getBookmark,
  listBookmarks,
  listChapterBookmarks,
  reorderBookmarks,
  getBookmarkStats,
  type UpsertBookmarkPayload,
  type VerseBookmark,
  type HighlightColor,
  type BookmarkDeleteTarget,
} from '../api/bibleBookmark'

export const bookmarkKeys = {
  all: ['bookmark'] as const,
  detail: (verseId: number) => [...bookmarkKeys.all, 'detail', verseId] as const,
  chapter: (bookNumber: number, chapter: number) =>
    [...bookmarkKeys.all, 'chapter', bookNumber, chapter] as const,
  chapters: () => [...bookmarkKeys.all, 'chapter'] as const,
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
 * 한 장의 내 북마크 전체 — VerseList가 한 번 받아 절별로 나눠준다
 * (절마다 개별 요청하는 N+1 제거, useChapterWordNotes와 동일 패턴).
 * 백엔드에 by-chapter 엔드포인트가 아직 없으면(배포 전 404) 쿼리는 에러로 남고,
 * VerseItem이 기존 절별 조회(useVerseBookmark)로 자동 폴백한다.
 */
export const useChapterBookmarks = (
  bookNumber: number,
  chapter: number,
  enabled: boolean = true
) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return useQuery({
    queryKey: bookmarkKeys.chapter(bookNumber, chapter),
    queryFn: () => listChapterBookmarks(bookNumber, chapter),
    enabled: enabled && !!token && bookNumber > 0 && chapter > 0,
    staleTime: 1000 * 60 * 5,
    // 전역 refetchOnMount:false의 예외 — 재진입 시 stale이면 다른 기기/세션의
    // 변경분을 반영한다 (useMyBookmarks와 동일 이유)
    refetchOnMount: true,
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

      // 장 배치 캐시(VerseItem 표시의 소스)에도 즉시 반영 — 이미 있는 절이면 교체.
      // 새 북마크는 어느 장 캐시 소속인지 verse_id만으로 알 수 없으므로
      // 아래 chapters() invalidate의 리페치(활성 쿼리 = 열려 있는 장)가 반영한다.
      queryClient.setQueriesData<VerseBookmark[]>(
        { queryKey: bookmarkKeys.chapters() },
        (old) => {
          if (!old) return old
          const idx = old.findIndex((b) => b.verse_id === verseId)
          if (idx < 0) return old
          const updated = [...old]
          updated[idx] = bookmark
          return updated
        },
      )

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
      // 현재 보고 있는 장의 배치 캐시 갱신 (활성 쿼리만 — 즉시 표시는 detail 캐시가 담당)
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.chapters() })
    },
  })
}

/**
 * 북마크 삭제
 * - mutate(undefined): 통째 삭제 (형광펜·노트·즐겨찾기 전부)
 * - mutate('note') / mutate('favorite'): 해당 필드만 삭제.
 *   서버는 필드만 지운 뒤 남은 표시가 없으면 행 자체를 정리한다.
 */
export const useDeleteBookmark = (verseId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (target?: BookmarkDeleteTarget) => deleteBookmark(verseId, target),
    onSuccess: (_data, target) => {
      const previous = queryClient.getQueryData<VerseBookmark | null>(bookmarkKeys.detail(verseId))

      // 필드만 지웠을 때는 detail 캐시도 필드만 반영하고, 남은 표시가 없으면
      // 서버와 동일하게 행 삭제(null) 취급한다
      let next: VerseBookmark | null = null
      if (target && previous) {
        next = target === 'note' ? { ...previous, note: null } : { ...previous, is_favorite: false }
        const empty =
          !next.highlight_color && !(next.note && next.note.trim().length > 0) && !next.is_favorite
        if (empty) next = null
      }
      queryClient.setQueryData(bookmarkKeys.detail(verseId), next)

      // 장 배치 캐시에도 즉시 반영 — 행 삭제면 제거, 필드만 지웠으면 교체
      const nextRow = next
      queryClient.setQueriesData<VerseBookmark[]>(
        { queryKey: bookmarkKeys.chapters() },
        (old) => {
          if (!old) return old
          if (nextRow === null) return old.filter((b) => b.verse_id !== verseId)
          return old.map((b) => (b.verse_id === verseId ? nextRow : b))
        },
      )

      queryClient.setQueryData(['profile', 'detail'], (old: any) => {
        if (!old) return old
        const bible = old.stats?.bible_reading ?? {}
        const hadNote = !!(previous?.note && previous.note.trim().length > 0)
        const wasFav = !!previous?.is_favorite
        const rowGone = next === null
        const noteCleared = (!target || target === 'note') && hadNote
        const favCleared = (!target || target === 'favorite') && wasFav
        return {
          ...old,
          stats: {
            ...old.stats,
            bible_reading: {
              ...bible,
              bookmarks_count: Math.max(0, (bible.bookmarks_count || 0) - (rowGone ? 1 : 0)),
              notes_count: Math.max(0, (bible.notes_count || 0) - (noteCleared ? 1 : 0)),
              favorites_count: Math.max(0, (bible.favorites_count || 0) - (favCleared ? 1 : 0)),
            },
          },
        }
      })

      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists(), refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.stats() })
      queryClient.invalidateQueries({ queryKey: ['profile', 'detail'] })
      // 현재 보고 있는 장의 배치 캐시 갱신 (활성 쿼리만 — 즉시 표시는 detail 캐시가 담당)
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.chapters() })
    },
  })
}

/**
 * 즐겨찾기 플레이리스트 순서 저장 (드래그 앤 드랍)
 * UI는 로컬 상태로 이미 새 순서를 보여주고 있으므로 optimistic 처리 불필요 —
 * 성공 시 목록 캐시만 동기화한다
 */
export const useReorderBookmarks = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookmarkIds: number[]) => reorderBookmarks(bookmarkIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists(), refetchType: 'all' })
    },
  })
}

/**
 * 북마크 목록 조회
 */
export const useMyBookmarks = (
  params?: {
    favorites_only?: boolean
    notes_only?: boolean
    color?: HighlightColor
    book_number?: number
    page?: number
    page_size?: number
  },
  enabled: boolean = true
) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return useQuery({
    queryKey: bookmarkKeys.list(params),
    queryFn: () => listBookmarks(params),
    enabled: enabled && !!token,
    staleTime: 1000 * 60 * 2,
    // 전역 refetchOnMount:false의 예외. persist 복원만 되고 이 세션에서 아직
    // 마운트된 적 없는 목록 쿼리는 queryFn이 없어 refetchType:'all' 무효화로도
    // 재요청이 조용히 실패한다 — 저장 직후 플레이리스트/프로필을 열면 옛 목록이
    // 그대로 보이는 원인. 마운트 시 stale이면 다시 받아 새 저장분을 반영한다
    // (캐시된 목록은 즉시 보여주고 뒤에서 갱신).
    refetchOnMount: true,
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
    // 목록과 같은 이유(persist 복원 쿼리는 무효화로 재요청 불가) — 마운트 시 갱신
    refetchOnMount: true,
  })
}
