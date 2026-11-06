// 검색 결과 정리 — 서버 응답·로컬 책 매칭·범위 필터를 합쳐 화면이 그릴 값으로 바꾼다.
// 어느 책 카드를 보일지, 어떤 절을 남길지, 헤딩·안내 문구·분포 칩을 어떻게 셀지의 단일 출처.
// React 를 모르는 순수 함수라 BibleSearch 밖에서 그대로 테스트한다.

import type { BibleBook, BibleSearchResult, BibleVerse, BookMatchCount } from '../../../../types/bible'
import type { BookCard } from '../SearchBookCard'
import { findFuzzyBook } from './bookFuzzy'

export type SearchScope = 'ALL' | 'OLD' | 'NEW'

/** 백엔드가 책 검색으로 인식했고 책 정보를 함께 보냈는가 */
export const isBackendBookSearch = (result: BibleSearchResult | undefined): boolean =>
  !!(result?.is_book_search && (result.books?.length || result.book))

/** 사건·지명·상황 같은 로컬 색인을 쓸 조건 — 한국어·두 글자 이상·숫자 없음·책 이름이 안 잡힘 */
export const isLocalIndexEligible = (args: {
  language: string
  trimmed: string
  isChapterLike: boolean
  localBookMatches: readonly unknown[]
}): boolean =>
  args.language === 'ko' && args.trimmed.length >= 2 && !args.isChapterLike && args.localBookMatches.length === 0

export interface FuzzyFallbackArgs {
  books: BibleBook[]
  trimmed: string
  isChapterLike: boolean
  localBookMatches: readonly unknown[]
  backendIsBookSearch: boolean
  /** 사건·지명 로컬 결과가 하나라도 있는가 */
  hasLocal: boolean
  /** 사전 표제어 카드가 뜨는가 */
  hasGlossary: boolean
  result: BibleSearchResult | undefined
  /** 범위 전환 중 이전 결과를 붙들고 있는 상태 */
  stale: boolean
  loadedVerseCount: number
}

/**
 * 한 글자 오타 보정 — 책 이름도, 본문 낱말도, 사건도, 사전도 아무것도 안 걸렸을 때만
 * 책 이름에 가깝게 고쳐 본다. 결과가 아직 안 왔거나 바뀌는 중이면 고치지 않는다.
 */
export const pickFuzzyBook = (a: FuzzyFallbackArgs): BibleBook | null =>
  a.trimmed &&
  !a.isChapterLike &&
  a.localBookMatches.length === 0 &&
  !a.backendIsBookSearch &&
  !a.hasLocal &&
  !a.hasGlossary &&
  a.result &&
  !a.stale &&
  (a.result.total ?? 0) === 0 &&
  a.loadedVerseCount === 0
    ? findFuzzyBook(a.books, a.trimmed)
    : null

/**
 * 책 카드로 보일 책 — 로컬 매칭이 우선(누락 없이 전부), 없으면 백엔드 책 응답, 없으면 오타 보정 한 권.
 */
export const pickBooksToShow = (args: {
  localBookMatches: BibleBook[]
  result: BibleSearchResult | undefined
  fuzzyBook: BibleBook | null
}): BookCard[] => {
  const { localBookMatches, result, fuzzyBook } = args
  if (localBookMatches.length > 0) return localBookMatches
  if (isBackendBookSearch(result)) {
    if (result!.books && result!.books.length > 0) return result!.books
    return result!.book ? [result!.book] : []
  }
  return fuzzyBook ? [fuzzyBook] : []
}

export interface ScopeFilter {
  /** 구절의 book_number(없으면 책 이름)로 신·구약 판별 — 판별 불가면 표시를 유지한다 */
  matchesScope: (bookNumber?: number | null, bookNameKo?: string) => boolean
  /** 키워드 검색 응답의 절 객체에는 책 이름이 없다(book_number만) → 책 목록으로 이름을 복원 */
  nameByNumber: Map<number, string>
}

export const buildScopeFilter = (books: BibleBook[], scope: SearchScope): ScopeFilter => {
  const testamentByNumber = new Map(books.map(b => [b.book_number, b.testament]))
  const testamentByName = new Map(books.map(b => [b.book_name_ko, b.testament]))
  const nameByNumber = new Map(books.map(b => [b.book_number, b.book_name_ko]))
  const matchesScope = (bookNumber?: number | null, bookNameKo?: string) => {
    if (scope === 'ALL') return true
    const testament =
      (bookNumber != null ? testamentByNumber.get(bookNumber) : undefined) ??
      (bookNameKo ? testamentByName.get(bookNameKo) : undefined)
    return testament ? testament === scope : true
  }
  return { matchesScope, nameByNumber }
}

