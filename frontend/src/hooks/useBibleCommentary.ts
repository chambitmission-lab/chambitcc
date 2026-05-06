import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCommentary,
  deleteCommentary,
  listChapterCommentaries,
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
