import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBibleChapter } from '../../../hooks/useBible'
import { useChapterReadStatus, useMarkVerseAsRead } from '../../../hooks/useBibleReading'
import { useChapterBookmarks } from '../../../hooks/useBibleBookmark'
import { useAuth } from '../../../hooks/useAuth'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useWakeLock } from '../../PrayerFocus/useWakeLock'
import { showToast } from '../../../utils/toast'
import { TRANSLATION_LABEL } from './verseCopy'
import VerseBookmarkModal from './VerseBookmarkModal'
import type { BibleVerse } from '../../../types/bible'
import type { VerseBookmark } from '../../../api/bibleBookmark'

/**
 * 집중 읽기 — 한 화면에 한 절만 띄우고 위로 쓸어올려 다음 절로 넘어가는 몰입 모드.
 * (Scroll The Bible 류의 절 단위 세로 스냅 벤치마킹)
 *
 * - CSS scroll-snap(y mandatory + stop always)으로 "정확히 한 절씩"만 넘어간다
 * - 하단 눈금자 = 장 전체를 자처럼 펼친 위치 지도. 탭/드래그로 원하는 절로 점프
 * - 한 절에 일정 시간 머문 절은 떠날 때 조용히 읽음 처리한다(마지막 절만 머무는
 *   순간 즉시 — 떠날 곳이 없어 누락되는 구멍 방지). 절 길게 누르기 수동 읽음과
 *   같은 similarity=1 경로.
 * - 마지막 절 다음 스냅은 "장 끝" 카드 — 다음 장으로 끊김 없이 이어 읽는다
 */

interface FocusReadingProps {
  /** BibleBook.id — 전체 장 조회(useBibleChapter)용 */
  bookId: number
  /** 성경 권 번호(1~66) — 읽음/북마크 API용 */
  bookNumber: number
  bookName: string
  chapter: number
  totalChapters: number
  onChapterChange: (chapter: number) => void
  onClose: () => void
}

/** 이 시간 이상 머문 절만 "읽었다"로 본다 — 눈금자 스크럽·빠른 플링은 걸리지 않는다 */
const DWELL_MS = 2200
const HINT_KEY = 'bible-focus-hint-v1'

/** 시간대 틴트 — 새벽/낮/노을/밤의 빛을 배경에 옅게 얹는다 */
const currentTint = (): string => {
  const h = new Date().getHours()
  if (h >= 5 && h < 8) return 'dawn'
  if (h >= 8 && h < 17) return 'day'
  if (h >= 17 && h < 20) return 'dusk'
  return 'night'
}

