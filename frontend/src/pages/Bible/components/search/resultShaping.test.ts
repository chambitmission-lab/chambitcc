import { describe, expect, it } from 'vitest'
import type { BibleSearchResult, BibleVerse } from '../../../../types/bible'
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
import { TEST_BOOKS, bookByNumber } from './testBooks'

const verse = (book_number: number | undefined, chapter: number, v: number, book_name_ko = ''): BibleVerse => ({
  id: v,
  book_id: book_number ?? 0,
  book_name_ko,
  book_number,
  chapter,
  verse: v,
  text: `v${v}`,
})

const result = (over: Partial<BibleSearchResult> = {}): BibleSearchResult => ({ total: 0, results: [], ...over })

const KO_LABELS = {
  verseCount: (n: number) => `${n}절`,
  chapterRangeLabel: (book: string, c1: number, c2: number) => `${book} ${c1}-${c2}장`,
  chapterUnit: '장',
  resultsCount: (n: number) => `검색 결과 ${n}절`,
  noticeChapterOutOfRange: (book: string, ch: number, max: number) => `${book} ${ch}>${max}`,
  noticeVerseOutOfRange: (book: string, ch: number, max: number) => `${book} ${ch}:>${max}`,
  noticeRangeClamped: (book: string, c1: number, c2: number) => `${book} ${c1}-${c2}`,
}

const fuzzyBase = {
  books: TEST_BOOKS,
  trimmed: '요한복은',
  isChapterLike: false,
  localBookMatches: [],
  backendIsBookSearch: false,
  hasLocal: false,
  hasGlossary: false,
  result: result(),
  stale: false,
  loadedVerseCount: 0,
}

describe('isBackendBookSearch', () => {
  it('책 검색 플래그와 책 정보가 함께 있어야 참', () => {
    expect(isBackendBookSearch(undefined)).toBe(false)
    expect(isBackendBookSearch(result({ is_book_search: true }))).toBe(false)
    expect(isBackendBookSearch(result({ is_book_search: true, book: bookByNumber(1) }))).toBe(true)
    expect(isBackendBookSearch(result({ is_book_search: true, books: [bookByNumber(1)] }))).toBe(true)
  })
})

describe('isLocalIndexEligible', () => {
  it('한국어·두 글자 이상·숫자 없음·책 이름 안 잡힘일 때만', () => {
    const base = { language: 'ko', trimmed: '출애굽', isChapterLike: false, localBookMatches: [] }
    expect(isLocalIndexEligible(base)).toBe(true)
    expect(isLocalIndexEligible({ ...base, language: 'en' })).toBe(false)
    expect(isLocalIndexEligible({ ...base, trimmed: '출' })).toBe(false)
    expect(isLocalIndexEligible({ ...base, isChapterLike: true })).toBe(false)
    expect(isLocalIndexEligible({ ...base, localBookMatches: [bookByNumber(1)] })).toBe(false)
  })
})

describe('pickFuzzyBook', () => {
  it('아무것도 안 걸렸고 서버 결과도 비어 있을 때만 오타를 고친다', () => {
    expect(pickFuzzyBook(fuzzyBase)?.book_number).toBe(43)
  })

  it('책·사건·사전·절 중 하나라도 걸리면 고치지 않는다', () => {
    expect(pickFuzzyBook({ ...fuzzyBase, localBookMatches: [bookByNumber(43)] })).toBeNull()
    expect(pickFuzzyBook({ ...fuzzyBase, backendIsBookSearch: true })).toBeNull()
    expect(pickFuzzyBook({ ...fuzzyBase, hasLocal: true })).toBeNull()
    expect(pickFuzzyBook({ ...fuzzyBase, hasGlossary: true })).toBeNull()
    expect(pickFuzzyBook({ ...fuzzyBase, result: result({ total: 3 }) })).toBeNull()
    expect(pickFuzzyBook({ ...fuzzyBase, loadedVerseCount: 1 })).toBeNull()
  })

  it('결과가 아직 없거나 범위 전환 중이면 고치지 않는다', () => {
    expect(pickFuzzyBook({ ...fuzzyBase, result: undefined })).toBeNull()
    expect(pickFuzzyBook({ ...fuzzyBase, stale: true })).toBeNull()
  })

  it('장·절 검색은 여기서 고치지 않는다(didYouMean 몫)', () => {
    expect(pickFuzzyBook({ ...fuzzyBase, trimmed: '요한복은 3', isChapterLike: true })).toBeNull()
  })
})

