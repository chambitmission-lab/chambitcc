import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useBibleSearch, useBibleBooks } from '../../../hooks/useBible'
import { useModalBackButton } from '../../../hooks/useModalBackButton'

// 책 카드 렌더에 필요한 최소 형태 — 백엔드 검색 결과(BibleSearchBook)와 전체 책 목록(BibleBook) 공통 필드
interface BookCard {
  book_number: number
  book_name_ko: string
  book_name_en: string
  testament: string
  chapter_count: number
}

type SearchScope = 'ALL' | 'OLD' | 'NEW'

const RECENT_SEARCHES_KEY = 'bible_recent_searches'
const MAX_RECENT_SEARCHES = 8
const PLACEHOLDER_ROTATE_MS = 3500

const loadRecentSearches = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

const persistRecentSearches = (keywords: string[]) => {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(keywords))
  } catch {
    // 저장 실패(사파리 시크릿 모드 등)는 무시 — 검색 자체에는 영향 없음
  }
}

const BibleSearch = () => {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches)
  const [scope, setScope] = useState<SearchScope>('ALL')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  const { data: searchResults, isLoading: searchLoading } = useBibleSearch(searchQuery)
  const { data: allBooks } = useBibleBooks()

  // 책 이름 부분일치를 프론트에서 직접 처리 — "고린" → 고린도전서·후서처럼 모든 매칭 책을 보장.
  // 장/절 검색(숫자 포함)이나 본문 키워드 검색은 건드리지 않는다.
  const normalize = (s: string) => s.replace(/\s/g, '').toLowerCase()
  const trimmedQuery = searchQuery.trim()
  const isChapterLike = /\d/.test(trimmedQuery)
  const localBookMatches: BookCard[] =
    trimmedQuery && !isChapterLike
      ? (allBooks || []).filter(
          b =>
            normalize(b.book_name_ko).includes(normalize(trimmedQuery)) ||
            normalize(b.book_name_en).includes(normalize(trimmedQuery))
        )
      : []

  const backendIsBookSearch = !!(
    searchResults?.is_book_search && (searchResults.books?.length || searchResults.book)
  )
  // 백엔드가 책 검색으로 인식했으면, 누락 없이 전체 로컬 매칭으로 카드를 그린다(없으면 백엔드 응답 사용).
  const booksToShow: BookCard[] =
    localBookMatches.length > 0
      ? localBookMatches
      : backendIsBookSearch
        ? searchResults!.books && searchResults!.books.length > 0
          ? searchResults!.books
          : searchResults!.book
            ? [searchResults!.book]
            : []
        : []

  const texts = {
    ko: {
      searchAria: '성경 검색 — 책 이름, 책+장, 또는 본문 키워드',
      placeholderExamples: [
        '"창세기 1장"을 검색해보세요',
        '"하나님 사랑"을 검색해보세요',
        '"고린도전서"를 검색해보세요',
        '책 이름 · 장 · 키워드로 검색',
      ],
      recentSearches: '최근 검색어',
      recommendedKeywords: '추천 키워드',
      clearAll: '전체 삭제',
      removeRecent: '검색어 삭제',
      clearSearch: '검색 지우기',
      suggestedKeywords: ['사랑', '믿음', '소망', '위로', '평안', '감사', '은혜', '기도'],
      scopeLabel: '검색 범위',
      scopeAll: '전체',
      scopeOld: '구약',
      scopeNew: '신약',
      searchResults: '검색 결과',
      noResults: '검색 결과가 없습니다',
      noResultsInScope: '선택한 범위에 검색 결과가 없습니다',
      bookFound: '해당 책을 찾았습니다',
      selectChapter: '장 선택',
      old: '구약',
      new: '신약',
      chapters: '장',
    },
    en: {
      searchAria: 'Bible search — book name, book+chapter, or keyword',
      placeholderExamples: [
        'Try "Genesis 1"',
        'Try "God\'s love"',
        'Try "1 Corinthians"',
        'Search by book, chapter, or keyword',
      ],
      recentSearches: 'Recent searches',
      recommendedKeywords: 'Suggested keywords',
      clearAll: 'Clear all',
      removeRecent: 'Remove keyword',
      clearSearch: 'Clear search',
      suggestedKeywords: ['love', 'faith', 'hope', 'comfort', 'peace', 'grace', 'prayer'],
      scopeLabel: 'Search scope',
      scopeAll: 'All',
      scopeOld: 'OT',
      scopeNew: 'NT',
      searchResults: 'Search Results',
      noResults: 'No results found',
      noResultsInScope: 'No results in the selected scope',
      bookFound: 'Book found',
      selectChapter: 'Select chapter',
      old: 'OT',
      new: 'NT',
      chapters: 'chapters',
    }
  }

  const t = texts[language]

  // 롤링 플레이스홀더 — 입력이 비어 있는 동안 검색 예시를 순차적으로 보여준다
  useEffect(() => {
    if (searchKeyword) return
    const id = setInterval(
      () => setPlaceholderIndex(i => (i + 1) % t.placeholderExamples.length),
      PLACEHOLDER_ROTATE_MS
    )
    return () => clearInterval(id)
  }, [searchKeyword, t.placeholderExamples.length])

  const saveRecentSearch = (keyword: string) => {
    setRecentSearches(prev => {
      const next = [keyword, ...prev.filter(k => k !== keyword)].slice(0, MAX_RECENT_SEARCHES)
      persistRecentSearches(next)
      return next
    })
  }

  const removeRecentSearch = (keyword: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(k => k !== keyword)
      persistRecentSearches(next)
      return next
    })
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    persistRecentSearches([])
  }

  const runSearch = (keyword: string) => {
    const q = keyword.trim()
    if (!q) return
    setSearchKeyword(q)
    setSearchQuery(q)
    saveRecentSearch(q)
  }

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    runSearch(searchKeyword)
  }

  const clearSearch = () => {
    setSearchKeyword('')
    setSearchQuery('')
  }

  // 검색 결과 화면에서 브라우저/안드로이드 뒤로가기 → 페이지 이탈 대신 검색 시작 화면으로 복귀
  useModalBackButton(clearSearch, !!searchQuery)

  const goToChapter = (bookNumber: number, chapter: number) => {
    navigate(`/bible/${bookNumber}/${chapter}`)
  }

  // 구약/신약 범위 필터 — 백엔드는 범위 파라미터가 없으므로 프론트에서 거른다.
  // 구절의 book_number(없으면 책 이름)로 신·구약을 판별하고, 판별 불가 시에는 표시를 유지한다.
  const testamentByNumber = new Map((allBooks || []).map(b => [b.book_number, b.testament]))
  const testamentByName = new Map((allBooks || []).map(b => [b.book_name_ko, b.testament]))
  const matchesScope = (bookNumber?: number | null, bookNameKo?: string) => {
    if (scope === 'ALL') return true
    const testament =
      (bookNumber != null ? testamentByNumber.get(bookNumber) : undefined) ??
      (bookNameKo ? testamentByName.get(bookNameKo) : undefined)
    return testament ? testament === scope : true
  }

  const scopedBooks = scope === 'ALL' ? booksToShow : booksToShow.filter(b => b.testament === scope)
  const scopedVerses = searchResults
    ? searchResults.results.filter(v =>
        matchesScope(v.book_number ?? searchResults.book_number, v.book_name_ko)
      )
    : []
  const shownTotal = scope === 'ALL' ? (searchResults?.total ?? 0) : scopedVerses.length

  const hasAnyResult =
    booksToShow.length > 0 || (searchResults ? searchResults.results.length > 0 : false)

  const currentPlaceholder = t.placeholderExamples[placeholderIndex % t.placeholderExamples.length]

  return (
    <div className="bible-search-section">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <div className="search-input-area">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                // 입력을 모두 지우면 결과도 접고 검색 시작 화면(최근/추천 키워드)으로
                if (e.target.value === '') setSearchQuery('')
              }}
              aria-label={t.searchAria}
              className="search-input"
            />
            {(searchKeyword || searchQuery) && (
              <button
                type="button"
                className="search-clear-button"
                aria-label={t.clearSearch}
                onClick={clearSearch}
              >
                <span className="material-icons-round">close</span>
              </button>
            )}
            {!searchKeyword && (
              <span
                key={placeholderIndex % t.placeholderExamples.length}
                className="search-placeholder-rolling"
                aria-hidden="true"
              >
                {currentPlaceholder}
              </span>
            )}
          </div>
          <button type="submit" className="search-button">
            <span className="material-icons-round">search</span>
          </button>
        </div>

        <div className="search-scope-filter" role="radiogroup" aria-label={t.scopeLabel}>
          {(['ALL', 'OLD', 'NEW'] as const).map(s => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={scope === s}
              className={`scope-chip${scope === s ? ' scope-chip--active' : ''}`}
              onClick={() => setScope(s)}
            >
              {s === 'ALL' ? t.scopeAll : s === 'OLD' ? t.scopeOld : t.scopeNew}
            </button>
          ))}
        </div>
      </form>

      {!searchQuery && (
        <div className="search-suggestions">
          {recentSearches.length > 0 && (
            <div className="search-chip-group">
              <div className="search-chip-group-header">
                <span>{t.recentSearches}</span>
                <button type="button" className="search-chip-clear" onClick={clearRecentSearches}>
                  {t.clearAll}
                </button>
              </div>
              <div className="search-chip-list">
                {recentSearches.map(kw => (
                  <span key={kw} className="search-chip">
                    <button
                      type="button"
                      className="search-chip-label"
                      onClick={() => runSearch(kw)}
                    >
                      {kw}
                    </button>
                    <button
                      type="button"
                      className="search-chip-remove"
                      aria-label={`${t.removeRecent}: ${kw}`}
                      onClick={() => removeRecentSearch(kw)}
                    >
                      <span className="material-icons-round">close</span>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="search-chip-group">
            <div className="search-chip-group-header">
              <span>{t.recommendedKeywords}</span>
            </div>
            <div className="search-chip-list">
              {t.suggestedKeywords.map(kw => (
                <button
                  key={kw}
                  type="button"
                  className="search-chip search-chip--suggest"
                  onClick={() => runSearch(kw)}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {searchLoading ? (
        <div className="loading-spinner">
          <span className="material-icons-round spinning">refresh</span>
        </div>
      ) : scopedBooks.length > 0 ? (
        // 책 단독 검색 → 매칭된 모든 책 카드 + 장 그리드 (예: "고린" → 전·후서)
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {scopedBooks.map(book => (
            <div
              key={book.book_number}
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
                  style={{ fontSize: '2rem', color: '#a855f7' }}
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
                    {book.book_name_ko}
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--ig-secondary-text)',
                      }}
                    >
                      {book.book_name_en}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--ig-secondary-text)',
                      marginTop: '0.125rem',
                    }}
                  >
                    {book.testament === 'OLD' ? t.old : t.new} ·{' '}
                    {book.chapter_count}{t.chapters}
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
                {Array.from({ length: book.chapter_count }, (_, i) => i + 1).map(ch => (
                  <button
                    key={ch}
                    onClick={() => goToChapter(book.book_number, ch)}
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
                      e.currentTarget.style.background = '#a855f7'
                      e.currentTarget.style.color = 'white'
                      e.currentTarget.style.borderColor = '#a855f7'
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
          ))}
        </div>
      ) : searchResults && scopedVerses.length > 0 ? (
        <div className="search-results">
          <p className="results-count">
            {searchResults.is_chapter_search && searchResults.book_name_ko
              ? `${searchResults.book_name_ko} ${searchResults.chapter}장 · ${shownTotal}절`
              : `${t.searchResults}: ${shownTotal}개`}
          </p>
          <div className="verses-list">
            {scopedVerses.map(verse => (
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
          <p>{scope !== 'ALL' && hasAnyResult ? t.noResultsInScope : t.noResults}</p>
        </div>
      ) : null}
    </div>
  )
}

export default BibleSearch
