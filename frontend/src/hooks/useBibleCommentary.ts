import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCommentary,
  deleteCommentary,
  listChapterCommentaries,
  listChapterCommentarySummaries,
  listVerseCommentaries,
  updateCommentary,
} from '../api/bibleCommentary'
import type {
  BibleCommentaryCreateRequest,
  BibleCommentaryUpdateRequest,
} from '../types/bibleCommentary'

const keys = {
  all: ['bibleCommentary'] as const,
  chapter: (book: number, chapter: number) =>
    [...keys.all, 'chapter', book, chapter] as const,
  chapterSummary: (book: number, chapter: number) =>
    [...keys.all, 'chapter-summary', book, chapter] as const,
  verse: (book: number, chapter: number, verse: number) =>
    [...keys.all, 'verse', book, chapter, verse] as const,
}

export const useChapterCommentaries = (
  bookNumber: number,
  chapter: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: keys.chapter(bookNumber, chapter),
    queryFn: () => listChapterCommentaries(bookNumber, chapter),
    enabled: enabled && bookNumber > 0 && chapter > 0,
    staleTime: 60_000,
  })
}

/** 읽기 화면용 — 절별 '해석 있음' 마커와 패널 버튼 노출에만 쓴다 (본문 없음, 장당 수백 B) */
export const useChapterCommentarySummaries = (
  bookNumber: number,
  chapter: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: keys.chapterSummary(bookNumber, chapter),
    queryFn: () => listChapterCommentarySummaries(bookNumber, chapter),
    enabled: enabled && bookNumber > 0 && chapter > 0,
    staleTime: 60_000,
  })
}

/**
 * 해석 패널을 열기 전에 장 해석 본문을 미리 받아 둔다.
 * 읽기 화면은 요약(마커용)만 갖고 있어서, "해석 보기"를 누른 뒤에야 본문을 요청하느라
 * 청크 왕복 + API 왕복이 직렬로 겹쳐 한 박자 늦게 떴다. 요약에 해석이 있는 장에서만 부른다.
 */
export const usePrefetchChapterCommentaries = (
  bookNumber: number,
  chapter: number,
  enabled: boolean,
) => {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!enabled || bookNumber <= 0 || chapter <= 0) return
    const run = () => {
      void queryClient.prefetchQuery({
        queryKey: keys.chapter(bookNumber, chapter),
        queryFn: () => listChapterCommentaries(bookNumber, chapter),
        staleTime: 60_000,
      })
    }
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 2500 })
      return () => w.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(run, 1200)
    return () => window.clearTimeout(id)
  }, [queryClient, bookNumber, chapter, enabled])
}

export const useVerseCommentaries = (
  bookNumber: number,
  chapter: number,
  verse: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: keys.verse(bookNumber, chapter, verse),
    queryFn: () => listVerseCommentaries(bookNumber, chapter, verse),
    enabled: enabled && bookNumber > 0 && chapter > 0 && verse > 0,
    staleTime: 60_000,
  })
}

const invalidateForCommentary = (
  queryClient: ReturnType<typeof useQueryClient>,
  bookNumber: number,
  chapter: number,
) => {
  queryClient.invalidateQueries({ queryKey: keys.chapter(bookNumber, chapter) })
  queryClient.invalidateQueries({ queryKey: keys.chapterSummary(bookNumber, chapter) })
  queryClient.invalidateQueries({ queryKey: [...keys.all, 'verse', bookNumber, chapter] })
}

export const useCreateCommentary = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BibleCommentaryCreateRequest) => createCommentary(payload),
    onSuccess: (commentary) => {
      invalidateForCommentary(queryClient, commentary.book_number, commentary.chapter)
    },
  })
}

export const useUpdateCommentary = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: number; payload: BibleCommentaryUpdateRequest }) =>
      updateCommentary(params.id, params.payload),
    onSuccess: (commentary) => {
      invalidateForCommentary(queryClient, commentary.book_number, commentary.chapter)
    },
  })
}

export const useDeleteCommentary = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: number; bookNumber: number; chapter: number }) =>
      deleteCommentary(params.id).then(() => params),
    onSuccess: (params) => {
      invalidateForCommentary(queryClient, params.bookNumber, params.chapter)
    },
  })
}
