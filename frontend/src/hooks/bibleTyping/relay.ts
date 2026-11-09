import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addTypingRelayMembers,
  createTypingRelay,
  sendTypingRelayGlossView,
  getTypingRelay,
  getTypingRelays,
  joinTypingRelay,
  leaveTypingRelay,
  passTypingRelayBaton,
  previewTypingRelay,
  sendTypingRelayCheer,
  sendTypingRelayPresence,
  type TypingCheerKind,
  type TypingRelayDetail,
  type TypingRelayLive,
} from '../../api/bibleTyping'
import { notificationStream } from '../../utils/notificationStream'
import { bibleTypingKeys } from './keys'
import { PRESENCE_BEAT_MS, loggedIn, parseJson } from './shared'

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
      // 세션(relayId 있음)은 방 자동 감지용 relays() 도 들고 있다 — 친구가 한 절 쓸 때마다 목록까지
      // 다시 받을 이유는 없으니 그땐 stale 로만 두고, 허브처럼 목록을 보는 화면에서만 바로 받는다
      const listRefetch = relayId ? 'none' : undefined
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.relays(), refetchType: listRefetch })
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.home(), refetchType: listRefetch })
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
    const offLive = notificationStream.on('typing_relay_live', (raw) => {
      const ev = parseJson<{ relay_id: number; user_id: number; verse: number | null }>(raw)
      if (!ev || ev.relay_id !== relayId) return
      setLive((prev) => {
        const rest = prev.filter((r) => r.user_id !== ev.user_id)
        return ev.verse === null ? rest : [...rest, { user_id: ev.user_id, verse: ev.verse }]
      })
    })
    const offCheer = notificationStream.on('typing_relay_cheer', (raw) => {
      const ev = parseJson<TypingCheerEvent>(raw)
      if (ev && ev.relay_id === relayId) handlersRef.current.onCheer?.(ev)
    })
    const offFill = notificationStream.on('typing_relay', (raw) => {
      const ev = parseJson<TypingRelayEvent>(raw)
      if (ev && ev.relay_id === relayId) handlersRef.current.onFill?.(ev)
    })
    // 친구가 '알아두면 좋은 말' 풀이를 열어 봤다 — 상세 캐시의 gloss_views 에 바로 얹는다(재조회 없이)
    const offGloss = notificationStream.on('typing_relay_gloss', (raw) => {
      const ev = parseJson<{ relay_id: number; user_id: number; term: string }>(raw)
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
