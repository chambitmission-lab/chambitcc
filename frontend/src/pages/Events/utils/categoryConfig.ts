import type { EventCategory } from '../../../types/event'

export interface CategoryVisual {
  emoji: string
  // Tailwind gradient classes — purple/pink/fuchsia/rose 안에서만
  gradient: string
  // 좌측 4px 바, 칩 배경에 쓰는 단일 색
  accent: string
  // 칩 배경/링 (alpha)
  chipBg: string
  chipText: string
  // dot 인디케이터용
  dot: string
  // 달력 dot 네온 글로우 (다크 배경에서 시인성 확보)
  dotGlow: string
}

export const CATEGORY_VISUAL: Record<EventCategory, CategoryVisual> = {
  worship: {
    emoji: '🙏',
    gradient: 'from-purple-500 to-pink-500',
    accent: '#a855f7',
    chipBg: 'bg-purple-500/15',
    chipText: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-400',
    dotGlow: 'shadow-[0_0_6px_rgba(192,132,252,0.85)]',
  },
  meeting: {
    emoji: '☕',
    gradient: 'from-fuchsia-500 to-pink-500',
    accent: '#d946ef',
    chipBg: 'bg-fuchsia-500/15',
    chipText: 'text-fuchsia-700 dark:text-fuchsia-300',
    dot: 'bg-fuchsia-400',
    dotGlow: 'shadow-[0_0_6px_rgba(232,121,249,0.85)]',
  },
  service: {
    emoji: '🤝',
    gradient: 'from-purple-400 to-fuchsia-500',
    accent: '#c084fc',
    chipBg: 'bg-purple-400/15',
    chipText: 'text-purple-700 dark:text-purple-200',
    dot: 'bg-purple-300',
    dotGlow: 'shadow-[0_0_6px_rgba(216,180,254,0.85)]',
  },
  special: {
    emoji: '✨',
    gradient: 'from-pink-500 to-rose-500',
    accent: '#ec4899',
    chipBg: 'bg-pink-500/15',
    chipText: 'text-pink-700 dark:text-pink-300',
    dot: 'bg-pink-400',
    dotGlow: 'shadow-[0_0_6px_rgba(244,114,182,0.85)]',
  },
  education: {
    emoji: '📖',
    gradient: 'from-fuchsia-500 to-purple-500',
    accent: '#a855f7',
    chipBg: 'bg-fuchsia-500/15',
    chipText: 'text-fuchsia-700 dark:text-fuchsia-200',
    dot: 'bg-fuchsia-300',
    dotGlow: 'shadow-[0_0_6px_rgba(240,171,252,0.85)]',
  },
  other: {
    emoji: '📌',
    gradient: 'from-purple-500 to-purple-700',
    accent: '#9333ea',
    chipBg: 'bg-purple-500/15',
    chipText: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
    dotGlow: 'shadow-[0_0_6px_rgba(168,85,247,0.85)]',
  },
}

export const ALL_CATEGORIES: EventCategory[] = [
  'worship',
  'meeting',
  'service',
  'special',
  'education',
  'other',
]
