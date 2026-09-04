import { useEffect, useRef, useState } from 'react'
import { API_V1 } from '../../../config/api'
import { showToast } from '../../../utils/toast'
import type { BibleTTSVoice } from '../../../types/bible'
import AudioSleepSheet from './AudioSleepSheet'
import AudioSettingsMenu from './AudioSettingsMenu'
import CinemaReading from './CinemaReading'

// 절 메뉴 '여기부터 듣기' 요청. seq가 바뀔 때마다 새 요청으로 처리한다.
// book/chapter는 장 이동 직후 남은 이전 장 요청을 무시하기 위한 대조용.
export interface PlayFromVerseRequest {
  book: number
  chapter: number
  verse: number
  seq: number
}

interface BibleAudioPlayerProps {
  bookNumber: number
  chapter: number
  // BibleBook.id — 낭독 영화관이 절 본문을 조회할 때 쓴다 (없으면 영화관 버튼 숨김)
  bookId?: number
  // 듣기-보기 동기화: 지금 낭독 중인 절이 바뀔 때마다 호출 (재생 전/머리말 구간은 null)
  onActiveVerseChange?: (verse: number | null) => void
  // 실제로 소리가 나는 중인지. 일시정지하면 본문 자동 따라가기도 멈춰야 하므로
  // 낭독 절과 별개로 재생 여부를 알려준다.
  onPlayingChange?: (playing: boolean) => void
  // 특정 절부터 재생 요청 (절 메뉴 '여기부터 듣기')
  playFromVerse?: PlayFromVerseRequest | null
  // 연속 재생(자동 다음 장): 현재 책에 다음 장이 있는지, 있으면 어떻게 넘어가는지
  hasNextChapter?: boolean
  onAutoNextChapter?: () => void
  // 잠들기 전 듣기(수면 타이머·듣기 범위) 시트용 — 없으면 달 버튼을 숨긴다
  totalChapters?: number
  bookName?: string
}

// 절별 낭독 시작 시각(초) — 백엔드가 mp3 생성 시 WordBoundary로 산출해 캐시
export interface VerseTiming {
  verse: number
  start: number
}

const VOICE_STORAGE_KEY = 'bible-tts-voice'
const RATE_STORAGE_KEY = 'bible-tts-rate'
const AUTO_NEXT_STORAGE_KEY = 'bible-tts-autonext'
const COLLAPSED_STORAGE_KEY = 'bible-tts-collapsed'
const RATE_OPTIONS = [0.75, 1, 1.25, 1.5]

// 첫 생성(몇 초) 동안 번갈아 보여줄 잔잔한 대기 문구
const LOADING_MESSAGES = [
  '말씀을 준비하고 있어요…',
  '잠시 마음을 고요히…',
  '은혜의 음성을 빚는 중…',
  '곧 들려드릴게요…',
]

// 현재는 음성 선택 UI를 숨기고 남성으로 고정한다(여성/남성 토글은 코드만 보존).
// 나중에 다시 노출하려면 아래 한 줄을 예전 로직으로 되돌리면 된다.
//   const v = localStorage.getItem(VOICE_STORAGE_KEY); return v === 'male' ? 'male' : 'female'
const loadVoice = (): BibleTTSVoice => 'male'

const loadRate = (): number => {
  const r = Number(localStorage.getItem(RATE_STORAGE_KEY))
  return RATE_OPTIONS.includes(r) ? r : 1
}

// 연속 재생(장이 끝나면 다음 장 자동 재생)은 기본 켬
const loadAutoNext = (): boolean => localStorage.getItem(AUTO_NEXT_STORAGE_KEY) !== 'off'

// 카드 접기 — 듣지 않는 사람에게는 본문이 그만큼 위로 올라온다.
// 기본은 펼침(기능 발견성). 한 번 접으면 장을 옮겨도, 다시 와도 접힌 채로 기억한다.
const loadCollapsed = (): boolean => localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'on'

