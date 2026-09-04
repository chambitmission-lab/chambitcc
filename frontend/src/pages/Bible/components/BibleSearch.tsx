import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useBibleSearchInfinite, useBibleBooks } from '../../../hooks/useBible'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { BibleBook } from '../../../types/bible'
import SearchBookCard from './SearchBookCard'
import type { BookCard } from './SearchBookCard'
import BookQuickPicker from './BookQuickPicker'
import { BOOK_ABBREV_KO, BOOK_ABBREV_EN } from './bibleBookAbbrev'

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

const isScope = (v: string | null): v is SearchScope => v === 'ALL' || v === 'OLD' || v === 'NEW'

const BibleSearch = () => {
  const { language } = useLanguage()
  const navigate = useNavigate()
  // 검색어·범위는 URL(?q=&scope=)을 원본으로 삼는다. 결과를 눌러 장으로 갔다가
  // 뒤로 오면 이 컴포넌트가 다시 마운트되는데, 로컬 state만 쓰면 입력창이 비어
  // 방금 보던 결과를 잃는다. URL에 남겨 두면 복원되고 링크 공유도 된다.
  // (결과 데이터는 React Query에 24시간 캐시되어 있어 복원 즉시 그려진다)
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q')?.trim() ?? ''
  const initialScopeParam = searchParams.get('scope')
  const [searchKeyword, setSearchKeyword] = useState(initialQuery)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches)
  const [scope, setScopeState] = useState<SearchScope>(
    isScope(initialScopeParam) ? initialScopeParam : 'ALL'
  )

  // URL 동기화 — 입력마다 히스토리가 쌓이지 않도록 replace. tab= 등 다른 파라미터는 보존
  const syncUrl = (q: string, sc: SearchScope) => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        if (q) next.set('q', q)
        else next.delete('q')
        if (sc !== 'ALL') next.set('scope', sc)
        else next.delete('scope')
        return next
      },
      { replace: true }
    )
  }
  const setScope = (sc: SearchScope) => {
    setScopeState(sc)
    syncUrl(searchQuery, sc)
  }
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  // 책 퀵 피커가 열려 있으면 그 트리거가 된 책의 book_number, 닫혀 있으면 null
  const [pickerFor, setPickerFor] = useState<number | null>(null)
  // 결과 목록 끝에 두는 무한 스크롤 감지용 센티널
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // 범위 필터는 서버로 넘긴다 — 페이지마다 프론트에서 거르면 페이지별 개수가 들쭉날쭉해진다
  const {
    data: searchPages,
    isLoading: searchLoading,
    isError: searchError,
    refetch: refetchSearch,
    // 범위 전환 중 — 이전 결과를 흐리게 붙들고 새 결과를 기다리는 상태
    isPlaceholderData: searchStale,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBibleSearchInfinite(searchQuery, scope === 'ALL' ? undefined : scope)
  const { data: allBooks } = useBibleBooks()

  // 메타(책·장 검색 여부 등)는 첫 페이지에만 담겨 오고, 절은 모든 페이지를 이어붙인다
  const searchResults = searchPages?.pages[0]
  const loadedVerses = searchPages?.pages.flatMap(p => p.results) ?? []

  // 책 이름 부분일치를 프론트에서 직접 처리 — "고린" → 고린도전서·후서처럼 모든 매칭 책을 보장.
  // 장/절 검색(숫자 포함)이나 본문 키워드 검색은 건드리지 않는다.
  const normalize = (s: string) => s.replace(/\s/g, '').toLowerCase()
  const trimmedQuery = searchQuery.trim()
  const isChapterLike = /\d/.test(trimmedQuery)
  // 표준 약칭("고전"·"요일"·"1Co")은 이름 부분일치로는 안 잡히므로 따로 본다
  const normalizedQuery = normalize(trimmedQuery)
  const matchesAbbrev = (b: BibleBook) =>
    BOOK_ABBREV_KO[b.book_number] === trimmedQuery ||
    BOOK_ABBREV_EN[b.book_number]?.toLowerCase() === normalizedQuery
  const localBookMatches: BookCard[] =
    trimmedQuery && !isChapterLike
      ? (allBooks || []).filter(
          b =>
            matchesAbbrev(b) ||
            normalize(b.book_name_ko).includes(normalizedQuery) ||
            normalize(b.book_name_en).includes(normalizedQuery)
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
        '"고전 13"처럼 약칭으로 검색해도 돼요',
        '"하나님 사랑"을 검색해보세요',
        '"주 그리스도 아들"처럼 여러 단어로 좁혀보세요',
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
      resultsCount: (n: number) => `검색 결과 ${n.toLocaleString()}절`,
      noResults: '검색 결과가 없습니다',
      noResultsInScope: '선택한 범위에 검색 결과가 없습니다',
      tooShort: '두 글자 이상 입력해 주세요',
      tooShortHint: '한 글자 단어는 "빛이", "복을"처럼 뒤에 오는 말과 붙여서 찾아보세요',
      searchFailed: '검색하지 못했어요',
      searchFailedHint: '연결 상태를 확인하고 다시 시도해 주세요',
      retry: '다시 시도',
      bookFound: '해당 책을 찾았습니다',
    },
    en: {
      searchAria: 'Bible search — book name, book+chapter, or keyword',
      placeholderExamples: [
        'Try "Genesis 1"',
        'Try "God\'s love"',
        'Narrow down with multiple words, e.g. "Lord Christ Son"',
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
      resultsCount: (n: number) => `${n.toLocaleString()} verse${n === 1 ? '' : 's'} found`,
      noResults: 'No results found',
      noResultsInScope: 'No results in the selected scope',
      tooShort: 'Enter at least two characters',
      tooShortHint: 'Try a longer word or add the word that follows it',
      searchFailed: 'Search failed',
      searchFailedHint: 'Check your connection and try again',
      retry: 'Try again',
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
    // 백엔드가 2글자 미만을 거부하므로 한 글자는 최근 검색어에 쌓지 않는다
    if (q.length >= 2) saveRecentSearch(q)
    syncUrl(q, scope)
  }

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    runSearch(searchKeyword)
  }

  const clearSearch = () => {
    setSearchKeyword('')
    setSearchQuery('')
    syncUrl('', scope)
  }

  // 검색 결과 화면에서 브라우저/안드로이드 뒤로가기 → 페이지 이탈 대신 검색 시작 화면으로 복귀
  useModalBackButton(clearSearch, !!searchQuery)

  const goToChapter = (bookNumber: number, chapter: number, verse?: number) => {
    // 현재 URL이 이미 같은 책·장이어도(예: 나훔 2장을 읽다가 검색에서 다시 나훔 2장 클릭)
    // 읽기 화면으로 전환되도록 재진입 신호를 state로 함께 넘긴다.
    // 절 결과에서 왔으면 ?verse=N — 읽기 화면이 그 절로 스크롤·하이라이트한다(장 첫머리에 떨구지 않는다)
    const search = verse && verse > 0 ? `?verse=${verse}` : ''
    navigate(`/bible/${bookNumber}/${chapter}${search}`, {
      state: { chapterNav: new Date().getTime() },
    })
  }

  // 퀵 피커에서 책 선택 — 타이핑 없이 그 책의 장 그리드로 바로 전환.
  // 검색 행위가 아니라 탐색이므로 최근 검색어에는 쌓지 않는다.
  const handlePickBook = (book: BibleBook) => {
    setPickerFor(null)
    setSearchKeyword(book.book_name_ko)
    setSearchQuery(book.book_name_ko)
    // 현재 범위 필터에 걸러져 방금 고른 책이 안 보이는 일이 없게
    const nextScope: SearchScope =
      scope !== 'ALL' && book.testament !== scope ? 'ALL' : scope
    if (nextScope !== scope) setScopeState(nextScope)
    syncUrl(book.book_name_ko, nextScope)
  }

  // 구약/신약 범위 필터 — 키워드 검색은 서버가 이미 걸러서 보내고,
  // 장 검색 결과(페이징 대상 아님)만 여기서 거른다.
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
    ? loadedVerses.filter(v =>
        matchesScope(v.book_number ?? searchResults.book_number, v.book_name_ko)
      )
    : []
  // 키워드 검색의 total은 서버가 센 전체 매칭 수(범위 필터 반영). 장 검색만 화면에 남은 절 수.
  const shownTotal = searchResults?.is_chapter_search
    ? scopedVerses.length
    : (searchResults?.total ?? 0)

  const hasAnyResult = booksToShow.length > 0 || loadedVerses.length > 0
  // 백엔드가 2글자 미만을 422로 막아 요청 자체를 안 보낸다 — "결과 없음"이 아니라 안내로 분기.
  // 단 "창"처럼 한 글자로도 책이 잡히면 책 카드 분기가 먼저라 여기 오지 않는다.
  const queryTooShort = trimmedQuery.length > 0 && trimmedQuery.length < 2

  // 키워드 검색 결과에서 매칭 단어 강조 — "왜 이 절이 걸렸는지"가 훑기만 해도 보이게.
  // 여러 단어 AND 검색은 단어별로 각각 칠한다. 장 검색(창 1)은 키워드가 없으므로 제외.
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const highlightTokens =
    trimmedQuery && !searchResults?.is_chapter_search
      ? [...new Set(trimmedQuery.split(/\s+/).filter(Boolean))]
      : []
  const highlightPattern =
    highlightTokens.length > 0
      ? new RegExp(`(${highlightTokens.map(escapeRegExp).join('|')})`, 'gi')
      : null
  const renderVerseText = (text: string) => {
    if (!highlightPattern) return text
    // 캡처 그룹 split — 홀수 인덱스가 매칭 조각
    return text
      .split(highlightPattern)
      .map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="verse-keyword-hl">
            {part}
          </mark>
        ) : (
          part
        )
      )
  }

  const currentPlaceholder = t.placeholderExamples[placeholderIndex % t.placeholderExamples.length]

  // 무한 스크롤 — 결과 목록 끝의 센티널이 보이면 다음 페이지를 이어 받는다
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) fetchNextPage()
      },
      { rootMargin: '240px' } // 바닥에 닿기 전에 미리 채워 끊김을 줄인다
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, loadedVerses.length])

  // 레일용 — 최근 검색어·추천 키워드 칩 그룹 (본문과 같은 마크업을 공유한다)
  const suggestionGroups = (
    <>
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
                <button type="button" className="search-chip-label" onClick={() => runSearch(kw)}>
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
    </>
  )

  return (
    <div className="bible-search-section">
      {/* lg+: 본문(검색·결과) + 우측 레일(범위·최근·추천). 레일 덕분에 결과를 보는
          중에도 최근 검색어로 바로 갈아탈 수 있다 — 모바일에선 이 래퍼가 그냥 스택 */}
      <div className="lg:flex lg:items-start lg:gap-6">
      <div className="lg:flex-1 lg:min-w-0">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <div className="search-input-area">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                // 입력을 모두 지우면 결과도 접고 검색 시작 화면(최근/추천 키워드)으로
                if (e.target.value === '') {
                  setSearchQuery('')
                  syncUrl('', scope)
                }
              }}
              aria-label={t.searchAria}
              enterKeyHint="search"
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
        </div>

        <div className="search-scope-filter lg:hidden" role="radiogroup" aria-label={t.scopeLabel}>
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

      {searchError && !hasAnyResult ? (
        <div className="no-results" role="alert">
          <span className="material-icons-round">cloud_off</span>
          <p>{t.searchFailed}</p>
          <p className="no-results-hint">{t.searchFailedHint}</p>
          <button type="button" className="search-retry-button" onClick={() => refetchSearch()}>
            <span className="material-icons-round" aria-hidden="true">refresh</span>
            {t.retry}
          </button>
        </div>
      ) : searchLoading ? (
        <div className="loading-spinner">
          <span className="material-icons-round spinning">refresh</span>
        </div>
      ) : scopedBooks.length > 0 ? (
        // 책 단독 검색 → 매칭된 모든 책 카드 + 장 그리드 (예: "고린" → 전·후서).
        // 장 그리드가 5열 고정이라 폭을 다 주면 칸이 늘어진다 — 읽기 폭으로 묶는다
        <div className="search-book-list lg:max-w-[680px]">
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
        <div className={`search-results${searchStale ? ' search-results--stale' : ''}`} aria-busy={searchStale}>
          <p className="results-count">
            {searchResults.is_chapter_search && searchResults.book_name_ko
              ? `${searchResults.book_name_ko} ${searchResults.chapter}장 · ${shownTotal}절`
              : t.resultsCount(shownTotal)}
          </p>
          {/* 절 결과는 서로 독립된 스니펫이라 넓은 화면에선 2열로 훑는 편이 빠르다 */}
          <div className="verses-list lg:grid lg:grid-cols-2 lg:gap-3 lg:items-start">
            {scopedVerses.map(verse => (
              <div
                key={verse.id}
                className="bible-verse-item bible-verse-item--search"
                onClick={() => goToChapter(verse.book_number ?? searchResults.book_number ?? 0, verse.chapter, verse.verse)}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    goToChapter(verse.book_number ?? searchResults.book_number ?? 0, verse.chapter, verse.verse)
                  }
                }}
              >
                <div className="bible-verse-reference">
                  {verse.book_name_ko || nameByNumber.get(verse.book_number ?? -1) || searchResults.book_name_ko || ''} {verse.chapter}:{verse.verse}
                </div>
                <div className="bible-verse-text">{renderVerseText(verse.text)}</div>
              </div>
            ))}
          </div>
          {hasNextPage && (
            <div ref={sentinelRef} className="search-load-more" aria-hidden={!isFetchingNextPage}>
              {isFetchingNextPage && (
                <span className="material-icons-round spinning">refresh</span>
              )}
            </div>
          )}
        </div>
      ) : queryTooShort ? (
        <div className="no-results">
          <span className="material-icons-round">short_text</span>
          <p>{t.tooShort}</p>
          <p className="no-results-hint">{t.tooShortHint}</p>
        </div>
      ) : searchQuery ? (
        <div className="no-results">
          <span className="material-icons-round">search_off</span>
          <p>{scope !== 'ALL' && hasAnyResult ? t.noResultsInScope : t.noResults}</p>
        </div>
      ) : null}

      </div>{/* /본문 컬럼 */}

      {/* 우측 레일 (lg+) — 범위 필터 + 최근·추천 검색어를 항상 보이는 자리에 */}
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-4 lg:sticky lg:top-[4.5rem]">
        <div className="search-chip-group">
          <div className="search-chip-group-header">
            <span>{t.scopeLabel}</span>
          </div>
          <div className="search-scope-filter" role="radiogroup" aria-label={t.scopeLabel}>
            {(['ALL', 'OLD', 'NEW'] as const).map(sc => (
              <button
                key={sc}
                type="button"
                role="radio"
                aria-checked={scope === sc}
                className={`scope-chip${scope === sc ? ' scope-chip--active' : ''}`}
                onClick={() => setScope(sc)}
              >
                {sc === 'ALL' ? t.scopeAll : sc === 'OLD' ? t.scopeOld : t.scopeNew}
              </button>
            ))}
          </div>
        </div>

        {/* 시작 화면에는 본문에 이미 같은 칩이 있으므로, 결과를 보는 중일 때만 레일에 둔다 */}
        {searchQuery && suggestionGroups}
      </aside>
      </div>{/* /lg 2단 래퍼 */}

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