describe('pickBooksToShow', () => {
  it('로컬 매칭이 있으면 그것이 전부', () => {
    const local = [bookByNumber(46), bookByNumber(47)]
    const r = result({ is_book_search: true, book: bookByNumber(46) })
    expect(pickBooksToShow({ localBookMatches: local, result: r, fuzzyBook: null })).toBe(local)
  })

  it('백엔드 책 검색은 books 우선, 없으면 book 한 권', () => {
    const b = bookByNumber(1)
    expect(pickBooksToShow({ localBookMatches: [], result: result({ is_book_search: true, books: [b] }), fuzzyBook: null })).toEqual([b])
    expect(pickBooksToShow({ localBookMatches: [], result: result({ is_book_search: true, book: b, books: [] }), fuzzyBook: null })).toEqual([b])
  })

  it('둘 다 없으면 오타 보정 한 권, 그것도 없으면 빈 목록', () => {
    expect(pickBooksToShow({ localBookMatches: [], result: result(), fuzzyBook: bookByNumber(43) })).toEqual([bookByNumber(43)])
    expect(pickBooksToShow({ localBookMatches: [], result: undefined, fuzzyBook: null })).toEqual([])
  })
})

describe('scope filtering', () => {
  it('ALL 은 전부 통과', () => {
    const f = buildScopeFilter(TEST_BOOKS, 'ALL')
    expect(f.matchesScope(1)).toBe(true)
    expect(f.matchesScope(undefined, undefined)).toBe(true)
  })

  it('book_number 로 신·구약을 가르고, 없으면 책 이름으로, 둘 다 모르면 표시를 유지한다', () => {
    const f = buildScopeFilter(TEST_BOOKS, 'NEW')
    expect(f.matchesScope(1)).toBe(false)
    expect(f.matchesScope(43)).toBe(true)
    expect(f.matchesScope(undefined, '창세기')).toBe(false)
    expect(f.matchesScope(undefined, '요한복음')).toBe(true)
    expect(f.matchesScope(999, '모르는책')).toBe(true)
  })

  it('nameByNumber 로 절의 책 이름을 복원한다', () => {
    expect(buildScopeFilter(TEST_BOOKS, 'ALL').nameByNumber.get(46)).toBe('고린도전서')
  })

  it('절에 book_number 가 없으면 응답의 책 번호를 쓴다', () => {
    const f = buildScopeFilter(TEST_BOOKS, 'OLD')
    const r = result({ is_chapter_search: true, book_number: 1 })
    const verses = [verse(undefined, 1, 1), verse(43, 3, 16)]
    expect(filterVersesByScope(verses, r, f).map(v => v.verse)).toEqual([1])
    expect(filterVersesByScope(verses, undefined, f)).toEqual([])
  })

  it('책 카드는 testament 로 거른다', () => {
    const cards = [bookByNumber(1), bookByNumber(43)]
    expect(filterBooksByScope(cards, 'ALL')).toBe(cards)
    expect(filterBooksByScope(cards, 'OLD').map(b => b.book_number)).toEqual([1])
  })
})

describe('countShownTotal / isQueryTooShort', () => {
  it('키워드 검색은 서버 total, 장 검색은 화면에 남은 절 수', () => {
    expect(countShownTotal(result({ total: 120 }), 5)).toBe(120)
    expect(countShownTotal(result({ is_chapter_search: true, total: 31 }), 5)).toBe(5)
    expect(countShownTotal(undefined, 5)).toBe(0)
  })

  it('한 글자만 너무 짧다', () => {
    expect(isQueryTooShort('')).toBe(false)
    expect(isQueryTooShort('창')).toBe(true)
    expect(isQueryTooShort('창세')).toBe(false)
  })
})

