import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  getBookTyping,
  getChapterTyping,
  getChurchBible,
  getTypingCalendar,
  getTypingDaily,
  getTypingHome,
  getTypingRelays,
  getTypingStats,
  getTypingWeekly,
  submitTypingRecord,
  updateTypingGoal,
  getMannaSummary,
  type TypingHomeBundle,
  type TypingRecordInput,
  type TypingStats,
} from '../../api/bibleTyping'
import { getBibleVerse } from '../../api/bible'
import { isApiError } from '../../api/utils/request'
import { bibleReadingKeys } from '../useBibleReading'
import { profileKeys } from '../queryKeys'
import { companionKeys } from '../useCompanion'
import { scheduleTitleEvaluation } from '../../utils/titleUnlockBus'
import { bibleTypingKeys } from './keys'
import { TYPING_HOME_STALE, loggedIn } from './shared'

/**
 * 필사 허브 묶음 — 통계·달력·오늘의 한 절·교회 성경·릴레이·이어 쓸 절 본문을 요청 하나로.
 * 허브가 요청 8개를 한꺼번에 보내면 홈에서 넘어올 때 홈의 요청 10여 개 뒤에 줄을 서서
 * 카드마다 3초 넘게 비어 있었다(백엔드 소형 컨테이너는 동시 요청을 거의 순서대로 처리한다).
 * 받은 조각은 단건 키에도 심어 두어 세션·스프린트·오늘의 한 절 화면의 단건 훅이 다시 받지 않게 한다.
 */
/** 허브 묶음 한 번 받기 — 조각 캐시(통계·달력·오늘의 한 절·교회 성경·릴레이)에도 심는다 */
const fetchTypingHome = async (qc: QueryClient): Promise<TypingHomeBundle> => {
  const bundle = await getTypingHome().catch(async (error: unknown) => {
    // 묶음 엔드포인트가 아직 배포되지 않은 백엔드(404)면 조각별 요청으로 돌아간다 — 배포 순서가 어긋나도 허브가 비지 않게
    if (!isApiError(error, 404)) throw error
    const [stats, calendar, daily, church_bible, relays] = await Promise.all([
      getTypingStats(),
      getTypingCalendar(182),
      getTypingDaily(),
      getChurchBible(),
      getTypingRelays(),
    ])
    const bundle: TypingHomeBundle = { stats, calendar, daily, church_bible, relays, next_verse_text: null }
    const next = stats.next_position
    if (next) {
      bundle.next_verse_text = await getBibleVerse(next.book_number, next.chapter, next.verse)
        .then((v) => v.text ?? null)
        .catch(() => null)
    }
    return bundle
  })
  qc.setQueryData(bibleTypingKeys.stats(), bundle.stats)
  qc.setQueryData(bibleTypingKeys.calendar(), bundle.calendar)
  qc.setQueryData(bibleTypingKeys.daily(), bundle.daily)
  qc.setQueryData(bibleTypingKeys.churchBible(), bundle.church_bible)
  qc.setQueryData(bibleTypingKeys.relays(), bundle.relays)
  return bundle
}

/**
 * 허브 묶음 선요청 — 두 시점에서 부른다(키·staleTime 은 useTypingHome 과 같아 진입 시 캐시를 그대로 이어받는다).
 *   1. 청크 프리로드(routePreload.routeDataPrefetchers): 메뉴 호버·허브 타일 pointerdown. coldOnly 로 캐시가 없을 때만
 *   2. 라우트 진입(RouteDataPrefetch): Suspense 바깥이라 청크 다운로드와 나란히 — 예전엔 청크가 도착해 허브가
 *      마운트된 뒤에야 묶음 요청이 출발해 청크 왕복 + API 왕복이 직렬이었다
 * 만나 입구 한 줄(오늘 순위)도 작아서 같이 띄운다. 비로그인은 훅도 꺼져 있으니 아무것도 하지 않는다.
 */
export const prefetchTypingHome = (qc: QueryClient, coldOnly = false): void => {
  if (!loggedIn()) return
  void qc.prefetchQuery({
    queryKey: bibleTypingKeys.home(),
    queryFn: () => fetchTypingHome(qc),
    staleTime: coldOnly ? Infinity : TYPING_HOME_STALE,
  })
  void qc.prefetchQuery({
    queryKey: bibleTypingKeys.mannaSummary(),
    queryFn: getMannaSummary,
    staleTime: coldOnly ? Infinity : TYPING_HOME_STALE,
  })
}

export const useTypingHome = () => {
  const qc = useQueryClient()
  return useQuery({
    queryKey: bibleTypingKeys.home(),
    queryFn: () => fetchTypingHome(qc),
    enabled: loggedIn(),
    staleTime: TYPING_HOME_STALE,
  })
}

