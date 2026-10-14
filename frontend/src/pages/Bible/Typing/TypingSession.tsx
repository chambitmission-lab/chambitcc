import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import { useBibleBooks, useBibleChapter } from '../../../hooks/useBible'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import {
  useChapterTyping,
  usePassTypingBaton,
  useSendTypingCheer,
  useSubmitTyping,
  useTypingRelay,
  useTypingRelayLive,
  useTypingRelayRoom,
  useTypingRelays,
  useTypingStats,
} from '../../../hooks/useBibleTyping'
import { showToast } from '../../../utils/toast'
import { tokenStore } from '../../../utils/tokenStore'
import type { TypingCheerKind, TypingMode } from '../../../api/bibleTyping'
import type { BibleVerse } from '../../../types/bible'
import TypingPad, { type TypingFinish } from './TypingPad'
import { PASS_ACCURACY, cpmOf } from './hangulTyping'
import { formatDuration, sessionPath, useIgnorePunct } from './typingPrefs'
import { playTypingSound } from './typingSound'
import SoundMenu from './SoundMenu'
import Lamp from './home/Lamp'
import { teaser } from './home/teaser'
import { BatonSheet, RelayBoard, RelayHandoff, RelayLine, RelayPrevNote } from './RelayRoom'
import { CHEER_LABEL, relayHueMap } from './relayShare'
import './typing.css'

interface SessionVerse {
  id: number
  verse: number
  label: string
  text: string
  /** 병합 구간의 딸린 절 id — 함께 읽음 처리한다 */
  extraIds: number[]
}

interface Outcome {
  status: 'saving' | 'passed' | 'failed'
  accuracy: number
  cpm: number
  newlyRead?: boolean
  personalBest?: boolean
  note?: string
}

interface SessionResult {
  verseId: number
  accuracy: number
  keystrokes: number
  durationMs: number
  maxCombo: number
}

// PC 무대 아래로 미리 보여 줄 다음 절 수
const STAGE_AHEAD = 2
// 장 지도 링 — r=44 원의 둘레
const RING_C = 2 * Math.PI * 44
// 릴레이 소식 띠에 잠깐 띄우는 소식(칸 채움·바통·응원 보냄)이 머무는 시간
const FLASH_MS = 6000

interface CheerFloat {
  id: number
  text: string
  hue: number
}

const toSessionVerses = (verses: BibleVerse[]): SessionVerse[] => {
  const byNumber = new Map(verses.map((v) => [v.verse, v.id]))
  return verses
    .filter((v) => !v.merged_into)
    .map((v) => ({
      id: v.id,
      verse: v.verse,
      label: v.verse_label || String(v.verse),
      text: v.text,
      extraIds: (v.merged_verses ?? [])
        .filter((n) => n !== v.verse)
        .map((n) => byNumber.get(n))
        .filter((id): id is number => typeof id === 'number'),
    }))
}

