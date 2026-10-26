// 읽기 플랜 공통 비주얼 토큰 — 토스 블루 테마(theme.css)에 맞춘 블루 계열 통일

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
