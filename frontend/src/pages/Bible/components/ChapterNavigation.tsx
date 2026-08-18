import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAuth } from '../../../hooks/useAuth'
import { bibleReadingKeys } from '../../../hooks/useBibleReading'
import { getBookReadingProgress } from '../../../api/bibleReading'
import { bookmarkKeys } from '../../../hooks/useBibleBookmark'
import { listBookmarks } from '../../../api/bibleBookmark'
import ReaderSettings from './ReaderSettings'
import ChapterPickerSheet from './ChapterPickerSheet'

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
  onOpenFocus
}: ChapterNavigationProps) => {
  const { language } = useLanguage()
  const { isLoggedIn } = useAuth()
  const [pickerOpen, setPickerOpen] = useState(false)
  const queryClient = useQueryClient()

  // 장 피커 시트가 열리는 순간에야 진행도·북마크를 요청하면 ✓ 표시가 한 박자 늦게
  // 뜬다. 책을 펼쳐 읽는 동안 미리 받아 두면 시트는 캐시로 즉시 그려진다.
  // (staleTime은 useBookReadingProgress / useMyBookmarks와 동일하게 맞춘다 —
  //  fresh하면 prefetch가 네트워크 요청 없이 조용히 끝난다)
  const loggedIn = isLoggedIn()
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
    }
  }, [loggedIn, selectedBookId, bookNumber, queryClient])

  const texts = {
    ko: { prevChapter: '이전 장', nextChapter: '다음 장', pick: '장 선택', of: '장', focus: '집중 읽기 — 한 절씩' },
    en: { prevChapter: 'Previous', nextChapter: 'Next', pick: 'Select chapter', of: '', focus: 'Focus reading — verse by verse' }
  }

  const t = texts[language]

  return (
    <>
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
          className={`chapter-trigger${pickerOpen ? ' is-open' : ''}`}
          onClick={() => setPickerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          aria-label={t.pick}
          title={t.pick}
        >
          <span className="chapter-trigger__num">
            {selectedChapter}
            {t.of}
          </span>
          <span className="chapter-trigger__total">/ {totalChapters}</span>
          <span className="material-icons-round chapter-trigger__icon" aria-hidden="true">
            grid_view
          </span>
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