export const filterBooksByScope = (books: BookCard[], scope: SearchScope): BookCard[] =>
  scope === 'ALL' ? books : books.filter(b => b.testament === scope)

/**
 * 구약/신약 범위 거르기 — 키워드 검색은 서버가 이미 걸러서 보내고, 장 검색 결과(페이징 대상 아님)만
 * 여기서 거른다. 절에 book_number 가 없으면 응답의 책 번호를 쓴다.
 */
export const filterVersesByScope = (
  verses: BibleVerse[],
  result: BibleSearchResult | undefined,
  filter: ScopeFilter
): BibleVerse[] =>
  result ? verses.filter(v => filter.matchesScope(v.book_number ?? result.book_number, v.book_name_ko)) : []

/** 키워드 검색의 total 은 서버가 센 전체 매칭 수(범위 필터 반영). 장 검색만 화면에 남은 절 수 */
export const countShownTotal = (result: BibleSearchResult | undefined, scopedVerseCount: number): number =>
  result?.is_chapter_search ? scopedVerseCount : (result?.total ?? 0)

/** 백엔드가 2글자 미만을 422로 막아 요청 자체를 안 보낸다 — "결과 없음"이 아니라 안내로 분기 */
export const isQueryTooShort = (trimmed: string): boolean => trimmed.length > 0 && trimmed.length < 2

export interface HeadingLabels {
  verseCount: (n: number) => string
  chapterRangeLabel: (book: string, c1: number, c2: number) => string
  chapterUnit: string
  resultsCount: (n: number) => string
}

/** 결과 헤딩 — 장/절/범위 검색은 참조 표기, 키워드 검색은 건수 */
export const formatResultsHeading = (
  result: BibleSearchResult | undefined,
  shownTotal: number,
  t: HeadingLabels
): string => {
  if (!result) return ''
  if (result.is_chapter_search && result.book_name_ko && result.chapter) {
    const book = result.book_name_ko
    const ch = result.chapter
    if (result.verse_start) {
      const ref = `${book} ${ch}:${result.verse_start}${result.verse_end ? `-${result.verse_end}` : ''}`
      return result.verse_end ? `${ref} · ${t.verseCount(shownTotal)}` : ref
    }
    if (result.chapter_end) {
      return `${t.chapterRangeLabel(book, ch, result.chapter_end)} · ${t.verseCount(shownTotal)}`
    }
    return `${book} ${ch}${t.chapterUnit} · ${t.verseCount(shownTotal)}`
  }
  return t.resultsCount(shownTotal)
}

export interface NoticeLabels {
  noticeChapterOutOfRange: (book: string, ch: number, max: number) => string
  noticeVerseOutOfRange: (book: string, ch: number, max: number) => string
  noticeRangeClamped: (book: string, c1: number, c2: number) => string
}

/** 서버 안내 코드 → 문구. 책 카드 위(장 초과) 또는 결과 위(절 초과·범위 축소)에 띄운다 */
export const formatNotice = (result: BibleSearchResult | undefined, t: NoticeLabels): string | null => {
  const r = result
  if (!r?.notice || !r.book_name_ko) return null
  if (r.notice === 'chapter_out_of_range' && r.chapter && r.chapter_count)
    return t.noticeChapterOutOfRange(r.book_name_ko, r.chapter, r.chapter_count)
  if (r.notice === 'verse_out_of_range' && r.chapter && r.verse_count)
    return t.noticeVerseOutOfRange(r.book_name_ko, r.chapter, r.verse_count)
  if (r.notice === 'chapter_range_clamped' && r.chapter && r.chapter_end)
    return t.noticeRangeClamped(r.book_name_ko, r.chapter, r.chapter_end)
  return null
}

export interface BookDistribution {
  /** 많은 순 — "어디에 몰려 있는지"가 먼저 읽히게 */
  bookCounts: BookMatchCount[]
  total: number
  /** 칩을 보일지 — 두 권 이상이거나, 한 권으로 좁혀 둔 상태(해제 칩이 필요) */
  showChips: boolean
}

/**
 * 책별 분포 칩 — 키워드 검색에서만. 책 하나를 골라도 서버가 전체 분포를 계속 주므로 칩 개수는 흔들리지 않는다.
 */
export const buildBookDistribution = (
  result: BibleSearchResult | undefined,
  bookFilter: number | null
): BookDistribution => {
  const bookCounts = result?.is_chapter_search
    ? []
    : [...(result?.book_counts ?? [])].sort((a, b) => b.count - a.count)
  const total = bookCounts.reduce((n, b) => n + b.count, 0)
  const showChips = bookCounts.length > 1 || (bookFilter !== null && bookCounts.length > 0)
  return { bookCounts, total, showChips }
}
