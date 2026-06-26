import { useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { BibleBook } from '../../../types/bible'
import type { ResumePosition } from '../../../api/bibleReading'
import { parseApiDate } from '../../../utils/dateUtils'

interface BookSelectorProps {
  books: BibleBook[] | undefined
  isLoading: boolean
  error: Error | null
  onBookSelect: (bookId: number, bookName: string, resume?: ResumePosition) => void
  resumeMap?: Map<number, ResumePosition>
  /** book_id → 완독률(0~100) */
  progressMap?: Map<number, number>
  /** 최근 읽은 책(전역 최신 제외) — 상단 가로 슬라이더에 사용 */
  recentBooks?: ResumePosition[]
}

// 성경 분류 필터 — book_number(1~66) 범위로 구약/신약을 묶는다.
// id 'all'은 구약/신약 전체 그리드를 그대로 노출.
const BOOK_CATEGORIES: { id: string; label: string; min: number; max: number }[] = [
  { id: 'all', label: '전체', min: 1, max: 66 },
  { id: 'law', label: '모세오경', min: 1, max: 5 },
  { id: 'history', label: '역사서', min: 6, max: 17 },
  { id: 'poetry', label: '시가서', min: 18, max: 22 },
  { id: 'prophets', label: '선지서', min: 23, max: 39 },
  { id: 'gospels', label: '복음·행전', min: 40, max: 44 },
  { id: 'epistles', label: '서신·계시', min: 45, max: 66 },
]

const formatRelativeShort = (iso: string): string => {
  const date = parseApiDate(iso)
  const diffDay = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDay <= 0) return '오늘'
  if (diffDay === 1) return '어제'
  if (diffDay < 7) return `${diffDay}일`
  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}

const BookSelector = ({ books, isLoading, error, onBookSelect, resumeMap, progressMap, recentBooks }: BookSelectorProps) => {
  const { language } = useLanguage()
  const [filter, setFilter] = useState<string>('all')
  
  const texts = {
    ko: {
      selectBook: '책 선택',
      recentTitle: '최근 읽은 책',
      oldTestament: '구약',
      newTestament: '신약',
      loadingBooks: '성경 책 목록을 불러오는 중...',
      errorBooks: '성경 책 목록을 불러오는데 실패했습니다. 백엔드 API를 확인해주세요.',
      noBooks: '성경 책 데이터가 없습니다.',
    },
    en: {
      selectBook: 'Select Book',
      recentTitle: 'Recently read',
      oldTestament: 'Old Testament',
      newTestament: 'New Testament',
      loadingBooks: 'Loading bible books...',
      errorBooks: 'Failed to load bible books. Please check backend API.',
      noBooks: 'No bible book data available.',
    }
  }
  
  const t = texts[language]

  const oldTestament = books?.filter(b => b.testament === 'OLD') || []
  const newTestament = books?.filter(b => b.testament === 'NEW') || []

  const renderBook = (book: BibleBook) => {
    const resume = resumeMap?.get(book.book_number)
    const progress = Math.max(0, Math.min(100, progressMap?.get(book.id) ?? 0))
    const isComplete = progress >= 100
    const hasProgress = progress > 0

    return (
      <button
        key={book.id}
        className={`book-button${resume ? ' book-button-has-resume' : ''}${isComplete ? ' book-button-complete' : ''}`}
        onClick={() => onBookSelect(book.id, book.book_name_ko, resume)}
      >
        {isComplete && (
          <span className="book-complete-badge" aria-label="완독">
            <span className="material-icons-round">check</span>
          </span>
        )}
        <span>{book.book_name_ko}</span>
        {resume && (
          <span className="book-resume-badge">
            <span className="material-icons-round">bookmark</span>
            {resume.chapter}:{resume.verse} · {formatRelativeShort(resume.read_at)}
          </span>
        )}
        {hasProgress && (
          <span className="book-progress-track" aria-hidden="true">
            <span className="book-progress-fill" style={{ width: `${progress}%` }} />
          </span>
        )}
      </button>
    )
  }

  if (isLoading) {
    return (
      <div className="bible-books-section">
        <h2 className="section-title">{t.selectBook}</h2>
        <div className="loading-spinner">
          <span className="material-icons-round spinning">refresh</span>
          <p style={{ marginTop: '1rem', color: 'var(--ig-secondary-text)' }}>
            {t.loadingBooks}
          </p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bible-books-section">
        <h2 className="section-title">{t.selectBook}</h2>
        <div className="no-results">
          <span className="material-icons-round">error_outline</span>
          <p>{t.errorBooks}</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Error: {error.message}
          </p>
        </div>
      </div>
    )
  }
  
  if (!books || books.length === 0) {
    return (
      <div className="bible-books-section">
        <h2 className="section-title">{t.selectBook}</h2>
        <div className="no-results">
          <span className="material-icons-round">menu_book</span>
          <p>{t.noBooks}</p>
        </div>
      </div>
    )
  }
  
  // 분류 필터 적용 — 'all'이면 구약/신약 섹션을 그대로, 그 외엔 해당 범위만 단일 그리드로
  const activeCategory = BOOK_CATEGORIES.find(c => c.id === filter) ?? BOOK_CATEGORIES[0]
  const filteredBooks =
    books?.filter(b => b.book_number >= activeCategory.min && b.book_number <= activeCategory.max) || []

  // 최근 읽은 책 슬라이더 — book_number로 실제 책을 찾아 onBookSelect에 resume까지 넘긴다
  const recentItems = (recentBooks || [])
    .map(pos => ({ pos, book: books?.find(b => b.book_number === pos.book_number) }))
    .filter((x): x is { pos: ResumePosition; book: BibleBook } => !!x.book)
    .slice(0, 4)

  return (
    <div className="bible-books-section">
      <h2 className="section-title">{t.selectBook}</h2>

      {recentItems.length > 0 && (
        <div className="recent-strip">
          <h3 className="recent-strip__title">{t.recentTitle}</h3>
          <div className="recent-scroll">
            {recentItems.map(({ pos, book }) => (
              <button
                key={book.id}
                type="button"
                className="recent-chip"
                onClick={() => onBookSelect(book.id, book.book_name_ko, pos)}
              >
                <span className="recent-chip__play">
                  <span className="material-icons-round">play_arrow</span>
                </span>
                <span className="recent-chip__body">
                  <span className="recent-chip__name">{book.book_name_ko}</span>
                  <span className="recent-chip__meta">
                    {pos.chapter}:{pos.verse} · {formatRelativeShort(pos.read_at)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 분류 필터 칩 */}
      <div className="book-filter">
        {BOOK_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            className={`book-filter-chip${filter === cat.id ? ' active' : ''}`}
            onClick={() => setFilter(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filter === 'all' ? (
        <>
          <div className="testament-section">
            <h3 className="testament-title">{t.oldTestament} ({oldTestament.length})</h3>
            <div className="books-grid">
              {oldTestament.map(renderBook)}
            </div>
          </div>

          <div className="testament-section">
            <h3 className="testament-title">{t.newTestament} ({newTestament.length})</h3>
            <div className="books-grid">
              {newTestament.map(renderBook)}
            </div>
          </div>
        </>
      ) : (
        <div className="testament-section">
          <h3 className="testament-title">{activeCategory.label} ({filteredBooks.length})</h3>
          <div className="books-grid">
            {filteredBooks.map(renderBook)}
          </div>
        </div>
      )}
    </div>
  )
}

export default BookSelector