/** 내 필사 통계 — 필사 세션의 기록은 useSubmitTyping 이 bibleTypingKeys.all 을 무효화해 허브에 바로 반영되므로
 *  마운트마다 강제 재조회하지 않는다(허브 재진입·뒤로가기마다 3요청이 나가던 것). 30초 지나면 stale 재조회 */
export const useTypingStats = () =>
  useQuery({
    queryKey: bibleTypingKeys.stats(),
    queryFn: getTypingStats,
    enabled: loggedIn(),
    staleTime: 1000 * 30,
  })

/** 이 장에서 필사를 마친 절 id */
export const useChapterTyping = (bookNumber: number, chapter: number) =>
  useQuery({
    queryKey: bibleTypingKeys.chapter(bookNumber, chapter),
    queryFn: () => getChapterTyping(bookNumber, chapter),
    enabled: loggedIn() && bookNumber > 0 && chapter > 0,
    staleTime: 1000 * 30,
  })

/** 이 책의 장별 필사 절 수 — 허브 장 그리드 진행 표시 */
export const useBookTyping = (bookNumber: number | null) =>
  useQuery({
    queryKey: bibleTypingKeys.book(bookNumber ?? 0),
    queryFn: () => getBookTyping(bookNumber ?? 0),
    enabled: loggedIn() && !!bookNumber,
    staleTime: 1000 * 30,
  })

/** 이번 주 교회 필사 현황 */
export const useTypingWeekly = () =>
  useQuery({
    queryKey: bibleTypingKeys.weekly(),
    queryFn: getTypingWeekly,
    enabled: loggedIn(),
    staleTime: 1000 * 60,
  })

/**
 * 절 하나 필사 완료 기록. 서버가 정확도 95%+ 면 읽음 처리까지 하므로
 * 성경 읽기 진행률·플랜·프로필 캐시도 함께 무효화하고 칭호 평가를 예약한다.
 */
export const useSubmitTyping = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TypingRecordInput) => submitTypingRecord(input),
    onSuccess: (result) => {
      // 세션 화면에 떠 있는 것 중 이 절로 바뀌는 것(통계·이 장의 필사 절·릴레이 방 칸)만 지금 다시 받는다.
      // 나머지(허브 묶음·내 릴레이 목록·달력·오늘의 한 절·교회 성경·책 진행률)는 stale 로만 표시해
      // 돌아가 마운트될 때 받는다. 세션은 방 자동 감지용으로 relays() 도 들고 있어 전부 active 로
      // 무효화하면 절 하나마다 요청이 4개 나갔다 — 그 목록은 세션 안에서 바뀔 일이 없다
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.all, refetchType: 'none' })
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.stats() })
      void qc.invalidateQueries({
        queryKey:
          result.book_number != null && result.chapter != null
            ? bibleTypingKeys.chapter(result.book_number, result.chapter)
            : [...bibleTypingKeys.all, 'chapter'],
      })
      void qc.invalidateQueries({ queryKey: [...bibleTypingKeys.all, 'relay'] })
      // 동행 필사 목표는 이 기록을 그 주 범위로 합산한다 — /companion 에 돌아가면 바로 다시 받게
      void qc.invalidateQueries({ queryKey: companionKeys.all })
      if (result.marked_read_ids.length > 0) {
        // 읽기 화면은 다른 라우트라 비활성 — refetchType 'all' 로 돌아갔을 때 바로 맞게
        void qc.invalidateQueries({ queryKey: bibleReadingKeys.all, refetchType: 'all' })
        void qc.invalidateQueries({ queryKey: profileKeys.all })
      }
      if (result.passed) scheduleTitleEvaluation()
    },
  })
}

/** 하루 목표 저장 — 통계 캐시의 daily_goal 을 바로 고쳐 허브 카드가 깜빡이지 않게 */
export const useUpdateTypingGoal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (goal: number) => updateTypingGoal(goal),
    onSuccess: (goal) => {
      qc.setQueryData<TypingStats>(bibleTypingKeys.stats(), (prev) => (prev ? { ...prev, daily_goal: goal } : prev))
      qc.setQueryData<TypingHomeBundle>(bibleTypingKeys.home(), (prev) =>
        prev ? { ...prev, stats: { ...prev.stats, daily_goal: goal } } : prev,
      )
    },
  })
}


/** 오늘의 한 절 — 날짜가 바뀌면 새 절이라 오래 들고 있지 않는다 */
export const useTypingDaily = () =>
  useQuery({
    queryKey: bibleTypingKeys.daily(),
    queryFn: getTypingDaily,
    enabled: loggedIn(),
    staleTime: 1000 * 30,
  })

