import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTypingRelay,
  getBookTyping,
  getChapterTyping,
  getChurchBible,
  getTypingCalendar,
  getTypingDaily,
  getTypingRelay,
  getTypingRelays,
  getTypingStats,
  getTypingWeekly,
  joinTypingRelay,
  leaveTypingRelay,
  previewTypingRelay,
  submitTypingRecord,
  updateTypingGoal,
  type TypingRecordInput,
  type TypingStats,
} from '../api/bibleTyping'
import { bibleReadingKeys } from './useBibleReading'
import { profileKeys } from './queryKeys'
import { scheduleTitleEvaluation } from '../utils/titleUnlockBus'
import { tokenStore } from '../utils/tokenStore'

export const bibleTypingKeys = {
  all: ['bibleTyping'] as const,
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
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.all, refetchType: 'all' })
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
    onSuccess: () => void qc.invalidateQueries({ queryKey: bibleTypingKeys.relays() }),
  })
}

export const useJoinTypingRelay = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: joinTypingRelay,
    onSuccess: () => void qc.invalidateQueries({ queryKey: bibleTypingKeys.relays() }),
  })
}

export const useLeaveTypingRelay = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: leaveTypingRelay,
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: bibleTypingKeys.relay(id) })
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.relays() })
    },
  })
}
