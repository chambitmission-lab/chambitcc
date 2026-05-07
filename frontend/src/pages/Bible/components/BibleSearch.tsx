import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useBibleSearch } from '../../../hooks/useBible'

const BibleSearch = () => {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: searchResults, isLoading: searchLoading } = useBibleSearch(searchQuery)

  const texts = {
    ko: {
      searchPlaceholder: '책이름, 책+장, 또는 본문 키워드 (예: 창세기, 창세기 2장, 사랑)',
      searchResults: '검색 결과',
      noResults: '검색 결과가 없습니다',
      bookFound: '해당 책을 찾았습니다',
      selectChapter: '장 선택',
      old: '구약',
      new: '신약',
      chapters: '장',
    },
    en: {
      searchPlaceholder: 'Book name, book+chapter, or keyword (e.g. Genesis, Genesis 2, love)',
      searchResults: 'Search Results',
      noResults: 'No results found',
      bookFound: 'Book found',
      selectChapter: 'Select chapter',
      old: 'OT',
      new: 'NT',
      chapters: 'chapters',
    }
  }

  const t = texts[language]

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchKeyword.trim()) {
      setSearchQuery(searchKeyword.trim())
    }
  }

  const goToChapter = (bookNumber: number, chapter: number) => {
    navigate(`/bible/${bookNumber}/${chapter}`)
  }

  return (
    <div className="bible-search-section">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="search-input"
          />
          <button type="submit" className="search-button">
            <span className="material-icons-round">search</span>
          </button>
        </div>
      </form>

      {searchLoading ? (
        <div className="loading-spinner">
          <span className="material-icons-round spinning">refresh</span>
        </div>
      ) : searchResults?.is_book_search && searchResults.book ? (
        // 책 단독 검색 → 책 카드 + 장 그리드
        <div
          style={{
            background: 'var(--ig-primary-background)',
            border: '1px solid var(--ig-border)',
            borderRadius: '12px',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingBottom: '0.875rem',
              borderBottom: '1px solid var(--ig-border)',
              marginBottom: '1rem',
            }}
          >
            <span
              className="material-icons-round"
              style={{ fontSize: '2rem', color: '#667eea' }}
            >
              menu_book
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--ig-primary-text)',
                  letterSpacing: '-0.01em',
                }}
              >
                {searchResults.book.book_name_ko}
                <span
                  style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--ig-secondary-text)',
                  }}
                >
                  {searchResults.book.book_name_en}
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--ig-secondary-text)',
                  marginTop: '0.125rem',
                }}
              >
                {searchResults.book.testament === 'OLD' ? t.old : t.new} ·{' '}
                {searchResults.book.chapter_count}{t.chapters}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--ig-secondary-text)',
              marginBottom: '0.625rem',
            }}
          >
            {t.selectChapter}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
              gap: '0.375rem',
            }}
          >
            {Array.from({ length: searchResults.book.chapter_count }, (_, i) => i + 1).map(ch => (
              <button
                key={ch}
                onClick={() => goToChapter(searchResults.book!.book_number, ch)}
                style={{
                  padding: '0.625rem 0',
                  border: '1px solid var(--ig-border)',
                  background: 'var(--ig-secondary-background)',
                  borderRadius: '8px',
                  color: 'var(--ig-primary-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#667eea'
                  e.currentTarget.style.color = 'white'
                  e.currentTarget.style.borderColor = '#667eea'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--ig-secondary-background)'
                  e.currentTarget.style.color = 'var(--ig-primary-text)'
                  e.currentTarget.style.borderColor = 'var(--ig-border)'
                }}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      ) : searchResults && searchResults.results.length > 0 ? (
        <div className="search-results">
          <p className="results-count">
            {searchResults.is_chapter_search && searchResults.book_name_ko
              ? `${searchResults.book_name_ko} ${searchResults.chapter}장 · ${searchResults.total}절`
              : `${t.searchResults}: ${searchResults.total}개`}
          </p>
          <div className="verses-list">
            {searchResults.results.map(verse => (
              <div
                key={verse.id}
                className="bible-verse-item bible-verse-item--search"
                onClick={() => goToChapter(verse.book_number ?? searchResults.book_number ?? 0, verse.chapter)}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    goToChapter(verse.book_number ?? searchResults.book_number ?? 0, verse.chapter)
                  }
                }}
                title="이 장으로 이동"
              >
                <div className="bible-verse-reference">
                  {verse.book_name_ko} {verse.chapter}:{verse.verse}
                </div>
                <div className="bible-verse-text">{verse.text}</div>
              </div>
            ))}
          </div>
        </div>
      ) : searchQuery ? (
        <div className="no-results">
          <span className="material-icons-round">search_off</span>
          <p>{t.noResults}</p>
        </div>
      ) : null}
    </div>
  )
}

export default BibleSearch
