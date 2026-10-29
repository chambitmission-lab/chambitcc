import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAuth } from '../../../hooks/useAuth'
import { bibleReadingKeys, useChapterReadStatus } from '../../../hooks/useBibleReading'
import { getBookReadingProgress } from '../../../api/bibleReading'
import { bookmarkKeys } from '../../../hooks/useBibleBookmark'
import { listBookmarks } from '../../../api/bibleBookmark'
import { wordNoteKeys } from '../../../hooks/useBibleWordNote'
import { listWordNotes } from '../../../api/bibleWordNote'
import ReaderSettings from './ReaderSettings'
import { lazyModal } from '../../../utils/lazyModal'
// 장 선택 시트는 열 때만 — 읽기 화면 청크에서 분리
const ChapterPickerSheet = lazyModal(() => import('./ChapterPickerSheet'))

/**
 * 장 알약 테두리 = 이 장 읽음 진행선.
 * 예전엔 본문 위에 진행률 pill 을 첫 읽음 때 새로 끼워 넣어 본문 전체가 툭 밀렸다.
 * 알약 둘레(위 가운데에서 시계 방향)에 겹쳐 그리면 차지하는 높이가 0 이다.
 * 알약 폭이 화면마다 달라 실제 크기를 재서 스타디움 경로를 그린다 — viewBox 를 늘이면 둥근 끝이 찌그러진다.
 */
const ChapterTriggerRing = ({ percent }: { percent: number }) => {
  const ref = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = ref.current?.parentElement
    if (!el) return
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const sw = 2
  let d = ''
  if (size && size.w > 0 && size.h > 0) {
    const t = sw / 2
    const w = size.w - t
    const h = size.h - t
    const r = (h - t) / 2
    d = `M ${size.w / 2} ${t} H ${w - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${t + r} A ${r} ${r} 0 0 1 ${t + r} ${t} Z`
  }
  return (
    <svg
      ref={ref}
      className="chapter-trigger__ring"
      width={size?.w ?? 0}
      height={size?.h ?? 0}
      aria-hidden
    >
      {d && (
        <path
          d={d}
          pathLength={100}
          strokeWidth={sw}
          strokeDasharray="100 100"
          strokeDashoffset={100 - Math.min(100, Math.max(0, percent))}
        />
      )}
    </svg>
  )
}

interface ChapterNavigationProps {
  selectedBook: string
  /** BibleBook.id — 장별 진행도 조회용 */
  selectedBookId: number
  /** 성경 권 번호(1~66) */
  bookNumber: number
  selectedChapter: number
  totalChapters: number
  /** 이 책에서 마지막으로 펼쳤던 장 — 시트의 '이어읽기' 칩 */
  resumeChapter?: number
  onChapterChange: (chapter: number) => void
  onBackToBooks: () => void
  /** 집중 읽기(한 절씩 몰입 모드) 열기 */
  onOpenFocus?: () => void
  /** 목회자 연구 모드 — 넘겨줄 때만(PC·목회자) 버튼이 생긴다 */
  research?: { on: boolean; onToggle: () => void }
}

