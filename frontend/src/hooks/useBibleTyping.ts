import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addTypingRelayMembers,
  createTypingRelay,
  deleteGlossaryLine,
  getGlossaryLines,
  leaveTypingTogether,
  saveGlossaryLine,
  sendTypingRelayGlossView,
  sendTypingTogetherCheer,
  sendTypingTogetherPresence,
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
  passTypingRelayBaton,
  previewTypingRelay,
  sendTypingRelayCheer,
  sendTypingRelayPresence,
  submitTypingRecord,
  updateTypingGoal,
  type TypingCheerKind,
  type TypingHomeBundle,
  type TypingRecordInput,
  type TypingChapterPerson,
  type TypingRelayDetail,
  type TypingRelayLive,
  type TypingStats,
} from '../api/bibleTyping'
import { getBibleVerse } from '../api/bible'
import { isApiError } from '../api/utils/request'
import { bibleReadingKeys } from './useBibleReading'
import { profileKeys } from './queryKeys'
import { scheduleTitleEvaluation } from '../utils/titleUnlockBus'
import { notificationStream } from '../utils/notificationStream'
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
  glossaryLinesAll: () => [...bibleTypingKeys.all, 'glossaryLines'] as const,
  glossaryLines: (terms: string) => [...bibleTypingKeys.all, 'glossaryLines', terms] as const,
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
    // 전역 refetchOnMount:false 라 복원된 옛 칸·바통이 그대로 남는다 — 방에 들어올 때마다 새로 받는다
    refetchOnMount: 'always',
    retry: false,
  })

/** 백엔드가 같은 방 멤버에게 보내는 SSE `typing_relay` 페이로드(진행은 안 실려 온다 — 재조회 신호) */
interface TypingRelayEvent {
  relay_id: number
  book_number: number
  chapter: number
  verse_id: number
  by: number
  /** 바통을 넘긴 경우 받은 사람 */
  baton_to?: number | null
}

/**
 * 릴레이 실시간 동기화 — 다른 멤버가 칸을 채우면(SSE `typing_relay`) 떠 있는 릴레이 화면을 새로 받는다.
 *
 * 폴링이 아니라 SSE 인 이유는 홈 "지금 함께 읽는 말씀"과 같다: 로그인 사용자는 이미 전역 스트림 하나를
 * 물고 있고, 변화가 없으면 아무것도 안 온다. 내 필사는 mutation 이 직접 재조회하므로 서버가 나는 빼고 보낸다.
 * invalidate 는 기본(active)이라 지금 마운트된 쿼리만 다시 받는다 — 상세 화면이면 그 방 하나, 허브면 묶음 하나.
 *
 * @param relayId 상세 화면에서 보고 있는 방 — 다른 방 이벤트는 무시하고, 재연결 뒤엔 이 방을 한 번 새로 받는다
 */
export const useTypingRelayLive = (relayId?: number) => {
  const qc = useQueryClient()
  useEffect(() => {
    if (!loggedIn()) return
    const refresh = (id: number) => {
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.relay(id) })
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.relays() })
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.home() })
    }
    const offEvent = notificationStream.on('typing_relay', (raw) => {
      try {
        const ev = JSON.parse(raw) as TypingRelayEvent
        if (relayId && ev.relay_id !== relayId) return
        refresh(ev.relay_id)
      } catch {
        /* 깨진 페이로드는 무시 — 다음 이벤트가 바로잡는다 */
      }
    })
    // 끊긴 사이 놓친 이벤트가 있을 수 있다 — 재연결 직후 보고 있던 방을 한 번 새로 받는다
    const offConnected = relayId
      ? notificationStream.on('connected', () => refresh(relayId))
      : () => undefined
    return () => {
      offEvent()
      offConnected()
    }
  }, [qc, relayId])
}

interface TypingCheerEvent {
  relay_id: number
  from_user_id: number
  name: string
  kind: TypingCheerKind
}

// 하트비트 간격 — 서버는 70초 끊기면 떠난 것으로 본다
const PRESENCE_BEAT_MS = 25_000

/**
 * 따라쓰기 화면 = 릴레이 방. 내가 쓰는 절을 알리고(하트비트), 다른 멤버가 쓰는 절·응원·칸 채움을 받는다.
 *
 * 접속 현황은 '지금'의 신호라 쿼리 캐시(persist)에 두지 않고 이 훅의 상태로만 든다 —
 * 복원된 지난 세션의 친구가 유령처럼 떠 있지 않게. 화면을 가리면 떠남으로 알리고, 돌아오면 다시 알린다.
 *
 * @param relayId 0 이면 아무것도 하지 않는다(릴레이 없이 혼자 쓰는 중)
 * @param verse 지금 쓰는 절 번호(아직 모르면 null)
 */
