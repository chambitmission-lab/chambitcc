// 검색어 해석 — 입력 문자열과 66권 책 목록만으로 "이 검색어가 무엇을 뜻하는지"를 판단한다.
// React·서버 응답과 무관한 순수 함수라 BibleSearch 화면 밖에서 그대로 테스트한다.
//
// 분기 규칙(모두 BibleSearch 가 원래 쓰던 것 그대로):
// - 숫자가 있으면 장·절 검색("창 1", "요 3:16") — 책 이름 매칭을 하지 않는다
// - 초성("ㄱㄹㄷㅈㅅ")은 본문에 없는 글자라 책 이름 앞글자만 본다
// - 그 외엔 약칭(고전·요일·1Co) 정확 일치 또는 책 이름(한·영) 부분일치

import type { BibleBook } from '../../../../types/bible'
import { BOOK_ABBREV_EN, BOOK_ABBREV_KO } from '../bibleBookAbbrev'
import { findFuzzyBook, isChoseongQuery, matchBooksByChoseong } from './bookFuzzy'

/** 공백 제거 + 소문자 — 책 이름·약칭 비교의 공통 정규화 */
export const normalizeQuery = (s: string): string => s.replace(/\s/g, '').toLowerCase()

/** 약칭 정확 일치 또는 책 이름(한·영) 부분일치 — `trimmed` 는 원문(약칭은 대소문자·공백 그대로 비교) */
export const matchesBookQuery = (book: BibleBook, trimmed: string, normalized: string): boolean =>
  BOOK_ABBREV_KO[book.book_number] === trimmed ||
  BOOK_ABBREV_EN[book.book_number]?.toLowerCase() === normalized ||
  normalizeQuery(book.book_name_ko).includes(normalized) ||
  normalizeQuery(book.book_name_en).includes(normalized)

export interface QueryInterpretation {
  /** 앞뒤 공백을 뗀 검색어 — 화면·요청에 쓰는 원문 */
  trimmed: string
  /** 공백 제거·소문자 */
  normalized: string
  /** 숫자가 섞여 있으면 장·절 검색 */
  isChapterLike: boolean
  /** 초성만으로 된 검색어 — 서버에 묻지 않는다 */
  isChoseong: boolean
  /** 로컬 책 목록에서 잡힌 책 — "고린" → 고린도전서·후서 */
  localBookMatches: BibleBook[]
}

export const interpretQuery = (books: BibleBook[], query: string): QueryInterpretation => {
  const trimmed = query.trim()
  const normalized = normalizeQuery(trimmed)
  const isChapterLike = /\d/.test(trimmed)
  const isChoseong = isChoseongQuery(trimmed)
  const localBookMatches =
    trimmed && !isChapterLike
      ? isChoseong
        ? matchBooksByChoseong(books, trimmed)
        : books.filter(b => matchesBookQuery(b, trimmed, normalized))
      : []
  return { trimmed, normalized, isChapterLike, isChoseong, localBookMatches }
}

/**
 * 책 이름 하나를 책으로 — 정확 일치 → 약칭 → 앞글자 순.
 * 타이핑 중 "고전 13" 의 "고전", 절 미리보기 "요 3:1" 의 "요" 를 푼다.
 */
export const resolveBookLocal = (books: BibleBook[], name: string): BibleBook | undefined => {
  const n = normalizeQuery(name)
  if (!n) return undefined
  return (
    books.find(b => normalizeQuery(b.book_name_ko) === n || normalizeQuery(b.book_name_en) === n) ??
    books.find(
      b => BOOK_ABBREV_KO[b.book_number] === name.trim() || BOOK_ABBREV_EN[b.book_number]?.toLowerCase() === n
    ) ??
    books.find(b => normalizeQuery(b.book_name_ko).startsWith(n) || normalizeQuery(b.book_name_en).startsWith(n))
  )
}

