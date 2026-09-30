// 카드 공유에 곁들이는 말씀 링크 — 받은 사람이 카드를 보고 곧바로 그 절을 열 수 있게.
// 출처 문자열("시편 121:1-2", "에스겔 37:5,10")을 책 목록으로 되짚어 /b/책/장/절 링크를 만든다.

import type { BibleBook } from '../../../types/bible'
import { buildVerseLink } from '../components/verseCopy'

/** "5,10" · "1-3" · "16" → 절 번호 목록 */
const parseVerseSpec = (spec: string): number[] => {
  const nums: number[] = []
  for (const part of spec.split(',')) {
    const [a, b] = part.split('-').map((x) => parseInt(x.trim(), 10))
    if (!Number.isFinite(a)) continue
    const end = Number.isFinite(b) && b >= a ? Math.min(b, a + 200) : a
    for (let v = a; v <= end; v++) nums.push(v)
  }
  return nums
}

/** 출처를 풀 수 없으면(책 이름이 목록에 없음 등) null — 링크 없이 카드만 공유한다 */
export const verseLinkFromRef = (refLabel: string, books: BibleBook[] | undefined): string | null => {
  if (!books?.length) return null
  // 나누기 표시(" · 1/3")는 떼고 푼다
  const m = refLabel.replace(/\s*·\s*\d+\/\d+$/, '').match(/^(.*\S)\s+(\d+):([\d,\s-]+)$/)
  if (!m) return null
  const name = m[1].replace(/\s/g, '')
  const book = books.find((b) => b.book_name_ko.replace(/\s/g, '') === name)
  if (!book) return null
  const verses = parseVerseSpec(m[3])
  if (!verses.length) return null
  return buildVerseLink({
    bookNameKo: book.book_name_ko,
    bookNumber: book.book_number,
    chapter: Number(m[2]),
    verses: verses.map((verse) => ({ verse, text: '' })),
  })
}
