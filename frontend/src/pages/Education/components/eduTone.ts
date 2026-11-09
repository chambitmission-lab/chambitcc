import type React from 'react'

export type Lang = 'ko' | 'en'

// 분야별 색 — 부서는 DB 기반이라 고정 키 대신 순서로 블루 패밀리(토스 블루 톤 안에서만)를 순환한다.
// 칩·벤토 타일·과정 카드 표지·시간표 줄이 같은 톤을 써서 "이 카드는 어느 분야"가 색으로 읽힌다.
export const TONES: Array<[string, string, string]> = [
  ['#4593fc', '#3182f6', '49, 130, 246'], // brand blue
  ['#38bdf8', '#0ea5e9', '56, 189, 248'], // sky
  ['#22d3ee', '#0891b2', '34, 211, 238'], // cyan
  ['#818cf8', '#4f46e5', '129, 140, 248'], // indigo
  ['#60a5fa', '#2563eb', '96, 165, 250'], // light blue
  ['#2dd4bf', '#0d9488', '45, 212, 191'], // teal
  ['#a78bfa', '#6d28d9', '167, 139, 250'], // violet
]
export const toneVars = (i: number) => {
  const [a, b, rgb] = TONES[((i % TONES.length) + TONES.length) % TONES.length]
  return { '--chip-a': a, '--chip-b': b, '--chip-rgb': rgb } as React.CSSProperties
}
