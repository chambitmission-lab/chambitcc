import { useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
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
}

const ChapterNavigation = ({
  selectedBook,
  selectedBookId,
  bookNumber,
  selectedChapter,
  totalChapters,
  resumeChapter,
  onChapterChange,
  onBackToBooks
}: ChapterNavigationProps) => {
  const { language } = useLanguage()
  const [pickerOpen, setPickerOpen] = useState(false)

  const texts = {
    ko: { prevChapter: '이전 장', nextChapter: '다음 장', pick: '장 선택', of: '장' },
    en: { prevChapter: 'Previous', nextChapter: 'Next', pick: 'Select chapter', of: '' }
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
