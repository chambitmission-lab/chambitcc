// 읽기 플랜 공통 비주얼 토큰 — 토스 블루 테마(theme.css)에 맞춘 블루 계열 통일
import type { CSSProperties } from 'react'

// accent 키 → 그라데이션. DB에는 기존 purple/pink/fuchsia/rose 키가 저장돼 있어
// 키는 유지하고 값만 블루 패밀리로 매핑한다 (플랜별 톤 변주는 블루 안에서만)
export const ACCENT_GRADIENT: Record<string, string> = {
  purple: 'from-blue-500 to-blue-600',
  pink: 'from-sky-400 to-blue-500',
  fuchsia: 'from-indigo-400 to-blue-600',
  rose: 'from-cyan-400 to-sky-500',
}

export const accentGradient = (accent?: string | null): string =>
  ACCENT_GRADIENT[accent ?? 'purple'] ?? ACCENT_GRADIENT.purple

// 통계 숫자용 brand 강조 텍스트 — 플랫 솔리드 블루 (그라데이션 대신 단색)
export const gradientTextStyle: CSSProperties = {
  color: 'var(--brand)',
  fontVariantNumeric: 'tabular-nums',
}

export const LEVEL_LABEL: Record<string, string> = {
  입문: '입문',
  초급: '초급',
  중급: '중급',
  고급: '고급',
}

// 플랜 메타 → 인스타 해시태그 스타일 토큰들 (#7일완성 #입문 …)
export const planHashtags = (plan: {
  total_days?: number | null
  level?: string | null
  category?: string | null
}): string[] => {
  const tags: string[] = []
  if (plan.total_days) tags.push(`${plan.total_days}일완성`)
  if (plan.level) tags.push(plan.level)
  if (plan.category) tags.push(plan.category)
  return tags
}
