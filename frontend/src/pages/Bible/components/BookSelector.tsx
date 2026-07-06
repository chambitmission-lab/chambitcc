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

type Testament = 'OT' | 'NT'

const OT_CATEGORIES: { id: string; label: string; min: number; max: number }[] = [
  { id: 'all', label: '전체', min: 1, max: 39 },
  { id: 'law', label: '모세오경', min: 1, max: 5 },
  { id: 'history', label: '역사서', min: 6, max: 17 },
  { id: 'poetry', label: '시가서', min: 18, max: 22 },
  { id: 'prophets', label: '선지서', min: 23, max: 39 },
]

const NT_CATEGORIES: { id: string; label: string; min: number; max: number }[] = [
  { id: 'all', label: '전체', min: 40, max: 66 },
  { id: 'gospels', label: '복음서', min: 40, max: 43 },
  { id: 'acts', label: '사도행전', min: 44, max: 44 },
  { id: 'epistles', label: '서신서', min: 45, max: 65 },
  { id: 'revelation', label: '요한계시록', min: 66, max: 66 },
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
  const [testament, setTestament] = useState<Testament>('OT')
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

  const handleTestamentChange = (next: Testament) => {
    setTestament(next)
    setFilter('all')
  }

  const categories = testament === 'OT' ? OT_CATEGORIES : NT_CATEGORIES
  const activeCategory = categories.find(c => c.id === filter) ?? categories[0]

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
          <span className="book-resume-badge">{resume.chapter}장 읽는 중</span>
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
  
  const filteredBooks =
    books?.filter(b => b.book_number >= activeCategory.min && b.book_number <= activeCategory.max) || []

  // 최근 읽은 책 슬라이더 — book_number로 실제 책을 찾아 onBookSelect에 resume까지 넘긴다
  const recentItems = (recentBooks || [])
    .map(pos => ({ pos, book: books?.find(b => b.book_number === pos.book_number) }))
    .filter((x): x is { pos: ResumePosition; book: BibleBook } => !!x.book)
    .slice(0, 8)

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
                <span className="recent-chip__icon">
                  <span className="material-icons-round">auto_stories</span>
                </span>
                <span className="recent-chip__body">
                  <span className="recent-chip__name">{book.book_name_ko}</span>
                  <span className="recent-chip__meta">
                    {pos.chapter}장 · {formatRelativeShort(pos.read_at)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 구약/신약 탭 + 서브 카테고리 칩 — 한 패널로 묶어 "칩은 탭에 종속"임을 시각적으로 표현.
          탭 전환 시 key가 바뀌며 칩들이 순차적으로 슬라이드 인 된다. */}
      <div className="book-nav">
        <div className="testament-tabs">
          <button
            type="button"
            className={`testament-tab${testament === 'OT' ? ' active' : ''}`}
            onClick={() => handleTestamentChange('OT')}
          >
            {t.oldTestament}
            <span className="testament-tab__count">39</span>
          </button>
          <button
            type="button"
            className={`testament-tab${testament === 'NT' ? ' active' : ''}`}
            onClick={() => handleTestamentChange('NT')}
          >
            {t.newTestament}
            <span className="testament-tab__count">27</span>
          </button>
        </div>

        <div className="book-filter" key={testament}>
          {categories.map((cat, i) => (
            <button
              key={cat.id}
              type="button"
              className={`book-filter-chip${filter === cat.id ? ' active' : ''}`}
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => setFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="testament-section">
        <h3 className="testament-title">
          {activeCategory.id === 'all'
            ? (testament === 'OT' ? t.oldTestament : t.newTestament)
            : activeCategory.label}
          {' '}({filteredBooks.length})
        </h3>
        <div className="books-grid">
          {filteredBooks.map(renderBook)}
        </div>
      </div>
    </div>
  )
}

export default BookSelector
