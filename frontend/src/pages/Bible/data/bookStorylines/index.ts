import type { BookStoryline, StoryAct } from './types'

export type { BookStoryline, StoryAct, StoryScene } from './types'

// 책별로 코드 분할 — 읽는 책의 줄거리만 내려받는다 (chapterBriefs 와 같은 패턴).
// 콘텐츠는 권 단위로 점진 작성 — 아직 없는 책은 화면에서 조용히 빠진다.
const loaders: Record<number, () => Promise<{ default: BookStoryline }>> = {
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

/** 줄거리가 준비된 책인지 — 없는 책은 자리 표시자도 띄우지 않으려고 동기로 묻는다 */
export const hasBookStoryline = (bookNumber: number): boolean => bookNumber in loaders

const cache = new Map<number, BookStoryline>()

export const peekBookStoryline = (bookNumber: number): BookStoryline | null =>
  cache.get(bookNumber) ?? null

export const loadBookStoryline = async (bookNumber: number): Promise<BookStoryline | null> => {
  const cached = cache.get(bookNumber)
  if (cached) return cached
  const loader = loaders[bookNumber]
  if (!loader) return null
  const story = (await loader()).default
  cache.set(bookNumber, story)
  return story
}

/** 이 장이 속한 막의 순번(0부터). 범위 밖이면 -1 */
export const actIndexOf = (acts: StoryAct[], chapter: number): number =>
  acts.findIndex((a) => chapter >= a.from && chapter <= a.to)