const TypingSession = () => {
  const navigate = useNavigate()
  const params = useParams()
  const [search] = useSearchParams()
  const bookNumber = Number(params.book) || 0
  const chapter = Number(params.chapter) || 0
  const mode: TypingMode = search.get('mode') === 'memorize' ? 'memorize' : 'copy'
  const startVerse = Number(search.get('v')) || 0
  const loggedIn = !!tokenStore.getAccess()
  // PC 는 '필사 책상' — 지금 절만 무대에 올리고, 장 전체는 오른쪽 지도로 본다
  const isDesk = useMediaQuery('(min-width: 1024px)')

  const { data: books } = useBibleBooks()
  const { data: chapterData, isLoading, error } = useBibleChapter(bookNumber, chapter)
  const { data: typedIds } = useChapterTyping(bookNumber, chapter)
  const submit = useSubmitTyping()
  const { data: stats } = useTypingStats()
  const [ignorePunct, setIgnorePunct] = useIgnorePunct()

  // ── 릴레이 방 — ?relay= 로 들어왔거나, 이 장으로 진행 중인 내 릴레이가 있으면 함께 쓰는 화면이 된다
  const relayParam = Number(search.get('relay')) || 0
  const { data: myRelays } = useTypingRelays()
  const autoRelayId =
    myRelays?.find((r) => !r.completed && r.book_number === bookNumber && r.chapter === chapter)?.id ?? 0
  const { data: relay } = useTypingRelay(relayParam || autoRelayId)
  // 다른 장의 릴레이 링크로 들어온 경우(주소를 손으로 바꾼 등)는 방으로 보지 않는다
  const room = relay && relay.book_number === bookNumber && relay.chapter === chapter ? relay : null
  const roomId = room?.id ?? 0
  useTypingRelayLive(roomId || undefined)
  const hueOf = useMemo(() => relayHueMap(room?.members), [room])
  const sendCheer = useSendTypingCheer()
  const passBaton = usePassTypingBaton()
  const [flash, setFlash] = useState<string | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showFlash = useCallback((text: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current)
    setFlash(text)
    flashTimer.current = setTimeout(() => setFlash(null), FLASH_MS)
  }, [])
  const [cheers, setCheers] = useState<CheerFloat[]>([])
  const cheerSeq = useRef(0)
  /** 내 칸을 쓴 직후 여는 바통 시트 — then 은 시트를 닫은 뒤 이어 갈 흐름(다음 절·목표 축하·마무리) */
  const [baton, setBaton] = useState<{
    verse: SessionVerse
    hasNext: boolean
    then: () => void
    /** 이 칸으로 오늘 목표를 채웠는지 — 바통을 넘겨도 축하는 띄운다 */
    reachedGoal?: boolean
  } | null>(null)
  /** 바통을 넘긴 뒤 — 그 칸은 받은 사람 차례라 내 화면은 다음 절로 가지 않고 기다린다 */
  const [handoff, setHandoff] = useState<{ toUserId: number; label: string | null; next: number | null } | null>(null)
  const batonAutoShown = useRef(false)
  /** 이번에 마지막으로 다 쓴 절 — '바통' 버튼으로 나중에 넘길 때 쓴다 */
  const [lastWritten, setLastWritten] = useState<SessionVerse | null>(null)
  // 오늘 목표 달성 모먼트 — 세션을 열 때 이미 채웠으면 띄우지 않고, 넘는 순간 한 번만
  const goal = stats?.daily_goal ?? 3
  const startTodayRef = useRef<number | null>(null)
  useEffect(() => {
    if (startTodayRef.current === null && stats) startTodayRef.current = stats.today_verses
  }, [stats])
  const goalShownRef = useRef(false)
  /** 목표를 채운 순간 — next 는 이어 쓸 절 인덱스(장 끝이면 null) */
  const [goalMoment, setGoalMoment] = useState<{ next: number | null } | null>(null)

  const book = books?.find((b) => b.book_number === bookNumber)
  const bookName = chapterData?.book_name_ko ?? book?.book_name_ko ?? ''
  const verses = useMemo(() => toSessionVerses(chapterData?.verses ?? []), [chapterData])

  const [sessionDone, setSessionDone] = useState<Set<number>>(() => new Set())
  const done = useMemo(() => {
    const s = new Set<number>(typedIds ?? [])
    sessionDone.forEach((id) => s.add(id))
    return s
  }, [typedIds, sessionDone])

  const [active, setActive] = useState<number | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [results, setResults] = useState<SessionResult[]>([])
  const [showSummary, setShowSummary] = useState(false)
  // 무대 전환 방향(1 = 다음 절로, -1 = 앞 절로)
  const [dir, setDir] = useState<1 | -1>(1)
  const activeRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 시작 절 — ?v= 가 있으면 그 절, 없으면 아직 안 쓴 첫 절. 첫 글자를 치는 순간(onStart)
  // active 로 굳혀, 그 뒤 진행 목록이 다시 와도 쓰던 절이 바뀌지 않게 한다
  const defaultIdx = useMemo(() => {
    if (verses.length === 0) return null
    if (loggedIn && typedIds === undefined) return null
    let idx = startVerse ? verses.findIndex((v) => v.verse === startVerse) : -1
    if (idx < 0) idx = verses.findIndex((v) => !(typedIds ?? []).includes(v.id))
    return idx < 0 ? 0 : idx
  }, [verses, typedIds, startVerse, loggedIn])
  const current = active ?? defaultIdx
  const memberName = (uid: number) => room?.members.find((m) => m.user_id === uid)?.name ?? '친구'
  const live = useTypingRelayRoom(roomId, current !== null ? (verses[current]?.verse ?? null) : null, {
    onCheer: (ev) => {
      const id = ++cheerSeq.current
      setCheers((prev) => [
        ...prev.slice(-3),
        { id, text: `${ev.name} · ${CHEER_LABEL[ev.kind]}`, hue: hueOf.get(ev.from_user_id) ?? 0 },
      ])
      setTimeout(() => setCheers((prev) => prev.filter((c) => c.id !== id)), 2200)
    },
    onFill: (ev) => {
      const label = room?.verses.find((v) => v.id === ev.verse_id)?.label
      if (ev.baton_to) {
        const me = room?.members.find((m) => m.is_me)?.user_id
        showFlash(
          ev.baton_to === me
            ? `${memberName(ev.by)}님이 내게 바통을 넘겼어요`
            : `${memberName(ev.by)}님이 ${memberName(ev.baton_to)}님에게 바통을 넘겼어요`,
        )
      } else if (label) {
        showFlash(`${memberName(ev.by)}님이 방금 ${label}절을 채웠어요`)
      }
    },
  })

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    [],
  )

  // 지금 쓰는 절을 화면 위쪽으로 — 모바일 키보드가 아래 절반을 덮는다.
  // body 가 스크롤러라 sticky 대신 scrollIntoView 로 붙든다. PC 책상은 무대가 제자리라 필요 없다
  const scrollToActive = useCallback(() => {
    activeRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [])
  useEffect(() => {
    if (current === null || isDesk) return
    const t = setTimeout(scrollToActive, 60)
    return () => clearTimeout(t)
  }, [current, scrollToActive, isDesk])
  // PC 장 지도 — 지금 절 칩이 지도 상자 안에 보이도록(페이지는 건드리지 않는다)
  useEffect(() => {
    if (!isDesk || current === null) return
    const box = mapRef.current
    const chip = box?.querySelector<HTMLElement>(`[data-map-idx="${current}"]`)
    if (!box || !chip) return
    const top = chip.offsetTop - box.offsetTop
    if (top < box.scrollTop || top + chip.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTo({
        top: top - box.clientHeight / 2 + chip.offsetHeight / 2,
        behavior: 'smooth',
      })
    }
  }, [current, isDesk])
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || isDesk) return
    let last = vv.height
    const onResize = () => {
      // 키보드가 올라와 화면이 크게 줄었을 때만 다시 맞춘다
      if (last - vv.height > 120) scrollToActive()
      last = vv.height
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [scrollToActive, isDesk])

  const goTo = (idx: number) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    setDir(current !== null && idx < current ? -1 : 1)
    setActive(idx)
    setAttempt((n) => n + 1)
    setOutcome(null)
    setHandoff(null)
  }

  const nextIndex = (from: number, doneSet: Set<number>) => {
    for (let i = from + 1; i < verses.length; i++) if (!doneSet.has(verses[i].id)) return i
    for (let i = 0; i < from; i++) if (!doneSet.has(verses[i].id)) return i
    return null
  }

  const handleFinish = async (sv: SessionVerse, r: TypingFinish) => {
    const cpm = cpmOf(r.keystrokes, r.durationMs)
    if (r.suspicious) {
      setOutcome({
        status: 'failed',
        accuracy: r.accuracy,
        cpm,
        note: '한꺼번에 들어온 입력은 기록되지 않아요. 직접 써 볼까요?',
      })
      return
    }
    let passed = r.accuracy >= PASS_ACCURACY
    let next: Outcome = { status: 'saving', accuracy: r.accuracy, cpm }
    let reachedGoal = false
    setOutcome(next)
    if (loggedIn) {
      try {
        const res = await submit.mutateAsync({
          verse_id: sv.id,
          mode,
          accuracy: r.accuracy,
          char_count: r.charCount,
          keystrokes: r.keystrokes,
          duration_ms: r.durationMs,
          merged_verse_ids: sv.extraIds,
        })
        passed = res.passed
        reachedGoal =
          res.passed &&
          !goalShownRef.current &&
          (startTodayRef.current ?? 0) < goal &&
          res.today_verses >= goal
        if (reachedGoal) goalShownRef.current = true
        next = {
          status: passed ? 'passed' : 'failed',
          accuracy: res.accuracy,
          cpm: res.cpm,
          newlyRead: res.marked_read_ids.length > 0,
          personalBest: res.personal_best,
          note: res.counted ? undefined : '너무 빠른 입력이라 기록으로 인정되지 않았어요',
        }
      } catch {
        next = {
          status: passed ? 'passed' : 'failed',
          accuracy: r.accuracy,
          cpm,
          note: '기록을 저장하지 못했어요 — 연결을 확인해 주세요',
        }
      }
    } else {
      next = {
        status: passed ? 'passed' : 'failed',
        accuracy: r.accuracy,
        cpm,
      }
    }
    setOutcome(next)
    if (!passed) return
    playTypingSound('done')

    setResults((prev) => [
      ...prev,
      {
        verseId: sv.id,
        accuracy: next.accuracy,
        keystrokes: r.keystrokes,
        durationMs: r.durationMs,
        maxCombo: r.maxCombo,
      },
    ])
    // 이미 다 쓴 장을 다시 쓰는 중이면 남은 절이 없어도 차례로 이어 간다(마지막 절에서 마무리)
    const wasComplete = verses.every((v) => done.has(v.id))
    const newDone = new Set(done)
    newDone.add(sv.id)
    sv.extraIds.forEach((id) => newDone.add(id))
    setSessionDone((prev) => {
      const s = new Set(prev)
      s.add(sv.id)
      sv.extraIds.forEach((id) => s.add(id))
      return s
    })
    const idx = verses.findIndex((v) => v.id === sv.id)
    const ni = wasComplete ? (idx < verses.length - 1 ? idx + 1 : null) : nextIndex(idx, newDone)
    setLastWritten(sv)
    const proceed = () => {
      if (reachedGoal) {
        setGoalMoment({ next: ni })
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#ffb547', '#ffe08a', '#3182f6', '#93c5fd'],
        })
        return
      }
      if (ni === null) {
        setShowSummary(true)
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.7 },
          colors: ['#3182f6', '#60a5fa', '#38bdf8', '#93c5fd'],
        })
      } else {
        goTo(ni)
      }
    }
    advanceTimer.current = setTimeout(
      () => {
        // 릴레이 방에서는 처음 쓴 칸(그리고 장의 마지막 칸)에 바통 시트를 연다 — 매 절마다 막지는 않는다
        if (roomId && loggedIn && (!batonAutoShown.current || ni === null)) {
          batonAutoShown.current = true
          setBaton({ verse: sv, hasNext: ni !== null, then: proceed, reachedGoal })
          return
        }
        proceed()
      },
      next.personalBest ? 1400 : 900,
    )
  }

  const onCheer = (to: { user_id: number; name: string }, kind: TypingCheerKind) => {
    if (!roomId) return
    sendCheer.mutate(
      { id: roomId, to_user_id: to.user_id, kind },
      {
        onSuccess: () => showFlash(`${to.name}님에게 “${CHEER_LABEL[kind]}” 응원을 보냈어요`),
        onError: (e) => showToast(e instanceof Error ? e.message : '응원을 보내지 못했어요', 'error'),
      },
    )
  }

  const closeBaton = () => {
    const then = baton?.then
    setBaton(null)
    then?.()
  }

  // 방금 쓴 칸 다음의 빈칸(없으면 앞쪽 빈칸) — 바통이 가리키는 칸. 방 정보가 아직 새로 오기 전이라 쓴 칸은 직접 뺀다
  const nextOpenLabel = (verseId: number): string | null => {
    if (!room) return null
    const slots = room.verses
    const idx = slots.findIndex((v) => v.id === verseId)
    const ordered = [...slots.slice(idx + 1), ...slots.slice(0, Math.max(idx, 0))]
    return ordered.find((v) => !v.by && v.id !== verseId && !done.has(v.id))?.label ?? null
  }

  const onPassBaton = (toUserId: number | null, message: string | null) => {
    if (!baton || !roomId) return
    const b = baton
    passBaton.mutate(
      { id: roomId, verse_id: b.verse.id, to_user_id: toUserId, message },
      {
        onSuccess: () => {
          if (!toUserId || !b.hasNext) {
            // 한마디만 남겼거나 이어 쓸 칸이 없으면 원래 흐름대로(다음 절·마무리)
            showFlash(toUserId ? `바통이 ${memberName(toUserId)}님에게 넘어갔어요` : '한마디를 남겼어요')
            closeBaton()
            return
          }
          // 바통을 넘겼으면 그 칸은 받은 사람 차례 — 내 화면은 다음 절로 넘어가지 않고 기다린다
          setBaton(null)
          const idx = verses.findIndex((v) => v.id === b.verse.id)
          setHandoff({ toUserId, label: nextOpenLabel(b.verse.id), next: nextIndex(idx, done) })
          if (b.reachedGoal) {
            setGoalMoment({ next: null })
            confetti({
              particleCount: 60,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#ffb547', '#ffe08a', '#3182f6', '#93c5fd'],
            })
          }
        },
        onError: (e) => showToast(e instanceof Error ? e.message : '바통을 넘기지 못했어요', 'error'),
      },
    )
  }

  const nextChapter = useMemo(() => {
    if (!book) return null
    if (chapter < book.chapter_count)
      return {
        book: bookNumber,
        chapter: chapter + 1,
        name: book.book_name_ko,
      }
    const nb = books?.find((b) => b.book_number === bookNumber + 1)
    return nb ? { book: nb.book_number, chapter: 1, name: nb.book_name_ko } : null
  }, [book, books, bookNumber, chapter])

  const doneCount = verses.filter((v) => done.has(v.id)).length
  const summary = useMemo(() => {
    const totalMs = results.reduce((s, r) => s + r.durationMs, 0)
    const keys = results.reduce((s, r) => s + r.keystrokes, 0)
    const acc = results.length ? results.reduce((s, r) => s + r.accuracy, 0) / results.length : 0
    const bestCombo = results.reduce((m, r) => Math.max(m, r.maxCombo), 0)
    return {
      count: results.length,
      totalMs,
      cpm: cpmOf(keys, totalMs),
      acc,
      bestCombo,
    }
  }, [results])

  // 키보드 단축키 — Tab/Shift+Tab 절 이동, Esc 처음부터, 틀린 뒤 Enter 다시 쓰기,
  // 입력칸 밖에서 글자를 치면 바로 입력칸으로. 최신 상태는 ref 로 읽어 리스너는 한 번만 단다
  const keyState = useRef({
    current,
    outcome,
    showSummary,
    goalOpen: goalMoment !== null || baton !== null,
    count: verses.length,
    goTo,
  })
  useEffect(() => {
    keyState.current = {
      current,
      outcome,
      showSummary,
      goalOpen: goalMoment !== null || baton !== null,
      count: verses.length,
      goTo,
    }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = keyState.current
      if (st.showSummary || st.goalOpen || st.current === null) return
      const cur = st.current
      if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const ni = e.shiftKey ? cur - 1 : cur + 1
        e.preventDefault()
        if (ni >= 0 && ni < st.count) st.goTo(ni)
        return
      }
      if (e.isComposing || e.keyCode === 229) return
      if (e.key === 'Escape') {
        if (document.querySelector('[role="dialog"]')) return
        e.preventDefault()
        st.goTo(cur)
        return
      }
      if (e.key === 'Enter' && st.outcome?.status === 'failed') {
        e.preventDefault()
        e.stopPropagation()
        st.goTo(cur)
        return
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const el = document.activeElement
        const typingElsewhere =
          el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable)
        if (!typingElsewhere)
          document.querySelector<HTMLTextAreaElement>('.bt-active .bt-input:not(:disabled)')?.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [])

  const keepAsCard = () => {
    const first = verses.find((v) => results.some((r) => r.verseId === v.id)) ?? verses[0]
    if (!first) return
    navigate('/bible/photo-verse', {
      state: {
        presetVerse: {
          text: first.text,
          refLabel: `${bookName} ${chapter}:${first.label}`,
        },
      },
    })
  }

  const modeLabel = room ? `릴레이 · ${room.title}` : mode === 'memorize' ? '암송 쓰기' : '따라 쓰기'

  // 릴레이 소식 띠 — 방금 일어난 일 > 내게 온 바통 > 지금 쓰는 친구 > 혼자일 때 안내
  const ticker = (() => {
    if (!room) return ''
    if (flash) return flash
    if (room.baton)
      return `${room.baton.name}님이 내게 바통을 넘겼어요${room.baton.message ? ` · “${room.baton.message}”` : ''}`
    if (room.turn) return `${room.turn.name}님이 ${room.turn.label}절을 이어 쓸 차례예요`
    if (live.length) {
      const first = live[0]
      const label = room.verses.find((v) => v.verse === first.verse)?.label ?? first.verse
      return `${memberName(first.user_id)}님이 지금 ${label}절을 쓰고 있어요${live.length > 1 ? ` 외 ${live.length - 1}명` : ''}`
    }
    if (room.completed) return '함께 이 장을 다 채웠어요!'
    return room.members.length > 1 ? '친구 얼굴을 누르면 응원을 보낼 수 있어요' : '아직 나 혼자예요 · 함께 쓸 친구를 불러 봐요'
  })()
  const goToVerse = (verseNo: number) => {
    const i = verses.findIndex((v) => v.verse === verseNo)
    if (i >= 0) goTo(i)
  }
  const myId = room?.members.find((m) => m.is_me)?.user_id

  const renderActive = (v: SessionVerse, i: number) => {
    const isDone = done.has(v.id)
    return (
      <div
        ref={activeRef}
        className={`bt-card bt-active${outcome?.status === 'passed' ? ' is-sealed' : ''}${room ? ' bt-active--room' : ''}`}
      >
        {outcome?.status === 'passed' && (
          <span className="bt-seal" aria-hidden>
            새김
          </span>
        )}
        {room && (
          <RelayLine
            relay={room}
            live={live}
            hueOf={hueOf}
            ticker={ticker}
            canPass={lastWritten !== null && baton === null && !handoff}
            onCheer={onCheer}
            onPass={() => lastWritten && setBaton({ verse: lastWritten, hasNext: true, then: () => undefined })}
          />
        )}
        {room && handoff && (
          <RelayHandoff
            toName={memberName(handoff.toUserId)}
            hue={hueOf.get(handoff.toUserId) ?? 0}
            label={handoff.label}
            onCheer={() => onCheer({ user_id: handoff.toUserId, name: memberName(handoff.toUserId) }, 'pray')}
            onOpenRelay={() => navigate(`/bible/typing/relay/${room.id}`)}
            onHome={() => navigate('/bible/typing')}
            onContinue={handoff.next !== null ? () => goTo(handoff.next!) : null}
          />
        )}
        {room && !handoff && <RelayPrevNote relay={room} verse={v.verse} hueOf={hueOf} />}
        <div className="bt-card__label" hidden={!!handoff}>
          {room ? (
            (() => {
              const slot = room.verses.find((rv) => rv.id === v.id)
              if (!slot?.by) {
                const turn = room.turn
                // '내 차례'는 실제로 내게 바통이 왔을 때만. 남의 차례인 칸도 막지는 않는다
                if (turn && turn.verse === v.verse && turn.user_id !== myId)
                  return (
                    <>
                      <span className="bt-verse-no">
                        {turn.name}님 차례 · {v.label}절
                      </span>
                      <span className="bt-badge">먼저 써도 괜찮아요</span>
                    </>
                  )
                if (turn && turn.verse === v.verse)
                  return <span className="bt-verse-no bt-room-turn">내 차례 · {v.label}절</span>
                return <span className="bt-verse-no">빈칸 · {v.label}절</span>
              }
              return (
                <>
                  <span className="bt-verse-no">{v.label}절</span>
                  <span className="bt-badge">{slot.by.user_id === myId ? '내가 채운 칸' : `${slot.by.name}님이 채운 칸`}</span>
                </>
              )
            })()
          ) : (
            <>
              <span className="bt-verse-no">{v.label}절</span>
              {isDone && outcome?.status !== 'passed' && <span className="bt-badge">이미 쓴 절</span>}
            </>
          )}
        </div>
        {cheers.length > 0 && (
          <div className="bt-room-floats" aria-live="polite">
            {cheers.map((c) => (
              <span key={c.id} className={`bt-room-float bt-hue-${c.hue}`}>
                {c.text}
              </span>
            ))}
          </div>
        )}
        {!handoff && (
        <TypingPad
          key={`${v.id}-${attempt}-${ignorePunct ? 1 : 0}`}
          text={v.text}
          mode={mode}
          ignorePunct={ignorePunct}
          disabled={outcome !== null && outcome.status !== 'failed'}
          onStart={() => setActive(i)}
          onFinish={(r) => void handleFinish(v, r)}
        />
        )}
        {outcome && !handoff && (
          <div className={`bt-outcome bt-outcome--${outcome.status}`} role="status">
            {outcome.status === 'saving' && <span>기록하는 중…</span>}
            {outcome.status === 'passed' && (
              <>
                <span className="material-icons-round" aria-hidden>
                  check_circle
                </span>
                <span>
                  정확도 <b>{Math.round(outcome.accuracy * 100)}%</b> · <b>{outcome.cpm}</b>타/분
                  {outcome.newlyRead && ' · 읽음 완료'}
                </span>
                {outcome.personalBest && <span className="bt-badge bt-badge--best">개인 최고 기록!</span>}
              </>
            )}
            {outcome.status === 'failed' && (
              <>
                <span>
                  {outcome.note ?? (
                    <>
                      정확도 <b>{Math.round(outcome.accuracy * 100)}%</b> — 95% 이상이면 완료돼요
                    </>
                  )}
                </span>
                <span className="bt-outcome__actions">
                  <button type="button" className="bt-btn bt-btn--primary" onClick={() => goTo(i)}>
                    다시 쓰기
                  </button>
                  {i < verses.length - 1 && (
                    <button type="button" className="bt-btn" onClick={() => goTo(i + 1)}>
                      다음 절
                    </button>
                  )}
                </span>
              </>
            )}
            {outcome.status === 'passed' && outcome.note && <span className="bt-outcome__note">{outcome.note}</span>}
          </div>
        )}
      </div>
    )
  }

  const curVerse = current !== null ? verses[current] : null
  const prevVerse = current !== null && current > 0 ? verses[current - 1] : null
  const aheadVerses = current !== null ? verses.slice(current + 1, current + 1 + STAGE_AHEAD) : []
  const ghostText = (v: SessionVerse) => (mode === 'memorize' && !done.has(v.id) ? v.text.replace(/[^\s]/g, '·') : v.text)
  const pct = verses.length ? doneCount / verses.length : 0

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="typing" />

        <main className={`bt-shell bt-shell--session${isDesk ? ' bt-shell--desk' : ''}`}>
          <header className="bt-head">
            <button type="button" className="bt-icon-btn" onClick={() => navigate('/bible/typing')} aria-label="필사 홈으로">
              <span className="material-icons-round">arrow_back</span>
            </button>
            <div className="bt-head__titles">
              <span className="bt-head__eyebrow">{modeLabel}</span>
              <h1 className="bt-head__title">
                {bookName} {chapter}장
              </h1>
            </div>
            <button
              type="button"
              className={`bt-chip${ignorePunct ? ' is-on' : ''}`}
              onClick={() => setIgnorePunct(!ignorePunct)}
              aria-pressed={ignorePunct}
              title="쉼표·마침표 같은 문장부호를 치지 않아도 되게 합니다"
            >
              부호 무시
            </button>
            <SoundMenu />
          </header>

          {!isDesk && (
            <div className="bt-session-progress">
              <div className="bt-session-progress__bar">
                <span
                  style={{
                    width: `${verses.length ? (doneCount / verses.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="bt-session-progress__text">
                {doneCount}/{verses.length}절
              </span>
            </div>
          )}

          {room && !isDesk && (
            <RelayBoard relay={room} live={live} hueOf={hueOf} currentVerse={curVerse?.verse ?? null} onPick={goToVerse} />
          )}

          {!loggedIn && (
            <p className="bt-note">
              지금은 연습으로만 쓸 수 있어요. <Link to="/login">로그인</Link>
              하면 필사 기록·읽음 처리·칭호가 저장돼요.
            </p>
          )}

          {isLoading && <p className="bt-empty">말씀을 불러오는 중…</p>}
          {error && <p className="bt-empty">말씀을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>}

          {isDesk && curVerse ? (
            <div className="bt-desk">
              <section className="bt-stage" style={{ ['--bt-dir' as string]: dir }}>
                {prevVerse && (
                  <button
                    key={`p${prevVerse.id}`}
                    type="button"
                    className="bt-stage__ctx bt-stage__ctx--prev"
                    onClick={() => goTo(current! - 1)}
                  >
                    <span className="bt-verse-no">{prevVerse.label}</span>
                    <span className="bt-stage__ctx-text">{ghostText(prevVerse)}</span>
                    {done.has(prevVerse.id) && (
                      <span className="material-icons-round bt-row__check" aria-label="필사 완료">
                        check_circle
                      </span>
                    )}
                  </button>
                )}
                <div key={curVerse.id} className="bt-stage__slide">
                  {renderActive(curVerse, current!)}
                </div>
                {aheadVerses.map((v, k) => (
                  <button
                    key={`n${v.id}`}
                    type="button"
                    className="bt-stage__ctx bt-stage__ctx--next"
                    style={{ ['--bt-fade' as string]: k }}
                    onClick={() => goTo(current! + 1 + k)}
                  >
                    <span className="bt-verse-no">{v.label}</span>
                    <span className="bt-stage__ctx-text">{ghostText(v)}</span>
                    {done.has(v.id) && (
                      <span className="material-icons-round bt-row__check" aria-label="필사 완료">
                        check_circle
                      </span>
                    )}
                  </button>
                ))}
                <p className="bt-keys" aria-label="키보드 단축키">
                  <span>
                    <kbd>Tab</kbd> 다음 절
                  </span>
                  <span>
                    <kbd>Shift</kbd>+<kbd>Tab</kbd> 앞 절
                  </span>
                  <span>
                    <kbd>Esc</kbd> 처음부터
                  </span>
                  <span>
                    <kbd>Enter</kbd> 완료·다시 쓰기
                  </span>
                  {mode === 'memorize' && (
                    <>
                      <span>
                        <kbd>Alt</kbd>+<kbd>H</kbd> 초성
                      </span>
                      <span>
                        <kbd>Alt</kbd>+<kbd>P</kbd> 잠깐 보기
                      </span>
                    </>
                  )}
                </p>
              </section>

              <aside className="bt-desk__side" aria-label="장 진행">
                {room && (
                  <RelayBoard relay={room} live={live} hueOf={hueOf} currentVerse={curVerse.verse} onPick={goToVerse} />
                )}
                <div className="bt-card bt-ringcard">
                  <div className="bt-ring" role="img" aria-label={`${verses.length}절 중 ${doneCount}절 필사`}>
                    <svg viewBox="0 0 100 100" aria-hidden>
                      <circle className="bt-ring__track" cx="50" cy="50" r="44" />
                      <circle
                        className="bt-ring__fill"
                        cx="50"
                        cy="50"
                        r="44"
                        strokeDasharray={RING_C}
                        strokeDashoffset={RING_C * (1 - pct)}
                      />
                    </svg>
                    <span className="bt-ring__label">
                      <b className="brand-text-gradient">{Math.round(pct * 100)}</b>
                      <small>%</small>
                    </span>
                  </div>
                  <div className="bt-ringcard__body">
                    <span className="bt-ringcard__count">
                      {doneCount}/{verses.length}절
                    </span>
                    <span className="bt-ringcard__sub">
                      {doneCount === verses.length && verses.length > 0 ? '이 장을 다 새겼어요' : `${verses.length - doneCount}절 남았어요`}
                    </span>
                  </div>
                </div>

                <dl className="bt-card bt-sessionstats">
                  <div>
                    <dt>이번에 쓴 절</dt>
                    <dd>{summary.count}</dd>
                  </div>
                  <div>
                    <dt>평균 타수</dt>
                    <dd>{summary.cpm}</dd>
                  </div>
                  <div>
                    <dt>정확도</dt>
                    <dd>{summary.count ? `${Math.round(summary.acc * 100)}%` : '–'}</dd>
                  </div>
                  <div>
                    <dt>최고 연속</dt>
                    <dd>{summary.bestCombo}</dd>
                  </div>
                </dl>

                <div className="bt-card bt-map">
                  <p className="bt-map__title">장 지도</p>
                  <div ref={mapRef} className="bt-map__grid">
                    {verses.map((v, i) => (
                      <button
                        key={v.id}
                        type="button"
                        data-map-idx={i}
                        className={[
                          'bt-map__chip',
                          done.has(v.id) ? 'is-done' : '',
                          sessionDone.has(v.id) ? 'is-fresh' : '',
                          i === current ? 'is-now' : '',
                        ].join(' ')}
                        onClick={() => goTo(i)}
                        title={mode === 'memorize' && !done.has(v.id) ? `${v.label}절` : `${v.label}절 · ${v.text}`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            <ol className="bt-verses">
              {verses.map((v, i) => {
                const isActive = i === current
                const isDone = done.has(v.id)
                if (isActive) return <li key={v.id}>{renderActive(v, i)}</li>
                return (
                  <li key={v.id}>
                    <button type="button" className={`bt-row${isDone ? ' is-done' : ''}`} onClick={() => goTo(i)}>
                      <span className="bt-verse-no">{v.label}</span>
                      <span className={`bt-row__text${mode === 'memorize' && !isDone ? ' is-masked' : ''}`}>
                        {mode === 'memorize' && !isDone ? v.text.replace(/[^\s]/g, '·') : v.text}
                      </span>
                      {isDone && (
                        <span className="material-icons-round bt-row__check" aria-label="필사 완료">
                          check_circle
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </main>
      </div>

      {baton && room && (
        <BatonSheet
          relay={room}
          verseLabel={baton.verse.label}
          liveIds={new Set(live.map((l) => l.user_id))}
          hueOf={hueOf}
          hasNext={baton.hasNext}
          sending={passBaton.isPending}
          onPass={onPassBaton}
          onClose={closeBaton}
        />
      )}

      {goalMoment && (
        <div className="bt-summary" role="dialog" aria-modal="true" aria-labelledby="bt-goal-title">
          <div className="bt-summary__card bt-goalmoment">
            <Lamp fill={1} lit full className="bt-goalmoment__lamp" />
            <p className="bt-summary__eyebrow">오늘의 목표 {goal}절 달성</p>
            <h2 id="bt-goal-title" className="bt-summary__title">
              오늘의 등잔이 가득 찼어요
            </h2>
            {stats && stats.current_streak > 0 && (
              <p className="bt-goalmoment__streak">
                <b>{stats.current_streak}</b>일째 등불이 이어지고 있어요
              </p>
            )}
            {(() => {
              const nv = goalMoment.next !== null ? verses[goalMoment.next] : null
              const ref = nv ? `${bookName} ${chapter}:${nv.label}` : nextChapter ? `${nextChapter.name} ${nextChapter.chapter}장` : null
              if (!ref) return null
              return (
                <div className="bt-goalmoment__tomorrow">
                  <span className="bt-goalmoment__eyebrow">내일 이어질 말씀 · {ref}</span>
                  <span className="bt-goalmoment__text">{nv ? `“${teaser(nv.text, 3)}”` : '새 장이 기다리고 있어요'}</span>
                </div>
              )
            })()}
            <div className="bt-summary__actions">
              <button
                type="button"
                className="bt-btn bt-btn--primary bt-btn--block"
                onClick={() => {
                  const ni = goalMoment.next
                  setGoalMoment(null)
                  // 바통을 넘기고 기다리는 중이면 그 화면으로 돌아간다
                  if (handoff) return
                  if (ni === null) setShowSummary(true)
                  else goTo(ni)
                }}
              >
                {handoff ? '확인' : '조금 더 쓰기'}
              </button>
              <button type="button" className="bt-btn bt-btn--ghost bt-btn--block" onClick={() => navigate('/bible/typing')}>
                오늘은 여기까지
              </button>
            </div>
          </div>
        </div>
      )}

      {showSummary && (
        <div className="bt-summary" role="dialog" aria-modal="true" aria-labelledby="bt-summary-title">
          <div className="bt-summary__card">
            <span className="bt-summary__seal" aria-hidden>
              <span className="material-icons-round">history_edu</span>
            </span>
            <p className="bt-summary__eyebrow">필사 완료</p>
            <h2 id="bt-summary-title" className="bt-summary__title">
              {bookName} {chapter}장을 온전히 새겼어요
            </h2>
            <dl className="bt-summary__stats">
              <div>
                <dt>이번에 쓴 절</dt>
                <dd className="brand-text-gradient">{summary.count}</dd>
              </div>
              <div>
                <dt>평균 타수</dt>
                <dd className="brand-text-gradient">{summary.cpm}</dd>
              </div>
              <div>
                <dt>정확도</dt>
                <dd className="brand-text-gradient">{Math.round(summary.acc * 100)}%</dd>
              </div>
            </dl>
            <p className="bt-summary__time">
              걸린 시간 {formatDuration(summary.totalMs)}
              {summary.bestCombo >= 10 && <> · 최고 {summary.bestCombo}자 연속 정확</>}
            </p>
            <div className="bt-summary__actions">
              {nextChapter && (
                <button
                  type="button"
                  className="bt-btn bt-btn--primary bt-btn--block"
                  onClick={() => {
                    setShowSummary(false)
                    setResults([])
                    setSessionDone(new Set())
                    setActive(null)
                    setOutcome(null)
                    navigate(sessionPath(nextChapter.book, nextChapter.chapter, mode), { replace: true })
                  }}
                >
                  이어서 {nextChapter.name} {nextChapter.chapter}장 쓰기
                </button>
              )}
              <button type="button" className="bt-btn bt-btn--block" onClick={keepAsCard}>
                말씀 카드로 간직하기
              </button>
              <button type="button" className="bt-btn bt-btn--ghost bt-btn--block" onClick={() => navigate('/bible/typing')}>
                필사 홈으로
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TypingSession
