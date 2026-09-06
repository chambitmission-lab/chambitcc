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
