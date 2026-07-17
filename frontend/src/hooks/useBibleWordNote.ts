import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'
import {
  createWordNote,
  updateWordNote,
  deleteWordNote,
  listChapterWordNotes,
  listWordNotes,
  type CreateWordNotePayload,
  type UpdateWordNotePayload,
  type WordNote,
} from '../api/bibleWordNote'

export const wordNoteKeys = {
  all: ['wordNote'] as const,
  // 장 단위 배치 조회 (본문 밑줄 표시용)
  chapter: (bookNumber: number, chapter: number) =>
    [...wordNoteKeys.all, 'chapter', bookNumber, chapter] as const,
  chapters: () => [...wordNoteKeys.all, 'chapter'] as const,
  lists: () => [...wordNoteKeys.all, 'list'] as const,
  list: (q?: string) => [...wordNoteKeys.lists(), q ?? ''] as const,
}

/**
 * 한 장의 내 단어 노트 전체 — VerseList가 한 번 받아 절별로 나눠준다
 * (절마다 개별 요청하지 않음)
 */
export const useChapterWordNotes = (
  bookNumber: number,
  chapter: number,
  enabled: boolean = true
) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return useQuery({
    queryKey: wordNoteKeys.chapter(bookNumber, chapter),
    queryFn: () => listChapterWordNotes(bookNumber, chapter),
    enabled: enabled && !!token && bookNumber > 0 && chapter > 0,
    staleTime: 1000 * 60 * 5,
  })
}

/** 저장/수정/삭제 공통 — 장 캐시와 단어장 목록을 함께 갱신 */
const useInvalidateWordNotes = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: wordNoteKeys.chapters() })
    // 단어장 페이지 목록은 성경 화면에서 저장하는 시점엔 비활성 쿼리라
    // refetchType:'all'이어야 재진입 시 새 데이터가 보인다 (북마크와 동일 패턴)
    queryClient.invalidateQueries({ queryKey: wordNoteKeys.lists(), refetchType: 'all' })
  }
}

export const useCreateWordNote = (verseId: number) => {
  const invalidate = useInvalidateWordNotes()
  return useMutation({
    mutationFn: (payload: CreateWordNotePayload) => createWordNote(verseId, payload),
    onSuccess: invalidate,
  })
}

export const useUpdateWordNote = () => {
  const invalidate = useInvalidateWordNotes()
  return useMutation({
    mutationFn: ({ noteId, payload }: { noteId: number; payload: UpdateWordNotePayload }) =>
      updateWordNote(noteId, payload),
    onSuccess: invalidate,
  })
}

export const useDeleteWordNote = () => {
  const invalidate = useInvalidateWordNotes()
  return useMutation({
    mutationFn: (noteId: number) => deleteWordNote(noteId),
    onSuccess: invalidate,
  })
}

const WORDBOOK_PAGE_SIZE = 30

/** 단어장 페이지 무한 목록 (검색어 포함) */
export const useMyWordNotes = (q?: string, enabled: boolean = true) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return useInfiniteQuery({
    queryKey: wordNoteKeys.list(q),
    queryFn: ({ pageParam }) =>
      listWordNotes({ q, page: pageParam, page_size: WORDBOOK_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.page_size < lastPage.total ? lastPage.page + 1 : undefined,
    enabled: enabled && !!token,
    staleTime: 1000 * 60 * 2,
    // persist 복원 쿼리는 무효화로 재요청되지 않으므로 마운트 시 갱신 (북마크 목록과 동일)
    refetchOnMount: true,
  })
}

/** 절 id → 단어 노트 배열 맵 (VerseList에서 절별 분배용) */
export const groupWordNotesByVerse = (notes: WordNote[] | undefined) => {
  const map = new Map<number, WordNote[]>()
  if (!notes) return map
  for (const n of notes) {
    const arr = map.get(n.verse_id)
    if (arr) arr.push(n)
    else map.set(n.verse_id, [n])
  }
  return map
}
