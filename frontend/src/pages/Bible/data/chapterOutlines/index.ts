import type { BookOutline } from './types'

export type { BookOutline, OutlineSection } from './types'

// 책별로 코드 분할 — 읽는 책의 개요만 내려받는다.
const loaders: Record<number, () => Promise<{ default: BookOutline }>> = {
  1: () => import('./book01'),
  2: () => import('./book02'),
  3: () => import('./book03'),
  4: () => import('./book04'),
  5: () => import('./book05'),
  6: () => import('./book06'),
  7: () => import('./book07'),
  8: () => import('./book08'),
  9: () => import('./book09'),
  10: () => import('./book10'),
  11: () => import('./book11'),
  12: () => import('./book12'),
  13: () => import('./book13'),
  14: () => import('./book14'),
  15: () => import('./book15'),
  16: () => import('./book16'),
  17: () => import('./book17'),
  18: () => import('./book18'),
  19: () => import('./book19'),
  20: () => import('./book20'),
  21: () => import('./book21'),
  22: () => import('./book22'),
  23: () => import('./book23'),
  24: () => import('./book24'),
  25: () => import('./book25'),
  26: () => import('./book26'),
  27: () => import('./book27'),
  28: () => import('./book28'),
  29: () => import('./book29'),
  30: () => import('./book30'),
  31: () => import('./book31'),
  32: () => import('./book32'),
  33: () => import('./book33'),
  34: () => import('./book34'),
  35: () => import('./book35'),
  36: () => import('./book36'),
  37: () => import('./book37'),
  38: () => import('./book38'),
  39: () => import('./book39'),
  40: () => import('./book40'),
  41: () => import('./book41'),
  42: () => import('./book42'),
  43: () => import('./book43'),
  44: () => import('./book44'),
  45: () => import('./book45'),
  46: () => import('./book46'),
  47: () => import('./book47'),
  48: () => import('./book48'),
  49: () => import('./book49'),
  50: () => import('./book50'),
  51: () => import('./book51'),
  52: () => import('./book52'),
  53: () => import('./book53'),
  54: () => import('./book54'),
  55: () => import('./book55'),
  56: () => import('./book56'),
  57: () => import('./book57'),
  58: () => import('./book58'),
  59: () => import('./book59'),
  60: () => import('./book60'),
  61: () => import('./book61'),
  62: () => import('./book62'),
  63: () => import('./book63'),
  64: () => import('./book64'),
  65: () => import('./book65'),
  66: () => import('./book66'),
}

const cache = new Map<number, BookOutline>()

export const hasChapterOutline = (bookNumber: number) => bookNumber in loaders

/** 이미 내려받은 책이면 동기로 돌려준다 — 장 이동 시 단락 제목이 한 프레임 비는 깜빡임 방지 */
export const peekBookOutline = (bookNumber: number): BookOutline | null =>
  cache.get(bookNumber) ?? null

export const loadBookOutline = async (bookNumber: number): Promise<BookOutline | null> => {
  const cached = cache.get(bookNumber)
  if (cached) return cached
  const loader = loaders[bookNumber]
  if (!loader) return null
  const mod = await loader()
  cache.set(bookNumber, mod.default)
  return mod.default
}
