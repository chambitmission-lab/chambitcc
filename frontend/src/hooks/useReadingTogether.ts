// 함께 읽기 — 실시간 읽기 현황(presence) 훅 + SSE 캐시 동기화
//
// 흐름: 스크롤로 확정된 절(useReadingLine) → 하트비트(25초 주기 + 절 바뀔 때)
//       → 서버 메모리 → 같은 장 사람들에게 SSE `reading_presence`
//       → 이 파일의 핸들러가 React Query 캐시 갱신 → 칩·pill 리렌더.
//
// 카운트는 사용자 기준이라 탭이 여러 개여도 한 명이다. 탭이 숨겨지면 하트비트를 멈추고
// 이탈을 보내 "읽는 중" 숫자가 부풀지 않게 한다. 서버 재시작으로 메모리가 비어도
// SSE 'connected' 직후 하트비트를 다시 보내 몇 초 안에 복구된다.
import { useCallback, useEffect, useRef } from 'react'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  getChapterPresence,
  leavePresence,
  sendPresenceHeartbeat,
  type ChapterPresence,
} from '../api/biblePresence'
import {
  getChapterReflectionSummary,
  type ChapterReflectionSummary,
  type ReflectionListResponse,
  type ReflectionStreamEvent,
} from '../api/bibleReflection'
import { notificationStream } from '../utils/notificationStream'
import { readingTogetherBus } from '../utils/readingTogetherBus'
import { readingTogetherKeys } from './queryKeys'

/** 하트비트 주기 — 서버 TTL(90초)의 1/3 이하여야 순단 한 번에 사라지지 않는다 */
export const HEARTBEAT_INTERVAL_MS = 25_000

// ── SSE → 캐시 ────────────────────────────────────────────────────────

