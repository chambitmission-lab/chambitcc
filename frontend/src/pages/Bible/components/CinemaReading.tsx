import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { RefObject } from 'react'
import { useBibleChapter } from '../../../hooks/useBible'
import { useChapterReadStatus, useMarkVerseAsRead } from '../../../hooks/useBibleReading'
import { useAuth } from '../../../hooks/useAuth'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useWakeLock } from '../../PrayerFocus/useWakeLock'
import { getCinemaScenes } from './cinemaScenes'
import { TRANSLATION_LABEL } from './verseCopy'
import type { VerseTiming } from '../../../api/bibleTts'

/**
 * 성경 낭독 영화관 — 화면을 전부 비우고 말씀 + 음성 + 배경만 남기는 몰입 모드.
 *
 * 오디오는 BibleAudioPlayer의 <audio> 요소를 "그대로" 공유한다(별도 재생 없음).
 * - 같은 요소를 재사용해야 연속 재생(다음 장 자동)이 모바일 자동재생 정책에 안 걸린다
 * - 절 타이밍·수면 타이머·배속 등 플레이어의 모든 기능이 뒤에서 그대로 동작한다
 *
 * 낭독 중인 절이 화면 가운데 크게 뜨고, 절 안에서는 낭독 진행을 보간해
 * 단어가 하나씩 은은하게 밝아진다(절 타이밍 사이를 글자 수 비례로 나눔).
 * 배경은 책 내용(창세기 1장: 우주→빛→물→하늘→땅, 시가서: 새벽→산→들판)을 따라
 * 절 진행에 맞춰 아주 느리게 크로스페이드한다 — 배경 10%, 말씀 90%.
 */

interface CinemaReadingProps {
  /** BibleBook.id — 본문(절 텍스트) 조회용 */
  bookId: number
  bookNumber: number
  bookName: string
  chapter: number
  isPlaying: boolean
  /** 첫 소리가 나기 전 준비 중(스트리밍 생성 등) */
  loading: boolean
  /** 지금 낭독 중인 절 번호 (머리말 구간·정지 시 null) */
  activeVerse: number | null
  duration: number
  timings: VerseTiming[] | null
  audioRef: RefObject<HTMLAudioElement | null>
  onTogglePlay: () => void
  /** 해당 절 시작점으로 점프 (타이밍 준비 전엔 false) */
  onSeekToVerse: (verse: number) => boolean
  onClose: () => void
}

const UI_HIDE_MS = 3500
/** 이 시간 이상 낭독을 듣고 넘어간 절만 읽음으로 기록 — 빠른 절 스킵은 제외 */
const NARRATE_MIN_MS = 2000