export type TypeaheadSuggestion =
  /** "고전 13" → 고린도전서 13장 하나 */
  | { kind: 'chapter'; book: BibleBook; chapter: number }
  /** "고린" → 고린도전서·후서 … 최대 6권 */
  | { kind: 'books'; books: BibleBook[] }

const TYPEAHEAD_MAX_BOOKS = 6

/**
 * 타이핑 중 책 제안 — Enter 전에 보여 주는 바로 가기.
 * 실행한 검색어와 같으면(이미 결과가 떠 있으면) 제안하지 않는다.
 * 절까지 입력 중("요 3:")이면 절 미리보기가 맡으므로 비운다.
 */
export const suggestTypeahead = (
  books: BibleBook[],
  typed: string,
  executedQuery: string
): TypeaheadSuggestion | null => {
  const typedRaw = typed.trim()
  if (!typedRaw || typedRaw === executedQuery || books.length === 0) return null
  const chapterMatch = typedRaw.match(/^(.+?)\s*(\d+)\s*(?:장|편)?\s*(?:[:.]\s*\d*)?$/)
  if (chapterMatch) {
    const book = resolveBookLocal(books, chapterMatch[1])
    const ch = Number(chapterMatch[2])
    if (!book || ch < 1 || ch > book.chapter_count) return null
    if (/[:.]/.test(typedRaw)) return null
    return { kind: 'chapter', book, chapter: ch }
  }
  if (/\d/.test(typedRaw)) return null
  const n = normalizeQuery(typedRaw)
  const matched = books.filter(b => matchesBookQuery(b, typedRaw, n)).slice(0, TYPEAHEAD_MAX_BOOKS)
  return matched.length > 0 ? { kind: 'books', books: matched } : null
}

export interface VerseTyping {
  book: BibleBook
  chapter: number
  /** 절 번호 입력 중인 앞자리 — "" 이면 아직 절을 안 쳤다 */
  versePrefix: string
}

/** 절 바로 가기 — "요 3:1" 까지 쳤을 때 미리 보여 줄 책·장·절 앞자리. 장 범위를 벗어나면 null */
export const parseVerseTyping = (books: BibleBook[], typed: string, executedQuery: string): VerseTyping | null => {
  const typedRaw = typed.trim()
  if (!typedRaw || typedRaw === executedQuery) return null
  const m = typedRaw.match(/^(.+?)\s*(\d+)\s*(?:장)?\s*[:.]\s*(\d*)$/)
  if (!m) return null
  const book = resolveBookLocal(books, m[1])
  const chapter = Number(m[2])
  if (!book || chapter < 1 || chapter > book.chapter_count) return null
  return { book, chapter, versePrefix: m[3] }
}

/**
 * 장·절 검색의 책 이름 오타("요한복은 3") — 결과가 비었을 때 고친 검색어를 제안한다.
 * 책 이름이 정상적으로 풀리면(결과가 비어도) 오타가 아니므로 제안하지 않는다.
 */
export const suggestDidYouMean = (books: BibleBook[], trimmed: string): string | null => {
  const m = trimmed.match(/^(.+?)\s*(\d.*)$/)
  if (!m || resolveBookLocal(books, m[1])) return null
  const b = findFuzzyBook(books, m[1])
  return b ? `${b.book_name_ko} ${m[2]}` : null
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * 키워드 검색 결과의 매칭 단어 강조 패턴 — 백엔드가 공백·쉼표 모두로 토큰을 나누므로
 * ("주,그리스도") 같은 규칙으로 잘라야 강조가 빠지지 않는다. 장 검색은 키워드가 없어 null.
 */
export const buildHighlightPattern = (trimmed: string, isChapterSearch: boolean): RegExp | null => {
  if (!trimmed || isChapterSearch) return null
  const tokens = [...new Set(trimmed.split(/[,\s]+/).filter(Boolean))]
  return tokens.length > 0 ? new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi') : null
}
