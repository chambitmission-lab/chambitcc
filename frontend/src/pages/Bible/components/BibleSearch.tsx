import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useBibleSearch, useBibleBooks } from '../../../hooks/useBible'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { BibleBook } from '../../../types/bible'
import SearchBookCard from './SearchBookCard'
import type { BookCard } from './SearchBookCard'
import BookQuickPicker from './BookQuickPicker'

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
  // 책 퀵 피커가 열려 있으면 그 트리거가 된 책의 book_number, 닫혀 있으면 null
  const [pickerFor, setPickerFor] = useState<number | null>(null)

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
        '"창 1"처럼 줄여서 검색해도 돼요',
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
    // 현재 URL이 이미 같은 책·장이어도(예: 나훔 2장을 읽다가 검색에서 다시 나훔 2장 클릭)
    // 읽기 화면으로 전환되도록 재진입 신호를 state로 함께 넘긴다
    navigate(`/bible/${bookNumber}/${chapter}`, { state: { chapterNav: Date.now() } })
  }

  // 퀵 피커에서 책 선택 — 타이핑 없이 그 책의 장 그리드로 바로 전환.
  // 검색 행위가 아니라 탐색이므로 최근 검색어에는 쌓지 않는다.
  const handlePickBook = (book: BibleBook) => {
    setPickerFor(null)
    setSearchKeyword(book.book_name_ko)
    setSearchQuery(book.book_name_ko)
    // 현재 범위 필터에 걸러져 방금 고른 책이 안 보이는 일이 없게
    if (scope !== 'ALL' && book.testament !== scope) setScope('ALL')
  }

  // 구약/신약 범위 필터 — 백엔드는 범위 파라미터가 없으므로 프론트에서 거른다.
  // 구절의 book_number(없으면 책 이름)로 신·구약을 판별하고, 판별 불가 시에는 표시를 유지한다.
  const testamentByNumber = new Map((allBooks || []).map(b => [b.book_number, b.testament]))
  const testamentByName = new Map((allBooks || []).map(b => [b.book_name_ko, b.testament]))
  // 검색 결과 카드(book_number 기반)에 읽기 진행도(book_id 기반)를 연결하기 위한 매핑
  const bookIdByNumber = new Map((allBooks || []).map(b => [b.book_number, b.id]))
  // 키워드 검색 응답의 절 객체에는 책 이름이 없다(book_number만) → 책 목록으로 이름을 복원
  const nameByNumber = new Map((allBooks || []).map(b => [b.book_number, b.book_name_ko]))
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
        <div className="search-book-list">
          {scopedBooks.map(book => (
            <SearchBookCard
              key={book.book_number}
              book={book}
              bookId={bookIdByNumber.get(book.book_number) ?? 0}
              onSelectChapter={goToChapter}
              onOpenPicker={() => setPickerFor(book.book_number)}
            />
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
              >
                <div className="bible-verse-reference">
                  {verse.book_name_ko || nameByNumber.get(verse.book_number ?? -1) || searchResults.book_name_ko || ''} {verse.chapter}:{verse.verse}
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

      {/* 책 퀵 전환 바텀시트 — 책 카드 헤더 탭으로 열림 */}
      {pickerFor !== null && allBooks && allBooks.length > 0 && (
        <BookQuickPicker
          books={allBooks}
          currentBookNumber={pickerFor}
          onPick={handlePickBook}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  )
}

export default BibleSearch