export const useTypingRelayRoom = (
  relayId: number,
  verse: number | null,
  handlers: {
    onCheer?: (ev: TypingCheerEvent) => void
    onFill?: (ev: TypingRelayEvent) => void
    onGloss?: (ev: { user_id: number; term: string }) => void
  } = {},
) => {
  const qc = useQueryClient()
  const [live, setLive] = useState<TypingRelayLive[]>([])
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  })
  const verseRef = useRef(verse)
  useEffect(() => {
    verseRef.current = verse
  })

  // 내가 쓰는 절 알리기 — 절이 바뀔 때 + 주기적으로, 화면을 가리면 떠남
  useEffect(() => {
    if (!loggedIn() || !relayId || verse === null) return
    let alive = true
    const beat = (v: number | null) =>
      sendTypingRelayPresence(relayId, v)
        .then((rows) => {
          if (alive && v !== null) setLive(rows)
        })
        .catch(() => undefined)
    void beat(verse)
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void beat(verseRef.current)
    }, PRESENCE_BEAT_MS)
    const onVis = () => void beat(document.visibilityState === 'visible' ? verseRef.current : null)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      alive = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [relayId, verse])
  // 방을 떠날 때 한 번만 '떠남' — 절이 바뀔 때마다 떠났다 들어오면 친구 화면이 깜빡인다
  useEffect(() => {
    if (!loggedIn() || !relayId) return
    return () => {
      void sendTypingRelayPresence(relayId, null).catch(() => undefined)
    }
  }, [relayId])

  useEffect(() => {
    if (!loggedIn() || !relayId) return
    const parse = <T,>(raw: string): T | null => {
      try {
        return JSON.parse(raw) as T
      } catch {
        return null
      }
    }
    const offLive = notificationStream.on('typing_relay_live', (raw) => {
      const ev = parse<{ relay_id: number; user_id: number; verse: number | null }>(raw)
      if (!ev || ev.relay_id !== relayId) return
      setLive((prev) => {
        const rest = prev.filter((r) => r.user_id !== ev.user_id)
        return ev.verse === null ? rest : [...rest, { user_id: ev.user_id, verse: ev.verse }]
      })
    })
    const offCheer = notificationStream.on('typing_relay_cheer', (raw) => {
      const ev = parse<TypingCheerEvent>(raw)
      if (ev && ev.relay_id === relayId) handlersRef.current.onCheer?.(ev)
    })
    const offFill = notificationStream.on('typing_relay', (raw) => {
      const ev = parse<TypingRelayEvent>(raw)
      if (ev && ev.relay_id === relayId) handlersRef.current.onFill?.(ev)
    })
    // 친구가 '알아두면 좋은 말' 풀이를 열어 봤다 — 상세 캐시의 gloss_views 에 바로 얹는다(재조회 없이)
    const offGloss = notificationStream.on('typing_relay_gloss', (raw) => {
      const ev = parse<{ relay_id: number; user_id: number; term: string }>(raw)
      if (!ev || ev.relay_id !== relayId) return
      qc.setQueryData<TypingRelayDetail>(bibleTypingKeys.relay(relayId), (prev) => {
        if (!prev) return prev
        const ids = prev.gloss_views?.[ev.term] ?? []
        if (ids.includes(ev.user_id)) return prev
        return { ...prev, gloss_views: { ...(prev.gloss_views ?? {}), [ev.term]: [...ids, ev.user_id] } }
      })
      handlersRef.current.onGloss?.(ev)
    })
    return () => {
      offLive()
      offCheer()
      offFill()
      offGloss()
    }
  }, [relayId, qc])

  return live
}

export const useSendTypingCheer = () => useMutation({ mutationFn: sendTypingRelayCheer })

export const usePassTypingBaton = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: passTypingRelayBaton,
    onSuccess: (_, input) => {
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.relay(input.id) })
    },
  })
}

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

export const useAddTypingRelayMembers = (id: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userIds: number[]) => addTypingRelayMembers(id, userIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.relay(id) })
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.relays() })
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

/** 릴레이 방 — 풀이를 열어 봤다. 내 화면엔 바로 얹고(낙관), 서버는 처음 본 것만 친구들에게 알린다 */
export const useSendRelayGlossView = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: sendTypingRelayGlossView,
    onMutate: ({ id, term }) => {
      qc.setQueryData<TypingRelayDetail>(bibleTypingKeys.relay(id), (prev) => {
        const me = prev?.members.find((m) => m.is_me)?.user_id
        if (!prev || me === undefined) return prev
        const ids = prev.gloss_views?.[term] ?? []
        if (ids.includes(me)) return prev
        return { ...prev, gloss_views: { ...(prev.gloss_views ?? {}), [term]: [...ids, me] } }
      })
    },
  })
}

// ── 혼자 쓸 때도 함께 — 지금 이 장을 쓰는 사람 ────────────────

export interface TypingCheerFromChapter {
  from_key: string
  /** 익명으로 쓰는 사람이 보냈으면 null */
  name: string | null
  kind: TypingCheerKind
}

export interface TypingWrittenEvent {
  key: string | null
  name: string | null
  verse: number
}

