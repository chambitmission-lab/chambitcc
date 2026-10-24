import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { markVerseAsRead, getChapterReadStatus, getReadingProgress, getBookReadingProgress, getResumeReading, unmarkVerseAsRead, markChapterAsRead, unmarkChapterAsRead, startReadingCycle } from '../api/bibleReading'
import type { ChapterReadStatusResponse } from '../api/bibleReading'
import { scheduleTitleEvaluation } from '../utils/titleUnlockBus'
import { isApiError } from '../api/utils/request'
import type { RequestPriority } from '../api/utils/request'
import type { ProfileDetail } from '../types/profile'
import { profileKeys } from './queryKeys'
import { biblePlanKeys } from './useBiblePlan'

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

/** SSE reading_sync 페이로드 — 백엔드 bible_reading_service._publish_reading_sync */
export interface ReadingSyncEvent {
  book_number: number
  chapter: number
  /** null 이면 그 장 전체(장 일괄 읽음/취소) */
  verse_ids: number[] | null
  is_read: boolean
  read_at: string | null
  similarity: number | null
}

/**
 * 같은 계정의 다른 기기(휴대폰↔PC)에서 읽음이 바뀌었을 때 — 서버 재조회 없이 장 상태 캐시만 고친다.
 * 보낸 기기 자신도 이 이벤트를 받지만 mutation 이 이미 같은 값으로 고쳐 둬서 바뀌는 게 없다(멱등).
 * 그 장 캐시가 없으면(아직 안 연 장) 할 일이 없다 — 열 때 서버에서 받는다.
 */
export const applyReadingSync = (qc: QueryClient, raw: string) => {
  let ev: ReadingSyncEvent
  try {
    ev = JSON.parse(raw)
  } catch {
    return
  }
  if (!(ev?.book_number > 0 && ev.chapter > 0)) return
  const key = bibleReadingKeys.chapterStatus(ev.book_number, ev.chapter)
  const targets = ev.verse_ids ? new Set(ev.verse_ids) : null
  let changed = false
  qc.setQueryData<ChapterStatusData>(key, (old) => {
    if (!old) return old
    let delta = 0
    const verses = old.verses.map((v) => {
      if ((targets && !targets.has(v.verse_id)) || v.is_read === ev.is_read) return v
      delta += ev.is_read ? 1 : -1
      return {
        ...v,
        is_read: ev.is_read,
        similarity: ev.is_read ? ev.similarity : null,
        read_at: ev.is_read ? ev.read_at : null,
      }
    })
    if (delta === 0) return old
    changed = true
    const read_verses = Math.min(old.total_verses, Math.max(0, old.read_verses + delta))
    const progress = old.total_verses > 0 ? Math.round((read_verses / old.total_verses) * 10000) / 100 : 0
    return { ...old, verses, read_verses, progress }
  })
  if (!changed) return
  // 받아오는 중이던 응답이 고친 값을 덮을 수 있다 — 그때만 다시 받는다
  if (qc.isFetching({ queryKey: key }) > 0) void qc.invalidateQueries({ queryKey: key })
  // 진행률·이어읽기·책 진행률은 stale 표시만 — 허브로 돌아갈 때 한 번 받는다
  void qc.invalidateQueries({
    queryKey: bibleReadingKeys.all,
    predicate: (q) => !isChapterStatusKey(q.queryKey),
    refetchType: 'none',
  })
}

/**
 * 새 통독 회차가 시작됐다 — 진행률·장 읽음 표시·이어읽기가 전부 0 기준으로 바뀌므로
 * 고칠 범위를 따지지 않고 읽기 캐시를 통째로 다시 받는다(보이는 것만 즉시, 나머지는 stale 표시).
 * 시작한 기기의 mutation 과 다른 기기의 SSE reading_cycle 이 함께 쓴다.
 */
export const applyReadingCycleStart = (qc: QueryClient) => {
  void qc.invalidateQueries({ queryKey: bibleReadingKeys.all })
  void qc.invalidateQueries({ queryKey: profileKeys.detail() })
  // 플랜 일차 완료 판정도 현재 회차 기준이라 오늘의 읽기·플랜 상세가 옛 완료 표시로 남지 않게
  void qc.invalidateQueries({ queryKey: biblePlanKeys.all })
}

/**
 * SSE 가 끊겨 있던 사이 다른 기기에서 바뀐 읽음은 이벤트로 오지 않는다 — 재연결 때 장 상태만
 * 다시 맞춘다. 보고 있는 장(활성 쿼리)만 재조회되고 나머지는 stale 표시만 된다.
 */
export const resyncReadingAfterReconnect = (qc: QueryClient) => {
  void qc.invalidateQueries({ queryKey: chapterStatusPrefix })
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
 * 창으로 돌아왔을 때 이 시간보다 오래된 장 상태면 staleTime 과 무관하게 다시 받는다.
 * 다른 기기 변경은 SSE reading_sync 가 즉시 고치지만, 이벤트를 놓친 경우(큐 넘침·연결 전)의
 * 안전장치다. 탭을 잠깐 오가는 정도로는 요청이 나가지 않게 1분 간격을 둔다.
 */
const CHAPTER_STATUS_FOCUS_REFETCH_MS = 1000 * 60

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
    // 전역 refetchOnWindowFocus:false 예외 — 휴대폰에서 읽고 PC 탭으로 돌아온 경우.
    // 'always' 여야 staleTime(5분) 안이어도 받는다
    refetchOnWindowFocus: (query) =>
      Date.now() - query.state.dataUpdatedAt > CHAPTER_STATUS_FOCUS_REFETCH_MS ? 'always' : false,
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

/**
 * 다음 통독 회차 시작 Mutation — 완독한 뒤에만 서버가 받아 준다(아니면 409)
 */
export const useStartReadingCycle = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => startReadingCycle(),
    onSuccess: () => applyReadingCycleStart(queryClient),
    // 409 는 서버 기준으로 "지금 회차는 완독 전" — 버튼이 보였다면 다른 기기가 이미 새 회차를
    // 시작했거나(SSE 를 놓침) 읽음 취소가 있었다는 뜻이라, 읽기 캐시를 통째로 다시 맞춘다
    onError: (error) => {
      if (isApiError(error, 409)) applyReadingCycleStart(queryClient)
    },
  })
}
