import type { BookBriefs } from './types'

export type { BookBriefs, ChapterBrief } from './types'

// 시가서·격언 모음처럼 서사가 아닌 책은 labels 를 함께 export 해 줄 이름을 바꾼다.
interface BriefModule {
  default: BookBriefs
  labels?: readonly [string, string, string]
}

// 책별로 코드 분할 — 읽는 책의 길잡이만 내려받는다 (chapterOutlines 와 같은 패턴).
// 콘텐츠는 권 단위로 점진 작성 중 — 아직 없는 책은 카드가 조용히 빠진다.
const loaders: Record<number, () => Promise<BriefModule>> = {
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

export const DEFAULT_BRIEF_LABELS = ['지금까지', '이 장에서', '눈여겨보기'] as const

export interface LoadedBriefs {
  briefs: BookBriefs
  labels: readonly [string, string, string]
  /** 서사형 책 여부 — 라벨을 커스텀한 책(시가·격언)은 "지난 이야기" 리캡이 무의미하다 */
  narrative: boolean
}

const cache = new Map<number, LoadedBriefs>()

export const hasChapterBriefs = (bookNumber: number) => bookNumber in loaders

export const loadBookBriefs = async (bookNumber: number): Promise<LoadedBriefs | null> => {
  const cached = cache.get(bookNumber)
  if (cached) return cached
  const loader = loaders[bookNumber]
  if (!loader) return null
  const mod = await loader()
  const loaded: LoadedBriefs = {
    briefs: mod.default,
    labels: mod.labels ?? DEFAULT_BRIEF_LABELS,
    narrative: !mod.labels,
  }
  cache.set(bookNumber, loaded)
  return loaded
}
