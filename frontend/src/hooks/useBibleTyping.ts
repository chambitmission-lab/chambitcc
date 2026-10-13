import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTypingRelay,
  getBookTyping,
  getChapterTyping,
  getChurchBible,
  getTypingCalendar,
  getTypingDaily,
  getTypingHome,
  getTypingRelay,
  getTypingRelays,
  getTypingStats,
  getTypingWeekly,
  joinTypingRelay,
  leaveTypingRelay,
  previewTypingRelay,
  submitTypingRecord,
  updateTypingGoal,
  type TypingHomeBundle,
  type TypingRecordInput,
  type TypingStats,
} from '../api/bibleTyping'
import { getBibleVerse } from '../api/bible'
import { isApiError } from '../api/utils/request'
import { bibleReadingKeys } from './useBibleReading'
import { profileKeys } from './queryKeys'
import { scheduleTitleEvaluation } from '../utils/titleUnlockBus'
import { tokenStore } from '../utils/tokenStore'

export const bibleTypingKeys = {
  all: ['bibleTyping'] as const,
  home: () => [...bibleTypingKeys.all, 'home'] as const,
  stats: () => [...bibleTypingKeys.all, 'stats'] as const,
  chapter: (bookNumber: number, chapter: number) => [...bibleTypingKeys.all, 'chapter', bookNumber, chapter] as const,
  book: (bookNumber: number) => [...bibleTypingKeys.all, 'book', bookNumber] as const,
  weekly: () => [...bibleTypingKeys.all, 'weekly'] as const,
  calendar: () => [...bibleTypingKeys.all, 'calendar'] as const,
  daily: () => [...bibleTypingKeys.all, 'daily'] as const,
  churchBible: () => [...bibleTypingKeys.all, 'churchBible'] as const,
  relays: () => [...bibleTypingKeys.all, 'relays'] as const,
  relay: (id: number) => [...bibleTypingKeys.all, 'relay', id] as const,
  relayInvite: (code: string) => [...bibleTypingKeys.all, 'relayInvite', code] as const,
}

const loggedIn = () => !!tokenStore.getAccess()

/**
 * 필사 허브 묶음 — 통계·달력·오늘의 한 절·교회 성경·릴레이·이어 쓸 절 본문을 요청 하나로.
 * 허브가 요청 8개를 한꺼번에 보내면 홈에서 넘어올 때 홈의 요청 10여 개 뒤에 줄을 서서
 * 카드마다 3초 넘게 비어 있었다(백엔드 소형 컨테이너는 동시 요청을 거의 순서대로 처리한다).
 * 받은 조각은 단건 키에도 심어 두어 세션·스프린트·오늘의 한 절 화면의 단건 훅이 다시 받지 않게 한다.
 */
export const useTypingHome = () => {
  const qc = useQueryClient()
  return useQuery({
    queryKey: bibleTypingKeys.home(),
    queryFn: async () => {
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
    },
    enabled: loggedIn(),
    staleTime: 1000 * 30,
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
      // 화면에 떠 있는 것(세션의 통계·이 장의 필사 절)만 지금 다시 받고, 허브 묶음 등 나머지는
      // stale 로만 표시해 돌아가 마운트될 때 받는다(refetchOnMount 기본 true). 전부('all') 다시 받으면
      // 절 하나 쓸 때마다 허브 조각 6~7개가 뒤에서 나가 필사 중 백엔드를 계속 두드렸다
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.all })
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

/** 잉크 달력 — 최근 26주 날짜별 필사한 절 수 */
export const useTypingCalendar = () =>
  useQuery({
    queryKey: bibleTypingKeys.calendar(),
    queryFn: () => getTypingCalendar(182),
    enabled: loggedIn(),
    staleTime: 1000 * 60,
  })

/** 오늘의 한 절 — 날짜가 바뀌면 새 절이라 오래 들고 있지 않는다 */
export const useTypingDaily = () =>
  useQuery({
    queryKey: bibleTypingKeys.daily(),
    queryFn: getTypingDaily,
    enabled: loggedIn(),
    staleTime: 1000 * 30,
  })

/** 우리 교회 손글씨 성경 */
export const useChurchBible = () =>
  useQuery({
    queryKey: bibleTypingKeys.churchBible(),
    queryFn: getChurchBible,
    enabled: loggedIn(),
    staleTime: 1000 * 60,
  })

/** 내가 참여한 릴레이 필사 */
export const useTypingRelays = () =>
  useQuery({
    queryKey: bibleTypingKeys.relays(),
    queryFn: getTypingRelays,
    enabled: loggedIn(),
    staleTime: 1000 * 30,
  })

export const useTypingRelay = (id: number) =>
  useQuery({
    queryKey: bibleTypingKeys.relay(id),
    queryFn: () => getTypingRelay(id),
    enabled: loggedIn() && id > 0,
    staleTime: 1000 * 15,
    retry: false,
  })

export const useTypingRelayInvite = (code: string) =>
  useQuery({
    queryKey: bibleTypingKeys.relayInvite(code),
    queryFn: () => previewTypingRelay(code),
    enabled: loggedIn() && !!code,
    retry: false,
  })

export const useCreateTypingRelay = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTypingRelay,
    // 허브는 묶음(home)으로 목록을 받으니 함께 무효화해야 돌아왔을 때 새 방이 보인다
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.relays() })
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.home() })
    },
  })
}

export const useJoinTypingRelay = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: joinTypingRelay,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.relays() })
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.home() })
    },
  })
}

export const useLeaveTypingRelay = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: leaveTypingRelay,
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: bibleTypingKeys.relay(id) })
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.relays() })
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.home() })
    },
  })
}
