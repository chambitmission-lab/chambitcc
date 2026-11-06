// BibleSearch 의 "데이터 모델" — 서버 질의·로컬 색인·사전·상황 매칭을 받아
// 화면이 바로 그릴 값(책 카드·절 목록·헤딩·안내·분포·타이핑 제안)으로 정리한다.
// 판단 규칙은 queryInterpretation / resultShaping 의 순수 함수에 있고, 이 훅은 그것들을
// React Query 결과와 이어 붙이는 배선만 맡는다. BibleSearch.tsx 에는 상태·URL 동기화·JSX 만 남는다.

import { useMemo } from 'react'
import { useBibleBooks, useBibleChapter, useBibleSearchInfinite } from '../../../../hooks/useBible'
import { useBookCardContexts } from '../../../../hooks/useBibleReading'
import { useSituationCategories } from '../../../../hooks/useSituation'
import type { BibleBook, BibleVerse } from '../../../../types/bible'
import { useGlossaryEntry } from '../../hooks/useGlossaryEntry'
import type { BookCard } from '../SearchBookCard'
import {
  buildHighlightPattern,
  interpretQuery,
  parseVerseTyping,
  suggestDidYouMean,
  suggestTypeahead,
} from './queryInterpretation'
import {
  buildBookDistribution,
  buildScopeFilter,
  countShownTotal,
  filterBooksByScope,
  filterVersesByScope,
  formatNotice,
  formatResultsHeading,
  isBackendBookSearch,
  isLocalIndexEligible,
  isQueryTooShort,
  pickBooksToShow,
  pickFuzzyBook,
} from './resultShaping'
import type { HeadingLabels, NoticeLabels, SearchScope } from './resultShaping'
import { matchSituation } from './situationMatch'
import { useSearchIndex } from './useSearchIndex'

export interface BibleSearchModelLabels extends HeadingLabels, NoticeLabels {
  chapterSuggestion: (book: string, ch: number) => string
}

export interface BibleSearchModelArgs {
  /** 실행한 검색어 — URL ?q= 과 같은 값 */
  searchQuery: string
  /** 입력창에 치는 중인 글자 — 타이핑 제안·절 미리보기용 */
  searchKeyword: string
  scope: SearchScope
  /** 분포 칩으로 고른 책(서버 필터). null = 전체 */
  bookFilter: number | null
  language: string
  loggedIn: boolean
  t: BibleSearchModelLabels
}

const EMPTY_BOOKS: BibleBook[] = []

