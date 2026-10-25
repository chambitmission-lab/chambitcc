import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import { useBibleBooks, useBibleChapter } from '../../../hooks/useBible'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import {
  useChapterTyping,
  useCreateTypingRelay,
  usePassTypingBaton,
  useSendRelayGlossView,
  useSendTogetherCheer,
  useSendTypingCheer,
  useSubmitTyping,
  useTypingRelay,
  useTypingRelayLive,
  useTypingRelayRoom,
  useTypingRelays,
  useTypingStats,
  useTypingTogether,
} from '../../../hooks/useBibleTyping'
import { showToast } from '../../../utils/toast'
import { tokenStore } from '../../../utils/tokenStore'
import type { TypingChapterPerson, TypingCheerKind, TypingMode } from '../../../api/bibleTyping'
import type { BibleVerse } from '../../../types/bible'
import TypingPad, { type TypingFinish, type TypingMark } from './TypingPad'
import { PASS_ACCURACY, cpmOf, typingSource } from './hangulTyping'
import { formatDuration, sessionPath, useIgnorePunct } from './typingPrefs'
import { playTypingSound } from './typingSound'
import SoundMenu from './SoundMenu'
import Lamp from './home/Lamp'
import { teaser } from './home/teaser'
import { BatonSheet, RelayBoard, RelayHandoff, RelayLine, RelayPrevNote } from './RelayRoom'
import RelayInviteSheet from './RelayInviteSheet'
import { RoomBanner, RoomFeed, RoomMembers, type RoomFeedItem } from './RelayStudyRoom'
import TypingGlossary, { type GlossaryViewer } from './TypingGlossary'
import { InviteCard, TogetherPanel, TogetherStrip } from './TypingTogether'
import { CHEER_LABEL, hueOfKey, relayHueMap } from './relayShare'
import { isGlossaryReady, loadGlossary, matchGlossary, type GlossaryEntry } from '../data/bibleGlossary'
import './typing.css'
import './together.css'
import { useTickingNow } from '../../../hooks/useTickingNow'
import { safeStorage } from '../../../utils/safeStorage'
import { chapterUnit } from '../../../utils/bibleLabels'

interface SessionVerse {
  id: number
  verse: number
  label: string
  text: string
  /** 병합 구간의 딸린 절 id — 함께 읽음 처리한다 */
  extraIds: number[]
}

