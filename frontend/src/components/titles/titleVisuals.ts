// 칭호 티어/카테고리 시각 토큰 — 카드와 해금 팝업이 공유.
// 티어 색은 메달(게임 시맨틱) 색으로 브랜드 블루를 따르지 않는 예외 허용.
import type { TitleTier, TitleCategory } from '../../api/titles'

export interface TierVisual {
  label: string
  ring: string      // 테두리/글로우 색
  chipBg: string
  chipText: string
}

export const TIER_VISUALS: Record<TitleTier, TierVisual> = {
  bronze: {
    label: '브론즈',
    ring: 'rgba(205, 127, 50, 0.65)',
    chipBg: 'rgba(205, 127, 50, 0.16)',
    chipText: '#c87f3a',
  },
  silver: {
    label: '실버',
    ring: 'rgba(148, 163, 184, 0.7)',
    chipBg: 'rgba(148, 163, 184, 0.18)',
    chipText: '#94a3b8',
  },
  gold: {
    label: '골드',
    ring: 'rgba(245, 158, 11, 0.7)',
    chipBg: 'rgba(245, 158, 11, 0.16)',
    chipText: '#f0a82c',
  },
  legendary: {
    label: '전설',
    ring: 'rgba(251, 191, 36, 0.9)',
    chipBg: 'rgba(251, 191, 36, 0.18)',
    chipText: '#fbbf24',
  },
}

export const CATEGORY_ORDER: TitleCategory[] = ['time', 'pattern', 'hidden']

export const CATEGORY_META: Record<TitleCategory, { icon: string; label: string }> = {
  time: { icon: '📅', label: '시간과 꾸준함' },
  pattern: { icon: '📖', label: '읽기 여정' },
  hidden: { icon: '🎉', label: '히든' },
}
