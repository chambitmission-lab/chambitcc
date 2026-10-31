import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useBibleSearchInfinite, useBibleBooks, useBibleChapter } from '../../../hooks/useBible'
import { useSituationCategories } from '../../../hooks/useSituation'
import { useBookCardContexts } from '../../../hooks/useBibleReading'
import { useAuth } from '../../../hooks/useAuth'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { BibleBook, BookMatchCount } from '../../../types/bible'
import SearchBookCard from './SearchBookCard'
import type { BookCard } from './SearchBookCard'
import BookQuickPicker from './BookQuickPicker'
import SearchVerseCard from './SearchVerseCard'
import SearchGlossaryCard from './SearchGlossaryCard'
import { useGlossaryEntry } from '../hooks/useGlossaryEntry'
import { BOOK_ABBREV_KO, BOOK_ABBREV_EN } from './bibleBookAbbrev'
import { safeStorage } from '../../../utils/safeStorage'
import { useSearchIndex } from './search/useSearchIndex'
import { useVoiceSearch } from './search/useVoiceSearch'
import { findFuzzyBook, isChoseongQuery, matchBooksByChoseong } from './search/bookFuzzy'
import { SearchEventRows, SearchEventTopCard, SearchKindTabs, SearchPlaceRows } from './search/SearchLocalResults'
import type { SearchKind } from './search/SearchLocalResults'
import type { EventRef } from './search/searchIndex'
import SearchMindAnswer from './search/SearchMindAnswer'
import { matchSituation } from './search/situationMatch'
import SearchVerseGroups from './search/SearchVerseGroups'
import SearchExploreHome from './search/SearchExploreHome'
import '../styles/search.css'

type SearchScope = 'ALL' | 'OLD' | 'NEW'
type VerseView = 'list' | 'book'

const RECENT_SEARCHES_KEY = 'bible_recent_searches'
const VERSE_VIEW_KEY = 'bible_search_verse_view'
const MAX_RECENT_SEARCHES = 8
const PLACEHOLDER_ROTATE_MS = 3500
/** 숫자 없는 검색어는 타이핑을 멈추면 Enter 없이 바로 찾는다 */
const LIVE_SEARCH_MS = 400
/** '전체' 보기에서 사건·지명은 몇 줄만 — 나머지는 종류 칩으로 */
const EVENT_PREVIEW = 3
const PLACE_PREVIEW = 2

const loadRecentSearches = (): string[] => {
  const parsed = safeStorage.getJson(RECENT_SEARCHES_KEY)
  return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
}

// 저장 실패(사파리 시크릿 모드 등)는 무시 — 검색 자체에는 영향 없음
const persistRecentSearches = (keywords: string[]) => {
  safeStorage.setJson(RECENT_SEARCHES_KEY, keywords)
}

const isScope = (v: string | null): v is SearchScope => v === 'ALL' || v === 'OLD' || v === 'NEW'

// 시작 화면 '주제별 말씀' 카드 — 카드는 그 주제어로 검색, 참조는 대표 구절로 바로 이동
interface SearchTopic {
  word: string
  ref: string
  book: number
  chapter: number
  verse: number
  /** 대표 구절 본문(개역개정, DB 원문 그대로) — 없으면 참조만 */
  text?: string
}

