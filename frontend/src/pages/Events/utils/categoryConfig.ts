import type { EventCategory } from '../../../types/event'

export interface CategoryVisual {
  emoji: string
  // Tailwind gradient classes — 토스 블루 테마(theme.css)에 맞춰 블루 패밀리 안에서만 변주
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
  // Hero 카드 배경 일러스트 (우측 배치, 좌측은 텍스트용 여백)
  bg: string
}

export const CATEGORY_VISUAL: Record<EventCategory, CategoryVisual> = {
  worship: {
    emoji: '🙏',
    gradient: 'from-blue-500 to-blue-600',
    accent: '#3182f6',
    chipBg: 'bg-blue-500/15',
    chipText: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-400',
    dotGlow: 'shadow-[0_0_6px_rgba(96,165,250,0.85)]',
    bg: '/images/events/worship.webp',
  },
  meeting: {
    emoji: '☕',
    gradient: 'from-sky-400 to-blue-500',
    accent: '#38bdf8',
    chipBg: 'bg-sky-400/15',
    chipText: 'text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-400',
    dotGlow: 'shadow-[0_0_6px_rgba(56,189,248,0.85)]',
    bg: '/images/events/meeting.webp',
  },
  service: {
    emoji: '🤝',
    gradient: 'from-cyan-400 to-sky-500',
    accent: '#22d3ee',
    chipBg: 'bg-cyan-400/15',
    chipText: 'text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-400',
    dotGlow: 'shadow-[0_0_6px_rgba(34,211,238,0.85)]',
    bg: '/images/events/service.webp',
  },
  special: {
    emoji: '✨',
    gradient: 'from-indigo-400 to-blue-600',
    accent: '#818cf8',
    chipBg: 'bg-indigo-400/15',
    chipText: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-400',
    dotGlow: 'shadow-[0_0_6px_rgba(129,140,248,0.85)]',
    bg: '/images/events/special.webp',
  },
  education: {
    emoji: '📖',
    gradient: 'from-blue-400 to-indigo-500',
    accent: '#60a5fa',
    chipBg: 'bg-blue-400/15',
    chipText: 'text-blue-700 dark:text-blue-200',
    dot: 'bg-blue-300',
    dotGlow: 'shadow-[0_0_6px_rgba(147,197,253,0.85)]',
    bg: '/images/events/education.webp',
  },
  other: {
    emoji: '📌',
    gradient: 'from-slate-400 to-slate-600',
    accent: '#94a3b8',
    chipBg: 'bg-slate-400/15',
    chipText: 'text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400',
    dotGlow: 'shadow-[0_0_6px_rgba(148,163,184,0.85)]',
    bg: '/images/events/other.webp',
  },
}

// Hero 배경 6장(총 ~140KB)을 페이지 진입 즉시 미리 받아둔다.
// API 응답 후 카드가 렌더될 때야 다운로드가 시작돼 늦게 '툭' 뜨는 문제 방지.
let bgPreloaded = false
export const preloadCategoryBackgrounds = () => {
  if (bgPreloaded || typeof window === 'undefined') return
  bgPreloaded = true
  for (const { bg } of Object.values(CATEGORY_VISUAL)) {
    const img = new Image()
    img.decoding = 'async'
    img.src = bg
  }
}

export const ALL_CATEGORIES: EventCategory[] = [
  'worship',
  'meeting',
  'service',
  'special',
  'education',
  'other',
]
