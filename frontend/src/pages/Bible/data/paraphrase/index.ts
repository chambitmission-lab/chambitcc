import type { BookParaphrase } from './types'

export type { BookParaphrase, ChapterParaphrase } from './types'

// 책별로 코드 분할 — 읽는 책의 풀이만 내려받는다. 아직 모든 책이 채워진 건 아니라
// 파일이 있는 책만 glob 으로 잡는다: bookNN.ts 를 추가하면 코드 수정 없이 바로 켜진다.
const modules = import.meta.glob<{ default: BookParaphrase }>('./book[0-9][0-9].ts')

const loaders = new Map<number, () => Promise<{ default: BookParaphrase }>>()
for (const [path, load] of Object.entries(modules)) {
  const m = path.match(/book(\d+)\.ts$/)
  if (m) loaders.set(Number(m[1]), load)
}

const cache = new Map<number, BookParaphrase>()

export const hasParaphrase = (bookNumber: number) => loaders.has(bookNumber)

/** 이미 내려받은 책이면 동기로 — 장 이동 시 풀이 버튼이 한 프레임 비는 깜빡임 방지 */
export const peekBookParaphrase = (bookNumber: number): BookParaphrase | null => cache.get(bookNumber) ?? null

export const loadBookParaphrase = async (bookNumber: number): Promise<BookParaphrase | null> => {
  const cached = cache.get(bookNumber)
  if (cached) return cached
  const loader = loaders.get(bookNumber)
  if (!loader) return null
  const mod = await loader()
  cache.set(bookNumber, mod.default)
  return mod.default
}
