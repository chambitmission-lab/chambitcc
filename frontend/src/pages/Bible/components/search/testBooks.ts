// 테스트용 책 목록 — 실제 66권 중 이름 매칭 분기를 가르는 데 필요한 권만 골랐다.
// (약칭 겹침: 요/요일/요이, 부분일치: 고린도전서·후서, 사무엘상·하)

import type { BibleBook } from '../../../../types/bible'

const book = (
  book_number: number,
  book_name_ko: string,
  book_name_en: string,
  testament: 'OLD' | 'NEW',
  chapter_count: number
): BibleBook => ({ id: book_number, book_number, book_name_ko, book_name_en, testament, chapter_count })

export const TEST_BOOKS: BibleBook[] = [
  book(1, '창세기', 'Genesis', 'OLD', 50),
  book(9, '사무엘상', '1 Samuel', 'OLD', 31),
  book(10, '사무엘하', '2 Samuel', 'OLD', 24),
  book(19, '시편', 'Psalms', 'OLD', 150),
  book(40, '마태복음', 'Matthew', 'NEW', 28),
  book(43, '요한복음', 'John', 'NEW', 21),
  book(46, '고린도전서', '1 Corinthians', 'NEW', 16),
  book(47, '고린도후서', '2 Corinthians', 'NEW', 13),
  book(62, '요한일서', '1 John', 'NEW', 5),
  book(63, '요한이서', '2 John', 'NEW', 1),
  book(66, '요한계시록', 'Revelation', 'NEW', 22),
]

export const bookByNumber = (n: number): BibleBook => {
  const b = TEST_BOOKS.find(x => x.book_number === n)
  if (!b) throw new Error(`test book ${n} missing`)
  return b
}
