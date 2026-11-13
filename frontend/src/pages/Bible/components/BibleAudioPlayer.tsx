import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { showToast } from '../../../utils/toast'
import type { BibleTTSVoice } from '../../../types/bible'
import { getTtsStreamUrl } from '../../../api/bibleTts'
import { useTtsTimings } from '../hooks/useTtsTimings'
import { useTtsResolve } from '../hooks/useTtsResolve'
import { useSmoothProgress } from '../hooks/useSmoothProgress'
import { useVerseSync } from '../hooks/useVerseSync'
import { useNextChapterPrewarm } from '../hooks/useNextChapterPrewarm'
import { formatRemain, useAudioSleepTimer } from '../hooks/useAudioSleepTimer'
import {
  RATE_OPTIONS,
  setAudioAutoNext,
  setAudioCollapsed,
  setAudioRate,
  setAudioVoice,
  useAudioSettings,
} from '../data/audioSettings'
import AudioSettingsMenu from './AudioSettingsMenu'
import AudioCollapsedBar from './AudioCollapsedBar'
import AudioExpandedCard from './AudioExpandedCard'
import AudioMiniBar from './AudioMiniBar'
import { lazyModal } from '../../../utils/lazyModal'
import { useThemeArt } from '../../../hooks/useThemeArt'
import { AUDIO_RIDGE } from '../../../utils/themeAssets'
// 열 때만 받는 오버레이·시트 — 읽기 화면 청크에서 분리
const AudioSleepSheet = lazyModal(() => import('./AudioSleepSheet'))
const CinemaReading = lazyModal(() => import('./CinemaReading'))

// 절 메뉴 '여기부터 듣기' 요청. seq가 바뀔 때마다 새 요청으로 처리한다.
// book/chapter는 장 이동 직후 남은 이전 장 요청을 무시하기 위한 대조용.
export interface PlayFromVerseRequest {
  book: number
  chapter: number
  verse: number
  seq: number
}

/** 플레이어 밖(장 머리말의 '듣기' 버튼)에서 재생을 시작할 때 쓰는 손잡이 */
export interface BibleAudioHandle {
  /** 재생/일시정지 — 클릭 핸들러 안에서 바로 불러야 모바일 자동재생 정책에 안 걸린다 */
  togglePlay: () => void
}

interface BibleAudioPlayerProps {
  ref?: Ref<BibleAudioHandle>
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
  // 플레이어가 실제로 보이는지. 설정에서 오디오북을 꺼 두면 hidden 으로 마운트만 되는데,
  // 그때는 장마다 resolve 를 묻지 않는다(재생을 시작했다면 보이지 않아도 계속 받는다).
  visible?: boolean
  /** 이 장의 재생을 시작했는지 — 부모가 '듣기' 버튼과 플레이어 띠 중 무엇을 보일지 정한다 */
  onStartedChange?: (started: boolean) => void
}

// 첫 생성(몇 초) 동안 번갈아 보여줄 잔잔한 대기 문구
const LOADING_MESSAGES = [
  '말씀을 준비하고 있어요…',
  '잠시 마음을 고요히…',
  '은혜의 음성을 빚는 중…',
  '곧 들려드릴게요…',
]

// R2(오디오 캐시 호스트)에 미리 TCP+TLS 를 열어 둔다 — 재생 버튼을 누른 순간 첫 바이트까지의
// 왕복에서 커넥션 수립을 뺀다. <audio> 는 crossorigin 없이 받으므로 preconnect 도 익명 커넥션.
const ensurePreconnect = (origin: string) => {
  if (typeof document === 'undefined') return
  if (document.head.querySelector(`link[rel="preconnect"][href="${origin}"]`)) return
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = origin
  document.head.appendChild(link)
}

/**
 * 성경 한 장을 오디오북처럼 들려주는 플레이어.
 * - 재생 버튼을 누른 시점에만 백엔드 TTS 엔드포인트를 src로 걸어 지연 로딩
 * - 캐시가 없으면 백엔드가 mp3를 "생성되는 즉시" 스트리밍하므로, 장 전체 생성을
 *   기다리지 않고 첫 절(+머리말)만 준비되면 바로 재생이 시작된다.
 * - 한 번 들으면 백엔드가 Supabase에 캐시 → 다음 재생은 캐시 파일로 리다이렉트되어
 *   즉시 재생 + 탐색바/총 길이까지 정상.
 * - 음성(여성/남성)·배속·연속 재생·접힘 설정은 data/audioSettings 스토어가 기억
 *
 * 장이 바뀌어도 컴포넌트(특히 <audio> 요소)는 유지하고 아래 리셋 effect로 상태만
 * 초기화한다. 연속 재생(장 끝 → 다음 장 자동 재생)은 사용자 터치 없이 play()를
 * 호출해야 하는데, 모바일 자동재생 정책상 "한 번 재생했던 그 <audio> 요소"를
 * 재사용해야 허용되기 때문 — key 리마운트로 요소를 새로 만들면 iOS에서 막힌다.
 */