const parse = <T,>(raw: string): T | null => {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

const applyPresence = (qc: QueryClient, data: ChapterPresence) => {
  qc.setQueryData<ChapterPresence>(
    readingTogetherKeys.presence(data.book_number, data.chapter),
    (old) => ({
      ...data,
      readers_today: old?.readers_today ?? data.readers_today ?? null,
      // 구 백엔드(필드 없음)에선 이전 값을 잃지 않게 둔다
      me_included: data.me_included ?? old?.me_included,
    }),
  )
}

const applyReflectionEvent = (qc: QueryClient, ev: ReflectionStreamEvent) => {
  // 절 칩 숫자
  qc.setQueryData<ChapterReflectionSummary>(
    readingTogetherKeys.summary(ev.book_number, ev.chapter),
    (old) => {
      const verse_counts = { ...(old?.verse_counts ?? {}) }
      if (ev.reflection_count > 0) verse_counts[String(ev.verse)] = ev.reflection_count
      else delete verse_counts[String(ev.verse)]
      const total = Object.values(verse_counts).reduce((a, b) => a + b, 0)
      return { book_number: ev.book_number, chapter: ev.chapter, verse_counts, total }
    },
  )

  // 열려 있는 목록 — 카운트만 바뀐 건 제자리에서 고치고, 글이 생기거나 사라지면 다시 받는다
  const listKey = readingTogetherKeys.reflections(ev.verse_id)
  if (ev.kind === 'liked' || ev.kind === 'replied') {
    qc.setQueryData<ReflectionListResponse>(listKey, (old) => {
      if (!old) return old
      let touched = false
      const items = old.items.map((r) => {
        if (r.id !== ev.reflection_id) return r
        if (r.like_count === ev.like_count && r.reply_count === ev.reply_count) return r
        touched = true
        return { ...r, like_count: ev.like_count, reply_count: ev.reply_count }
      })
      return touched ? { ...old, items } : old
    })
    if (ev.kind === 'replied') {
      qc.invalidateQueries({ queryKey: readingTogetherKeys.replies(ev.reflection_id) })
    }
  } else if (qc.getQueryState(listKey)) {
    qc.invalidateQueries({ queryKey: listKey })
  }

  if (ev.kind === 'created') readingTogetherBus.emitReflection(ev)
}

let streamInstalled = false
/** SSE 이벤트 핸들러를 한 번만 붙인다. 성경 화면이 처음 마운트될 때 부른다. */
export const installReadingTogetherStream = (qc: QueryClient) => {
  if (streamInstalled) return
  streamInstalled = true
  notificationStream.on('reading_presence', (raw) => {
    const data = parse<ChapterPresence>(raw)
    if (data) applyPresence(qc, data)
  })
  notificationStream.on('verse_reflection', (raw) => {
    const ev = parse<ReflectionStreamEvent>(raw)
    if (ev) applyReflectionEvent(qc, ev)
  })
}

// ── 조회 훅 ───────────────────────────────────────────────────────────

export const useChapterPresence = (bookNumber: number, chapter: number, enabled = true) =>
  useQuery({
    queryKey: readingTogetherKeys.presence(bookNumber, chapter),
    queryFn: () => getChapterPresence(bookNumber, chapter),
    enabled: enabled && bookNumber > 0 && chapter > 0,
    // 실시간 값이라 persist 복원분은 의미 없다 — 진입마다 새로 받고 SSE 가 이어받는다.
    // 메모리 캐시도 남기지 않는다(gcTime 0): 장을 떠나면 그 장의 SSE 도 더 안 오므로
    // 남은 숫자는 그 순간 화석이 된다. 다시 들어올 때 화석부터 그리면 '지금 N명과 함께
    // 읽는 중'이 떴다가 응답이 와서 사라진다 — 그 N명이 사실은 조금 전의 나였다.
    // refetchOnMount:'always' 라 어차피 매 진입 요청하므로 요청 수는 그대로다.
    staleTime: 30_000,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
  })

export const useChapterReflectionSummary = (bookNumber: number, chapter: number, enabled = true) =>
  useQuery({
    queryKey: readingTogetherKeys.summary(bookNumber, chapter),
    queryFn: () => getChapterReflectionSummary(bookNumber, chapter),
    enabled: enabled && bookNumber > 0 && chapter > 0,
    staleTime: 60_000,
    refetchOnMount: 'always',
  })

// ── 하트비트 훅 ───────────────────────────────────────────────────────

interface HeartbeatOptions {
  bookNumber: number
  chapter: number
  /** 확정된 현재 절 — null 이면 아직 모름(보내지 않음) */
  verse: number | null
  /** 로그인 + 공유 설정 켜짐 + 본문 표시 중 */
  enabled: boolean
}

/**
 * 내 읽기 위치를 서버에 알린다. 응답(장 현황)은 presence 캐시에 바로 넣어
 * 첫 하트비트가 곧 초기 조회를 겸한다.
 */
export const useReadingPresenceHeartbeat = ({ bookNumber, chapter, verse, enabled }: HeartbeatOptions) => {
  const qc = useQueryClient()
  useEffect(() => installReadingTogetherStream(qc), [qc])

  // 최신 위치를 ref 로 들고 있어 타이머·이벤트 콜백이 stale 값을 보내지 않는다.
  // (아래 하트비트 effect 보다 먼저 선언돼야 같은 커밋에서 갱신된 값을 본다)
  const posRef = useRef({ bookNumber, chapter, verse })
  useEffect(() => {
    posRef.current = { bookNumber, chapter, verse }
  }, [bookNumber, chapter, verse])
  const activeRef = useRef(false)

  const send = useCallback(() => {
    const { bookNumber: b, chapter: c, verse: v } = posRef.current
    if (!activeRef.current || v === null || document.visibilityState === 'hidden') return
    sendPresenceHeartbeat({ book_number: b, chapter: c, verse: v })
      .then((data) => applyPresence(qc, data))
      .catch(() => {
        /* 순단·401 등 — 다음 주기에 다시 시도, 화면엔 영향 없음 */
      })
  }, [qc])

  const leave = useCallback(() => {
    leavePresence().catch(() => {
      /* 이탈 실패는 서버 TTL 이 정리한다 */
    })
  }, [])

  useEffect(() => {
    if (!enabled || verse === null) {
      if (activeRef.current) {
        activeRef.current = false
        leave()
      }
      return
    }
    activeRef.current = true
    send()
    const timer = window.setInterval(send, HEARTBEAT_INTERVAL_MS)

    // 탭 숨김 → 이탈, 복귀 → 즉시 하트비트 (숨긴 탭이 "읽는 중"으로 남지 않게)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') leave()
      else send()
    }
    // 탭 닫힘 — keepalive 요청으로 마지막 이탈을 남긴다
    const onPageHide = () => leave()
    // 재연결 직후 — 서버가 재시작됐을 수 있으니 위치를 다시 알린다
    const offConnected = notificationStream.on('connected', send)

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      offConnected()
    }
    // verse 가 바뀌면 effect 가 다시 돌아 즉시 send() — 절 이동을 바로 알린다.
    // 장이 바뀌어도 leave 는 보내지 않는다: 다음 하트비트가 서버에서 이전 장을 자동으로 비운다.
  }, [enabled, bookNumber, chapter, verse, send, leave])

  // 성경 화면을 완전히 떠날 때
  useEffect(
    () => () => {
      if (activeRef.current) {
        activeRef.current = false
        leave()
      }
    },
    [leave],
  )
}
