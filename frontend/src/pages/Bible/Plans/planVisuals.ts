// 읽기 플랜 공통 비주얼 토큰 — brand purple→pink 통일 (메모리 다크모드 합의)
import type { CSSProperties } from 'react'

// accent 키 → 그라데이션 (purple/pink/fuchsia/rose 만 허용)
export const ACCENT_GRADIENT: Record<string, string> = {
  purple: 'from-purple-500 to-pink-500',
  pink: 'from-pink-500 to-rose-500',
  fuchsia: 'from-fuchsia-500 to-purple-500',
  rose: 'from-rose-500 to-pink-500',
}

export const accentGradient = (accent?: string | null): string =>
  ACCENT_GRADIENT[accent ?? 'purple'] ?? ACCENT_GRADIENT.purple

// 통계 숫자용 brand 그라데이션 텍스트
export const gradientTextStyle: CSSProperties = {
  backgroundImage: 'linear-gradient(135deg,#a855f7,#ec4899)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  fontVariantNumeric: 'tabular-nums',
}

export const LEVEL_LABEL: Record<string, string> = {
  입문: '입문',
  초급: '초급',
  중급: '중급',
  고급: '고급',
}