const ChapterNavigation = ({
  selectedBook,
  selectedBookId,
  bookNumber,
  selectedChapter,
  totalChapters,
  resumeChapter,
  onChapterChange,
  onBackToBooks,
  onOpenFocus,
  research
}: ChapterNavigationProps) => {
  const { language } = useLanguage()
  const { isLoggedIn } = useAuth()
  const [pickerOpen, setPickerOpen] = useState(false)
  const queryClient = useQueryClient()
  const loggedIn = isLoggedIn()

  // 이 장 읽음 현황 — 본문(useChapterReadState)과 같은 쿼리 키라 요청이 더 생기지 않는다
  const { data: readStatus } = useChapterReadStatus(bookNumber, selectedChapter, loggedIn)
  const readTotal = readStatus?.total_verses ?? 0
  const readDone = Math.min(readStatus?.read_verses ?? 0, readTotal)
  const readPercent = readTotal > 0 ? (readDone / readTotal) * 100 : 0
  const chapterComplete = readTotal > 0 && readDone >= readTotal

  // 시트 청크를 본문이 그려진 뒤 한가할 때 미리 받아둔다.
  // 미리 받지 않으면 첫 탭은 Suspense 경로로 열리는데, React는 폴백(null)을 한 번
  // 커밋하면 실제 콘텐츠 커밋을 폴백 시점+300ms까지 미룬다(fallback throttle) —
  // 청크가 7ms에 도착해도 빈 화면 300ms 뒤에 시트가 "툭" 뜨던 원인. 받아둔 뒤엔
  // lazyModal이 Suspense를 건너뛰어 첫 열기도 즉시(3~5ms) 그려진다.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(ChapterPickerSheet.preload, { timeout: 2500 })
      return () => w.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(ChapterPickerSheet.preload, 1200)
    return () => window.clearTimeout(id)
  }, [])

  // 장 피커 시트가 열리는 순간에야 진행도·북마크·단어장을 요청하면 ✓·점 표시가
  // 한 박자 늦게 뜬다. 책을 펼쳐 읽는 동안 미리 받아 두면 시트는 캐시로 즉시 그려진다.
  // (staleTime은 useBookReadingProgress / useMyBookmarks / useBookWordNotes와
  //  동일하게 맞춘다 — fresh하면 prefetch도, 시트의 refetchOnMount도 요청 없이 끝난다)
  useEffect(() => {
    if (!loggedIn) return
    if (selectedBookId > 0) {
      queryClient.prefetchQuery({
        queryKey: bibleReadingKeys.bookProgress(selectedBookId),
        queryFn: () => getBookReadingProgress(selectedBookId),
        staleTime: 1000 * 60 * 10,
      })
    }
    if (bookNumber > 0) {
      queryClient.prefetchQuery({
        queryKey: bookmarkKeys.list({ book_number: bookNumber, page_size: 100 }),
        queryFn: () => listBookmarks({ book_number: bookNumber, page_size: 100 }),
        staleTime: 1000 * 60 * 2,
      })
      queryClient.prefetchQuery({
        queryKey: wordNoteKeys.book(bookNumber),
        queryFn: () => listWordNotes({ book_number: bookNumber, page_size: 100 }),
        staleTime: 1000 * 60 * 5,
      })
    }
  }, [loggedIn, selectedBookId, bookNumber, queryClient])

  const texts = {
    ko: { prevChapter: '이전 장', nextChapter: '다음 장', pick: '장 선택', of: '장', focus: '집중 읽기 — 한 절씩', readProgress: (n: number, total: number) => `${total}절 중 ${n}절 읽음` },
    en: { prevChapter: 'Previous', nextChapter: 'Next', pick: 'Select chapter', of: '', focus: 'Focus reading — verse by verse', readProgress: (n: number, total: number) => `${n} of ${total} verses read` }
  }

  const t = texts[language]

  return (
    <>
      {/* 모바일에선 상자가 없는 래퍼(display: contents)라 두 줄이 지금처럼 따로 놓이고,
          PC(lg+)에선 두 줄을 한 줄 sticky 바로 합친다 — chapter-navigation.css 'chapter-nav-bar' */}
      <div className="chapter-nav-bar">
      {/* 책 정보 헤더 */}
      <div className="book-header">
        <button className="back-button" onClick={onBackToBooks}>
          <span className="material-icons-round">arrow_back</span>
        </button>
        <div className="book-info">
          <h2 className="book-title">{selectedBook}</h2>
          <p className="book-progress">
            {selectedChapter}장 / {totalChapters}장
          </p>
        </div>
        {/* 연구 모드(목회자) — 개역개정 ↔ 쉽게 풀면/해석 나란히 보기 + 말씀 바구니 */}
        {research && (
          <button
            type="button"
            className={`research-toggle${research.on ? ' is-on' : ''}`}
            onClick={research.onToggle}
            aria-pressed={research.on}
            title={research.on ? '연구 모드 끄기 — 읽기로 돌아가기' : '연구 모드 — 나란히 보기·말씀 바구니'}
          >
            <span className="material-icons-round" aria-hidden>menu_book</span>
            <span className="research-toggle__label">연구 모드</span>
          </button>
        )}
        {/* 집중 읽기 — 한 절씩 몰입해서 읽는 모드 진입 */}
        {onOpenFocus && (
          <button
            type="button"
            className="focus-mode-btn"
            onClick={onOpenFocus}
            aria-label={t.focus}
            title={t.focus}
          >
            <span className="material-icons-round">filter_center_focus</span>
          </button>
        )}
        {/* Aa 읽기 설정 — '보기 설정'이므로 장 이동(콘텐츠 탐색) 줄과 분리해 헤더 우측에 둔다 */}
        <ReaderSettings />
      </div>

      {/* 장 네비게이션 */}
      <div className="chapter-navigation">
        <button
          className="nav-button prev"
          onClick={() => onChapterChange(selectedChapter - 1)}
          disabled={selectedChapter === 1}
          title={t.prevChapter}
        >
          <span className="material-icons-round">chevron_left</span>
        </button>

        {/* 가운데 알약 = 장 피커 트리거. 현재 장을 크게, 전체 장수를 옆에 얇게 두어
            "50장 중 3장"이라는 위치 감각까지 알약 하나로 전달한다 */}
        <button
          type="button"
          className={`chapter-trigger${pickerOpen ? ' is-open' : ''}${readDone > 0 ? ' has-progress' : ''}${chapterComplete ? ' is-complete' : ''}`}
          onClick={() => setPickerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          aria-label={readDone > 0 ? `${t.pick} — ${t.readProgress(readDone, readTotal)}` : t.pick}
          title={readDone > 0 ? `${t.pick} · ${t.readProgress(readDone, readTotal)}` : t.pick}
        >
          {readDone > 0 && <ChapterTriggerRing percent={readPercent} />}
          <span className="chapter-trigger__num">
            {selectedChapter}
            {t.of}
          </span>
          <span className="chapter-trigger__total">/ {totalChapters}</span>
          <span className="material-icons-round chapter-trigger__icon" aria-hidden="true">
            grid_view
          </span>
          {/* 몇 절 읽었는지 — 알약 모서리에 겹쳐 띄워 줄 높이를 바꾸지 않는다 */}
          {readDone > 0 && (
            <span key={chapterComplete ? 'done' : 'reading'} className="chapter-trigger__badge" aria-hidden>
              {chapterComplete
                ? <span className="material-icons-round">check</span>
                : <>{readDone}<small>/{readTotal}</small></>}
            </span>
          )}
        </button>

        <button
          className="nav-button next"
          onClick={() => onChapterChange(selectedChapter + 1)}
          disabled={selectedChapter === totalChapters}
          title={t.nextChapter}
        >
          <span className="material-icons-round">chevron_right</span>
        </button>
      </div>
      </div>

      {pickerOpen && (
        <ChapterPickerSheet
          bookNameKo={selectedBook}
          bookId={selectedBookId}
          bookNumber={bookNumber}
          totalChapters={totalChapters}
          currentChapter={selectedChapter}
          resumeChapter={resumeChapter}
          onPick={ch => {
            setPickerOpen(false)
            if (ch !== selectedChapter) onChapterChange(ch)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  )
}

export default ChapterNavigation