describe('formatResultsHeading', () => {
  it('절 검색은 참조만, 절 범위는 참조 + 절 수', () => {
    const base = { is_chapter_search: true, book_name_ko: '요한복음', chapter: 3 }
    expect(formatResultsHeading(result({ ...base, verse_start: 16 }), 1, KO_LABELS)).toBe('요한복음 3:16')
    expect(formatResultsHeading(result({ ...base, verse_start: 16, verse_end: 18 }), 3, KO_LABELS)).toBe('요한복음 3:16-18 · 3절')
  })

  it('장 범위·단일 장·키워드 검색', () => {
    const base = { is_chapter_search: true, book_name_ko: '창세기', chapter: 1 }
    expect(formatResultsHeading(result({ ...base, chapter_end: 3 }), 80, KO_LABELS)).toBe('창세기 1-3장 · 80절')
    expect(formatResultsHeading(result(base), 31, KO_LABELS)).toBe('창세기 1장 · 31절')
    expect(formatResultsHeading(result({ total: 12 }), 12, KO_LABELS)).toBe('검색 결과 12절')
    expect(formatResultsHeading(undefined, 0, KO_LABELS)).toBe('')
  })
})

describe('formatNotice', () => {
  it('안내 코드별 문구 — 필요한 숫자가 빠지면 null', () => {
    expect(formatNotice(result({ notice: 'chapter_out_of_range', book_name_ko: '룻기', chapter: 9, chapter_count: 4 }), KO_LABELS)).toBe('룻기 9>4')
    expect(formatNotice(result({ notice: 'verse_out_of_range', book_name_ko: '요한복음', chapter: 3, verse_count: 36 }), KO_LABELS)).toBe('요한복음 3:>36')
    expect(formatNotice(result({ notice: 'chapter_range_clamped', book_name_ko: '시편', chapter: 1, chapter_end: 10 }), KO_LABELS)).toBe('시편 1-10')
    expect(formatNotice(result({ notice: 'chapter_out_of_range', book_name_ko: '룻기', chapter: 9 }), KO_LABELS)).toBeNull()
    expect(formatNotice(result({ notice: 'chapter_out_of_range' }), KO_LABELS)).toBeNull()
    expect(formatNotice(undefined, KO_LABELS)).toBeNull()
  })
})

describe('buildBookDistribution', () => {
  const counts = [
    { book_number: 1, book_name_ko: '창세기', count: 2 },
    { book_number: 19, book_name_ko: '시편', count: 9 },
    { book_number: 43, book_name_ko: '요한복음', count: 5 },
  ]

  it('많은 순으로 정렬하고 합계를 센다', () => {
    const d = buildBookDistribution(result({ book_counts: counts }), null)
    expect(d.bookCounts.map(b => b.book_number)).toEqual([19, 43, 1])
    expect(d.total).toBe(16)
    expect(d.showChips).toBe(true)
  })

  it('원본 배열은 건드리지 않는다', () => {
    const copy = [...counts]
    buildBookDistribution(result({ book_counts: counts }), null)
    expect(counts).toEqual(copy)
  })

  it('한 권뿐이면 칩을 숨기되, 그 책으로 좁혀 둔 상태면 해제용으로 보인다', () => {
    const one = result({ book_counts: [counts[0]] })
    expect(buildBookDistribution(one, null).showChips).toBe(false)
    expect(buildBookDistribution(one, 1).showChips).toBe(true)
  })

  it('장 검색·응답 없음은 빈 분포', () => {
    expect(buildBookDistribution(result({ is_chapter_search: true, book_counts: counts }), null).bookCounts).toEqual([])
    expect(buildBookDistribution(undefined, null)).toEqual({ bookCounts: [], total: 0, showChips: false })
  })
})