export const useBibleSearchModel = ({
  searchQuery,
  searchKeyword,
  scope,
  bookFilter,
  language,
  loggedIn,
  t,
}: BibleSearchModelArgs) => {
  const { data: allBooksData } = useBibleBooks()
  const allBooks = allBooksData ?? EMPTY_BOOKS

  const { trimmed: trimmedQuery, isChapterLike, isChoseong, localBookMatches } = useMemo(
    () => interpretQuery(allBooks, searchQuery),
    [allBooks, searchQuery]
  )

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
    isChoseong ? '' : searchQuery,
    scope === 'ALL' ? undefined : scope,
    bookFilter ?? undefined
  )
  // 검색어가 사전 표제어("바리새인", "삼위일체")면 결과 위에 뜻풀이 카드 — 사전은 한국어라 ko 에서만
  const glossaryEntry = useGlossaryEntry(language === 'ko' ? searchQuery : '')

  // 메타(책·장 검색 여부 등)는 첫 페이지에만 담겨 오고, 절은 모든 페이지를 이어붙인다
  const searchResults = searchPages?.pages[0]
  const loadedVerses: BibleVerse[] = useMemo(
    () => searchPages?.pages.flatMap(p => p.results) ?? [],
    [searchPages]
  )

  const backendIsBookSearch = isBackendBookSearch(searchResults)

  // 사건·지명 로컬 색인 — 숫자 없는 검색어에서만, 책 이름이 잡히면(책 카드가 답) 쓰지 않는다
  const localEligible = isLocalIndexEligible({ language, trimmed: trimmedQuery, isChapterLike, localBookMatches })
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

  const fuzzyBook = pickFuzzyBook({
    books: allBooks,
    trimmed: trimmedQuery,
    isChapterLike,
    localBookMatches,
    backendIsBookSearch,
    hasLocal,
    hasGlossary: !!glossaryEntry,
    result: searchResults,
    stale: searchStale,
    loadedVerseCount: loadedVerses.length,
  })

  const booksToShow: BookCard[] = pickBooksToShow({ localBookMatches, result: searchResults, fuzzyBook })

  const scopeFilter = useMemo(() => buildScopeFilter(allBooks, scope), [allBooks, scope])
  const scopedBooks = filterBooksByScope(booksToShow, scope)
  // 카드에 얹을 장별 진행률·표시 장 — 결과의 책 전부를 한 요청으로 받아 카드별로 나눠 준다
  // (쿼리 키는 책 번호를 정렬해 이어 붙인 문자열이라 배열 참조가 바뀌어도 재요청하지 않는다)
  const { data: cardContexts } = useBookCardContexts(scopedBooks.map(b => b.book_number), loggedIn)
  const scopedVerses = filterVersesByScope(loadedVerses, searchResults, scopeFilter)
  const shownTotal = countShownTotal(searchResults, scopedVerses.length)

  const hasAnyResult = booksToShow.length > 0 || loadedVerses.length > 0
  const queryTooShort = isQueryTooShort(trimmedQuery)
  const resultsHeading = formatResultsHeading(searchResults, shownTotal, t)
  const noticeText = formatNotice(searchResults, t)
  const { bookCounts, total: bookCountsTotal, showChips: showBookChips } = buildBookDistribution(
    searchResults,
    bookFilter
  )

  // 타이핑 중 책 제안 — Enter 전에 "고린" → 고린도전서·후서, "고전 13" → 고린도전서 13장.
  // 로컬 책 목록만 보므로 요청이 없다
  const suggestion = suggestTypeahead(allBooks, searchKeyword, searchQuery)
  const typeahead: { label: string; query: string }[] =
    suggestion?.kind === 'chapter'
      ? [
          {
            label: t.chapterSuggestion(suggestion.book.book_name_ko, suggestion.chapter),
            query: `${suggestion.book.book_name_ko} ${suggestion.chapter}`,
          },
        ]
      : suggestion?.kind === 'books'
        ? suggestion.books.map(b => ({ label: b.book_name_ko, query: b.book_name_ko }))
        : []

  // 절 바로 가기 — "요 3:1"까지 치면 그 장의 3:1·3:10~19 를 본문 첫머리와 함께 미리 보여 준다.
  // 장 본문은 읽기 화면과 같은 캐시 칸이라, 한 번 받은 장은 다시 묻지 않는다
  const verseTyping = parseVerseTyping(allBooks, searchKeyword, searchQuery)
  const previewBook = verseTyping?.book
  const previewCh = verseTyping?.chapter ?? 0
  const { data: previewChapter } = useBibleChapter(previewBook?.book_number ?? 0, previewCh, !!verseTyping)
  const versePreview =
    verseTyping && previewChapter
      ? previewChapter.verses
          .filter(v => !v.merged_into && String(v.verse).startsWith(verseTyping.versePrefix))
          .slice(0, 5)
      : []

  // 키워드 검색 결과에서 매칭 단어 강조 — "왜 이 절이 걸렸는지"가 훑기만 해도 보이게.
  // 여러 단어 AND 검색은 단어별로 각각 칠한다. 장 검색(창 1)은 키워드가 없으므로 제외.
  const highlightPattern = buildHighlightPattern(trimmedQuery, !!searchResults?.is_chapter_search)

  // 통합 결과 배치
  const topEvent = !glossaryEntry && eventHits?.exact ? events[0] : undefined
  const previewEvents = topEvent ? events.slice(1) : events
  // 사건·지명을 절보다 위에 세우는 건 고유명사일 때만 — 사전의 인물·지명·칭호(모세·다윗·바로),
  // 사건 이름 그 자체(십계명), 지도 장소(여리고). "은혜"처럼 제목 머리에 흔한 낱말은 절이 먼저다
  const properNoun = !!glossaryEntry && ['person', 'place', 'title'].includes(glossaryEntry.type)
  const strongLocal = !!(eventHits?.exact || placeHits?.strong || (properNoun && eventHits?.strong))
  // 책별 묶음은 여러 책에 걸친 키워드 검색에서만 — 책 하나로 좁혔으면 목록이 곧 그 책이다
  const canGroup = !!searchResults && !searchResults.is_chapter_search && bookCounts.length > 1 && bookFilter === null

  // 장·절 검색의 책 이름 오타("요한복은 3") — 결과가 없을 때 고친 검색어를 제안한다
  const didYouMean =
    isChapterLike && searchResults && loadedVerses.length === 0 ? suggestDidYouMean(allBooks, trimmedQuery) : null

  return {
    // 서버 질의 상태
    searchLoading,
    searchError,
    refetchSearch,
    searchStale,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    // 원자료
    allBooks,
    searchResults,
    loadedVerses,
    glossaryEntry,
    cardContexts,
    // 해석
    trimmedQuery,
    isChapterLike,
    eventHits,
    placeHits,
    events,
    places,
    hasLocal,
    situationMatch,
    fuzzyBook,
    // 결과 정리
    booksToShow,
    scopedBooks,
    scopedVerses,
    nameByNumber: scopeFilter.nameByNumber,
    shownTotal,
    hasAnyResult,
    queryTooShort,
    resultsHeading,
    noticeText,
    bookCounts,
    bookCountsTotal,
    showBookChips,
    // 타이핑 중
    typeahead,
    previewBook,
    previewCh,
    versePreview,
    highlightPattern,
    // 배치
    topEvent,
    previewEvents,
    strongLocal,
    canGroup,
    didYouMean,
  }
}
