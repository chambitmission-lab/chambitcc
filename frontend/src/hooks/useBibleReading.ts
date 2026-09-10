import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import {
  markVerseAsRead,
  getReadVerses,
  getChapterReadStatus,
  getReadingProgress,
  getBookReadingProgress,
  getResumeReading,
  unmarkVerseAsRead,
  markChapterAsRead,
  unmarkChapterAsRead
} from '../api/bibleReading'
import { scheduleTitleEvaluation } from '../utils/titleUnlockBus'
import type { RequestPriority } from '../api/utils/request'
import type { ProfileDetail } from '../types/profile'
import { profileKeys } from './queryKeys'

// 진행률·이어읽기 신선도. 예전 30초는 /bible 을 열 때마다 두 요청을 다시 보냈는데,
// 읽음·플랜 mutation 이 이미 bibleReadingKeys.all 을 무효화하므로 짧은 staleTime 은
// 소형 컨테이너에서 요청 경쟁만 늘렸다. 선요청(prefetchReadingState)과 반드시 같은 값.
export const READING_STATE_STALE_MS = 1000 * 60 * 5
/** /bible 허브의 책별 이어읽기 마커 개수 — 훅 호출과 선요청의 키가 같아야 한다 */
export const BIBLE_HUB_RESUME_LIMIT = 20

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
  resume: (limit: number) => [...bibleReadingKeys.all, 'resume', limit] as const,
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

      // 성경 칭호 평가 예약(디바운스) — 읽기 세션 끝에 새 칭호 해금 팝업
      scheduleTitleEvaluation()

      // 프로필 캐시 즉시 업데이트 (구절 읽기 +1P)
      queryClient.setQueryData<ProfileDetail>(profileKeys.detail(), (old) => {
        if (!old) return old
        return {
          ...old,
          stats: {
            ...old.stats,
            // 스프레드로 병합 — 필드를 새로 나열하면 books_progress·북마크 카운트 등
            // 여기서 다루지 않는 통계가 재조회 전까지 사라진다
            bible_reading: {
              chapters_read: 0,
              books_completed: [],
              ...old.stats.bible_reading,
              verses_read: (old.stats.bible_reading?.verses_read || 0) + 1,
            },
          },
        }
      })
      
      // 백그라운드에서 실제 데이터로 동기화
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: profileKeys.detail(),
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
    // 전역 refetchOnMount:false(queryClient.ts) 예외 — 읽음 mutation의 invalidate는
    // 비활성 쿼리를 stale 마크만 하므로, true(=stale이면 refetch)가 없으면
    // 다른 장으로 이동했을 때 옛 읽음 표시가 그대로 남는다
    refetchOnMount: true,
  })
}

/**
 * 전체 읽기 진행률 조회
 */
export const useReadingProgress = (
  enabled: boolean = true,
  options?: { priority?: RequestPriority }
) => {
  return useQuery({
    queryKey: bibleReadingKeys.progress(),
    queryFn: () => getReadingProgress(options),
    enabled,
    staleTime: READING_STATE_STALE_MS,
    refetchOnMount: true, // staleTime 지나면 Garden 진입 시 재조회
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
    // 전역 refetchOnMount:false(queryClient.ts) 예외 — 장 선택 시트는 읽는 동안
    // 언마운트 상태라 invalidate가 stale 마크만 남긴다. true가 없으면 시트를
    // 다시 열어도 방금 완독한 장에 ✓가 안 붙는다
    refetchOnMount: true,
  })
}

/**
 * 이어 읽기 위치 조회 (전역 최신 + 책별 마지막)
 */
export const useResumeReading = (
  limit: number = 10,
  enabled: boolean = true,
  options?: { priority?: RequestPriority }
) => {
  return useQuery({
    queryKey: bibleReadingKeys.resume(limit),
    queryFn: () => getResumeReading(limit, options),
    enabled,
    staleTime: READING_STATE_STALE_MS,
  })
}

/**
 * /bible 허브의 진행률 + 이어읽기를 훅과 같은 키·staleTime 으로 미리 받는다
 * (pages/Bible/prefetch — 청크 프리로드·라우트 진입 시점). 로그인 상태에서만 부른다.
 * 'critical' 은 훅과 동일 — 허브가 먼저 마운트돼 게이트가 걸려 있어도 통과한다.
 */
export const prefetchReadingState = (qc: QueryClient): void => {
  void qc.prefetchQuery({
    queryKey: bibleReadingKeys.progress(),
    queryFn: () => getReadingProgress({ priority: 'critical' }),
    staleTime: READING_STATE_STALE_MS,
  })
  void qc.prefetchQuery({
    queryKey: bibleReadingKeys.resume(BIBLE_HUB_RESUME_LIMIT),
    queryFn: () => getResumeReading(BIBLE_HUB_RESUME_LIMIT, { priority: 'critical' }),
    staleTime: READING_STATE_STALE_MS,
  })
}

/**
 * 장 전체 읽음 처리 Mutation (관리자 전용 — 업적 테스트용)
 * 절 수가 많아 낙관적 +1 대신 invalidate로만 동기화한다.
 */
export const useMarkChapterAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookNumber, chapter }: { bookNumber: number; chapter: number }) =>
      markChapterAsRead(bookNumber, chapter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bibleReadingKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() })
      // 일괄 처리 후 칭호 평가는 한 번만 — 개별 절처럼 절마다 부르지 않는다
      scheduleTitleEvaluation()
    },
  })
}

/**
 * 장 전체 읽음 취소 Mutation (관리자 전용 — 일괄 읽음 되돌리기)
 */
export const useUnmarkChapterAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookNumber, chapter }: { bookNumber: number; chapter: number }) =>
      unmarkChapterAsRead(bookNumber, chapter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bibleReadingKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() })
    },
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
      queryClient.setQueryData<ProfileDetail>(profileKeys.detail(), (old) => {
        if (!old) return old
        return {
          ...old,
          stats: {
            ...old.stats,
            bible_reading: {
              chapters_read: 0,
              books_completed: [],
              ...old.stats.bible_reading,
              verses_read: Math.max(0, (old.stats.bible_reading?.verses_read || 0) - 1),
            },
          },
        }
      })
      
      // 백그라운드에서 실제 데이터로 동기화
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: profileKeys.detail(),
        })
      }, 0)
    },
  })
}