const CinemaReading = ({
  bookId,
  bookNumber,
  bookName,
  chapter,
  isPlaying,
  loading,
  activeVerse,
  duration,
  timings,
  audioRef,
  onTogglePlay,
  onSeekToVerse,
  onClose,
}: CinemaReadingProps) => {
  const { data: chapterData } = useBibleChapter(bookId, chapter)
  const verses = useMemo(() => chapterData?.verses ?? [], [chapterData])

  const { isLoggedIn } = useAuth()
  const loggedIn = isLoggedIn()
  const { data: readStatus } = useChapterReadStatus(bookNumber, chapter, loggedIn)
  const markAsRead = useMarkVerseAsRead()

  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [uiVisible, setUiVisible] = useState(true)
  const uiTimerRef = useRef<number | null>(null)
  const isPlayingRef = useRef(isPlaying)
  isPlayingRef.current = isPlaying

  // 세로로 들고 있으면 처음 한 번만 "눕히면 넓게" 힌트
  const [rotateHint, setRotateHint] = useState(
    () => window.matchMedia?.('(orientation: portrait)').matches ?? false
  )

  useWakeLock(true)
  useModalBackButton(onClose)


  // 뒤 페이지 스크롤 잠금 + 전체화면 진입(가능한 기기에서만, 실패는 조용히 무시)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    try {
      rootRef.current?.requestFullscreen?.({ navigationUI: 'hide' })?.catch?.(() => {})
    } catch {
      // iOS 등 미지원 — fixed 오버레이만으로 충분
    }
    return () => {
      document.body.style.overflow = prev
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!rotateHint) return
    const t = setTimeout(() => setRotateHint(false), 4500)
    return () => clearTimeout(t)
  }, [rotateHint])

  // ── 컨트롤 자동 숨김 — 재생 중 잠시 두면 말씀만 남는다 ──
  const pokeUi = useCallback(() => {
    setUiVisible(true)
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current)
    uiTimerRef.current = window.setTimeout(() => {
      if (isPlayingRef.current) setUiVisible(false)
    }, UI_HIDE_MS)
  }, [])

  useEffect(() => {
    pokeUi()
    return () => {
      if (uiTimerRef.current) clearTimeout(uiTimerRef.current)
    }
  }, [pokeUi, isPlaying])

  const handleBackdropTap = () => {
    if (uiVisible && isPlaying) {
      setUiVisible(false)
      if (uiTimerRef.current) clearTimeout(uiTimerRef.current)
    } else {
      pokeUi()
    }
  }

  // ── 현재 절 텍스트 ──
  const currentVerseObj = useMemo(
    () => (activeVerse != null ? verses.find(v => v.verse === activeVerse) ?? null : null),
    [verses, activeVerse]
  )

  // 화면 맞춤 — 절이 무대보다 길면(특히 가로 모드) 글자를 단계적으로 줄여 한 화면에 담는다.
  // 0.5까지 줄여도 안 들어가면 그대로 두고 스크롤(CSS overflow)에 맡긴다.
  const [fitTick, setFitTick] = useState(0)
  useEffect(() => {
    const bump = () => setFitTick((t) => t + 1)
    window.addEventListener('resize', bump)
    window.addEventListener('orientationchange', bump)
    return () => {
      window.removeEventListener('resize', bump)
      window.removeEventListener('orientationchange', bump)
    }
  }, [])
  const fitKey = currentVerseObj ? `${chapter}-${currentVerseObj.verse}` : `title-${chapter}`
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let fit = 1
    stage.style.setProperty('--cinema-fit', '1')
    stage.scrollTop = 0
    // scrollHeight > clientHeight 이면 넘친 것. 5%씩 줄이며 재측정
    while (stage.scrollHeight > stage.clientHeight + 1 && fit > 0.5) {
      fit = Math.round((fit - 0.05) * 100) / 100
      stage.style.setProperty('--cinema-fit', String(fit))
    }
  }, [fitKey, fitTick])

  // ── 낭독 완료 자동 읽음 — 절 낭독이 끝나 다음 절로 넘어가는 순간 조용히 기록 ──
  // 시네마는 단어가 밝아지는 걸 눈으로 따라 읽는 화면이므로 집중 읽기와 같은
  // similarity=1 경로로 기록한다. 화면에는 아무 표시도 하지 않는다(고요함 유지).
  // NARRATE_MIN_MS 미만에 스킵한 절은 제외. 판정용 값들은 ref로 미러링해
  // 렌더·refetch에 흔들리지 않게 한다.
  const loggedInRef = useRef(loggedIn)
  const markAsReadRef = useRef(markAsRead)
  const readIdsRef = useRef<Set<number>>(new Set())
  const markedRef = useRef<Set<number>>(new Set())
  loggedInRef.current = loggedIn
  markAsReadRef.current = markAsRead
  readIdsRef.current = useMemo(() => {
    const s = new Set<number>()
    readStatus?.verses.forEach(v => {
      if (v.is_read) s.add(v.verse_id)
    })
    return s
  }, [readStatus])

  const markVerseRead = useCallback((verseId: number) => {
    if (!loggedInRef.current) return
    if (readIdsRef.current.has(verseId) || markedRef.current.has(verseId)) return
    markedRef.current.add(verseId)
    markAsReadRef.current.mutate(
      { verseId, similarity: 1 },
      {
        onError: e => {
          // 이미 읽음(409)은 정상 — 그 외 실패만 재시도 여지를 남긴다
          if (!(e instanceof Error) || e.message !== 'ALREADY_READ') {
            markedRef.current.delete(verseId)
          }
        },
      }
    )
  }, [])

  // 지금 낭독 중인 절과 시작 시각 — 절이 바뀌면(다음 절·장 끝·장 전환) 직전 절 정산
  const narratingRef = useRef<{ id: number | null; since: number }>({ id: null, since: 0 })
  useEffect(() => {
    const prev = narratingRef.current
    const nowId = currentVerseObj?.id ?? null
    if (prev.id === nowId) return
    if (prev.id != null && performance.now() - prev.since >= NARRATE_MIN_MS) {
      markVerseRead(prev.id)
    }
    narratingRef.current = { id: nowId, since: performance.now() }
  }, [currentVerseObj, markVerseRead])

  // 닫기(언마운트) 시 마지막으로 듣던 절 정산 — 장 끝까지 안 듣고 닫아도 누락 없음
  useEffect(
    () => () => {
      const prev = narratingRef.current
      if (prev.id != null && performance.now() - prev.since >= NARRATE_MIN_MS) {
        markVerseRead(prev.id)
      }
    },
    [markVerseRead]
  )
  const words = useMemo(
    () => (currentVerseObj ? currentVerseObj.text.split(/\s+/).filter(Boolean) : []),
    [currentVerseObj]
  )

  // ── 단어 보간 하이라이트 — 절 시작~다음 절 시작 사이를 글자 수 비례로 나눈다 ──
  const [litCount, setLitCount] = useState(0)
  useEffect(() => {
    setLitCount(0)
  }, [activeVerse, chapter, bookNumber])

  useEffect(() => {
    if (!isPlaying || activeVerse == null || !timings || words.length === 0) return
    const idx = timings.findIndex(t => t.verse === activeVerse)
    if (idx < 0) return
    const start = timings[idx].start

    // 절 끝 시각 — 다음 절 타이밍이 있으면 그대로, 없으면(장의 마지막 절,
    // 첫 생성 중 부분 타이밍의 끝) 앞 절들의 "실측 낭독 속도"(초당 글자 수)로
    // 이 절의 길이를 추정한다. 예전 고정 0.45초/단어 추정은 실제(단어당 약 1초)보다
    // 두 배쯤 빨라서 마지막 절 하이라이트가 음성을 앞질렀다. 추정엔 +12% 여유를 둬
    // 밝기가 음성보다 먼저 끝나느니 살짝 늦게 끝나는 쪽을 택한다.
    let end: number
    if (idx + 1 < timings.length) {
      end = timings[idx + 1].start
    } else {
      let charsPerSec = 0
      if (idx > 0) {
        let chars = 0
        for (let i = 0; i < idx; i++) {
          const tv = verses.find(v => v.verse === timings[i].verse)
          if (tv) chars += tv.text.length
        }
        const covered = start - timings[0].start
        if (covered > 0 && chars > 0) charsPerSec = chars / covered
      }
      const textLen = currentVerseObj?.text.length ?? words.length * 4
      end =
        charsPerSec > 0
          ? start + (textLen / charsPerSec) * 1.12
          : start + words.length * 0.9 // 첫 절부터 재생 등 실측 불가 시 보수적 폴백
      // 총길이를 알면 그 너머로는 가지 않는다
      if (duration > start + 1) end = Math.min(end, duration)
    }
    const span = Math.max(0.001, end - start)
    // 단어 경계를 누적 글자 수 비율로 배치 — 긴 단어가 더 오래 밝아진다.
    // bounds[i] = i번째 단어 낭독이 "끝나는" 지점(0~1). frac이 bounds[i]를
    // 지나면 i+1번째 단어가 읽히는 중이므로, 밝힐 단어 수 = 지난 경계 수 + 1.
    const totalChars = words.reduce((n, w) => n + w.length, 0)
    const bounds: number[] = []
    let acc = 0
    for (const w of words) {
      acc += w.length
      bounds.push(acc / totalChars)
    }
    let raf = 0
    const tick = () => {
      const t = audioRef.current?.currentTime
      if (t != null) {
        const frac = Math.min(1, Math.max(0, (t - start) / span))
        let n = 1
        while (n < words.length && frac >= bounds[n - 1]) n++
        // 같은 절 안에서 하이라이트는 앞으로만 간다 — 부분 타이밍이 최종본으로
        // 갱신되며 절 길이가 재계산될 때, 이미 밝힌 단어가 도로 어두워지며
        // 뒤로 점프하던 현상 방지 (절이 바뀌면 위 effect가 0으로 리셋)
        setLitCount(prev => (n > prev ? n : prev))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, activeVerse, timings, duration, words, verses, currentVerseObj, audioRef])

  // 타이밍이 없으면(첫 스트리밍 생성 중) 보간 불가 — 절 전체를 밝게
  const effectiveLit = timings ? litCount : words.length

  // ── 배경 장면 — 절 진행(몇 절째인지)에 따라 느린 크로스페이드 ──
  const scenes = useMemo(() => getCinemaScenes(bookNumber, chapter), [bookNumber, chapter])
  const verseIdx = currentVerseObj ? verses.indexOf(currentVerseObj) : 0
  const sceneProgress = verses.length > 1 ? verseIdx / (verses.length - 1) : 0
  const scenePos = sceneProgress * (scenes.length - 1)

  // ── 절 이동 ──
  const maxTimedVerse = timings && timings.length > 0 ? timings[timings.length - 1].verse : 0
  const stepVerse = (dir: 1 | -1) => {
    const cur = activeVerse ?? 0
    const target = Math.max(1, Math.min(maxTimedVerse || cur + dir, cur + dir))
    if (target !== cur || dir === -1) onSeekToVerse(target)
    pokeUi()
  }

  // 키보드 — 스페이스 재생/정지, ←→ 절 이동, Esc 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        onTogglePlay()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        stepVerse(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        stepVerse(-1)
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVerse, timings, onTogglePlay, onClose])

  const canSeek = maxTimedVerse > 0

  return createPortal(
    <div ref={rootRef} className="cinema-overlay" role="dialog" aria-label="성경 낭독 영화관">
      {/* 배경 — 장면 레이어 크로스페이드 + 느린 빛무리. 항상 말씀보다 뒤·어둡게 */}
      <div className="cinema-bg" aria-hidden>
        {scenes.map((s, i) => (
          <div
            key={i}
            className="cinema-bg__layer"
            style={{
              background: s.bg,
              opacity: Math.max(0, 1 - Math.abs(scenePos - i)),
            }}
          />
        ))}
        <div
          className="cinema-bg__glow"
          style={{ background: `radial-gradient(60% 45% at 50% 42%, ${scenes[Math.round(scenePos)]?.glow ?? 'rgba(255,255,255,0.06)'}, transparent 70%)` }}
        />
        <div className="cinema-bg__vignette" />
      </div>

      {/* 탭 영역 — 컨트롤 표시/숨김 토글 */}
      <div ref={stageRef} className="cinema-stage" onClick={handleBackdropTap}>
        {currentVerseObj ? (
          /* key로 절이 바뀔 때마다 새로 페이드 인 */
          <div key={`${chapter}-${currentVerseObj.verse}`} className="cinema-verse">
            <p className="cinema-verse__text">
              {words.map((w, i) => (
                <span key={i} className={`cinema-word${i < effectiveLit ? ' is-lit' : ''}`}>
                  {w}
                  {i < words.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
            <span className="cinema-verse__ref">
              {bookName} {chapter}:{currentVerseObj.verse}
            </span>
          </div>
        ) : (
          /* 머리말 낭독·준비 중 — 영화 타이틀 카드 */
          <div key={`title-${chapter}`} className="cinema-verse cinema-title">
            <span className="cinema-title__label">{TRANSLATION_LABEL}</span>
            <h2 className="cinema-title__book">{bookName}</h2>
            <span className="cinema-title__chapter">{chapter}장</span>
            {loading && <span className="cinema-title__status">말씀을 준비하고 있어요…</span>}
          </div>
        )}
      </div>

      {/* 세로 화면 힌트 — 처음 몇 초만 */}
      {rotateHint && (
        <div className="cinema-rotate-hint">
          <span className="material-icons-round" aria-hidden>
            screen_rotation
          </span>
          휴대폰을 눕히면 영화관처럼 넓게 보여요
        </div>
      )}

      {/* 컨트롤 — 재생 중 잠시 두면 사라진다 */}
      <div className={`cinema-ui${uiVisible ? '' : ' is-hidden'}`}>
        <header className="cinema-ui__top">
          <button
            type="button"
            className="cinema-ui__btn"
            onClick={onClose}
            aria-label="영화관 닫기"
          >
            <span className="material-icons-round">close</span>
          </button>
          <span className="cinema-ui__caption">
            {bookName} {chapter}장 낭독
          </span>
          <span className="cinema-ui__spacer" />
        </header>

        <footer className="cinema-ui__bottom">
          {/* 장 진행 — 절 기준의 얇은 실선 하나만 */}
          <div className="cinema-progress">
            <div
              className="cinema-progress__fill"
              style={{
                width: `${verses.length > 0 ? ((verseIdx + (currentVerseObj ? 1 : 0)) / verses.length) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="cinema-ui__controls">
            <button
              type="button"
              className="cinema-ui__btn"
              onClick={() => stepVerse(-1)}
              disabled={!canSeek}
              aria-label="이전 절"
            >
              <span className="material-icons-round">skip_previous</span>
            </button>
            <button
              type="button"
              className="cinema-ui__btn cinema-ui__btn--play"
              onClick={() => {
                onTogglePlay()
                pokeUi()
              }}
              aria-label={isPlaying ? '일시정지' : '재생'}
            >
              <span className={`material-icons-round${loading ? ' cinema-pulse' : ''}`}>
                {loading ? 'auto_awesome' : isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button
              type="button"
              className="cinema-ui__btn"
              onClick={() => stepVerse(1)}
              disabled={!canSeek}
              aria-label="다음 절"
            >
              <span className="material-icons-round">skip_next</span>
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  )
}

export default CinemaReading