const FocusReading = ({
  bookId,
  bookNumber,
  bookName,
  chapter,
  totalChapters,
  onChapterChange,
  onClose,
}: FocusReadingProps) => {
  const { isLoggedIn } = useAuth()
  const loggedIn = isLoggedIn()

  const { data: chapterData, isLoading } = useBibleChapter(bookId, chapter)
  const verses = useMemo(() => chapterData?.verses ?? [], [chapterData])

  const { data: readStatus } = useChapterReadStatus(bookNumber, chapter, loggedIn)
  const { data: chapterBookmarks } = useChapterBookmarks(bookNumber, chapter, loggedIn)
  const markAsRead = useMarkVerseAsRead()

  const [activeIndex, setActiveIndex] = useState(0)
  const [showBookmark, setShowBookmark] = useState(false)
  const [tint] = useState(currentTint)
  const [hint, setHint] = useState<'off' | 'on' | 'leaving'>(() =>
    localStorage.getItem(HINT_KEY) ? 'off' : 'on'
  )

  const scrollerRef = useRef<HTMLDivElement>(null)
  const rulerRef = useRef<HTMLDivElement>(null)
  const scrubbingRef = useRef(false)
  const rafRef = useRef(0)

  // 스크롤/키 핸들러가 최신 값을 리렌더 없이 읽도록 ref로 미러링
  const indexRef = useRef(0)
  const versesRef = useRef<BibleVerse[]>(verses)
  const dwellStartRef = useRef(performance.now())
  const readIdsRef = useRef<Set<number>>(new Set())
  const markedRef = useRef<Set<number>>(new Set())
  const loggedInRef = useRef(loggedIn)
  const markAsReadRef = useRef(markAsRead)
  const showBookmarkRef = useRef(false)
  versesRef.current = verses
  loggedInRef.current = loggedIn
  markAsReadRef.current = markAsRead
  showBookmarkRef.current = showBookmark

  const readSet = useMemo(() => {
    const s = new Set<number>()
    readStatus?.verses.forEach(v => {
      if (v.is_read) s.add(v.verse_id)
    })
    return s
  }, [readStatus])
  readIdsRef.current = readSet

  const bookmarksByVerse = useMemo(() => {
    const map = new Map<number, VerseBookmark>()
    for (const b of chapterBookmarks ?? []) map.set(b.verse_id, b)
    return map
  }, [chapterBookmarks])

  // 화면 꺼짐 방지 + 뒤에 깔린 페이지 스크롤 잠금
  useWakeLock(true)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // ── 체류 자동 읽음 ──────────────────────────────────────────────
  // 원칙: 읽는 도중에는 화면이 절대 바뀌지 않는다(집중 우선).
  // - 일반 절: 떠날 때(다음 절로 넘어갈 때) 머문 시간을 정산해 조용히 기록
  // - 마지막 절: 떠날 곳이 없어 누락되던 구멍 — 이 절만 DWELL_MS 머무는 순간 기록
  // - 이번 세션에서 기록한 절은 ✓ 읽음 배지를 띄우지 않아(markedRef 제외)
  //   어느 경우에도 읽는 중에 UI가 움직이지 않는다.
  const markVerse = useCallback((verse: BibleVerse) => {
    if (readIdsRef.current.has(verse.id) || markedRef.current.has(verse.id)) return
    markedRef.current.add(verse.id)
    markAsReadRef.current.mutate(
      { verseId: verse.id, similarity: 1 },
      {
        onError: e => {
          // 이미 읽음(409)은 정상 — 그 외 실패만 재시도 여지를 남긴다
          if (!(e instanceof Error) || e.message !== 'ALREADY_READ') {
            markedRef.current.delete(verse.id)
          }
        },
      }
    )
  }, [])

  /** 지금 머물던 절의 체류 시간을 정산하고, 충분히 머물렀으면 읽음 처리 */
  const commitDwell = useCallback(() => {
    const stayed = performance.now() - dwellStartRef.current
    dwellStartRef.current = performance.now()
    if (!loggedInRef.current || stayed < DWELL_MS) return
    const verse = versesRef.current[indexRef.current]
    if (verse) markVerse(verse)
  }, [markVerse])

  // 마지막 절 전용 — DWELL_MS 머무는 순간 즉시 기록 (일찍 떠나면 cleanup이 취소).
  // readSet은 의존성이 아닌 ref로 판정 — refetch로 Set 정체성이 바뀔 때마다
  // 타이머가 리셋되는 것을 막는다.
  useEffect(() => {
    if (!loggedIn || verses.length === 0) return
    if (activeIndex !== verses.length - 1) return
    const verse = verses[activeIndex]
    if (readIdsRef.current.has(verse.id) || markedRef.current.has(verse.id)) return
    const t = setTimeout(() => markVerse(verse), DWELL_MS)
    return () => clearTimeout(t)
  }, [activeIndex, verses, loggedIn, markVerse])

  const requestClose = useCallback(() => {
    commitDwell()
    onClose()
  }, [commitDwell, onClose])

  // 안드로이드/브라우저 뒤로가기 → 집중 읽기만 닫기
  useModalBackButton(requestClose)

  const scrollToIndex = useCallback((idx: number, smooth = true) => {
    const el = scrollerRef.current
    if (!el || !el.clientHeight) return
    const max = versesRef.current.length // 마지막 인덱스 = 장 끝 카드
    const clamped = Math.max(0, Math.min(max, idx))
    el.scrollTo({ top: clamped * el.clientHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  const handleScroll = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const el = scrollerRef.current
      if (!el || !el.clientHeight) return
      const max = versesRef.current.length
      const idx = Math.max(0, Math.min(max, Math.round(el.scrollTop / el.clientHeight)))
      if (idx !== indexRef.current) {
        commitDwell() // 떠나는 절 정산 — indexRef 갱신 전에 호출해야 그 절이 잡힌다
        indexRef.current = idx
        setActiveIndex(idx)
        if (hint === 'on') setHint('leaving')
      }
    })
  }, [hint, commitDwell])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  // 첫 진입 힌트 — 한 번 스와이프하거나 4초 지나면 스르르 사라진다
  useEffect(() => {
    if (hint === 'on') {
      const t = setTimeout(() => setHint('leaving'), 4000)
      return () => clearTimeout(t)
    }
    if (hint === 'leaving') {
      localStorage.setItem(HINT_KEY, '1')
      const t = setTimeout(() => setHint('off'), 700)
      return () => clearTimeout(t)
    }
  }, [hint])

  // 키보드 — ↑↓/스페이스 절 이동, Esc 닫기 (북마크 모달이 열려 있으면 양보)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showBookmarkRef.current) return
      if (['ArrowDown', 'ArrowRight', ' ', 'PageDown'].includes(e.key)) {
        e.preventDefault()
        scrollToIndex(indexRef.current + 1)
      } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        scrollToIndex(indexRef.current - 1)
      } else if (e.key === 'Escape') {
        requestClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [scrollToIndex, requestClose])

  const goToChapter = useCallback(
    (ch: number) => {
      if (ch < 1 || ch > totalChapters) return
      commitDwell()
      indexRef.current = 0
      setActiveIndex(0)
      scrollerRef.current?.scrollTo({ top: 0 })
      onChapterChange(ch)
    },
    [commitDwell, onChapterChange, totalChapters]
  )

  // ── 눈금자 스크럽 — 탭/드래그한 x 위치의 절로 즉시 점프 ──
  const scrubTo = useCallback((clientX: number) => {
    const el = rulerRef.current
    const count = versesRef.current.length
    if (!el || !count) return
    const rect = el.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    const idx = Math.max(0, Math.min(count - 1, Math.floor(ratio * count)))
    const scroller = scrollerRef.current
    if (scroller?.clientHeight) scroller.scrollTo({ top: idx * scroller.clientHeight })
  }, [])

  const totalVerses = verses.length
  const isEndSlide = activeIndex >= totalVerses && totalVerses > 0
  const currentVerse = verses[Math.min(activeIndex, Math.max(0, totalVerses - 1))]
  const currentBookmark = currentVerse ? bookmarksByVerse.get(currentVerse.id) ?? null : null
  const hasNextChapter = chapter < totalChapters

  const handleBookmark = () => {
    if (isEndSlide || !currentVerse) return
    if (!loggedIn) {
      showToast('로그인 후 이용할 수 있어요', 'error')
      return
    }
    setShowBookmark(true)
  }

  // 눈금자 간격 — 절 수가 많은 장(시 119편 176절)도 한 줄에 들어가게 좁힌다
  const tickGap = totalVerses > 90 ? 0 : totalVerses > 45 ? 1 : 2

  return createPortal(
    <div className="focus-overlay" data-tint={tint} role="dialog" aria-label="집중 읽기">
      {/* 절 스크롤러 — 한 절 = 한 화면 */}
      <div ref={scrollerRef} className="focus-scroller" onScroll={handleScroll}>
        {isLoading && (
          <div className="focus-loading">
            <div className="focus-loading__spinner" />
          </div>
        )}

        {verses.map((v, i) => {
          // ✓ 읽음 배지는 "예전에 읽었던 절"에만 — 이번 세션에서 기록된 절은
          // 제외해서, 읽는 도중 배지가 나타나며 집중을 깨는 일이 없게 한다
          const isRead = readSet.has(v.id) && !markedRef.current.has(v.id)
          const lengthClass =
            v.text.length > 150 ? ' is-vlong' : v.text.length > 90 ? ' is-long' : ''
          return (
            <section key={v.id} className="focus-slide">
              <div className={`focus-slide__inner${i === activeIndex ? ' is-active' : ''}`}>
                <span className="focus-slide__num">{v.verse}</span>
                {isRead && (
                  <span className="focus-slide__read">
                    <span className="material-icons-round" aria-hidden>
                      check
                    </span>
                    읽음
                  </span>
                )}
                <p className={`focus-slide__text${lengthClass}`}>{v.text}</p>
                <span className="focus-slide__translation">{TRANSLATION_LABEL}</span>
              </div>
            </section>
          )
        })}

        {/* 장 끝 카드 — 마지막 절에서 한 번 더 쓸어올리면 도착한다 */}
        {totalVerses > 0 && (
          <section className="focus-slide">
            <div className={`focus-slide__inner${isEndSlide ? ' is-active' : ''}`}>
              <div className="focus-end__icon">
                <span className="material-icons-round" aria-hidden>
                  auto_awesome
                </span>
              </div>
              <h3 className="focus-end__title">
                {bookName} {chapter}장 끝
              </h3>
              <p className="focus-end__sub">
                {hasNextChapter
                  ? '숨 한 번 고르고, 이어서 읽어볼까요'
                  : `${bookName}의 마지막 장까지 다 읽었어요 🎉`}
              </p>
              {hasNextChapter ? (
                <button type="button" className="focus-end__next" onClick={() => goToChapter(chapter + 1)}>
                  {chapter + 1}장 이어 읽기
                  <span className="material-icons-round" aria-hidden>
                    arrow_downward
                  </span>
                </button>
              ) : (
                <button type="button" className="focus-end__next" onClick={requestClose}>
                  집중 읽기 마치기
                </button>
              )}
              {hasNextChapter && (
                <button type="button" className="focus-end__close" onClick={requestClose}>
                  오늘은 여기까지
                </button>
              )}
            </div>
          </section>
        )}
      </div>

      {/* 상단 바 */}
      <header className="focus-top">
        <button type="button" className="focus-top__btn" onClick={requestClose} aria-label="집중 읽기 닫기">
          <span className="material-icons-round">close</span>
        </button>
        <div className="focus-top__title">
          <span className="focus-top__mode">집중 읽기</span>
          <span className="focus-top__book">
            {bookName} {chapter}장
          </span>
        </div>
        <button
          type="button"
          className={`focus-top__btn${currentBookmark ? ' is-on' : ''}`}
          onClick={handleBookmark}
          aria-label="이 절 북마크"
          title="이 절 북마크"
        >
          <span className="material-icons-round">
            {currentBookmark ? 'bookmark' : 'bookmark_border'}
          </span>
        </button>
      </header>

      {/* 좌우 화살표 — 데스크톱·접근성 보조 이동 수단 */}
      <button
        type="button"
        className="focus-arrow focus-arrow--prev"
        onClick={() => scrollToIndex(activeIndex - 1)}
        disabled={activeIndex === 0}
        aria-label="이전 절"
      >
        <span className="material-icons-round">chevron_left</span>
      </button>
      <button
        type="button"
        className="focus-arrow focus-arrow--next"
        onClick={() => scrollToIndex(activeIndex + 1)}
        disabled={isEndSlide}
        aria-label="다음 절"
      >
        <span className="material-icons-round">chevron_right</span>
      </button>

      {/* 첫 진입 힌트 */}
      {hint !== 'off' && (
        <div className={`focus-hint${hint === 'leaving' ? ' is-leaving' : ''}`}>
          <span className="material-icons-round" aria-hidden>
            arrow_upward
          </span>
          위로 쓸어올려 다음 절로
        </div>
      )}

      {/* 하단 — 절 눈금자 + 현재 위치 + 장 이동 */}
      <footer className="focus-bottom">
        {totalVerses > 0 && (
          <div
            ref={rulerRef}
            className="focus-ruler"
            style={{ gap: tickGap }}
            role="slider"
            aria-label="절 위치"
            aria-valuemin={1}
            aria-valuemax={totalVerses}
            aria-valuenow={currentVerse?.verse ?? 1}
            onPointerDown={e => {
              scrubbingRef.current = true
              e.currentTarget.setPointerCapture(e.pointerId)
              scrubTo(e.clientX)
            }}
            onPointerMove={e => {
              if (scrubbingRef.current) scrubTo(e.clientX)
            }}
            onPointerUp={() => {
              scrubbingRef.current = false
            }}
            onPointerCancel={() => {
              scrubbingRef.current = false
            }}
          >
            {verses.map((v, i) => (
              <span
                key={v.id}
                className={`focus-ruler__tick${i < activeIndex ? ' is-past' : ''}${
                  i === activeIndex ? ' is-current' : ''
                }${readSet.has(v.id) ? ' is-read' : ''}`}
              />
            ))}
          </div>
        )}

        <div className="focus-bottom__row">
          <button
            type="button"
            className="focus-chapter-btn"
            onClick={() => goToChapter(chapter - 1)}
            disabled={chapter <= 1}
          >
            <span className="focus-chapter-btn__num">{chapter - 1}</span>
            <span className="focus-chapter-btn__label">이전 장</span>
          </button>

          <div className="focus-bottom__ref">
            {isEndSlide
              ? `${bookName} ${chapter}장 · ${totalVerses}절 끝`
              : currentVerse
                ? `${bookName} ${chapter}:${currentVerse.verse} · 전체 ${totalVerses}절`
                : `${bookName} ${chapter}장`}
          </div>

          <button
            type="button"
            className="focus-chapter-btn"
            onClick={() => goToChapter(chapter + 1)}
            disabled={!hasNextChapter}
          >
            <span className="focus-chapter-btn__num">{chapter + 1}</span>
            <span className="focus-chapter-btn__label">다음 장</span>
          </button>
        </div>
      </footer>

      {/* 절 북마크(형광펜·노트·즐겨찾기) — 일반 읽기와 같은 모달 재사용 */}
      {showBookmark && currentVerse && (
        <VerseBookmarkModal
          verseId={currentVerse.id}
          verseReference={`${bookName} ${chapter}:${currentVerse.verse}`}
          verseText={currentVerse.text}
          existing={currentBookmark}
          onClose={() => setShowBookmark(false)}
        />
      )}
    </div>,
    document.body
  )
}

export default FocusReading
