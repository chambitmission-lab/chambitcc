// 칭호 티어/카테고리 시각 토큰 — 카드와 해금 팝업이 공유.
// 티어 색은 메달(게임 시맨틱) 색으로 브랜드 블루를 따르지 않는 예외 허용.
import type { TitleTier, TitleCategory } from '../../api/titles'
import type { translations } from '../../locales'

type LocaleKey = keyof typeof translations.ko

export interface TierVisual {
  labelKey: LocaleKey  // 티어 이름은 로케일에서 (t 로 조회)
  ring: string      // 테두리/글로우 색
  chipBg: string
  chipText: string
}

export const TIER_VISUALS: Record<TitleTier, TierVisual> = {
  bronze: {
    labelKey: 'titleTierBronze',
    ring: 'rgba(205, 127, 50, 0.65)',
    chipBg: 'rgba(205, 127, 50, 0.16)',
    chipText: '#c87f3a',
  },
  silver: {
    labelKey: 'titleTierSilver',
    ring: 'rgba(148, 163, 184, 0.7)',
    chipBg: 'rgba(148, 163, 184, 0.18)',
    chipText: '#94a3b8',
  },
  gold: {
    labelKey: 'titleTierGold',
    ring: 'rgba(245, 158, 11, 0.7)',
    chipBg: 'rgba(245, 158, 11, 0.16)',
    chipText: '#f0a82c',
  },
  legendary: {
    labelKey: 'titleTierLegendary',
    ring: 'rgba(251, 191, 36, 0.9)',
    chipBg: 'rgba(251, 191, 36, 0.18)',
    chipText: '#fbbf24',
  },
}

export const CATEGORY_ORDER: TitleCategory[] = ['time', 'pattern', 'hidden']

export const CATEGORY_META: Record<TitleCategory, { icon: string; labelKey: LocaleKey }> = {
  time: { icon: '📅', labelKey: 'titleCatTime' },
  pattern: { icon: '📖', labelKey: 'titleCatPattern' },
  hidden: { icon: '🎉', labelKey: 'titleCatHidden' },
}
