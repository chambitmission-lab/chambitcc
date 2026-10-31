import type { BibleBook } from '../../../../types/bible'
import { BOOK_ABBREV_KO } from '../../components/bibleBookAbbrev'
import { findFuzzyBook, isChoseongQuery, matchBooksByChoseong } from '../../components/search/bookFuzzy'

export type PickResult =
  | { kind: 'go'; book: BibleBook; chapter: number; verse?: number }
  | { kind: 'book'; book: BibleBook }
  | { kind: 'over'; book: BibleBook; chapter: number }
  | { kind: 'none' }

const squash = (s: string) => s.replace(/\s/g, '')

/** 책 이름 하나 찾기 — 약칭(요·삼상) → 전체 이름 → 앞글자 → 초성 → 한 글자 오타 순 */
const findBook = (books: BibleBook[], raw: string): BibleBook | null => {
  const q = squash(raw)
  if (!q) return null
  return (
    books.find((b) => BOOK_ABBREV_KO[b.book_number] === q) ??
    books.find((b) => squash(b.book_name_ko) === q) ??
    books.find((b) => squash(b.book_name_ko).startsWith(q)) ??
    (isChoseongQuery(q) ? (matchBooksByChoseong(books, q)[0] ?? null) : null) ??
    findFuzzyBook(books, q)
  )
}

/**
 * 필사 바로가기 입력 해석 — "시 23", "요 3:16", "요한복음 3장 16절", "창세기", "ㄹㅁㅅ 8".
 * 장이 없으면 그 책의 장 고르기로, 장이 넘치면 몇 장까지 있는지 알려 준다.
 */
export const parsePickRef = (books: BibleBook[], input: string): PickResult => {
  const s = input.trim()
  if (!s) return { kind: 'none' }
  const m = s.match(/^(.+?)\s*(\d+)\s*(?:장|편)?\s*(?:(?:[:.]|\s)\s*(\d+)\s*절?)?\s*$/)
  const book = findBook(books, m ? m[1] : s)
  if (!book) return { kind: 'none' }
  if (!m) return { kind: 'book', book }
  const chapter = Number(m[2])
  if (chapter < 1 || chapter > book.chapter_count) return { kind: 'over', book, chapter }
  const verse = m[3] ? Number(m[3]) : undefined
  return { kind: 'go', book, chapter, verse: verse && verse > 0 ? verse : undefined }
}
