import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { markVerseAsRead, getChapterReadStatus, getReadingProgress, getBookReadingProgress, getResumeReading, unmarkVerseAsRead, markChapterAsRead, unmarkChapterAsRead } from '../api/bibleReading'
import type { ChapterReadStatusResponse } from '../api/bibleReading'
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

type ChapterStatusData = ChapterReadStatusResponse['data']
const chapterStatusPrefix = [...bibleReadingKeys.all, 'chapterStatus'] as const
const isChapterStatusKey = (key: readonly unknown[]) => key[1] === 'chapterStatus'

/**
 * 절 하나를 읽음/안 읽음으로 바꾼 뒤의 캐시 동기화 — 서버 재조회 없이.
 *
 * 예전엔 bibleReadingKeys.all 을 통째로 무효화해, 절을 꾹 누를 때마다 지금 장 상태(호출부의
 * refetch 까지 2회)·허브 진행률(내 기록 전체 GROUP BY)·이어읽기가 매번 다시 나갔다.
 *  - 장 상태: 그 절이 든 캐시만 직접 고친다 (read_verses·progress 는 백엔드와 같은 공식)
 *  - 나머지(진행률·이어읽기·책 진행률): stale 표시만 — 읽는 동안엔 화면에 없고, 허브로 돌아갈 때
 *    (BibleStudy) 또는 다음 마운트(refetchOnMount)에서 한 번만 받는다
 * 장 상태를 받아오는 중이었다면 그 응답이 고친 값을 덮을 수 있어, 그때만 다시 받는다.
 */
const syncAfterVerseToggle = (
  qc: QueryClient,
  verseId: number,
  record: { similarity: number; read_at: string } | null,
) => {
  qc.setQueriesData<ChapterStatusData>({ queryKey: chapterStatusPrefix }, (old) => {
    // undefined 를 돌려주면 그 캐시는 건드리지 않는다(다른 장)
    if (!old) return undefined
    const idx = old.verses.findIndex((v) => v.verse_id === verseId)
    if (idx < 0) return undefined
    const nextRead = record !== null
    if (old.verses[idx].is_read === nextRead) return undefined
    const verses = old.verses.slice()
    verses[idx] = {
      ...verses[idx],
      is_read: nextRead,
      similarity: record?.similarity ?? null,
      read_at: record?.read_at ?? null,
    }
    const read_verses = Math.max(0, old.read_verses + (nextRead ? 1 : -1))
    const progress = old.total_verses > 0 ? Math.round((read_verses / old.total_verses) * 10000) / 100 : 0
    return { ...old, verses, read_verses, progress }
  })
  if (qc.isFetching({ queryKey: chapterStatusPrefix }) > 0) {
    void qc.invalidateQueries({ queryKey: chapterStatusPrefix })
  }
  void qc.invalidateQueries({
    queryKey: bibleReadingKeys.all,
    predicate: (q) => !isChapterStatusKey(q.queryKey),
    refetchType: 'none',
  })
}

/**
 * 절 읽음 처리/취소가 실패했을 때(이미 읽음 409·기록 없음 404 등) — 캐시가 서버와 어긋났다는 뜻이라
 * 보이는 장 상태만 다시 받는다. 묶음 처리(병합 구간)에서 일부만 이미 읽힌 경우도 여기서 맞춰진다.
 */
const resyncChapterStatus = (qc: QueryClient) => {
  void qc.invalidateQueries({ queryKey: chapterStatusPrefix })
}

/**
 * 구절 읽음 처리 Mutation
 */
export const useMarkVerseAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ verseId, similarity }: { verseId: number; similarity: number }) =>
      markVerseAsRead(verseId, similarity),
    onError: () => resyncChapterStatus(queryClient),
    onSuccess: (record, { verseId }) => {
      syncAfterVerseToggle(queryClient, verseId, { similarity: record.similarity, read_at: record.read_at })

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

/** 장 읽음 상태 신선도 — 훅과 선요청(prefetchChapterReadStatus)이 반드시 같은 값 */
export const CHAPTER_STATUS_STALE_MS = 1000 * 60 * 5

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
    staleTime: CHAPTER_STATUS_STALE_MS,
    // 전역 refetchOnMount:false(queryClient.ts) 예외 — 읽음 mutation의 invalidate는
    // 비활성 쿼리를 stale 마크만 하므로, true(=stale이면 refetch)가 없으면
    // 다른 장으로 이동했을 때 옛 읽음 표시가 그대로 남는다
    refetchOnMount: true,
  })
}

/**
 * 장 읽음 상태를 훅과 같은 키·staleTime 으로 미리 받는다.
 * 본문(prefetchBibleChapter)과 같은 시점에 띄워야 절 번호 색·흐림이 본문과 한 프레임에
 * 그려진다 — 예전엔 VerseList 가 마운트된 뒤에야 요청이 나가 본문이 먼저 밝게 그려졌다가
 * 뒤늦게 읽은 절이 일제히 흐려지며 화면이 툭 바뀌었다. 로그인 상태에서만 부른다.
 */
export const prefetchChapterReadStatus = (qc: QueryClient, bookNumber: number, chapter: number): void => {
  if (!(bookNumber > 0 && chapter > 0)) return
  void qc.prefetchQuery({
    queryKey: bibleReadingKeys.chapterStatus(bookNumber, chapter),
    queryFn: () => getChapterReadStatus(bookNumber, chapter),
    staleTime: CHAPTER_STATUS_STALE_MS,
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
 * 장 일괄 읽음/취소 뒤 — 절이 여럿 바뀌어 캐시를 직접 고치지 않고 그 장 상태만 받아 온다.
 * 진행률·이어읽기는 절 단위와 같이 stale 표시만 (syncAfterVerseToggle 참고)
 */
const syncAfterChapterBulk = (qc: QueryClient, bookNumber: number, chapter: number) => {
  void qc.invalidateQueries({
    queryKey: bibleReadingKeys.all,
    predicate: (q) => !isChapterStatusKey(q.queryKey),
    refetchType: 'none',
  })
  return qc.invalidateQueries({ queryKey: bibleReadingKeys.chapterStatus(bookNumber, chapter) })
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
    onSuccess: (_data, { bookNumber, chapter }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() })
      // 일괄 처리 후 칭호 평가는 한 번만 — 개별 절처럼 절마다 부르지 않는다
      scheduleTitleEvaluation()
      // 반환한 promise 를 mutateAsync 가 기다린다 — 끝나면 이 장 상태가 이미 새 값이다
      return syncAfterChapterBulk(queryClient, bookNumber, chapter)
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
    onSuccess: (_data, { bookNumber, chapter }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() })
      return syncAfterChapterBulk(queryClient, bookNumber, chapter)
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
    onError: () => resyncChapterStatus(queryClient),
    onSuccess: (_data, verseId) => {
      syncAfterVerseToggle(queryClient, verseId, null)
      
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