interface Outcome {
  status: 'passed' | 'failed'
  /** 저장 응답이 늦게 와도 지금 이 절의 결과에만 붙이도록 */
  verseId: number
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
// 주소로 정해진 절에 처음 내려앉은 뒤, 늦게 도착한 내용에 밀려도 자리를 다시 맞추는 시간
const LAND_HOLD_MS = 1500
// 방 소식에 남겨 두는 개수
const FEED_MAX = 8
// '내 이름 숨기고 쓰기' — 기기별 기억
const ANON_KEY = 'bt-together-anon'
const readAnon = () => safeStorage.get(ANON_KEY) === '1'

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

const TypingSessionView = () => {
  const navigate = useNavigate()
  const params = useParams()
  const [search, setSearch] = useSearchParams()
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
  const { data: relay, refetch: refetchRelay } = useTypingRelay(relayParam || autoRelayId)
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
  const floatCheer = useCallback((text: string, hue: number) => {
    const id = ++cheerSeq.current
    setCheers((prev) => [...prev.slice(-3), { id, text, hue }])
    setTimeout(() => setCheers((prev) => prev.filter((c) => c.id !== id)), 2200)
  }, [])
  // 방 소식(PC 독서실) — 이 화면에 있는 동안 일어난 일
  const [feed, setFeed] = useState<RoomFeedItem[]>([])
  const feedSeq = useRef(0)
  const pushFeed = useCallback((text: string, hue: number | null) => {
    const id = ++feedSeq.current
    setFeed((prev) => [{ id, text, hue, at: Date.now() }, ...prev].slice(0, FEED_MAX))
  }, [])
  // 방 소식의 "n분 전"은 PC 독서실에서만 보인다 — 그때만, 탭이 보일 때만 흐른다
  const clock = useTickingNow(30_000, isDesk && !!room)
  const [inviting, setInviting] = useState(false)
  const createRelay = useCreateTypingRelay()
  const sendGlossView = useSendRelayGlossView()
  const sendTogetherCheer = useSendTogetherCheer()
  const [anon, setAnonState] = useState(readAnon)
  const setAnon = (v: boolean) => {
    setAnonState(v)
    safeStorage.set(ANON_KEY, v ? '1' : '0')
  }
  // 알아두면 좋은 말 — 사전은 코드 분할이라 처음 필요할 때 받는다
  const [glossReady, setGlossReady] = useState(isGlossaryReady)
  useEffect(() => {
    if (glossReady) return
    let alive = true
    loadGlossary()
      .then(() => alive && setGlossReady(true))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [glossReady])
  // 펼친 풀이는 절에 묶는다 — 다른 절로 가면 저절로 접힌다
  const [glossState, setGlossState] = useState<{ verseId: number; term: string } | null>(null)
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
  /** 내가 마지막 빈칸을 채워 릴레이가 완성된 순간 — personalNext 는 내가 아직 안 써 본 절(더 써 보기용) */
  const [relayDone, setRelayDone] = useState<{ personalNext: number | null } | null>(null)
  // 오늘 목표 달성 모먼트 — 세션을 열 때 이미 채웠으면 띄우지 않고, 넘는 순간 한 번만
  const goal = stats?.daily_goal ?? 3
  const startTodayRef = useRef<number | null>(null)
  useEffect(() => {
    if (startTodayRef.current === null && stats) startTodayRef.current = stats.today_verses
  }, [stats])
  const goalShownRef = useRef(false)
  /** 목표를 채운 순간 — next 는 이어 쓸 절 인덱스(장 끝이면 null) */
  // resume — 저장 응답이 다음 절로 넘어간 뒤에 와서 띄운 경우. 닫으면 쓰던 절 그대로 둔다
  const [goalMoment, setGoalMoment] = useState<{ next: number | null; resume?: boolean } | null>(null)

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
  const outcomeRef = useRef(outcome)
  useEffect(() => {
    outcomeRef.current = outcome
  }, [outcome])
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
  // 저장 응답이 늦게 왔을 때 '지금 쓰는 절'을 알기 위해
  const currentRef = useRef(current)
  useEffect(() => {
    currentRef.current = current
  }, [current])
  const memberName = (uid: number) => room?.members.find((m) => m.user_id === uid)?.name ?? '친구'
  const live = useTypingRelayRoom(roomId, current !== null ? (verses[current]?.verse ?? null) : null, {
    onCheer: (ev) => {
      const hue = hueOf.get(ev.from_user_id) ?? 0
      floatCheer(`${ev.name} · ${CHEER_LABEL[ev.kind]}`, hue)
      pushFeed(`${ev.name}님이 내게 “${CHEER_LABEL[ev.kind]}”`, hue)
    },
    onFill: (ev) => {
      const label = room?.verses.find((v) => v.id === ev.verse_id)?.label
      const hue = hueOf.get(ev.by) ?? null
      if (ev.baton_to) {
        const me = room?.members.find((m) => m.is_me)?.user_id
        const text =
          ev.baton_to === me
            ? `${memberName(ev.by)}님이 내게 바통을 넘겼어요`
            : `${memberName(ev.by)}님이 ${memberName(ev.baton_to)}님에게 바통을 넘겼어요`
        showFlash(text)
        pushFeed(text, hue)
      } else if (label) {
        showFlash(`${memberName(ev.by)}님이 방금 ${label}절을 채웠어요`)
        pushFeed(`${memberName(ev.by)}님이 ${label}절을 채웠어요`, hue)
      }
    },
    onGloss: (ev) => {
      pushFeed(`${memberName(ev.user_id)}님이 ‘${ev.term}’ 풀이를 열어 봤어요`, hueOf.get(ev.user_id) ?? null)
    },
  })

  // 혼자 쓸 때 — 지금 이 장을 쓰는 사람. 릴레이 방이면(또는 방인지 아직 모르면) 켜지 않는다
  const roomPending = loggedIn && (myRelays === undefined || (!!relayParam && relay === undefined))
  const together = useTypingTogether(bookNumber, chapter, current !== null ? (verses[current]?.verse ?? null) : null, {
    enabled: loggedIn && !room && !roomPending,
    anon,
    onCheer: (ev) => {
      const who = ev.name ?? '익명 성도'
      floatCheer(`${who} · ${CHEER_LABEL[ev.kind]}`, ev.name ? hueOfKey(ev.from_key) : 0)
      showFlash(`${who}님이 내게 “${CHEER_LABEL[ev.kind]}” 응원을 보냈어요`)
    },
    onWritten: (ev) => {
      showFlash(`방금 ${ev.name ?? '익명 성도'}님이 ${ev.verse}절을 다 썼어요`)
    },
  })
  const onTogetherCheer = (to: TypingChapterPerson, kind: TypingCheerKind) =>
    sendTogetherCheer.mutate(
      { book_number: bookNumber, chapter, to_key: to.key, kind },
      {
        onSuccess: () => showFlash(`${to.name ?? '익명 성도'}님에게 “${CHEER_LABEL[kind]}” 응원을 보냈어요`),
        onError: (e) => showToast(e instanceof Error ? e.message : '응원을 보내지 못했어요', 'error'),
      },
    )

  // 방에 처음 들어왔을 때 — 바통 한마디를 방 소식의 바닥으로 깔아 둔다(언제였는지는 모른다)
  const feedSeeded = useRef(0)
  useEffect(() => {
    if (!room || feedSeeded.current === room.id) return
    feedSeeded.current = room.id
    const notes = room.verses
      .filter((v) => v.note)
      .slice(-3)
      .reverse()
      .map((v) => ({
        id: ++feedSeq.current,
        hue: hueOf.get(v.note!.user_id) ?? null,
        text: `${v.note!.name} · ${v.label}절 “${v.note!.message}”`,
        at: null,
      }))
    setFeed((prev) => [...prev, ...notes].slice(0, FEED_MAX))
  }, [room, hueOf])

  // 방 만들기로 들어왔으면(?invite=1) 초대 시트를 연다 — 닫을 때 주소에서 뺀다
  const inviteFromUrl = !!room && search.get('invite') === '1'
  const showInvite = inviting || inviteFromUrl
  const closeInvite = () => {
    setInviting(false)
    if (!inviteFromUrl) return
    const next = new URLSearchParams(search)
    next.delete('invite')
    setSearch(next, { replace: true })
  }

  const onCreateRoom = () => {
    if (!loggedIn) return
    createRelay.mutate(
      { book_number: bookNumber, chapter },
      {
        onSuccess: (r) => {
          const next = new URLSearchParams(search)
          next.set('relay', String(r.id))
          next.set('invite', '1')
          setSearch(next, { replace: true })
        },
        onError: (e) => showToast(e instanceof Error ? e.message : '방을 만들지 못했어요', 'error'),
      },
    )
  }

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
  // 주소로 정해진 절(?v=, 알림·릴레이에서 들어옴)에 처음 내려앉을 때는 smooth 한 번으로 끝내지 않는다.
  // 모바일은 본문 뒤로 릴레이 칸 판·소식 띠가 늦게 도착해 레이아웃이 밀리고, 그 사이 smooth 스크롤이
  // 취소돼 맨 위에 머물렀다. 즉시 이동 후 잠깐 동안 자리를 다시 맞추고, 사용자가 만지면 바로 멈춘다
  const landedRef = useRef(false)
  useEffect(() => {
    if (current === null || isDesk) return
    if (landedRef.current) {
      const t = setTimeout(scrollToActive, 60)
      return () => clearTimeout(t)
    }
    landedRef.current = true
    const until = performance.now() + LAND_HOLD_MS
    let stopped = false
    let raf = 0
    const stop = () => {
      stopped = true
      cancelAnimationFrame(raf)
      window.removeEventListener('touchstart', stop, true)
      window.removeEventListener('wheel', stop, true)
    }
    window.addEventListener('touchstart', stop, { passive: true, capture: true })
    window.addEventListener('wheel', stop, { passive: true, capture: true })
    const pin = () => {
      if (stopped) return
      const el = activeRef.current
      if (el) {
        const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
        if (Math.abs(el.getBoundingClientRect().top - margin) > 4)
          el.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior })
      }
      if (performance.now() < until) raf = requestAnimationFrame(pin)
      else stop()
    }
    raf = requestAnimationFrame(pin)
    return stop
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

  const handleFinish = (sv: SessionVerse, r: TypingFinish) => {
    const cpm = cpmOf(r.keystrokes, r.durationMs)
    if (r.suspicious) {
      setOutcome({
        status: 'failed',
        verseId: sv.id,
        accuracy: r.accuracy,
        cpm,
        note: '한꺼번에 들어온 입력은 기록되지 않아요. 직접 써 볼까요?',
      })
      return
    }
    // 통과 판정은 이 자리에서 끝난다(정확도 95%) — 서버 저장을 기다리지 않고 바로 '새김'을 보여 주고
    // 다음 절로 넘어간다. 저장은 뒤에서 하고, 서버가 인정하지 않으면(너무 빠른 입력 등) 되돌리고 알린다
    const passed = r.accuracy >= PASS_ACCURACY
    const next: Outcome = { status: passed ? 'passed' : 'failed', verseId: sv.id, accuracy: r.accuracy, cpm }
    // 목표 달성은 서버의 오늘 절 수로만 안다 — 넘어가기 전에 응답이 오면 그 흐름에서, 늦으면 따로 띄운다
    const pending = { reachedGoal: false, advanced: false }
    setOutcome(next)
    if (loggedIn) {
      const label = sv.label
      submit
        .mutateAsync({
          verse_id: sv.id,
          mode,
          accuracy: r.accuracy,
          char_count: r.charCount,
          keystrokes: r.keystrokes,
          duration_ms: r.durationMs,
          merged_verse_ids: sv.extraIds,
        })
        .then((res) => {
          if (!passed) return
          if (!res.passed) {
            rollback(sv)
            const note = res.counted ? '정확도가 조금 모자라 기록되지 않았어요' : '너무 빠른 입력이라 기록으로 인정되지 않았어요'
            if (!patchOutcome(sv.id, { status: 'failed', note })) showToast(`${label}절 — ${note}`, 'error')
            return
          }
          patchOutcome(sv.id, {
            accuracy: res.accuracy,
            cpm: res.cpm,
            newlyRead: res.marked_read_ids.length > 0,
            personalBest: res.personal_best,
          })
          if (
            !goalShownRef.current &&
            (startTodayRef.current ?? 0) < goal &&
            res.today_verses >= goal
          ) {
            goalShownRef.current = true
            if (!pending.advanced) pending.reachedGoal = true
            else {
              setGoalMoment({ next: currentRef.current, resume: true })
              celebrateGoal()
            }
          }
        })
        .catch(() => {
          if (!passed) return
          rollback(sv)
          const note = '기록을 저장하지 못했어요 — 연결을 확인해 주세요'
          if (!patchOutcome(sv.id, { status: 'failed', note })) showToast(`${label}절 — ${note}`, 'error')
        })
    }
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
    const proceed = (to: number | null) => {
      if (pending.reachedGoal) {
        setGoalMoment({ next: to })
        celebrateGoal()
        return
      }
      if (to === null) {
        setShowSummary(true)
        playTypingSound('finish')
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.7 },
          colors: ['#3182f6', '#60a5fa', '#38bdf8', '#93c5fd'],
        })
      } else {
        goTo(to)
      }
    }
    // 진행 중인 릴레이 방에서 '다음 칸'은 내가 안 쓴 절이 아니라 릴레이의 빈칸이다
    // (남이 채운 칸으로 보내면 다 채운 뒤에도 1절부터 다시 쓰라고 하게 된다)
    const inRoom = !!room && loggedIn && !room.completed
    const written = new Set(sessionDone)
    written.add(sv.id)
    sv.extraIds.forEach((id) => written.add(id))
    const relayNext = inRoom ? relayNextIndex(sv.id, written) : null
    advanceTimer.current = setTimeout(
      () => {
        pending.advanced = true
        const reachedGoal = pending.reachedGoal
        if (inRoom) {
          if (relayNext === null) {
            // 마지막 빈칸을 내가 채웠다 — 바통 대신 함께 완성한 순간
            setRelayDone({ personalNext: ni })
            void refetchRelay()
            playTypingSound('finish')
            confetti({
              particleCount: 140,
              spread: 95,
              origin: { y: 0.55 },
              colors: ['#3182f6', '#60a5fa', '#ffb547', '#ffe08a'],
            })
            return
          }
          // 처음 쓴 칸에만 바통 시트를 자동으로 연다 — 매 절마다 막지는 않는다
          if (!batonAutoShown.current) {
            batonAutoShown.current = true
            setBaton({ verse: sv, hasNext: true, then: () => proceed(relayNext), reachedGoal })
            return
          }
          proceed(relayNext)
          return
        }
        proceed(ni)
      },
      900,
    )
  }

  /** 지금 화면의 결과가 그 절 것일 때만 고친다 — 이미 다음 절로 넘어갔으면 false */
  const patchOutcome = (verseId: number, patch: Partial<Outcome>) => {
    const prev = outcomeRef.current
    if (!prev || prev.verseId !== verseId || prev.status !== 'passed') return false
    // 넘어가기 전에 거절이 오면 넘어가지 않고 이 자리에서 다시 쓰게 한다
    if (patch.status === 'failed' && advanceTimer.current) clearTimeout(advanceTimer.current)
    setOutcome({ ...prev, ...patch })
    return true
  }

  /** 서버가 인정하지 않은 절 — 이번 세션의 '쓴 절'·결과에서 뺀다 */
  const rollback = (sv: SessionVerse) => {
    const ids = new Set([sv.id, ...sv.extraIds])
    setSessionDone((prev) => new Set([...prev].filter((id) => !ids.has(id))))
    setResults((prev) => prev.filter((x) => x.verseId !== sv.id))
  }

  const celebrateGoal = () => {
    playTypingSound('finish')
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#ffb547', '#ffe08a', '#3182f6', '#93c5fd'],
    })
  }

  const onCheer = (to: { user_id: number; name: string }, kind: TypingCheerKind) => {
    if (!roomId) return
    sendCheer.mutate(
      { id: roomId, to_user_id: to.user_id, kind },
      {
        onSuccess: () => {
          showFlash(`${to.name}님에게 “${CHEER_LABEL[kind]}” 응원을 보냈어요`)
          pushFeed(`내가 ${to.name}님에게 “${CHEER_LABEL[kind]}”`, null)
        },
        onError: (e) => showToast(e instanceof Error ? e.message : '응원을 보내지 못했어요', 'error'),
      },
    )
  }

  const closeBaton = () => {
    const then = baton?.then
    setBaton(null)
    then?.()
  }

  // 방금 쓴 칸 다음의 릴레이 빈칸(없으면 앞쪽 빈칸) → 세션 절 인덱스. 바통이 가리키는 칸이기도 하다.
  // 방 정보가 아직 새로 오기 전일 수 있어 이번에 쓴 칸(written)은 직접 뺀다
  function relayNextIndex(fromId: number, written: Set<number>): number | null {
    if (!room) return null
    const slots = room.verses
    const at = slots.findIndex((v) => v.id === fromId)
    const ordered = [...slots.slice(at + 1), ...slots.slice(0, Math.max(at, 0))]
    const slot = ordered.find((v) => !v.by && !written.has(v.id))
    if (!slot) return null
    const i = verses.findIndex((v) => v.id === slot.id)
    return i < 0 ? null : i
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
          const written = new Set(sessionDone)
          written.add(b.verse.id)
          const ni = relayNextIndex(b.verse.id, written)
          setHandoff({ toUserId, label: ni !== null ? verses[ni].label : null, next: ni })
          if (b.reachedGoal) {
            setGoalMoment({ next: null })
            playTypingSound('finish')
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
    goalOpen: goalMoment !== null || baton !== null || relayDone !== null,
    count: verses.length,
    goTo,
  })
  useEffect(() => {
    keyState.current = {
      current,
      outcome,
      showSummary,
      goalOpen: goalMoment !== null || baton !== null || relayDone !== null,
      count: verses.length,
      goTo,
    }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = keyState.current
      if (st.showSummary || st.goalOpen || st.current === null) return
      // 한 줄 남기기 입력칸에서는 절 이동·처음부터 단축키를 쓰지 않는다
      const focusEl = document.activeElement
      if (focusEl instanceof HTMLInputElement && focusEl.closest('.bt-gloss')) return
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
  const unit = chapterUnit(bookNumber)

  // 지금 절의 알아두면 좋은 말 — 필사 판이 그리는 원문(typingSource) 기준으로 찾는다
  const activeVerse = current !== null ? verses[current] : null
  const gloss = useMemo((): { entries: GlossaryEntry[]; marks: TypingMark[] } => {
    if (!glossReady || !activeVerse || mode === 'memorize') return { entries: [], marks: [] }
    const found = matchGlossary(bookNumber, typingSource(activeVerse.text))
    const entries: GlossaryEntry[] = []
    found.forEach((m) => {
      if (!entries.includes(m.entry)) entries.push(m.entry)
    })
    return { entries, marks: found.map((m) => ({ id: m.entry.name, start: m.start, end: m.end })) }
  }, [glossReady, activeVerse, mode, bookNumber])
  const glossOpen = glossState && glossState.verseId === activeVerse?.id ? glossState.term : null
  const toggleGloss = (term: string) => {
    const opening = glossOpen !== term
    setGlossState(opening && activeVerse ? { verseId: activeVerse.id, term } : null)
    if (opening && room && myId !== undefined && !(room.gloss_views?.[term] ?? []).includes(myId))
      sendGlossView.mutate({ id: room.id, term })
  }
  const viewersOf = room
    ? (term: string): GlossaryViewer[] =>
        (room.gloss_views?.[term] ?? [])
          .filter((uid) => uid !== myId)
          .map((uid) => ({ user_id: uid, name: memberName(uid), hue: hueOf.get(uid) ?? 0 }))
    : undefined
  const canPassBaton =
    !!room && lastWritten !== null && baton === null && !handoff && !room.completed && room.verses.some((rv) => !rv.by)
  const openBaton = () => lastWritten && setBaton({ verse: lastWritten, hasNext: true, then: () => undefined })

  const renderActive = (v: SessionVerse, i: number) => {
    const isDone = done.has(v.id)
    return (
      <div
        ref={activeRef}
        className={`bt-card bt-active${outcome?.status === 'passed' ? ' is-sealed' : ''}${room ? ' bt-active--room' : ''}`}
      >
        {room && !isDesk && (
          <RelayLine
            relay={room}
            live={live}
            hueOf={hueOf}
            ticker={ticker}
            canPass={canPassBaton}
            onCheer={onCheer}
            onPass={openBaton}
          />
        )}
        {!room && !isDesk && loggedIn && (
          <TogetherStrip
            people={together.people}
            todayWriters={together.todayWriters}
            ticker={flash}
            unit={unit}
            onCheer={onTogetherCheer}
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
          {/* 새김 도장 — 카드 모서리가 아니라 절 번호 줄에 붙인다(위에 함께 쓰는 줄이 와도 겹치지 않게) */}
          {outcome?.status === 'passed' && (
            <span className="bt-seal" aria-hidden>
              새김
            </span>
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
          marks={gloss.marks}
          activeMark={glossOpen}
          onMarkClick={toggleGloss}
        />
        )}
        {outcome && !handoff && (
          <div className={`bt-outcome bt-outcome--${outcome.status}`} role="status">
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
        {!handoff && (
          <TypingGlossary
            entries={gloss.entries}
            active={glossOpen}
            onToggle={toggleGloss}
            where={{ book_number: bookNumber, chapter, verse_id: v.id }}
            loggedIn={loggedIn}
            viewersOf={viewersOf}
          />
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

          {isDesk && room && (
            <RoomBanner
              relay={room}
              canPass={canPassBaton}
              onInvite={() => setInviting(true)}
              onPass={openBaton}
              onOpenRelay={() => navigate(`/bible/typing/relay/${room.id}`)}
            />
          )}

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
                  <>
                    <RoomMembers relay={room} live={live} hueOf={hueOf} onCheer={onCheer} />
                    <RelayBoard relay={room} live={live} hueOf={hueOf} currentVerse={curVerse.verse} onPick={goToVerse} />
                    <RoomFeed items={feed} now={clock} />
                  </>
                )}
                {!room && (
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
                    {stats && (
                      <span className="bt-ringcard__today">
                        오늘 <b>{stats.today_verses}절</b> · 목표 {goal}절
                        {stats.current_streak > 0 && <> · {stats.current_streak}일째</>}
                      </span>
                    )}
                  </div>
                </div>
                )}

                {!room && loggedIn && (
                  <TogetherPanel
                    people={together.people}
                    todayWriters={together.todayWriters}
                    ticker={flash}
                    unit={unit}
                    onCheer={onTogetherCheer}
                    anon={anon}
                    onAnon={setAnon}
                  />
                )}
                {!room && loggedIn && <InviteCard unit={unit} busy={createRelay.isPending} onCreate={onCreateRoom} />}

                {!room && (
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
                        {(() => {
                          const p = together.people.find((pp) => pp.verse === v.verse)
                          return p ? (
                            <i className={`bt-map__dot${p.name ? ` bt-hue-${hueOfKey(p.key)}` : ' is-anon'}`} aria-hidden />
                          ) : null
                        })()}
                      </button>
                    ))}
                  </div>
                </div>
                )}
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
          {!isDesk && !room && loggedIn && verses.length > 0 && (
            <InviteCard unit={unit} busy={createRelay.isPending} onCreate={onCreateRoom} />
          )}
        </main>
      </div>

      {showInvite && room && <RelayInviteSheet relay={room} onClose={closeInvite} />}

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
                  const resume = goalMoment.resume
                  setGoalMoment(null)
                  // 바통을 넘기고 기다리는 중이거나 이미 다음 절을 쓰던 중이면 그 화면으로 돌아간다
                  if (handoff || resume) return
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

      {relayDone && room && (
        <div className="bt-summary" role="dialog" aria-modal="true" aria-labelledby="bt-relaydone-title">
          <div className="bt-summary__card bt-relaydone">
            <span className="bt-baton__torch" aria-hidden />
            <p className="bt-summary__eyebrow">릴레이 완성 · 마지막 칸을 내가 채웠어요</p>
            <h2 id="bt-relaydone-title" className="bt-summary__title">
              {room.book_name} {room.chapter}
              {chapterUnit(room.book_number)}을 함께 완성했어요!
            </h2>
            <ul className="bt-relaydone__members">
              {[...room.members]
                .sort((a, b) => b.verses - a.verses)
                .map((m) => (
                  <li key={m.user_id} className={`bt-hue-${hueOf.get(m.user_id) ?? 0}`}>
                    <span className="bt-relay__swatch" aria-hidden />
                    {m.is_me ? '나' : m.name}
                    <b>{m.verses}칸</b>
                  </li>
                ))}
            </ul>
            <div className="bt-summary__actions">
              <button
                type="button"
                className="bt-btn bt-btn--primary bt-btn--block"
                onClick={() => navigate(`/bible/typing/relay/${room.id}`)}
              >
                릴레이 현황 보기
              </button>
              <button type="button" className="bt-btn bt-btn--block" onClick={() => navigate('/bible/typing')}>
                필사 홈으로
              </button>
              {relayDone.personalNext !== null && (
                <button
                  type="button"
                  className="bt-btn bt-btn--ghost bt-btn--block"
                  onClick={() => {
                    const ni = relayDone.personalNext!
                    setRelayDone(null)
                    goTo(ni)
                  }}
                >
                  친구가 쓴 절도 내 손으로 써 보기
                </button>
              )}
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

/**
 * 화면을 연 채로 다른 주소로 다시 들어오면(알림을 눌러 장·?v= 만 바뀜) 라우트 컴포넌트가 재사용돼
 * 쓰던 절·바통 대기 상태가 그대로 남았다. 책·장·시작 절을 key 로 걸어 새 주소마다 새로 연다
 * (세션 안의 절 이동은 주소를 바꾸지 않으니 영향이 없다).
 */
const TypingSession = () => {
  const { book, chapter } = useParams()
  const [search] = useSearchParams()
  return <TypingSessionView key={`${book}:${chapter}:${search.get('v') ?? ''}`} />
}

export default TypingSession
