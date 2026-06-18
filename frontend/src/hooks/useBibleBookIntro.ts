import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteBookIntro,
  getBookIntro,
  upsertBookIntro,
} from '../api/bibleBookIntro'
import type { BibleBookIntroUpsertRequest } from '../types/bibleBookIntro'

const keys = {
  all: ['bibleBookIntro'] as const,
  book: (book: number) => [...keys.all, 'book', book] as const,
}

export const useBookIntro = (bookNumber: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: keys.book(bookNumber),
    queryFn: () => getBookIntro(bookNumber),
    enabled: enabled && bookNumber > 0,
    staleTime: 1000 * 60 * 10, // 10분 — 자주 바뀌지 않음
  })
}

export const useUpsertBookIntro = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      bookNumber: number
      payload: BibleBookIntroUpsertRequest
    }) => upsertBookIntro(params.bookNumber, params.payload),
    onSuccess: (intro) => {
      queryClient.setQueryData(keys.book(intro.book_number), intro)
      queryClient.invalidateQueries({ queryKey: keys.book(intro.book_number) })
    },
  })
}

export const useDeleteBookIntro = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (bookNumber: number) =>
      deleteBookIntro(bookNumber).then(() => bookNumber),
    onSuccess: (bookNumber) => {
      queryClient.setQueryData(keys.book(bookNumber), null)
      queryClient.invalidateQueries({ queryKey: keys.book(bookNumber) })
    },
  })
}