const formatTime = (sec: number): string => {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// 수면 타이머 남은 시간 — 1분 미만은 초, 그 외엔 분(올림)으로 짧게
const formatRemain = (ms: number): string =>
  ms < 60_000 ? `${Math.max(1, Math.ceil(ms / 1000))}초` : `${Math.ceil(ms / 60_000)}분`

/**
 * 성경 한 장을 오디오북처럼 들려주는 플레이어.
 * - 재생 버튼을 누른 시점에만 백엔드 TTS 엔드포인트를 src로 걸어 지연 로딩
 * - 캐시가 없으면 백엔드가 mp3를 "생성되는 즉시" 스트리밍하므로, 장 전체 생성을
 *   기다리지 않고 첫 절(+머리말)만 준비되면 바로 재생이 시작된다.
 * - 한 번 들으면 백엔드가 Supabase에 캐시 → 다음 재생은 캐시 파일로 리다이렉트되어
 *   즉시 재생 + 탐색바/총 길이까지 정상.
 * - 음성(여성/남성)·배속·연속 재생 여부는 localStorage에 기억
 *
 * 장이 바뀌어도 컴포넌트(특히 <audio> 요소)는 유지하고 아래 리셋 effect로 상태만
 * 초기화한다. 연속 재생(장 끝 → 다음 장 자동 재생)은 사용자 터치 없이 play()를
 * 호출해야 하는데, 모바일 자동재생 정책상 "한 번 재생했던 그 <audio> 요소"를
 * 재사용해야 허용되기 때문 — key 리마운트로 요소를 새로 만들면 iOS에서 막힌다.
 */
const BibleAudioPlayer = ({ bookNumber, chapter, bookId, onActiveVerseChange, onPlayingChange, playFromVerse, hasNextChapter, onAutoNextChapter, totalChapters, bookName }: BibleAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const wantPlayRef = useRef(false) // src 로드 시 자동 재생할지
  // '여기부터 듣기'로 요청됐지만 아직 점프하지 못한 절.
  // 타이밍/총길이가 준비되는 즉시(타이밍 도착·메타데이터 로드 등) 점프를 재시도한다.
  const pendingVerseRef = useRef<number | null>(null)
  const firstGenNoticeRef = useRef(false) // 첫 생성 중 안내 토스트는 장당 1회만
  // 직전 장이 끝나 자동으로 다음 장에 온 상태인지 — 리셋 effect가 소비한다
  const autoAdvanceRef = useRef(false)

  const [voice, setVoice] = useState<BibleTTSVoice>(loadVoice)
  const [rate, setRate] = useState<number>(loadRate)
  const [autoNext, setAutoNext] = useState<boolean>(loadAutoNext)
  const [collapsed, setCollapsed] = useState<boolean>(loadCollapsed)
  const [started, setStarted] = useState(false) // 첫 재생 이후에만 src 설정
  const [isPlaying, setIsPlaying] = useState(false)
  const [preparing, setPreparing] = useState(false) // 첫 소리가 나기 전 대기 상태
  const [isError, setIsError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [cardVisible, setCardVisible] = useState(true) // 본 카드가 뷰포트에 보이는지
  const [timings, setTimings] = useState<VerseTiming[] | null>(null)
  const [activeVerse, setActiveVerse] = useState<number | null>(null)
  const activeVerseRef = useRef<number | null>(null)
  // 낭독 영화관 — 같은 <audio> 요소 위에 전체화면 뷰만 씌운다
  const [showCinema, setShowCinema] = useState(false)

  // ── 잠들기 전 듣기 ─────────────────────────────────────────────
  // 수면 타이머 만료 시각(epoch ms). setTimeout은 화면이 꺼지면 스로틀되므로
  // 재생 중 계속 발생하는 timeupdate 이벤트 + 1초 인터벌에서 실측 시각으로 판정한다.
  const [sleepUntil, setSleepUntil] = useState<number | null>(null)
  const sleepUntilRef = useRef<number | null>(null)
  // 듣기 범위: 이 장(포함)까지 듣고 연속 재생을 멈춘다. null이면 제한 없음
  const [endChapter, setEndChapter] = useState<number | null>(null)
  const [showSleepSheet, setShowSleepSheet] = useState(false)
  // 오디오 설정 메뉴(배속·연속·잠들기) — 톱니 버튼 아래/바텀시트
  const [showSettings, setShowSettings] = useState(false)
  const settingsBtnRef = useRef<HTMLButtonElement>(null)
  const miniSettingsBtnRef = useRef<HTMLButtonElement>(null)
  // 남은 시간 표시 갱신용 1초 틱 — 타이머가 켜져 있는 동안만 돈다
  const [, setSleepTick] = useState(0)
  const fadeTimerRef = useRef<number | null>(null)
  // 부모 콜백은 ref로 보관 — 렌더마다 바뀌어도 이펙트/핸들러를 재구성하지 않는다
  const onActiveVerseChangeRef = useRef(onActiveVerseChange)
  onActiveVerseChangeRef.current = onActiveVerseChange
  const onPlayingChangeRef = useRef(onPlayingChange)
  onPlayingChangeRef.current = onPlayingChange

  // 재생/일시정지 상태를 부모에 통지 — 본문 자동 따라가기를 여기에 맞춰 멈춘다
  useEffect(() => {
    onPlayingChangeRef.current?.(isPlaying)
  }, [isPlaying])

  const cancelSleepFade = () => {
    if (fadeTimerRef.current != null) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
      const audio = audioRef.current
      if (audio) audio.volume = 1
    }
  }

  // 수면 타이머 만료 → 볼륨을 몇 초간 서서히 줄인 뒤 일시정지(위치 보존 → 이어듣기 가능).
  // iOS는 미디어 볼륨 설정이 무시되므로 페이드 없이 잠시 뒤 조용히 일시정지된다.
  // 페이드 진행률은 스텝 수가 아닌 경과 시각 기준 — 백그라운드에서 인터벌이
  // 1초로 스로틀돼도 제때 끝난다.
  const startSleepFade = () => {
    sleepUntilRef.current = null
    setSleepUntil(null)
    wantPlayRef.current = false // 다음 장 자동 재생을 기다리던 중이었다면 취소
    const audio = audioRef.current
    if (!audio || audio.paused) {
      // 이미 조용한 상태(수동 일시정지·장 전환 대기 등) — 타이머만 조용히 해제
      setPreparing(false)
      return
    }
    if (fadeTimerRef.current != null) return
    const FADE_MS = 2500
    const fadeStart = Date.now()
    fadeTimerRef.current = window.setInterval(() => {
      const p = (Date.now() - fadeStart) / FADE_MS
      if (p >= 1) {
        if (fadeTimerRef.current != null) clearInterval(fadeTimerRef.current)
        fadeTimerRef.current = null
        audio.pause()
        audio.volume = 1
        showToast('설정한 시간이 되어 재생을 멈췄어요 🌙', 'info')
      } else {
        audio.volume = Math.max(0, 1 - p)
      }
    }, 100)
  }

  const checkSleepTimer = () => {
    if (sleepUntilRef.current != null && Date.now() >= sleepUntilRef.current) startSleepFade()
  }

  // 타이머가 켜져 있는 동안 1초마다 남은 시간 표시를 갱신하고 만료를 판정한다.
  // (화면이 꺼진 채 재생 중일 땐 timeupdate 이벤트가 판정을 이어받는다)
  useEffect(() => {
    if (sleepUntil == null) return
    const id = window.setInterval(() => {
      setSleepTick(t => t + 1)
      checkSleepTimer()
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleepUntil])

  const handleSetSleepMinutes = (m: number | null) => {
    cancelSleepFade()
    if (m == null) {
      const wasOn = sleepUntilRef.current != null
      sleepUntilRef.current = null
      setSleepUntil(null)
      if (wasOn) showToast('수면 타이머를 껐어요', 'info')
      return
    }
    const until = Date.now() + m * 60_000
    sleepUntilRef.current = until
    setSleepUntil(until)
    showToast(`${m}분 뒤에 소리를 줄이며 멈출게요 🌙`, 'info')
  }

  const handleSetEndChapter = (ch: number | null) => {
    setEndChapter(ch)
    if (ch == null) return
    // 범위 재생은 연속 재생이 전제 — 꺼져 있으면 함께 켠다
    if (!autoNext && ch > chapter) {
      setAutoNext(true)
      localStorage.setItem(AUTO_NEXT_STORAGE_KEY, 'on')
    }
    showToast(
      ch === chapter
        ? '이 장까지만 듣고 멈출게요 🌙'
        : `${bookName ? `${bookName} ` : ''}${ch}장까지 듣고 멈출게요 🌙`,
      'info'
    )
  }

  // 절별 타이밍 로드. 캐시된 장은 첫 응답에 최종본이 온다.
  // 첫 재생(스트리밍 생성 중)엔 서버가 "지금까지 합성된 구간"의 부분(partial)
  // 타이밍을 돌려주므로, 최종본이 올 때까지 짧은 간격으로 다시 조회한다 —
  // 앞 절들 하이라이트가 생성 완료를 기다리지 않고 거의 바로 붙는다.
  // 음성이 바뀌면 오디오가 달라지므로 타이밍도 다시 받는다.
  useEffect(() => {
    if (!started) return
    let cancelled = false
    let timer: number | undefined
    let attempts = 0
    setTimings(null)
    const load = async () => {
      try {
        const res = await fetch(
          `${API_V1}/bible/tts/${bookNumber}/${chapter}/timings?voice=${voice}`
        )
        if (res.ok) {
          const data = await res.json()
          if (cancelled) return
          if (Array.isArray(data?.verses) && data.verses.length > 0) {
            setTimings(data.verses)
          }
          if (!data?.partial) return // 최종본 도착 → 조회 종료
        }
      } catch {
        // 네트워크 오류 → 아래에서 재시도
      }
      if (!cancelled && ++attempts < 120) timer = window.setTimeout(load, 2500)
    }
    load()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [started, voice, bookNumber, chapter])

  // 재생 시각 → 지금 낭독 중인 절 (마지막으로 start를 지난 절)
  const syncActiveVerse = (time: number | null) => {
    let v: number | null = null
    if (time !== null && timings && timings.length > 0) {
      for (const t of timings) {
        if (time >= t.start) v = t.verse
        else break
      }
    }
    if (v !== activeVerseRef.current) {
      activeVerseRef.current = v
      setActiveVerse(v)
      onActiveVerseChangeRef.current?.(v)
    }
  }

  // 해당 절의 시작 시각으로 점프. 절별 타이밍과 총길이(캐시 mp3)가 있어야 가능 —
  // 첫 스트리밍 생성 중엔 둘 다 없어 실패하고, 준비되면 tryPendingSeek로 재시도된다.
  const trySeekToVerse = (verse: number): boolean => {
    const audio = audioRef.current
    if (!audio || !timings) return false
    const t = timings.find((x) => x.verse === verse)
    if (!t) return false
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return false
    audio.currentTime = t.start
    setCurrentTime(t.start)
    syncActiveVerse(t.start)
    return true
  }

  const tryPendingSeek = () => {
    const v = pendingVerseRef.current
    if (v == null) return
    if (trySeekToVerse(v)) pendingVerseRef.current = null
  }

  // 타이밍이 재생 도중(첫 스트리밍 완료 후) 늦게 도착하면 즉시 한 번 동기화.
  // 대기 중인 절 점프가 있으면 그 절로 이동하는 것이 곧 동기화다.
  useEffect(() => {
    if (!timings) return
    const v = pendingVerseRef.current
    if (v != null && trySeekToVerse(v)) {
      pendingVerseRef.current = null
      return
    }
    syncActiveVerse(audioRef.current?.currentTime ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timings])

  // 장 이동 등으로 언마운트되면 본문 하이라이트도 해제 (따라가기도 함께 종료)
  useEffect(
    () => () => {
      onActiveVerseChangeRef.current?.(null)
      onPlayingChangeRef.current?.(false)
    },
    []
  )

  // 장(또는 책)이 바뀌면 마운트를 유지한 채 플레이어 상태를 초기화한다.
  // 연속 재생으로 넘어온 경우(autoAdvanceRef)는 started를 유지 — audioUrl이
  // 새 장 주소로 바뀌면서 같은 <audio> 요소가 로드·재생을 이어간다.
  const prevChapterKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const key = `${bookNumber}-${chapter}`
    if (prevChapterKeyRef.current === null || prevChapterKeyRef.current === key) {
      prevChapterKeyRef.current = key
      return
    }
    const prevBook = Number(prevChapterKeyRef.current.split('-')[0])
    prevChapterKeyRef.current = key
    const auto = autoAdvanceRef.current
    autoAdvanceRef.current = false
    pendingVerseRef.current = null
    firstGenNoticeRef.current = false
    setCurrentTime(0)
    setDuration(0)
    setIsError(false)
    syncActiveVerse(null)
    // 듣기 범위: 다른 책으로 가거나, 수동 이동으로 범위를 지나쳤으면 해제
    if (prevBook !== bookNumber) setEndChapter(null)
    else if (!auto && endChapter != null && chapter > endChapter) setEndChapter(null)
    if (!auto) {
      // 사용자가 직접 장을 이동 — 재생을 멈추고 처음 상태로.
      // 주의: 이 effect가 돌기 전 렌더에서 src가 이미 새 장 URL로 바뀌며
      // 브라우저 로드 알고리즘이 paused를 "pause 이벤트 없이" true로 만든다.
      // 그래서 아래 pause()는 no-op이 되고 onPause도 안 오므로,
      // isPlaying을 여기서 직접 내려야 한다(안 내리면 '재생 중' 표시로 고착).
      wantPlayRef.current = false
      setStarted(false)
      setPreparing(false)
      setIsPlaying(false)
      audioRef.current?.pause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookNumber, chapter])

  // 본문을 읽으러 스크롤을 내려 카드가 화면 밖으로 나가면,
  // 재생을 시작한 경우에 한해 상단에 한 줄짜리 미니 플레이어를 띄운다.
  useEffect(() => {
    const el = cardRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      ([entry]) => setCardVisible(entry.isIntersecting),
      // 상단 고정 헤더(56px)에 가려진 것도 "안 보임"으로 취급
      { rootMargin: '-56px 0px 0px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // 재생을 누른 시점에만 백엔드 스트리밍 엔드포인트를 src로 건다.
  // 음성이 바뀌면 URL이 바뀌어 audio 요소가 새 음성으로 다시 로드된다.
  const audioUrl = started
    ? `${API_V1}/bible/tts/${bookNumber}/${chapter}?voice=${voice}`
    : undefined

  // src가 준비되면 배속을 적용하고, 대기 중이던 재생 요청을 실행
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    audio.playbackRate = rate
    if (wantPlayRef.current) {
      wantPlayRef.current = false
      audio.play().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl])

  // 언마운트 시(장 이동 등) 재생 정지 + 진행 중이던 수면 페이드 정리
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      audio?.pause()
      if (fadeTimerRef.current != null) clearInterval(fadeTimerRef.current)
    }
  }, [])

  const requestPlay = () => {
    const audio = audioRef.current
    if (started && audio) {
      // 스트리밍으로 끝까지 들었거나 오류로 끝난 경우, 같은 src에 audio.play()만
      // 하면 미디어가 "끝(ended)" 상태에 머물러 재생이 시작되지 않는다.
      // 첫 재생 이후엔 백엔드가 캐시 파일로 응답하므로, load()로 다시 불러오면
      // 처음부터 정상 재생(탐색 가능)된다.
      if (audio.ended || audio.error) {
        setIsError(false)
        setPreparing(true)
        setCurrentTime(0)
        wantPlayRef.current = true
        audio.load()
        return
      }
      // 이미 src가 걸려 있음 → 즉시(또는 버퍼되면) 재생
      if (audio.readyState < 2) setPreparing(true)
      audio.play().catch(() => {})
      return
    }
    // 첫 재생 → src를 걸고, 로드되면 자동 재생
    setIsError(false)
    setPreparing(true)
    wantPlayRef.current = true
    setStarted(true)
  }

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      requestPlay()
    }
  }

  // 낭독 영화관 — 소리 없는 영화관은 의미가 없으므로 열면서 재생도 시작한다
  const canCinema = bookId != null && bookId > 0
  const openCinema = () => {
    setShowCinema(true)
    if (!isPlaying) requestPlay()
  }

  // 절 메뉴 '여기부터 듣기' — 요청된 절로 점프해 재생.
  // 캐시된 장(타이밍·총길이 보유)은 즉시 점프하고, 아직 준비 전이면 pending으로
  // 보관해 타이밍/메타데이터가 도착하는 시점에 점프한다.
  useEffect(() => {
    if (!playFromVerse) return
    // 장 이동 직후 남아 있던 이전 장 요청은 무시
    if (playFromVerse.book !== bookNumber || playFromVerse.chapter !== chapter) return
    pendingVerseRef.current = playFromVerse.verse
    const audio = audioRef.current
    if (started && audio && !audio.ended && !audio.error) {
      tryPendingSeek()
      if (audio.paused) {
        if (audio.readyState < 2) setPreparing(true)
        audio.play().catch(() => {})
      }
    } else {
      requestPlay()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playFromVerse?.seq])

  const handleVoiceChange = (v: BibleTTSVoice) => {
    if (v === voice) return
    const wasPlaying = isPlaying
    audioRef.current?.pause()
    setVoice(v)
    localStorage.setItem(VOICE_STORAGE_KEY, v)
    setIsError(false)
    // 이미 듣고 있었다면 새 음성으로 이어서 재생
    if (started) {
      wantPlayRef.current = wasPlaying
      if (wasPlaying) setPreparing(true)
    }
  }

  // 접기/펼치기 — 설정을 기억하되, 접어도 재생은 그대로 이어진다.
  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? 'on' : 'off')
    // 설정 메뉴가 열린 채 접히면 허공에 뜬 팝오버만 남는다
    if (next) setShowSettings(false)
  }

  const toggleAutoNext = () => {
    const next = !autoNext
    setAutoNext(next)
    localStorage.setItem(AUTO_NEXT_STORAGE_KEY, next ? 'on' : 'off')
    showToast(
      next ? '장이 끝나면 다음 장을 이어서 들려드려요' : '연속 재생을 껐어요',
      'info'
    )
  }

  const selectRate = (next: number) => {
    if (!RATE_OPTIONS.includes(next)) return
    setRate(next)
    localStorage.setItem(RATE_STORAGE_KEY, String(next))
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value)
    // 직접 위치를 고르면 대기 중이던 절 점프는 취소 (나중에 갑자기 이동하지 않도록)
    pendingVerseRef.current = null
    setCurrentTime(t)
    if (audioRef.current) audioRef.current.currentTime = t
  }

  const loading = preparing && !isError
  // 미캐시 첫 재생은 스트리밍이라 총길이를 알 수 없다(duration<=0).
  // 이 경우 멈춘 듯한 0:00·고정 진행바 대신 "실시간 생성 중" 불확정 표시로 보여준다.
  const liveStream = started && !loading && !isError && duration <= 0
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  // 로딩 중에는 잔잔한 문구를 천천히 교체
  useEffect(() => {
    if (!loading) return
    setLoadingMsgIdx(0)
    const id = setInterval(
      () => setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length),
      2400
    )
    return () => clearInterval(id)
  }, [loading])

  const statusText = isError
    ? '오디오를 불러오지 못했어요'
    : loading
      ? LOADING_MESSAGES[loadingMsgIdx]
      : isPlaying
        ? activeVerse
          ? `재생 중 · ${activeVerse}절`
          : '재생 중'
        : '듣기'

  // 미니 플레이어: 재생을 한 번이라도 시작했고, 본 카드가 스크롤로 가려졌을 때만
  const showMini = started && !cardVisible

  // 잠들기 전 듣기 — 버튼에 얹을 현재 설정 요약 (타이머는 1초 틱으로 갱신)
  const sleepRemainingMs = sleepUntil != null ? Math.max(0, sleepUntil - Date.now()) : null
  const sleepActive = sleepRemainingMs != null || endChapter != null
  const sleepLabel = [
    sleepRemainingMs != null ? formatRemain(sleepRemainingMs) : null,
    endChapter != null ? `${endChapter}장` : null,
  ]
    .filter(Boolean)
    .join('·')
  const canSleepSheet = totalChapters != null && totalChapters > 0
  // 헤더 상태 요약: 기본값(1×·연속 켬·타이머 없음)이 아닐 때만 톱니 옆에 표시
  const settingsSummary = [
    rate !== 1 ? `${rate}×` : null,
    sleepActive ? sleepLabel : null,
    !autoNext ? '이 장만' : null,
  ]
    .filter(Boolean)
    .join(' · ') || null

  return (
    <>
    <div
      ref={cardRef}
      className={`relative mx-3 overflow-hidden border border-black/[0.05] dark:border-white/[0.08] bg-surface-light dark:bg-card-dark ${
        collapsed
          ? 'my-1.5 rounded-xl'
          : 'my-2 rounded-2xl shadow-[0_8px_24px_-14px_var(--brand-glow)]'
      }`}
    >
      {/* 장식용 그라데이션 오브 — 접힌 한 줄에는 번짐이 과해 펼쳤을 때만 */}
      {!collapsed && (
        <>
          <div className="pointer-events-none absolute -top-10 -right-8 h-32 w-32 rounded-full bg-[var(--brand-soft-strong)] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-[var(--brand-soft)] blur-3xl" />
          {/* 능선 배경 — "말씀 한 장을 넘는 고갯길"의 무대.
              지금은 흐름 없이 고정(추후 업데이트 시 is-drifting 클래스를 다시 붙이면 된다).
              스타일은 styles/audio-player.css, 그림 프롬프트는 docs/audio-player-bg-prompts.md */}
          <div className="audio-ridge" aria-hidden="true">
            <div className="audio-ridge__strip" />
          </div>
        </>
      )}

      {/* 접힌 상태 — 한 줄 띠. 안 듣는 사람에겐 본문이 그만큼 위로 올라오고,
          들으려는 사람은 펼치지 않고도 여기서 바로 재생할 수 있다. */}
      {collapsed && (
        <div className="relative flex items-center gap-2 px-2.5 py-1.5">
          <button
            type="button"
            onClick={togglePlay}
            disabled={loading}
            aria-label={isPlaying ? '일시정지' : '재생'}
            className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_4px_10px_-4px_var(--brand-glow)] transition active:scale-95 disabled:cursor-default"
          >
            <span className={`material-icons-round text-[16px] leading-none ${loading ? 'animate-pulse' : ''}`}>
              {loading ? 'auto_awesome' : isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={false}
            aria-label="오디오북 펼치기"
            className="flex min-w-0 flex-1 items-center gap-1.5 py-0.5 text-left"
          >
            <span className="material-icons-round flex-shrink-0 text-[14px] text-brand">headphones</span>
            <span className="flex-shrink-0 whitespace-nowrap text-[12.5px] font-extrabold tracking-tight text-brand">
              오디오북
            </span>
            <span className="truncate text-[11px] font-medium text-gray-400 dark:text-white/40">
              · {statusText}
            </span>
            <span className="ml-auto flex flex-shrink-0 items-center gap-1 pl-1">
              {started && !loading && !liveStream && duration > 0 && (
                <span className="text-[10.5px] font-medium tabular-nums text-gray-400 dark:text-white/45">
                  {formatTime(currentTime)}
                </span>
              )}
              <span className="material-icons-round text-[18px] leading-none text-gray-400 dark:text-white/40">
                expand_more
              </span>
            </span>
          </button>

          {/* 접혀 있어도 어디까지 왔는지는 보이게 — 카드 아래 실선 한 줄 */}
          {started && (
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-black/[0.06] dark:bg-white/[0.08]">
              <span
                className={`block h-full rounded-r-full bg-brand ${liveStream ? 'w-full animate-pulse' : 'transition-[width] duration-200'}`}
                style={liveStream ? undefined : { width: `${pct}%` }}
              />
            </span>
          )}
        </div>
      )}

      <div className={`relative px-3 py-2.5 ${collapsed ? 'hidden' : ''}`}>
        <div className="flex items-center gap-3">
          {/* 재생 / 일시정지 — 그라데이션 + 글로우 + 재생 중 펄스 링 */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={loading}
            aria-label={isPlaying ? '일시정지' : '재생'}
            className="relative grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_6px_16px_-5px_var(--brand-glow)] transition active:scale-95 disabled:cursor-default"
          >
            {isPlaying && !loading && (
              <span className="absolute inset-0 rounded-full bg-[var(--brand-glow)] animate-ping [animation-duration:1.6s]" />
            )}
            {loading ? (
              <>
                {/* 퍼져나가는 빛의 파동 */}
                <span className="absolute inset-0 rounded-full bg-white/25 animate-ping [animation-duration:2s]" />
                <span className="absolute inset-0 rounded-full bg-white/20 animate-ping [animation-duration:2s] [animation-delay:0.7s]" />
                {/* 회전하는 빛무리(후광) */}
                <span className="absolute -inset-2 animate-spin rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.65),transparent_55%)] blur-[1px] [animation-duration:2.6s]" />
                {/* 은은히 빛나는 코어 */}
                <span className="material-icons-round relative animate-pulse text-[20px] leading-none text-white [animation-duration:1.6s]">
                  auto_awesome
                </span>
              </>
            ) : (
              <span className="material-icons-round relative text-[24px] leading-none">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            )}
          </button>

          {/* 중앙: 라벨 + 진행바 + 시간 */}
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between">
              {/* 배속(1.25× 등)으로 오른쪽 버튼이 넓어져도 줄바꿈 없이 말줄임 —
                  카드 높이가 변해 본문이 아래로 밀리는 것을 막는다 */}
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="material-icons-round flex-shrink-0 text-[15px] text-brand">
                  headphones
                </span>
                <span className="flex-shrink-0 whitespace-nowrap text-[13px] font-extrabold tracking-tight text-brand">
                  오디오북
                </span>
                <span className="truncate text-[11px] font-medium text-gray-400 dark:text-white/40">
                  · {statusText}
                </span>
              </span>
              <span className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap">
                {/* 오디오 설정 — 배속·연속 재생·잠들기 전 듣기를 톱니 하나에.
                    기본값이 아닌 설정(배속≠1×·타이머·연속 끔)은 톱니 옆에 요약해 보여줘
                    "왜 빨리 읽지?", "왜 멈췄지?"의 원인을 바로 찾을 수 있게 한다. */}
                <button
                  type="button"
                  ref={settingsBtnRef}
                  onClick={() => setShowSettings(v => !v)}
                  aria-haspopup="dialog"
                  aria-expanded={showSettings}
                  aria-label={settingsSummary ? `오디오 설정 (${settingsSummary})` : '오디오 설정 (배속·연속 재생·잠들기 전 듣기)'}
                  title="오디오 설정"
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums transition active:scale-95 ${
                    settingsSummary || showSettings
                      ? 'border-transparent bg-[var(--brand-soft)] text-brand'
                      : 'audio-chip-glow border-black/10 bg-black/[0.03] text-gray-400 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/40'
                  }`}
                >
                  {sleepRemainingMs != null && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                  )}
                  {settingsSummary}
                  <span className="material-icons-round text-[13px] leading-none">tune</span>
                </button>
                {/* 낭독 영화관 — 설정이 아니라 "모드 진입"이라 메뉴에 넣지 않고 밖에 남긴다 */}
                {canCinema && (
                  <button
                    type="button"
                    onClick={openCinema}
                    aria-label="낭독 영화관 (전체화면 몰입 낭독)"
                    title="낭독 영화관"
                    className="audio-chip-glow flex items-center gap-0.5 rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[11px] font-bold text-gray-400 transition active:scale-95 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/40"
                  >
                    <span className="material-icons-round text-[13px] leading-none">
                      theaters
                    </span>
                  </button>
                )}
                {/* 접기 — 듣지 않을 땐 한 줄로 접어 본문에 자리를 내준다 */}
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-expanded={true}
                  aria-label="오디오북 접기"
                  title="접기"
                  className="flex items-center rounded-full border border-black/10 bg-black/[0.03] px-1.5 py-0.5 text-gray-400 transition active:scale-95 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/40"
                >
                  <span className="material-icons-round text-[14px] leading-none">
                    expand_less
                  </span>
                </button>
              </span>
            </div>

            {/* 커스텀 그라데이션 진행바 (seek 가능) */}
            <div className="group relative h-2">
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-black/10 dark:bg-white/12" />
              {loading && (
                <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 animate-pulse rounded-full bg-brand [animation-duration:1.8s]" />
              )}

              {liveStream ? (
                /* 실시간 생성 중 — 동방박사가 별을 따라가듯, 별이 천천히 길을 가로지른다.
                   총길이를 모르므로 진행률 대신 "별의 동행"으로 라이브 상태를 표현. */
                <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
                  <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 animate-bible-star-travel">
                    {/* 별똥별 꼬리 — 지나온 길에 남는 빛의 자취 */}
                    <span className="absolute right-1/2 top-1/2 h-[2px] w-8 -translate-y-1/2 rounded-full bg-gradient-to-l from-[var(--brand)] via-[var(--brand-glow)] to-transparent blur-[0.5px]" />
                    {/* 은은한 빛무리(후광) */}
                    <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[var(--brand-glow)] blur-[3px] [animation-duration:1.6s]" />
                    {/* 별 — 정상 재생 때와 같은 네 갈래 별. 밝은 테마에선 흰 카드 위라 브랜드색.
                        카드 배경색 아웃라인(paint-order:stroke)이 같은 색 진행 트랙에서 형태를 분리한다 */}
                    <svg
                      viewBox="0 0 24 24"
                      className="relative block h-[14px] w-[14px] text-brand dark:text-white stroke-[#fafafa] dark:stroke-[#201f1f] [paint-order:stroke] drop-shadow-[0_0_6px_var(--brand-glow)]"
                      fill="currentColor"
                      strokeWidth={4}
                      strokeLinejoin="round"
                    >
                      <path d="M12 1.5 L14 9.5 L22 12 L14 14.5 L12 22.5 L10 14.5 L2 12 L10 9.5 Z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand"
                    style={{ width: `${pct}%` }}
                  />

                  {/* 시작점 — 함께 출발한 자리 */}
                  <span className="pointer-events-none absolute left-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-brand" />

                  {/* 도착점 — 빛이 향해 가는 목적지(가까워질수록 환해진다) */}
                  <span
                    className="pointer-events-none absolute left-full top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity"
                    style={{ opacity: 0.3 + (pct / 100) * 0.7 }}
                  >
                    <span className="material-icons-round block text-[12px] leading-none text-brand">
                      auto_awesome
                    </span>
                  </span>

                  {/* 인도하는 빛 — 처음부터 끝까지 길을 함께 걷는 별빛 동행 */}
                  <div
                    className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${pct}%` }}
                  >
                    {isPlaying && (
                      <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[var(--brand-glow)] blur-[3px] [animation-duration:1.6s]" />
                    )}
                    <svg
                      viewBox="0 0 24 24"
                      className="relative block h-[14px] w-[14px] text-brand dark:text-white stroke-[#fafafa] dark:stroke-[#201f1f] [paint-order:stroke] drop-shadow-[0_0_6px_var(--brand-glow)] transition-transform group-active:scale-110"
                      fill="currentColor"
                      strokeWidth={4}
                      strokeLinejoin="round"
                    >
                      <path d="M12 1.5 L14 9.5 L22 12 L14 14.5 L12 22.5 L10 14.5 L2 12 L10 9.5 Z" />
                    </svg>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    disabled={!duration}
                    aria-label="재생 위치"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
                  />
                </>
              )}
            </div>

            <div className="mt-1 flex items-center justify-between text-[10.5px] font-medium tabular-nums text-gray-400 dark:text-white/45">
              <span>{formatTime(currentTime)}</span>
              {loading ? (
                /* 힌트를 별도 줄이 아닌 이 자리(총길이 자리)에 보여 카드 높이가 변하지 않는다 */
                <span className="flex items-center gap-1">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-brand" />
                  처음 재생은 조금 걸려요
                </span>
              ) : liveStream ? (
                <span className="flex items-center gap-1 font-semibold text-brand">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                  실시간 생성 중
                </span>
              ) : (
                <span>{formatTime(duration)}</span>
              )}
            </div>
          </div>
        </div>

        {/* 음성 선택(여성/남성) 세그먼트 — 현재는 숨기고 남성 고정.
            다시 노출하려면 바깥 div의 `hidden`과 안쪽 div의 `!hidden`을 제거하고
            `mt-2 flex items-center` 등 배치 클래스를 되살린다. */}
        <div className="hidden">
          <div className="relative !hidden inline-flex rounded-full bg-black/[0.05] p-0.5 dark:bg-white/[0.07]">
            <span
              className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-brand shadow-[0_4px_12px_-4px_var(--brand-glow)] transition-transform duration-300 ease-out"
              style={{ transform: voice === 'male' ? 'translateX(100%)' : 'translateX(0)' }}
            />
            {(['female', 'male'] as BibleTTSVoice[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => handleVoiceChange(v)}
                className={`relative z-10 w-[58px] rounded-full py-1 text-xs font-bold transition-colors ${
                  voice === v ? 'text-white' : 'text-gray-500 dark:text-white/55'
                }`}
              >
                {v === 'female' ? '여성' : '남성'}
              </button>
            ))}
          </div>

        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        onCanPlay={(e) => {
          // load() 재로딩(재생 종료 후 다시 재생) 시 src가 그대로라 audioUrl
          // effect가 다시 돌지 않으므로, 데이터가 준비되면 여기서 대기 재생을 실행한다.
          tryPendingSeek()
          if (wantPlayRef.current) {
            wantPlayRef.current = false
            e.currentTarget.playbackRate = rate
            e.currentTarget.play().catch(() => {})
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPlaying={() => {
          // 첫 소리가 실제로 나기 시작 → 대기 상태 해제
          setIsPlaying(true)
          setPreparing(false)
          // '여기부터 듣기'를 눌렀지만 아직 절 위치 정보가 없는 경우(미캐시 첫 생성):
          // 일단 처음부터 들려주고 있음을 안내한다. 생성이 끝나 타이밍이 도착하면
          // 요청한 절로 자동 이동한다.
          if (pendingVerseRef.current != null && !timings && !firstGenNoticeRef.current) {
            firstGenNoticeRef.current = true
            showToast('이 장은 처음 준비 중이라 잠시 처음부터 들려드려요. 준비되면 선택한 절로 이동해요', 'info')
          }
        }}
        onPause={() => setIsPlaying(false)}
        onEmptied={() => {
          // src 교체(장 이동·음성 변경 등)로 미디어가 비워질 때 — 스펙상 이때
          // paused는 true가 되지만 pause 이벤트는 오지 않는다. 상태를 직접 동기화.
          // (자동 다음 장은 이후 play()가 다시 onPlay를 쏘므로 영향 없음)
          setIsPlaying(false)
        }}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
          // 끝까지 재생됐으면 절 점프 요청도 소멸 — 다음 재생은 처음부터
          pendingVerseRef.current = null
          syncActiveVerse(null)
          // 듣기 범위: 설정한 장까지 다 들었으면 다음 장으로 넘어가지 않고 멈춘다
          if (endChapter != null && chapter >= endChapter) {
            setEndChapter(null)
            showToast(
              `${bookName ? `${bookName} ` : ''}${endChapter}장까지 다 들었어요 🌙`,
              'info'
            )
            return
          }
          // 연속 재생: 다음 장으로 넘어가 이어서 듣기.
          // 부모가 장을 바꾸면 리셋 effect가 autoAdvanceRef를 소비해 started를
          // 유지하고, 새 audioUrl 로드 시(wantPlayRef) 자동으로 재생된다.
          if (autoNext && hasNextChapter && onAutoNextChapter) {
            autoAdvanceRef.current = true
            wantPlayRef.current = true
            setPreparing(true)
            onAutoNextChapter()
          } else if (autoNext && !hasNextChapter) {
            showToast('이 책의 마지막 장까지 다 들었어요 🙌', 'info')
          }
        }}
        onError={() => {
          setPreparing(false)
          setIsPlaying(false)
          // started 후에만 실제 오류로 간주(초기 src 없는 상태 제외)
          if (started) setIsError(true)
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime)
          syncActiveVerse(e.currentTarget.currentTime)
          // 화면이 꺼진 채 재생 중에도 이 이벤트는 계속 발생 — 수면 타이머 판정
          checkSleepTimer()
        }}
        onLoadedMetadata={(e) => {
          // 스트리밍(미캐시) 최초 재생 땐 길이를 모를 수 있다(Infinity/NaN) → 0 처리
          const d = e.currentTarget.duration
          setDuration(Number.isFinite(d) ? d : 0)
          e.currentTarget.playbackRate = rate
          tryPendingSeek()
        }}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration
          if (Number.isFinite(d)) setDuration(d)
          tryPendingSeek()
        }}
      />
    </div>

    {/* 미니 플레이어 — 본문을 읽으러 스크롤하면 카드 대신 앱바 아래 한 줄로.
        항상 렌더하고 transform/opacity로만 보였다 숨겨 전환이 부드럽다. */}
    <div
      className={`fixed inset-x-0 top-14 z-40 transition-all duration-300 ${
        showMini ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0'
      }`}
    >
      <div className="mx-auto max-w-md px-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-black/[0.06] bg-white/95 px-3 py-2 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.35)] backdrop-blur-md dark:border-white/[0.1] dark:bg-[#1c1c26]/95">
          <button
            type="button"
            onClick={togglePlay}
            disabled={loading}
            aria-label={isPlaying ? '일시정지' : '재생'}
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)] transition active:scale-95 disabled:cursor-default"
          >
            <span className={`material-icons-round text-[20px] leading-none ${loading ? 'animate-pulse' : ''}`}>
              {loading ? 'auto_awesome' : isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[12px] font-bold text-gray-700 dark:text-white/85">
                오디오북 <span className="font-medium text-gray-400 dark:text-white/45">· {statusText}</span>
              </span>
              <span className="flex-shrink-0 text-[10.5px] font-medium tabular-nums text-gray-400 dark:text-white/45">
                {liveStream ? '실시간 생성 중' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
              </span>
            </div>
            {/* 얇은 진행바 (미니에서는 seek 없이 상태 표시만) */}
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/[0.12]">
              {liveStream ? (
                <div className="h-full w-full animate-pulse bg-brand" />
              ) : (
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-200"
                  style={{ width: `${pct}%` }}
                />
              )}
            </div>
          </div>

          {/* 미니 플레이어도 설정은 톱니 하나로 — 본 카드와 같은 메뉴를 연다 */}
          <button
            type="button"
            ref={miniSettingsBtnRef}
            onClick={() => setShowSettings(v => !v)}
            aria-haspopup="dialog"
            aria-expanded={showSettings}
            aria-label={settingsSummary ? `오디오 설정 (${settingsSummary})` : '오디오 설정'}
            title="오디오 설정"
            className={`flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums transition active:scale-95 ${
              settingsSummary || showSettings
                ? 'border-transparent bg-[var(--brand-soft)] text-brand'
                : 'border-black/10 bg-black/[0.03] text-gray-400 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/40'
            }`}
          >
            {sleepRemainingMs != null && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            )}
            {settingsSummary}
            <span className="material-icons-round text-[13px] leading-none">tune</span>
          </button>
        </div>
      </div>
    </div>

    {/* 낭독 영화관 — 같은 <audio> 요소를 공유하는 전체화면 뷰.
        닫아도 재생은 계속되고, 연속 재생(다음 장)도 뒤에서 그대로 이어진다. */}
    {showCinema && canCinema && (
      <CinemaReading
        bookId={bookId!}
        bookNumber={bookNumber}
        bookName={bookName ?? ''}
        chapter={chapter}
        isPlaying={isPlaying}
        loading={loading}
        activeVerse={activeVerse}
        duration={duration}
        timings={timings}
        audioRef={audioRef}
        onTogglePlay={togglePlay}
        onSeekToVerse={trySeekToVerse}
        onClose={() => setShowCinema(false)}
      />
    )}

    {/* 오디오 설정 메뉴 — 배속·연속·잠들기 */}
    {showSettings && (
      <AudioSettingsMenu
        anchorRef={showMini ? miniSettingsBtnRef : settingsBtnRef}
        rate={rate}
        rateOptions={RATE_OPTIONS}
        onSetRate={selectRate}
        autoNext={autoNext}
        onToggleAutoNext={toggleAutoNext}
        sleepSummary={sleepActive ? sleepLabel : null}
        onOpenSleep={canSleepSheet ? () => setShowSleepSheet(true) : undefined}
        onClose={() => setShowSettings(false)}
      />
    )}

    {/* 잠들기 전 듣기 설정 시트 — 수면 타이머 + 어느 장까지 들을지 */}
    {showSleepSheet && canSleepSheet && (
      <AudioSleepSheet
        bookName={bookName ?? ''}
        currentChapter={chapter}
        totalChapters={totalChapters!}
        sleepRemainingMs={sleepRemainingMs}
        onSetSleepMinutes={handleSetSleepMinutes}
        endChapter={endChapter}
        onSetEndChapter={handleSetEndChapter}
        onClose={() => setShowSleepSheet(false)}
      />
    )}
    </>
  )
}

export default BibleAudioPlayer