const BibleSearch = () => {
  const { language } = useLanguage()
  const { isLoggedIn } = useAuth()
  const loggedIn = isLoggedIn()
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
  // 책별 분포 칩으로 고른 책 — 키워드 검색을 그 책으로 좁힌다(서버 필터). null = 전체
  const [bookFilter, setBookFilterState] = useState<number | null>(() => {
    const n = Number(searchParams.get('book'))
    return n >= 1 && n <= 66 ? n : null
  })

  // URL 동기화 — 입력마다 히스토리가 쌓이지 않도록 replace. tab= 등 다른 파라미터는 보존
  const syncUrl = (q: string, sc: SearchScope, book: number | null) => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        if (q) next.set('q', q)
        else next.delete('q')
        if (sc !== 'ALL') next.set('scope', sc)
        else next.delete('scope')
        if (book) next.set('book', String(book))
        else next.delete('book')
        return next
      },
      { replace: true }
    )
  }
  // 범위를 바꾸면 책 선택은 푼다 — 고른 책이 새 범위 밖일 수 있고, 분포 자체가 달라진다
  const setScope = (sc: SearchScope) => {
    setScopeState(sc)
    setBookFilterState(null)
    syncUrl(searchQuery, sc, null)
  }
  const setBookFilter = (book: number | null) => {
    setBookFilterState(book)
    syncUrl(searchQuery, scope, book)
  }
  // 결과 종류 칩(전체·절·사건·지명) — 검색어가 바뀌면 '전체'로 돌아간다(이펙트 없이 검색어와 묶어 둔다)
  const [kindState, setKindState] = useState<{ q: string; kind: SearchKind }>({ q: initialQuery, kind: 'all' })
  const kind: SearchKind = kindState.q === searchQuery ? kindState.kind : 'all'
  const setKind = (k: SearchKind) => setKindState({ q: searchQuery, kind: k })
  // 절 결과 보기 방식 — 기기별로 기억한다
  const [verseView, setVerseViewState] = useState<VerseView>(() =>
    safeStorage.get(VERSE_VIEW_KEY) === 'book' ? 'book' : 'list'
  )
  const setVerseView = (v: VerseView) => {
    setVerseViewState(v)
    safeStorage.set(VERSE_VIEW_KEY, v)
  }
  const liveTimerRef = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(liveTimerRef.current), [])
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  // 책 퀵 피커가 열려 있으면 그 트리거가 된 책의 book_number, 닫혀 있으면 null
  const [pickerFor, setPickerFor] = useState<number | null>(null)
  // PC 우측 레일 책별 분포 — 기본은 많은 순 상위 몇 권만, 펼치면 전부
  const [distExpanded, setDistExpanded] = useState(false)
  // 결과 목록 끝에 두는 무한 스크롤 감지용 센티널
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  // 검색창 높이 → --search-form-h. PC 결과 화면에서 sticky 검색창 바로 아래에 우측 레일을 붙인다
  // ('가' 배율·입력 칩 줄에 따라 높이가 달라져 고정값을 못 쓴다). offsetHeight 는 zoom 안 레이아웃 px
  const formRef = useRef<HTMLFormElement | null>(null)
  useEffect(() => {
    const form = formRef.current
    const section = form?.parentElement
    if (!form || !section || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => section.style.setProperty('--search-form-h', `${form.offsetHeight}px`))
    ro.observe(form)
    return () => ro.disconnect()
  }, [])

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
  } = useBibleSearchInfinite(
    // 초성("ㄱㄹㄷㅈㅅ")은 본문에 없는 글자라 서버에 묻지 않는다 — 로컬 책 매칭만으로 답한다
    isChoseongQuery(searchQuery) ? '' : searchQuery,
    scope === 'ALL' ? undefined : scope,
    bookFilter ?? undefined
  )
  const { data: allBooks } = useBibleBooks()
  // 검색어가 사전 표제어("바리새인", "삼위일체")면 결과 위에 뜻풀이 카드 — 사전은 한국어라 ko 에서만
  const glossaryEntry = useGlossaryEntry(language === 'ko' ? searchQuery : '')

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
      ? isChoseongQuery(trimmedQuery)
        ? matchBooksByChoseong(allBooks || [], trimmedQuery)
        : (allBooks || []).filter(
            b =>
              matchesAbbrev(b) ||
              normalize(b.book_name_ko).includes(normalizedQuery) ||
              normalize(b.book_name_en).includes(normalizedQuery)
          )
      : []

  const backendIsBookSearch = !!(
    searchResults?.is_book_search && (searchResults.books?.length || searchResults.book)
  )

  // 사건·지명 로컬 색인 — 숫자 없는 검색어에서만, 책 이름이 잡히면(책 카드가 답) 쓰지 않는다
  const localEligible = language === 'ko' && trimmedQuery.length >= 2 && !isChapterLike && localBookMatches.length === 0
  const searchIndex = useSearchIndex(!!trimmedQuery && language === 'ko')
  const eventHits = useMemo(
    () => (searchIndex && localEligible ? searchIndex.findEvents(trimmedQuery) : null),
    [searchIndex, localEligible, trimmedQuery]
  )
  const placeHits = useMemo(
    () => (searchIndex && localEligible ? searchIndex.findPlaces(trimmedQuery) : null),
    [searchIndex, localEligible, trimmedQuery]
  )
  const events = backendIsBookSearch ? [] : (eventHits?.items ?? [])
  const places = backendIsBookSearch ? [] : (placeHits?.items ?? [])
  const hasLocal = events.length > 0 || places.length > 0

  // 마음으로 찾기 — 상황별 성구 카테고리 이름·키워드
  const { data: situationCategories } = useSituationCategories(localEligible)
  const situationMatch =
    localEligible && situationCategories ? matchSituation(situationCategories, trimmedQuery) : null

  // 한 글자 오타 보정 — 책 이름도, 본문 낱말도, 사건도 아무것도 안 걸렸을 때만 책 이름에 가깝게 고쳐 본다
  const fuzzyBook =
    trimmedQuery &&
    !isChapterLike &&
    localBookMatches.length === 0 &&
    !backendIsBookSearch &&
    !hasLocal &&
    !glossaryEntry &&
    searchResults &&
    !searchStale &&
    (searchResults.total ?? 0) === 0 &&
    loadedVerses.length === 0
      ? findFuzzyBook(allBooks || [], trimmedQuery)
      : null

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
        : fuzzyBook
          ? [fuzzyBook]
          : []

  const texts = {
    ko: {
      searchAria: '성경 검색 — 책 이름, 책+장, 또는 본문 키워드',
      placeholderExamples: [
        '"창세기 1장"을 검색해보세요',
        '"고전 13"처럼 약칭으로 검색해도 돼요',
        '"요 3:16"처럼 절까지 바로 찾을 수 있어요',
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
      verseCount: (n: number) => `${n.toLocaleString()}절`,
      chapterUnit: '장',
      chapterRangeLabel: (book: string, c1: number, c2: number) => `${book} ${c1}-${c2}장`,
      byBook: '책별로 보기',
      allBooksChip: '전체',
      bookChipAria: (book: string, n: number) => `${book} ${n}절`,
      jumpTo: '바로 가기',
      chapterSuggestion: (book: string, ch: number) => `${book} ${ch}장`,
      noticeChapterOutOfRange: (book: string, ch: number, max: number) =>
        `${book}은(는) ${max}장까지 있어요. ${ch}장은 없어서 장을 골라 볼 수 있게 펼쳤어요.`,
      noticeVerseOutOfRange: (book: string, ch: number, max: number) =>
        `${book} ${ch}장은 ${max}절까지예요. 장 전체를 보여 드릴게요.`,
      noticeRangeClamped: (book: string, c1: number, c2: number) =>
        `한 번에 10장까지만 볼 수 있어 ${book} ${c1}-${c2}장만 보여 드려요.`,
      noResults: '검색 결과가 없습니다',
      noResultsInScope: '선택한 범위에 검색 결과가 없습니다',
      tooShort: '두 글자 이상 입력해 주세요',
      tooShortHint: '한 글자 단어는 "빛이", "복을"처럼 뒤에 오는 말과 붙여서 찾아보세요',
      searchFailed: '검색하지 못했어요',
      searchFailedHint: '연결 상태를 확인하고 다시 시도해 주세요',
      retry: '다시 시도',
      bookFound: '해당 책을 찾았습니다',
      heroTitle: '어떤 말씀을 찾고 계세요?',
      fuzzyNotice: (typed: string, book: string) => `‘${typed}’에 맞는 결과가 없어 ‘${book}’으로 찾았어요.`,
      didYouMean: '혹시 이걸 찾으셨나요?',
      noVerseButLocal: (q: string) => `‘${q}’이(가) 본문에 그대로 나오는 절은 없어요`,
      viewLabel: '절 보기 방식',
      viewList: '목록',
      viewBook: '책별',
      voiceStart: '말로 검색',
      voiceStop: '듣기 멈추기',
      versePreview: '절 바로 가기',
      topicsTitle: '주제별 말씀',
      topicOpen: (ref: string) => `${ref} 읽기`,
      topics: [
        { word: '사랑', ref: '고전 13:4', book: 46, chapter: 13, verse: 4, text: '사랑은 오래 참고 사랑은 온유하며 시기하지 아니하며 사랑은 자랑하지 아니하며 교만하지 아니하며' },
        { word: '믿음', ref: '히 11:1', book: 58, chapter: 11, verse: 1, text: '믿음은 바라는 것들의 실상이요 보이지 않는 것들의 증거니' },
        { word: '소망', ref: '롬 5:5', book: 45, chapter: 5, verse: 5, text: '소망이 우리를 부끄럽게 하지 아니함은 우리에게 주신 성령으로 말미암아 하나님의 사랑이 우리 마음에 부은 바 됨이니' },
        { word: '위로', ref: '고후 1:4', book: 47, chapter: 1, verse: 4, text: '우리의 모든 환난 중에서 우리를 위로하사 우리로 하여금 하나님께 받는 위로로써 모든 환난 중에 있는 자들을 능히 위로하게 하시는 이시로다' },
        { word: '평안', ref: '요 14:27', book: 43, chapter: 14, verse: 27, text: '평안을 너희에게 끼치노니 곧 나의 평안을 너희에게 주노라' },
        { word: '감사', ref: '살전 5:18', book: 52, chapter: 5, verse: 18, text: '범사에 감사하라 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라' },
        { word: '은혜', ref: '엡 2:8', book: 49, chapter: 2, verse: 8, text: '너희는 그 은혜에 의하여 믿음으로 말미암아 구원을 받았으니 이것은 너희에게서 난 것이 아니요 하나님의 선물이라' },
        { word: '기도', ref: '빌 4:6', book: 50, chapter: 4, verse: 6, text: '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라' },
      ] as SearchTopic[],
      keywordHeading: (q: string) => `‘${q}’`,
      distTitle: '어디에 많이 나오나요?',
      distClear: '선택 해제',
      distMore: (n: number) => `${n}권 더 보기`,
      distLess: '접기',
    },
    en: {
      searchAria: 'Bible search — book name, book+chapter, or keyword',
      placeholderExamples: [
        'Try "Genesis 1"',
        'Try "John 3:16" to jump to a verse',
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
      verseCount: (n: number) => `${n.toLocaleString()} verse${n === 1 ? '' : 's'}`,
      chapterUnit: '',
      chapterRangeLabel: (book: string, c1: number, c2: number) => `${book} ${c1}-${c2}`,
      byBook: 'By book',
      allBooksChip: 'All',
      bookChipAria: (book: string, n: number) => `${book}, ${n} verse${n === 1 ? '' : 's'}`,
      jumpTo: 'Jump to',
      chapterSuggestion: (book: string, ch: number) => `${book} ${ch}`,
      noticeChapterOutOfRange: (book: string, ch: number, max: number) =>
        `${book} has ${max} chapters, so chapter ${ch} doesn't exist. Pick a chapter below.`,
      noticeVerseOutOfRange: (book: string, ch: number, max: number) =>
        `${book} ${ch} has ${max} verses. Showing the whole chapter instead.`,
      noticeRangeClamped: (book: string, c1: number, c2: number) =>
        `Up to 10 chapters at a time — showing ${book} ${c1}-${c2}.`,
      noResults: 'No results found',
      noResultsInScope: 'No results in the selected scope',
      tooShort: 'Enter at least two characters',
      tooShortHint: 'Try a longer word or add the word that follows it',
      searchFailed: 'Search failed',
      searchFailedHint: 'Check your connection and try again',
      retry: 'Try again',
      bookFound: 'Book found',
      heroTitle: 'What are you looking for?',
      fuzzyNotice: (typed: string, book: string) => `No results for “${typed}”, so we searched “${book}”.`,
      didYouMean: 'Did you mean',
      noVerseButLocal: (q: string) => `No verse contains “${q}” word for word`,
      viewLabel: 'Verse view',
      viewList: 'List',
      viewBook: 'By book',
      voiceStart: 'Search by voice',
      voiceStop: 'Stop listening',
      versePreview: 'Jump to verse',
      topicsTitle: 'Verses by theme',
      topicOpen: (ref: string) => `Read ${ref}`,
      // 본문은 한국어 성경뿐이라 영문은 참조만 보여 준다
      topics: [
        { word: 'love', ref: '1 Cor 13:4', book: 46, chapter: 13, verse: 4 },
        { word: 'faith', ref: 'Heb 11:1', book: 58, chapter: 11, verse: 1 },
        { word: 'hope', ref: 'Rom 5:5', book: 45, chapter: 5, verse: 5 },
        { word: 'comfort', ref: '2 Cor 1:4', book: 47, chapter: 1, verse: 4 },
        { word: 'peace', ref: 'John 14:27', book: 43, chapter: 14, verse: 27 },
        { word: 'grace', ref: 'Eph 2:8', book: 49, chapter: 2, verse: 8 },
        { word: 'prayer', ref: 'Phil 4:6', book: 50, chapter: 4, verse: 6 },
      ] as SearchTopic[],
      keywordHeading: (q: string) => `“${q}”`,
      distTitle: 'Where it appears most',
      distClear: 'Clear',
      distMore: (n: number) => `${n} more books`,
      distLess: 'Show less',
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
    window.clearTimeout(liveTimerRef.current)
    setSearchKeyword(q)
    setSearchQuery(q)
    // 백엔드가 2글자 미만을 거부하므로 한 글자는 최근 검색어에 쌓지 않는다
    if (q.length >= 2) saveRecentSearch(q)
    // 새 검색어의 분포는 다르므로 책 선택은 푼다(같은 검색어 재실행도 전체로 되돌린다)
    setBookFilterState(null)
    syncUrl(q, scope, null)
  }

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    runSearch(searchKeyword)
  }

  // 즉시 검색 — 숫자 없는 검색어는 타이핑을 멈추면 Enter 없이 결과를 펼친다.
  // 장·절("요 3:16")은 쓰는 도중엔 뜻이 계속 바뀌므로 아래 바로 가기 제안으로 대신하고 Enter 로 찾는다.
  // 최근 검색어에는 쌓지 않는다(타이핑 중간 글자가 쌓이므로) — Enter·결과 열기 때만 저장
  const scheduleLiveSearch = (value: string) => {
    window.clearTimeout(liveTimerRef.current)
    const q = value.trim()
    if (q.length < 2 || /\d/.test(q)) return
    liveTimerRef.current = window.setTimeout(() => {
      setSearchQuery(q)
      setBookFilterState(null)
      syncUrl(q, scope, null)
    }, LIVE_SEARCH_MS)
  }

  const clearSearch = () => {
    window.clearTimeout(liveTimerRef.current)
    setSearchKeyword('')
    setSearchQuery('')
    setBookFilterState(null)
    syncUrl('', scope, null)
  }

  // 검색 결과 화면에서 브라우저/안드로이드 뒤로가기 → 페이지 이탈 대신 검색 시작 화면으로 복귀
  useModalBackButton(clearSearch, !!searchQuery)

  const goToChapter = (bookNumber: number, chapter: number, verse?: number) => {
    // 즉시 검색으로 뜬 결과를 열었으면 그 검색어도 최근 검색어로 남긴다
    const q = searchQuery.trim()
    if (q.length >= 2) saveRecentSearch(q)
    // 현재 URL이 이미 같은 책·장이어도(예: 나훔 2장을 읽다가 검색에서 다시 나훔 2장 클릭)
    // 읽기 화면으로 전환되도록 재진입 신호를 state로 함께 넘긴다.
    // 절 결과에서 왔으면 ?verse=N — 읽기 화면이 그 절로 스크롤·하이라이트한다(장 첫머리에 떨구지 않는다)
    const search = verse && verse > 0 ? `?verse=${verse}` : ''
    navigate(`/bible/${bookNumber}/${chapter}${search}`, {
      state: { chapterNav: new Date().getTime() },
    })
  }

  const openEventRef = (r: EventRef) => goToChapter(r.b, r.c, r.v)

  // 음성 검색 — 말하는 동안 받아 적고, 말을 마치면 바로 찾는다
  const voice = useVoiceSearch(language, text => setSearchKeyword(text), text => runSearch(text))

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
    setBookFilterState(null)
    syncUrl(book.book_name_ko, nextScope, null)
  }

  // 구약/신약 범위 필터 — 키워드 검색은 서버가 이미 걸러서 보내고,
  // 장 검색 결과(페이징 대상 아님)만 여기서 거른다.
  // 구절의 book_number(없으면 책 이름)로 신·구약을 판별하고, 판별 불가 시에는 표시를 유지한다.
  const testamentByNumber = new Map((allBooks || []).map(b => [b.book_number, b.testament]))
  const testamentByName = new Map((allBooks || []).map(b => [b.book_name_ko, b.testament]))
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
  // 카드에 얹을 장별 진행률·표시 장 — 결과의 책 전부를 한 요청으로 받아 카드별로 나눠 준다
  // (쿼리 키는 책 번호를 정렬해 이어 붙인 문자열이라 배열 참조가 바뀌어도 재요청하지 않는다)
  const { data: cardContexts } = useBookCardContexts(scopedBooks.map(b => b.book_number), loggedIn)
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

  // 결과 헤딩 — 장/절/범위 검색은 참조 표기, 키워드 검색은 건수
  const resultsHeading = (() => {
    if (!searchResults) return ''
    if (searchResults.is_chapter_search && searchResults.book_name_ko && searchResults.chapter) {
      const book = searchResults.book_name_ko
      const ch = searchResults.chapter
      if (searchResults.verse_start) {
        const ref = `${book} ${ch}:${searchResults.verse_start}${
          searchResults.verse_end ? `-${searchResults.verse_end}` : ''
        }`
        return searchResults.verse_end ? `${ref} · ${t.verseCount(shownTotal)}` : ref
      }
      if (searchResults.chapter_end) {
        return `${t.chapterRangeLabel(book, ch, searchResults.chapter_end)} · ${t.verseCount(shownTotal)}`
      }
      return `${book} ${ch}${t.chapterUnit} · ${t.verseCount(shownTotal)}`
    }
    return t.resultsCount(shownTotal)
  })()

  // 서버 안내 코드 → 문구. 책 카드 위(장 초과) 또는 결과 위(절 초과·범위 축소)에 띄운다
  const noticeText = (() => {
    const r = searchResults
    if (!r?.notice || !r.book_name_ko) return null
    if (r.notice === 'chapter_out_of_range' && r.chapter && r.chapter_count)
      return t.noticeChapterOutOfRange(r.book_name_ko, r.chapter, r.chapter_count)
    if (r.notice === 'verse_out_of_range' && r.chapter && r.verse_count)
      return t.noticeVerseOutOfRange(r.book_name_ko, r.chapter, r.verse_count)
    if (r.notice === 'chapter_range_clamped' && r.chapter && r.chapter_end)
      return t.noticeRangeClamped(r.book_name_ko, r.chapter, r.chapter_end)
    return null
  })()

  // 책별 분포 칩 — 키워드 검색에서 매칭이 두 권 이상일 때. 많은 순으로 늘어놓아
  // "어디에 몰려 있는지"가 먼저 읽히게 한다. 책 하나를 골라도 서버가 전체 분포를 계속 주므로
  // 칩 개수는 흔들리지 않는다.
  const bookCounts: BookMatchCount[] = searchResults?.is_chapter_search
    ? []
    : [...(searchResults?.book_counts ?? [])].sort((a, b) => b.count - a.count)
  const bookCountsTotal = bookCounts.reduce((n, b) => n + b.count, 0)
  const showBookChips = bookCounts.length > 1 || (bookFilter !== null && bookCounts.length > 0)

  // 타이핑 중 책 제안 — Enter 전에 "고린" → 고린도전서·후서, "고전 13" → 고린도전서 13장.
  // 로컬 책 목록만 보므로 요청이 없고, 실행한 검색어와 같으면(이미 결과가 떠 있으면) 숨긴다
  const resolveBookLocal = (name: string): BibleBook | undefined => {
    const books = allBooks || []
    const n = normalize(name)
    if (!n) return undefined
    return (
      books.find(b => normalize(b.book_name_ko) === n || normalize(b.book_name_en) === n) ??
      books.find(b => BOOK_ABBREV_KO[b.book_number] === name.trim() || BOOK_ABBREV_EN[b.book_number]?.toLowerCase() === n) ??
      books.find(b => normalize(b.book_name_ko).startsWith(n) || normalize(b.book_name_en).startsWith(n))
    )
  }
  const typedRaw = searchKeyword.trim()
  const typeahead: { label: string; query: string }[] = (() => {
    if (!typedRaw || typedRaw === searchQuery || !allBooks?.length) return []
    const chapterMatch = typedRaw.match(/^(.+?)\s*(\d+)\s*(?:장|편)?\s*(?:[:.]\s*\d*)?$/)
    if (chapterMatch) {
      const book = resolveBookLocal(chapterMatch[1])
      const ch = Number(chapterMatch[2])
      if (!book || ch < 1 || ch > book.chapter_count) return []
      // 절까지 입력 중이면 그대로 두고, 장만 입력했을 때만 "○○ N장" 하나를 제안
      if (/[:.]/.test(typedRaw)) return []
      return [{ label: t.chapterSuggestion(book.book_name_ko, ch), query: `${book.book_name_ko} ${ch}` }]
    }
    if (/\d/.test(typedRaw)) return []
    const n = normalize(typedRaw)
    return allBooks
      .filter(
        b =>
          BOOK_ABBREV_KO[b.book_number] === typedRaw ||
          BOOK_ABBREV_EN[b.book_number]?.toLowerCase() === n ||
          normalize(b.book_name_ko).includes(n) ||
          normalize(b.book_name_en).includes(n)
      )
      .slice(0, 6)
      .map(b => ({ label: b.book_name_ko, query: b.book_name_ko }))
  })()

  // 절 바로 가기 — "요 3:1"까지 치면 그 장의 3:1·3:10~19 를 본문 첫머리와 함께 미리 보여 준다.
  // 장 본문은 읽기 화면과 같은 캐시 칸이라, 한 번 받은 장은 다시 묻지 않는다
  const verseTyping =
    typedRaw && typedRaw !== searchQuery ? typedRaw.match(/^(.+?)\s*(\d+)\s*(?:장)?\s*[:.]\s*(\d*)$/) : null
  const previewBook = verseTyping ? resolveBookLocal(verseTyping[1]) : undefined
  const previewCh = verseTyping ? Number(verseTyping[2]) : 0
  const previewOk = !!previewBook && previewCh >= 1 && previewCh <= previewBook.chapter_count
  const { data: previewChapter } = useBibleChapter(
    previewOk ? previewBook!.book_number : 0,
    previewOk ? previewCh : 0,
    previewOk
  )
  const versePreview =
    previewOk && previewChapter && verseTyping
      ? previewChapter.verses
          .filter(v => !v.merged_into && String(v.verse).startsWith(verseTyping[3]))
          .slice(0, 5)
      : []

  // 키워드 검색 결과에서 매칭 단어 강조 — "왜 이 절이 걸렸는지"가 훑기만 해도 보이게.
  // 여러 단어 AND 검색은 단어별로 각각 칠한다. 장 검색(창 1)은 키워드가 없으므로 제외.
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const highlightTokens =
    trimmedQuery && !searchResults?.is_chapter_search
      ? // 백엔드가 공백·쉼표 모두로 토큰을 나누므로("주,그리스도") 같은 규칙으로 잘라야 강조가 빠지지 않는다
        [...new Set(trimmedQuery.split(/[,\s]+/).filter(Boolean))]
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

  // 최근 검색어 칩 그룹 — 모바일 시작 화면·PC 시작 화면(히어로)·PC 결과 레일이 같은 마크업을 쓴다
  const recentGroup = recentSearches.length > 0 && (
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
  )

  // 최근 검색어·추천 키워드 칩 그룹 — PC 결과 화면 우측 레일
  const suggestionGroups = (
    <>
      {recentGroup}

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

  // 범위 버튼 — 모바일은 입력창 아래 칩 줄, PC는 입력창 안 세그먼트. 같은 radiogroup 을 두 자리에 그린다
  const scopeButtons = (className: string) =>
    (['ALL', 'OLD', 'NEW'] as const).map(sc => (
      <button
        key={sc}
        type="button"
        role="radio"
        aria-checked={scope === sc}
        className={`${className}${scope === sc ? ` ${className}--active` : ''}`}
        onClick={() => setScope(sc)}
      >
        {sc === 'ALL' ? t.scopeAll : sc === 'OLD' ? t.scopeOld : t.scopeNew}
      </button>
    ))

  const isHome = !searchQuery

  // 통합 결과 배치
  const topEvent = !glossaryEntry && eventHits?.exact ? events[0] : undefined
  const previewEvents = topEvent ? events.slice(1) : events
  // 사건·지명을 절보다 위에 세우는 건 고유명사일 때만 — 사전의 인물·지명·칭호(모세·다윗·바로),
  // 사건 이름 그 자체(십계명), 지도 장소(여리고). "은혜"처럼 제목 머리에 흔한 낱말은 절이 먼저다
  const properNoun = !!glossaryEntry && ['person', 'place', 'title'].includes(glossaryEntry.type)
  const strongLocal = !!(eventHits?.exact || placeHits?.strong || (properNoun && eventHits?.strong))
  // 책별 묶음은 여러 책에 걸친 키워드 검색에서만 — 책 하나로 좁혔으면 목록이 곧 그 책이다
  const canGroup = !!searchResults && !searchResults.is_chapter_search && bookCounts.length > 1 && bookFilter === null
  const verseViewShown: VerseView = canGroup ? verseView : 'list'

  // 장·절 검색의 책 이름 오타("요한복은 3") — 결과가 없을 때 고친 검색어를 제안한다
  const didYouMean = (() => {
    if (!isChapterLike || !searchResults || loadedVerses.length > 0) return null
    const m = trimmedQuery.match(/^(.+?)\s*(\d.*)$/)
    if (!m || resolveBookLocal(m[1])) return null
    const b = findFuzzyBook(allBooks || [], m[1])
    return b ? `${b.book_name_ko} ${m[2]}` : null
  })()
  // PC 레일 분포 막대 — 가장 많은 책 기준 비율
  const distMax = bookCounts[0]?.count ?? 1
  const DIST_COLLAPSED = 8
  const distShown = distExpanded ? bookCounts : bookCounts.slice(0, DIST_COLLAPSED)

  return (
    <div className="bible-search-section">
      {/* lg+ 제목·검색창은 시작 화면과 결과 화면이 같은 틀 — 2단 래퍼 밖(위)에 두어 결과 화면에서
          우측 레일이 생겨도 검색창 폭·위치·모양이 그대로다(검색 전후로 화면이 덜컥 바뀌지 않게) */}
      <h2 className="search-hero-title hidden lg:block">{t.heroTitle}</h2>
      <form ref={formRef} onSubmit={handleSearch} className={`search-form${isHome ? ' search-form--hero' : ''}`}>
        <div className="search-input-wrapper">
          <div className={`search-input-area${voice.supported ? ' search-input-area--voice' : ''}`}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                // 입력을 모두 지우면 결과도 접고 검색 시작 화면(최근/추천 키워드)으로
                if (e.target.value === '') {
                  window.clearTimeout(liveTimerRef.current)
                  setSearchQuery('')
                  setBookFilterState(null)
                  syncUrl('', scope, null)
                } else {
                  scheduleLiveSearch(e.target.value)
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
            {voice.supported && (!searchKeyword || voice.listening) && (
              <button
                type="button"
                className={`search-voice-button${voice.listening ? ' search-voice-button--on' : ''}`}
                aria-label={voice.listening ? t.voiceStop : t.voiceStart}
                aria-pressed={voice.listening}
                onClick={voice.toggle}
              >
                <span className="material-icons-round">{voice.listening ? 'graphic_eq' : 'mic'}</span>
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
          {/* PC — 범위를 입력창 안 세그먼트로(좁은 zoom 폭에선 아래 모바일 칩 줄이 대신한다) */}
          <div className="search-scope-seg hidden lg:flex zoom-narrow-hide" role="radiogroup" aria-label={t.scopeLabel}>
            {scopeButtons('search-scope-seg__btn')}
          </div>
        </div>

        {typeahead.length > 0 && (
          <div className="search-typeahead" role="group" aria-label={t.jumpTo}>
            <span className="search-typeahead-label">{t.jumpTo}</span>
            {typeahead.map(item => (
              <button
                key={item.query}
                type="button"
                className="search-chip search-chip--suggest"
                onClick={() => runSearch(item.query)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {versePreview.length > 0 && previewBook && (
          <div className="search-typeahead search-typeahead--verses" role="group" aria-label={t.versePreview}>
            <span className="search-typeahead-label">{t.versePreview}</span>
            {versePreview.map(v => (
              <button
                key={v.id}
                type="button"
                className="search-verse-jump"
                onClick={() => {
                  saveRecentSearch(`${previewBook.book_name_ko} ${previewCh}:${v.verse}`)
                  goToChapter(previewBook.book_number, previewCh, v.verse)
                }}
              >
                <b>
                  {previewBook.book_name_ko} {previewCh}:{v.verse}
                </b>
                <span>{v.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* 모바일 — 입력창 아래 세그먼트(PC 는 입력창 안). 범위는 보조 기능이라 칩보다 조용한 톤 */}
        <div
          className="search-scope-filter search-scope-seg lg:hidden zoom-narrow-show-flex"
          role="radiogroup"
          aria-label={t.scopeLabel}
        >
          {scopeButtons('search-scope-seg__btn')}
        </div>
      </form>

      {/* 결과 화면: 본문 + 우측 레일(책별 분포·최근·추천) — 레일 덕분에 결과를 보는 중에도
          다른 책으로 좁히거나 최근 검색어로 갈아탈 수 있다. 모바일에선 이 래퍼가 그냥 스택 */}
      <div className="lg:flex lg:items-start lg:gap-6">
      <div className="lg:flex-1 lg:min-w-0">
      {/* 시작 화면(모바일·PC 공통) — 설교 본문·최근 검색어·마음·이야기 + 주제별 말씀.
          결과를 보는 중엔 최근·추천 칩이 PC 우측 레일로 옮겨 간다 */}
      {isHome && (
        <div className="search-hero">
          {language === 'ko' ? (
            <SearchExploreHome onSearch={runSearch} onOpen={goToChapter} recent={recentGroup} />
          ) : (
            recentGroup
          )}
          <section className="search-chip-group">
            <div className="search-chip-group-header">
              <span>{t.topicsTitle}</span>
            </div>
            <div className="search-topics">
              {t.topics.map(topic => (
                // 카드 = 주제어 검색, 오른쪽 위 참조 = 대표 구절로 바로 이동(버튼 중첩을 피해 형제로 겹쳐 둔다)
                <div key={topic.word} className="search-topic">
                  <button type="button" className="search-topic__main" onClick={() => runSearch(topic.word)}>
                    <span className="search-topic__word">{topic.word}</span>
                    {topic.text && <span className="search-topic__text">{topic.text}</span>}
                  </button>
                  <button
                    type="button"
                    className="search-topic__ref"
                    aria-label={t.topicOpen(topic.ref)}
                    onClick={() => goToChapter(topic.book, topic.chapter, topic.verse)}
                  >
                    {topic.ref}
                    <span className="material-icons-round" aria-hidden="true">chevron_right</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 결과 종류 칩 — 사건·지명이 함께 잡힐 때만. 검색창 바로 아래(Spotify·Apple Music 검색 문법) */}
      {searchQuery && hasLocal && booksToShow.length === 0 && (
        <SearchKindTabs
          kind={kind}
          onChange={setKind}
          verseCount={searchResults && !searchStale ? shownTotal : null}
          eventCount={events.length}
          placeCount={places.length}
          lang={language}
        />
      )}

      {/* 최상위 결과 — 사전 표제어("모세", "바리새인")가 먼저, 아니면 사건 이름 그 자체("오병이어").
          절 결과가 0건("삼위일체")이어도 뜻은 답한다 */}
      {searchQuery && kind === 'all' && (
        glossaryEntry ? (
          <SearchGlossaryCard
            entry={glossaryEntry}
            mapPlaceId={glossaryEntry.type === 'place' && placeHits?.exact ? places[0]?.id : undefined}
          />
        ) : topEvent ? (
          <SearchEventTopCard event={topEvent} onOpen={openEventRef} lang={language} />
        ) : null
      )}

      {/* 마음으로 찾기 — "요즘 불안해요" → 상황별 성구 */}
      {searchQuery && kind === 'all' && situationMatch && (
        <SearchMindAnswer key={situationMatch.category.id} match={situationMatch} onOpenVerse={goToChapter} />
      )}

      {kind === 'event' ? (
        <SearchEventRows events={events} onOpen={openEventRef} lang={language} />
      ) : kind === 'place' ? (
        <SearchPlaceRows places={places} lang={language} />
      ) : (
      <>
      {/* '전체' — 검색어가 사건 제목·지명 머리와 맞으면(모세·홍해·여리고) 절보다 위에 몇 줄.
          본문 낱말에 가까운 검색어("은혜")는 절이 먼저고, 사건·지명은 종류 칩으로만 연다 */}
      {kind === 'all' && strongLocal && (
        <div className="search-local">
          <SearchEventRows
            events={previewEvents}
            limit={EVENT_PREVIEW}
            onOpen={openEventRef}
            onShowAll={() => setKind('event')}
            lang={language}
          />
          <SearchPlaceRows places={places} limit={PLACE_PREVIEW} onShowAll={() => setKind('place')} lang={language} />
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
        <div className={`search-book-list${scopedBooks.length > 1 ? ' search-book-list--multi' : ' lg:max-w-[680px]'}`}>
          {noticeText && (
            <p className="search-notice" role="status">
              <span className="material-icons-round" aria-hidden="true">info</span>
              {noticeText}
            </p>
          )}
          {fuzzyBook && scopedBooks[0]?.book_number === fuzzyBook.book_number && (
            <p className="search-notice" role="status">
              <span className="material-icons-round" aria-hidden="true">spellcheck</span>
              {t.fuzzyNotice(trimmedQuery, fuzzyBook.book_name_ko)}
            </p>
          )}
          {scopedBooks.map(book => (
            <SearchBookCard
              key={book.book_number}
              book={book}
              cardContext={cardContexts?.get(book.book_number)}
              onSelectChapter={goToChapter}
              onOpenPicker={() => setPickerFor(book.book_number)}
            />
          ))}
        </div>
      ) : searchResults && scopedVerses.length > 0 ? (
        <div className={`search-results${searchStale ? ' search-results--stale' : ''}`} aria-busy={searchStale}>
          {noticeText && (
            <p className="search-notice" role="status">
              <span className="material-icons-round" aria-hidden="true">info</span>
              {noticeText}
            </p>
          )}
          {/* 스크린리더가 결과 도착·건수 변화를 읽도록 polite로 알린다 */}
          <p className="results-count" aria-live="polite">
            <span className="lg:hidden">{resultsHeading}</span>
            {/* PC — 키워드 검색은 검색어를 제목으로 세운다(‘사랑’ 614절). 장·절 검색은 참조 표기 그대로 */}
            <span className="hidden lg:inline">
              {searchResults.is_chapter_search ? (
                resultsHeading
              ) : (
                <>
                  <em>{t.keywordHeading(trimmedQuery)}</em>
                  {bookFilter !== null && ` · ${nameByNumber.get(bookFilter) ?? ''}`} {t.verseCount(shownTotal)}
                </>
              )}
            </span>
          </p>
          {/* 보기 방식 — 목록(성경 순서) / 책별(많이 나온 책부터 접어 두기). 여러 책에 걸친 키워드 검색에서만 */}
          {canGroup && (
            <div className="search-view-toggle" role="radiogroup" aria-label={t.viewLabel}>
              {(['list', 'book'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={verseViewShown === v}
                  className={`search-view-toggle__btn${verseViewShown === v ? ' search-view-toggle__btn--on' : ''}`}
                  onClick={() => setVerseView(v)}
                >
                  <span className="material-icons-round" aria-hidden="true">{v === 'list' ? 'list' : 'view_agenda'}</span>
                  {v === 'list' ? t.viewList : t.viewBook}
                </button>
              ))}
            </div>
          )}
          {verseViewShown === 'book' ? (
            <SearchVerseGroups
              query={searchQuery}
              scope={scope === 'ALL' ? undefined : scope}
              bookCounts={bookCounts}
              lang={language}
              renderVerseText={renderVerseText}
              onOpen={goToChapter}
              onMore={book => {
                setBookFilter(book)
                window.scrollTo({ top: 0 })
              }}
            />
          ) : (
          <>
          {/* 책별 분포 칩 — 모바일·좁은 zoom 폭. PC 에선 우측 레일 막대 그래프가 대신한다 */}
          {showBookChips && (
            <div className="lg:hidden zoom-narrow-show">
            <div className="search-book-chips" role="group" aria-label={t.byBook}>
              <button
                type="button"
                className={`scope-chip scope-chip--sm${bookFilter === null ? ' scope-chip--active' : ''}`}
                aria-pressed={bookFilter === null}
                onClick={() => setBookFilter(null)}
              >
                {t.allBooksChip} <span className="search-book-chip-count">{bookCountsTotal.toLocaleString()}</span>
              </button>
              {bookCounts.map(b => (
                <button
                  key={b.book_number}
                  type="button"
                  className={`scope-chip scope-chip--sm${bookFilter === b.book_number ? ' scope-chip--active' : ''}`}
                  aria-pressed={bookFilter === b.book_number}
                  aria-label={t.bookChipAria(b.book_name_ko, b.count)}
                  onClick={() => setBookFilter(bookFilter === b.book_number ? null : b.book_number)}
                >
                  {b.book_name_ko} <span className="search-book-chip-count">{b.count.toLocaleString()}</span>
                </button>
              ))}
            </div>
            </div>
          )}
          {/* PC — 한 장의 목록 안에 '참조 | 본문' 줄로 늘어놓아 성구 사전처럼 위에서 아래로 훑는다 */}
          <div className="search-verses-list">
            {scopedVerses.map(verse => {
              const bookNumber = verse.book_number ?? searchResults.book_number ?? 0
              return (
                <SearchVerseCard
                  key={verse.id}
                  verse={verse}
                  bookNumber={bookNumber}
                  bookNameKo={
                    verse.book_name_ko || nameByNumber.get(bookNumber) || searchResults.book_name_ko || ''
                  }
                  onOpen={() => goToChapter(bookNumber, verse.chapter, verse.verse)}
                >
                  {renderVerseText(verse.text)}
                </SearchVerseCard>
              )
            })}
          </div>
          {hasNextPage && (
            <div ref={sentinelRef} className="search-load-more" aria-hidden={!isFetchingNextPage}>
              {isFetchingNextPage && (
                <span className="material-icons-round spinning">refresh</span>
              )}
            </div>
          )}
          </>
          )}
        </div>
      ) : queryTooShort ? (
        <div className="no-results">
          <span className="material-icons-round">short_text</span>
          <p>{t.tooShort}</p>
          <p className="no-results-hint">{t.tooShortHint}</p>
        </div>
      ) : searchQuery && (hasLocal || situationMatch || glossaryEntry || topEvent) ? (
        // 사건·사전·마음 답변이 이미 답했으면 큰 빈 상태 대신 한 줄만
        searchResults && !searchStale ? <p className="search-quiet-empty">{t.noVerseButLocal(trimmedQuery)}</p> : null
      ) : searchQuery ? (
        <div className="no-results">
          <span className="material-icons-round">search_off</span>
          <p>{scope !== 'ALL' && hasAnyResult ? t.noResultsInScope : t.noResults}</p>
          {didYouMean && (
            <div className="search-did-you-mean">
              <span>{t.didYouMean}</span>
              <button type="button" className="search-chip search-chip--suggest" onClick={() => runSearch(didYouMean)}>
                {didYouMean}
              </button>
            </div>
          )}
        </div>
      ) : null}
      </>
      )}

      </div>{/* /본문 컬럼 */}

      {/* 우측 레일 (lg+, 결과 화면만) — 책별 분포 + 최근·추천 검색어를 항상 보이는 자리에.
          범위는 입력창 안 세그먼트로 옮겼다 */}
      {!isHome && (
        <aside className="search-rail hidden lg:flex lg:w-[300px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky zoom-narrow-hide">
          {showBookChips && (
            <div className="search-rail-panel">
              <div className="search-chip-group-header">
                <span>{t.distTitle}</span>
                {bookFilter !== null && (
                  <button type="button" className="search-chip-clear" onClick={() => setBookFilter(null)}>
                    {t.distClear}
                  </button>
                )}
              </div>
              <div className="search-dist" role="group" aria-label={t.byBook}>
                {distShown.map(b => (
                  <button
                    key={b.book_number}
                    type="button"
                    className={`search-dist__row${bookFilter === b.book_number ? ' search-dist__row--active' : ''}`}
                    aria-pressed={bookFilter === b.book_number}
                    aria-label={t.bookChipAria(b.book_name_ko, b.count)}
                    onClick={() => setBookFilter(bookFilter === b.book_number ? null : b.book_number)}
                  >
                    <span className="search-dist__name">{b.book_name_ko}</span>
                    <span className="search-dist__bar" aria-hidden="true">
                      <i style={{ width: `${(b.count / distMax) * 100}%` }} />
                    </span>
                    <span className="search-dist__count">{b.count.toLocaleString()}</span>
                  </button>
                ))}
              </div>
              {bookCounts.length > DIST_COLLAPSED && (
                <button type="button" className="search-dist__more" onClick={() => setDistExpanded(v => !v)}>
                  <span className="material-icons-round" aria-hidden="true">{distExpanded ? 'expand_less' : 'expand_more'}</span>
                  {distExpanded ? t.distLess : t.distMore(bookCounts.length - DIST_COLLAPSED)}
                </button>
              )}
            </div>
          )}
          <div className="search-rail-panel">{suggestionGroups}</div>
        </aside>
      )}
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