const BibleAudioPlayer = ({ ref, onStartedChange, bookNumber, chapter, bookId, onActiveVerseChange, onPlayingChange, playFromVerse, hasNextChapter, onAutoNextChapter, totalChapters, bookName, visible = true }: BibleAudioPlayerProps) => {
  // 능선 띠는 CSS 배경(audio-player.css)이라 테마 토글 순간 반대 테마 파일을 새로 받는다 —
  // 플레이어가 떠 있는 동안 등록해 두면 토글 직전 선요청이 챙긴다(themeAssets.ts)
  useThemeArt(AUDIO_RIDGE)
  const audioRef = useRef<HTMLAudioElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const wantPlayRef = useRef(false) // src 로드 시 자동 재생할지
  const firstGenNoticeRef = useRef(false) // 첫 생성 중 안내 토스트는 장당 1회만
  // 직전 장이 끝나 자동으로 다음 장에 온 상태인지 — 리셋 effect가 소비한다
  const autoAdvanceRef = useRef(false)

  const { voice, rate, autoNext, collapsed } = useAudioSettings()
  // 재생을 시작한 장(key)과 그때 확정한 src. 장이 바뀌면 key 가 달라져 "시작 전"이 된다.
  // 캐시된 장은 R2 직접 URL, 아니면 백엔드 스트리밍 URL — 재생 중엔 resolve 가 뒤늦게
  // 도착해도 src 를 바꾸지 않는다(바꾸면 오디오가 처음부터 다시 로드된다).
  const chapterKey = `${bookNumber}-${chapter}`
  const [play, setPlay] = useState<{ key: string; url: string } | null>(null)
  const started = play?.key === chapterKey
  const streamUrl = getTtsStreamUrl(bookNumber, chapter, voice)
  // 장을 열 때 캐시 상태를 미리 묻는다 — 캐시된 장은 재생 순간 백엔드 왕복 없이 R2 로 직행.
  // 숨겨진 플레이어(설정 off)는 묻지 않는다 — 안 듣는 사람도 장마다 요청 하나씩 냈다.
  const resolved = useTtsResolve({ bookNumber, chapter, voice, enabled: visible || started })
  const [isPlaying, setIsPlaying] = useState(false)
  const [preparing, setPreparing] = useState(false) // 첫 소리가 나기 전 대기 상태
  const [isError, setIsError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [cardVisible, setCardVisible] = useState(true) // 본 카드가 뷰포트에 보이는지
  // 낭독 영화관 — 같은 <audio> 요소 위에 전체화면 뷰만 씌운다
  const [showCinema, setShowCinema] = useState(false)

  const [showSleepSheet, setShowSleepSheet] = useState(false)
  // 오디오 설정 메뉴(배속·연속·잠들기) — 톱니 버튼 아래/바텀시트
  const [showSettings, setShowSettings] = useState(false)
  const settingsBtnRef = useRef<HTMLButtonElement>(null)
  const miniSettingsBtnRef = useRef<HTMLButtonElement>(null)
  // 부모 콜백은 ref로 보관 — 렌더마다 바뀌어도 이펙트/핸들러를 재구성하지 않는다
  const onPlayingChangeRef = useRef(onPlayingChange)
  onPlayingChangeRef.current = onPlayingChange

  // 재생/일시정지 상태를 부모에 통지 — 본문 자동 따라가기를 여기에 맞춰 멈춘다
  useEffect(() => {
    onPlayingChangeRef.current?.(isPlaying)
  }, [isPlaying])

  // 잠들기 전 듣기 — 수면 타이머·듣기 범위는 별도 훅이 담당한다
  const { sleepRemainingMs, endChapter, setEndChapter, checkSleepTimer, setSleepMinutes } =
    useAudioSleepTimer({
      audioRef,
      onExpire: () => {
        wantPlayRef.current = false // 다음 장 자동 재생을 기다리던 중이었다면 취소
        setPreparing(false)
      },
      notify: (message) => showToast(message, 'info'),
    })


  const handleSetEndChapter = (ch: number | null) => {
    setEndChapter(ch)
    if (ch == null) return
    // 범위 재생은 연속 재생이 전제 — 꺼져 있으면 함께 켠다
    if (!autoNext && ch > chapter) setAudioAutoNext(true)
    showToast(
      ch === chapter
        ? '이 장까지만 듣고 멈출게요 🌙'
        : `${bookName ? `${bookName} ` : ''}${ch}장까지 듣고 멈출게요 🌙`,
      'info'
    )
  }

  // 절별 타이밍 — 재생을 시작한 뒤에만 조회하고, 스트리밍 생성 중엔 최종본까지 폴링한다
  const timings = useTtsTimings({ enabled: started, bookNumber, chapter, voice, initial: resolved?.timings?.verses })

  // 듣기-보기 동기화 — "지금 몇 절인지" 판정과 절 점프(준비 전 요청 보관)는 useVerseSync 가 담당.
  // pendingVerseRef: '여기부터 듣기'로 요청됐지만 아직 점프하지 못한 절(준비되면 재시도).
  const { activeVerse, pendingVerseRef, syncActiveVerse, trySeekToVerse, tryPendingSeek } = useVerseSync({
    audioRef,
    timings,
    onActiveVerseChange,
    onSeeked: setCurrentTime,
  })

  // 장 이동 등으로 언마운트되면 따라가기도 함께 종료 (하이라이트 해제는 useVerseSync)
  useEffect(
    () => () => {
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
      setPlay(null)
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

  // 재생 전에도 캐시된 장이면 R2 URL 을 src 로 미리 걸어 둔다(preload="none" 이라 받지는
  // 않는다) — 누르는 순간 백엔드 307 없이 R2 로 곧장 간다. 시작한 뒤엔 그때 확정한 URL 고정.
  const audioUrl = started ? play!.url : (resolved?.url ?? undefined)

  useEffect(() => {
    if (!resolved?.url) return
    try {
      ensurePreconnect(new URL(resolved.url).origin)
    } catch {
      // 잘못된 URL 이면 무시 — 재생 시 onError 폴백이 처리한다
    }
  }, [resolved?.url])

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

  // 언마운트 시(장 이동 등) 재생 정지
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      audio?.pause()
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
    // 첫 재생 → src를 확정하고, 로드되면 자동 재생
    setIsError(false)
    setPreparing(true)
    wantPlayRef.current = true
    const url = resolved?.url ?? streamUrl
    setPlay({ key: chapterKey, url })
    // 선해결한 R2 URL 이 이미 src 로 걸려 있으면 audioUrl effect 가 다시 돌지 않는다 — 여기서 바로 재생
    if (audio && audioUrl === url) {
      wantPlayRef.current = false
      audio.playbackRate = rate
      audio.play().catch(() => {})
    }
  }

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      requestPlay()
    }
  }
  useImperativeHandle(ref, () => ({ togglePlay }))

  const onStartedChangeRef = useRef(onStartedChange)
  onStartedChangeRef.current = onStartedChange
  useEffect(() => {
    onStartedChangeRef.current?.(started)
  }, [started])

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
    setAudioVoice(v)
    setIsError(false)
    // 이미 듣고 있었다면 새 음성으로 이어서 재생
    if (started) {
      wantPlayRef.current = wasPlaying
      if (wasPlaying) setPreparing(true)
      // 새 음성은 아직 캐시 여부를 모른다 — 스트리밍 URL 로 두면 백엔드가 알아서 캐시로 보낸다
      setPlay({ key: chapterKey, url: getTtsStreamUrl(bookNumber, chapter, v) })
    }
  }

  // 접기/펼치기 — 설정을 기억하되, 접어도 재생은 그대로 이어진다.
  const toggleCollapsed = () => {
    const next = !collapsed
    setAudioCollapsed(next)
    // 설정 메뉴가 열린 채 접히면 허공에 뜬 팝오버만 남는다
    if (next) setShowSettings(false)
  }

  const toggleSettings = () => setShowSettings(v => !v)

  const toggleAutoNext = () => {
    const next = !autoNext
    setAudioAutoNext(next)
    showToast(
      next ? '장이 끝나면 다음 장을 이어서 들려드려요' : '연속 재생을 껐어요',
      'info'
    )
  }

  const selectRate = (next: number) => {
    if (!setAudioRate(next)) return
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

  // 진행바·별은 리렌더 없이 DOM 을 직접 움직인다(재생 중엔 매 프레임 보간) — useSmoothProgress
  const { fillRef, starRef, collapsedFillRef, miniFillRef } = useSmoothProgress({
    audioRef,
    isPlaying,
    duration,
    progress: pct / 100,
  })

  // 연속 재생 다음 장 준비: 절반(스트리밍이면 30초) 넘게 들으면 다음 장을 미리 생성시키고
  // 캐시 URL 을 받아 둔다 — 장이 끝나는 순간 R2 파일로 바로 이어진다(useNextChapterPrewarm)
  const nextChapter = chapter + 1
  const nextResolved = useNextChapterPrewarm({
    bookNumber,
    chapter,
    voice,
    started,
    isPlaying,
    autoNext,
    hasNextChapter,
    currentTime,
    pct,
  })

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
        <AudioCollapsedBar
          isPlaying={isPlaying}
          loading={loading}
          started={started}
          liveStream={liveStream}
          currentTime={currentTime}
          duration={duration}
          statusText={statusText}
          fillRef={collapsedFillRef}
          onTogglePlay={togglePlay}
          onExpand={toggleCollapsed}
        />
      )}

      {/* 접혀 있어도 마운트는 유지 — hidden 으로만 감춘다 */}
      <AudioExpandedCard
        collapsed={collapsed}
        isPlaying={isPlaying}
        loading={loading}
        liveStream={liveStream}
        currentTime={currentTime}
        duration={duration}
        pct={pct}
        statusText={statusText}
        voice={voice}
        settingsSummary={settingsSummary}
        showSettings={showSettings}
        sleepRemainingMs={sleepRemainingMs}
        canCinema={canCinema}
        fillRef={fillRef}
        starRef={starRef}
        settingsBtnRef={settingsBtnRef}
        onTogglePlay={togglePlay}
        onToggleSettings={toggleSettings}
        onOpenCinema={openCinema}
        onCollapse={toggleCollapsed}
        onSeek={handleSeek}
        onVoiceChange={handleVoiceChange}
      />

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
            // 다음 장 src 를 지금 확정 — 미리 준비된 캐시 URL 이 있으면 R2 로 곧장, 없으면 스트리밍
            setPlay({
              key: `${bookNumber}-${nextChapter}`,
              url: nextResolved?.url ?? getTtsStreamUrl(bookNumber, nextChapter, voice),
            })
            onAutoNextChapter()
          } else if (autoNext && !hasNextChapter) {
            showToast('이 책의 마지막 장까지 다 들었어요 🙌', 'info')
          }
        }}
        onError={() => {
          setPreparing(false)
          setIsPlaying(false)
          // started 후에만 실제 오류로 간주(초기 src 없는 상태 제외)
          if (!started) return
          // 선해결한 R2 URL 이 죽었으면(본문 수정으로 파일이 바뀐 뒤 옛 URL 등)
          // 백엔드 스트리밍 URL 로 한 번 되돌린다 — 백엔드가 새 캐시로 보내거나 생성한다
          if (play && play.url !== streamUrl) {
            wantPlayRef.current = true
            setPreparing(true)
            setPlay({ key: chapterKey, url: streamUrl })
            return
          }
          setIsError(true)
        }}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime
          // 시간 표시는 초 단위, 진행바는 1초 선형 전환 — 초가 바뀔 때만 상태를 갱신해
          // 초당 4번 오던 플레이어 전체 리렌더를 1번으로 줄인다
          if (Math.floor(t) !== Math.floor(currentTime)) setCurrentTime(t)
          syncActiveVerse(t)
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
    <AudioMiniBar
      showMini={showMini}
      isPlaying={isPlaying}
      loading={loading}
      liveStream={liveStream}
      currentTime={currentTime}
      duration={duration}
      statusText={statusText}
      settingsSummary={settingsSummary}
      showSettings={showSettings}
      sleepRemainingMs={sleepRemainingMs}
      fillRef={miniFillRef}
      settingsBtnRef={miniSettingsBtnRef}
      onTogglePlay={togglePlay}
      onToggleSettings={toggleSettings}
    />

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
        onSetSleepMinutes={setSleepMinutes}
        endChapter={endChapter}
        onSetEndChapter={handleSetEndChapter}
        onClose={() => setShowSleepSheet(false)}
      />
    )}
    </>
  )
}

export default BibleAudioPlayer
