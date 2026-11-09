import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  leaveTypingTogether,
  sendTypingTogetherCheer,
  sendTypingTogetherPresence,
  type TypingCheerKind,
  type TypingChapterPerson,
} from '../../api/bibleTyping'
import { notificationStream } from '../../utils/notificationStream'
import { PRESENCE_BEAT_MS, loggedIn, parseJson } from './shared'

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