const parseJson = <T,>(raw: string): T | null => {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * 혼자 쓰는 필사 화면의 '지금 이 장을 쓰는 사람'. 쓰는 절을 알리고(하트비트), 같은 장 사람 명단·응원·
 * 절 완료 소식을 SSE 로 받는다. 릴레이 방 훅(useTypingRelayRoom)과 같은 원칙 — 접속 현황은 '지금'의 신호라
 * 쿼리 캐시(persist)에 두지 않고 이 훅의 상태로만 든다. 화면을 가리면 떠남, 돌아오면 다시 알린다.
 *
 * @param opts.enabled false 면(비로그인·릴레이 방 안) 아무것도 하지 않는다
 */
export const useTypingTogether = (
  bookNumber: number,
  chapter: number,
  verse: number | null,
  opts: {
    enabled: boolean
    anon: boolean
    onCheer?: (ev: TypingCheerFromChapter) => void
    onWritten?: (ev: TypingWrittenEvent) => void
  },
) => {
  const [people, setPeople] = useState<TypingChapterPerson[]>([])
  const [meKey, setMeKey] = useState<string | null>(null)
  const [todayWriters, setTodayWriters] = useState(0)
  const optsRef = useRef(opts)
  useEffect(() => {
    optsRef.current = opts
  })
  const on = opts.enabled && loggedIn() && bookNumber > 0 && chapter > 0
  const anon = opts.anon

  useEffect(() => {
    if (!on || verse === null) return
    let alive = true
    const beat = () =>
      sendTypingTogetherPresence({ book_number: bookNumber, chapter, verse, anon })
        .then((snap) => {
          if (!alive) return
          setMeKey(snap.me_key)
          setPeople(snap.people)
          setTodayWriters(snap.today_writers)
        })
        .catch(() => undefined)
    void beat()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void beat()
    }, PRESENCE_BEAT_MS)
    const onVis = () => {
      if (document.visibilityState === 'visible') void beat()
      else void leaveTypingTogether().catch(() => undefined)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      alive = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [on, bookNumber, chapter, verse, anon])
  // 화면을 떠날 때 한 번만 '떠남' — 절이 바뀔 때마다 떠났다 들어오면 다른 사람 화면이 깜빡인다
  useEffect(() => {
    if (!on) return
    return () => {
      void leaveTypingTogether().catch(() => undefined)
    }
  }, [on])

  useEffect(() => {
    if (!on) return
    const same = (ev: { book_number: number; chapter: number } | null) =>
      !!ev && ev.book_number === bookNumber && ev.chapter === chapter
    const offLive = notificationStream.on('typing_chapter_live', (raw) => {
      const ev = parseJson<{ book_number: number; chapter: number; people: TypingChapterPerson[] }>(raw)
      if (ev && same(ev)) setPeople(ev.people)
    })
    const offCheer = notificationStream.on('typing_chapter_cheer', (raw) => {
      const ev = parseJson<TypingCheerFromChapter & { book_number: number; chapter: number }>(raw)
      if (ev && same(ev)) optsRef.current.onCheer?.(ev)
    })
    const offWritten = notificationStream.on('typing_chapter_event', (raw) => {
      const ev = parseJson<TypingWrittenEvent & { book_number: number; chapter: number }>(raw)
      if (!ev || !same(ev)) return
      setTodayWriters((n) => Math.max(n, 1))
      optsRef.current.onWritten?.(ev)
    })
    return () => {
      offLive()
      offCheer()
      offWritten()
    }
  }, [on, bookNumber, chapter])

  const others = meKey ? people.filter((p) => p.key !== meKey) : []
  return { people: others, todayWriters }
}

export const useSendTogetherCheer = () => useMutation({ mutationFn: sendTypingTogetherCheer })

// ── 알아두면 좋은 말 — 성도들이 남긴 한 줄 ────────────────────

export const useGlossaryLines = (terms: string[]) => {
  const qc = useQueryClient()
  const key = [...terms].sort().join(',')
  // 누가 이 말들에 한 줄을 남기거나 지우면(SSE `typing_glossary_line`) 바로 다시 받는다 — 표제어 기준이라
  // 다른 장에서 남긴 한 줄도 해당된다. 내 저장은 mutation 이 이미 무효화하므로 한 번 더 받을 뿐 해는 없다
  useEffect(() => {
    if (!loggedIn() || !key) return
    const watching = new Set(key.split(','))
    return notificationStream.on('typing_glossary_line', (raw) => {
      const ev = parseJson<{ term: string }>(raw)
      if (ev && watching.has(ev.term)) void qc.invalidateQueries({ queryKey: bibleTypingKeys.glossaryLines(key) })
    })
  }, [key, qc])
  return useQuery({
    queryKey: bibleTypingKeys.glossaryLines(key),
    queryFn: () => getGlossaryLines(terms),
    enabled: loggedIn() && terms.length > 0,
    staleTime: 1000 * 60,
    // 옛 백엔드(엔드포인트 없음)면 조용히 빈 채로 — 풀이 자체는 사전 데이터라 그대로 보인다
    retry: false,
  })
}

export const useSaveGlossaryLine = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveGlossaryLine,
    onSuccess: () => void qc.invalidateQueries({ queryKey: bibleTypingKeys.glossaryLinesAll() }),
  })
}

export const useDeleteGlossaryLine = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteGlossaryLine,
    onSuccess: () => void qc.invalidateQueries({ queryKey: bibleTypingKeys.glossaryLinesAll() }),
  })
}
