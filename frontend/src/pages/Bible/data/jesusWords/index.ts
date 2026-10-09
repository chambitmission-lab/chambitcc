import type { BookJesusWords } from './types'

export type { BookJesusWords, JesusWordsItem } from './types'

// 예수님 말씀이 나오는 책만 — 사복음서·사도행전(승천·다메섹)·요한계시록(일곱 교회 등)
const loaders: Record<number, () => Promise<{ default: BookJesusWords }>> = {
  40: () => import('./book40'),
  41: () => import('./book41'),
  42: () => import('./book42'),
  43: () => import('./book43'),
  44: () => import('./book44'),
  66: () => import('./book66'),
}

/** 절 번호 → 'all'(절 전체) 또는 어절 구간 목록 */
export type ChapterJesusWords = Map<number, 'all' | [number, number][]>

const bookCache = new Map<number, BookJesusWords>()
const chapterCache = new Map<string, ChapterJesusWords>()
const pending = new Map<number, Promise<void>>()

export const hasJesusWords = (bookNumber: number) => bookNumber in loaders

export const isJesusWordsReady = (bookNumber: number) => !hasJesusWords(bookNumber) || bookCache.has(bookNumber)

export const loadJesusWords = (bookNumber: number): Promise<void> => {
  const loader = loaders[bookNumber]
  if (!loader || bookCache.has(bookNumber)) return Promise.resolve()
  let p = pending.get(bookNumber)
  if (!p) {
    p = loader().then((mod) => {
      bookCache.set(bookNumber, mod.default)
    })
    pending.set(bookNumber, p)
  }
  return p
}

/** 내려받은 책이면 장 색인을 펼쳐 돌려준다 (장마다 한 번만 펼친다) */
export const getChapterJesusWords = (bookNumber: number, chapter: number): ChapterJesusWords | null => {
  const book = bookCache.get(bookNumber)
  if (!book) return null
  const key = `${bookNumber}:${chapter}`
  const cached = chapterCache.get(key)
  if (cached) return cached
  const map: ChapterJesusWords = new Map()
  for (const item of book[chapter] ?? []) {
    if (typeof item === 'string') {
      const [a, b = a] = item.split('-').map(Number)
      for (let v = a; v <= b; v++) map.set(v, 'all')
    } else {
      const [v, from, to] = item
      const prev = map.get(v)
      if (prev === 'all') continue
      map.set(v, [...(prev ?? []), [from, to]])
    }
  }
  chapterCache.set(key, map)
  return map
}

/** 어절 구간 → 본문 글자 구간. 본문이 수정돼 어절 수가 줄었으면 남은 만큼만 */
export const wordRangesToText = (text: string, ranges: [number, number][]): { start: number; end: number }[] => {
  const tokens: { start: number; end: number }[] = []
  const re = /\S+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) tokens.push({ start: m.index, end: m.index + m[0].length })
  const out: { start: number; end: number }[] = []
  for (const [from, to] of ranges) {
    const last = Math.min(to, tokens.length) - 1
    if (from > last) continue
    out.push({ start: tokens[from].start, end: tokens[last].end })
  }
  return out
}
