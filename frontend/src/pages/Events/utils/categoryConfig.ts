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
}

export const CATEGORY_VISUAL: Record<EventCategory, CategoryVisual> = {
  worship: {
    emoji: '🙏',
    gradient: 'from-purple-500 to-pink-500',
    accent: '#a855f7',
    chipBg: 'bg-purple-500/15',
    chipText: 'text-purple-300',
    dot: 'bg-purple-400',
  },
  meeting: {
    emoji: '☕',
    gradient: 'from-fuchsia-500 to-pink-500',
    accent: '#d946ef',
    chipBg: 'bg-fuchsia-500/15',
    chipText: 'text-fuchsia-300',
    dot: 'bg-fuchsia-400',
  },
  service: {
    emoji: '🤝',
    gradient: 'from-purple-400 to-fuchsia-500',
    accent: '#c084fc',
    chipBg: 'bg-purple-400/15',
    chipText: 'text-purple-200',
    dot: 'bg-purple-300',
  },
  special: {
    emoji: '✨',
    gradient: 'from-pink-500 to-rose-500',
    accent: '#ec4899',
    chipBg: 'bg-pink-500/15',
    chipText: 'text-pink-300',
    dot: 'bg-pink-400',
  },
  education: {
    emoji: '📖',
    gradient: 'from-fuchsia-500 to-purple-500',
    accent: '#a855f7',
    chipBg: 'bg-fuchsia-500/15',
    chipText: 'text-fuchsia-200',
    dot: 'bg-fuchsia-300',
  },
  other: {
    emoji: '📌',
    gradient: 'from-purple-500 to-purple-700',
    accent: '#9333ea',
    chipBg: 'bg-purple-500/15',
    chipText: 'text-purple-300',
    dot: 'bg-purple-500',
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
