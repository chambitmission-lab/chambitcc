import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { RefObject } from 'react'
import { useBibleChapter } from '../../../hooks/useBible'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useWakeLock } from '../../PrayerFocus/useWakeLock'
import { getCinemaScenes } from './cinemaScenes'
import { TRANSLATION_LABEL } from './verseCopy'
import type { VerseTiming } from './BibleAudioPlayer'

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

  const rootRef = useRef<HTMLDivElement>(null)
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
    const nextStart =
      idx + 1 < timings.length
        ? timings[idx + 1].start
        : duration > start
          ? duration
          : start + words.length * 0.45 // 마지막 절 + 총길이 미상: 대략치
    const span = Math.max(0.001, nextStart - start)
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
        setLitCount(prev => (prev === n ? prev : n))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, activeVerse, timings, duration, words, audioRef])

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
      <div className="cinema-stage" onClick={handleBackdropTap}>
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
