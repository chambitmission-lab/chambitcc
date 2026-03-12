import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  markVerseAsRead,
  getReadVerses,
  getChapterReadStatus,
  getReadingProgress,
  getBookReadingProgress,
  unmarkVerseAsRead
} from '../api/bibleReading'

// Query Keys
export const bibleReadingKeys = {
  all: ['bibleReading'] as const,
  readVerses: (params?: {
    book_id?: number
    chapter?: number
    start_date?: string
    end_date?: string
  }) => [...bibleReadingKeys.all, 'readVerses', params] as const,
  chapterStatus: (bookNumber: number, chapter: number) =>
    [...bibleReadingKeys.all, 'chapterStatus', bookNumber, chapter] as const,
  progress: () => [...bibleReadingKeys.all, 'progress'] as const,
  bookProgress: (bookId: number) =>
    [...bibleReadingKeys.all, 'bookProgress', bookId] as const,
}

/**
 * 구절 읽음 처리 Mutation
 */
export const useMarkVerseAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ verseId, similarity }: { verseId: number; similarity: number }) =>
      markVerseAsRead(verseId, similarity),
    onSuccess: () => {
      // 관련된 모든 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: bibleReadingKeys.all })
      
      // 프로필 캐시 즉시 업데이트 (구절 읽기 +1P)
      queryClient.setQueryData(['profile', 'detail'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          stats: {
            ...old.stats,
            bible_reading: {
              verses_read: (old.stats.bible_reading?.verses_read || 0) + 1,
              chapters_read: old.stats.bible_reading?.chapters_read || 0,
              books_completed: old.stats.bible_reading?.books_completed || [],
            },
          },
        }
      })
      
      // 백그라운드에서 실제 데이터로 동기화
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['profile', 'detail'],
        })
      }, 0)
    },
  })
}

/**
 * 읽은 구절 목록 조회
 */
export const useReadVerses = (params?: {
  book_id?: number
  chapter?: number
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}) => {
  return useQuery({
    queryKey: bibleReadingKeys.readVerses(params),
    queryFn: () => getReadVerses(params),
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 특정 장의 읽음 상태 조회
 */
export const useChapterReadStatus = (
  bookNumber: number,
  chapter: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: bibleReadingKeys.chapterStatus(bookNumber, chapter),
    queryFn: () => getChapterReadStatus(bookNumber, chapter),
    enabled: enabled && bookNumber > 0 && chapter > 0,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 전체 읽기 진행률 조회
 */
export const useReadingProgress = () => {
  return useQuery({
    queryKey: bibleReadingKeys.progress(),
    queryFn: () => getReadingProgress(),
    staleTime: 1000 * 60 * 10, // 10분
  })
}

/**
 * 특정 책의 읽기 진행률 조회
 */
export const useBookReadingProgress = (bookId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: bibleReadingKeys.bookProgress(bookId),
    queryFn: () => getBookReadingProgress(bookId),
    enabled: enabled && bookId > 0,
    staleTime: 1000 * 60 * 10, // 10분
  })
}

/**
 * 읽음 취소 Mutation
 */
export const useUnmarkVerseAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (verseId: number) => unmarkVerseAsRead(verseId),
    onSuccess: () => {
      // 관련된 모든 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: bibleReadingKeys.all })
      
      // 프로필 캐시 즉시 업데이트 (구절 읽기 -1P)
      queryClient.setQueryData(['profile', 'detail'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          stats: {
            ...old.stats,
            bible_reading: {
              verses_read: Math.max(0, (old.stats.bible_reading?.verses_read || 0) - 1),
              chapters_read: old.stats.bible_reading?.chapters_read || 0,
              books_completed: old.stats.bible_reading?.books_completed || [],
            },
          },
        }
      })
      
      // 백그라운드에서 실제 데이터로 동기화
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['profile', 'detail'],
        })
      }, 0)
    },
  })
}
