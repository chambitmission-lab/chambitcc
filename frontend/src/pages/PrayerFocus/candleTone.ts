import type { CSSProperties } from 'react'

// 집중 기도 흐름(설정 → 진입 의식 → 기도 중 → 완료)의 강조 톤 — 시간대 무드 색과 무관하게 촛불빛(크림·호박)을 따른다.
// 무드 보조색(밤의 분홍 등)이 사실적인 촛불과 부딪히지 않도록, 무드는 배경 베이스·큰 글로우·촛불 외곽 할로에만 남긴다.

export const CANDLE_TONE = {
  /** 선택된 아이콘·강조 텍스트 */
  text: '#f2d2a4',
  /** 선택 항목의 한 줄 설명 */
  textMuted: 'rgba(242, 210, 164, 0.7)',
  /** 켜진 스위치 트랙 */
  switchOn: '#e3b57b',
  /** 타이머 아크 그라데이션 — 호박빛 불꽃 가장자리 → 크림 속불꽃 (SVG stop·알파 접미사용 6자리 hex) */
  ringFrom: '#e8a25c',
  ringTo: '#f9dcaf',
}

// Tailwind 클래스로 써야 하는 자리(className prop을 받는 하위 컴포넌트 등)용
export const CANDLE_CLASS = {
  accentText: 'text-[#f2d2a4]',
  /** 촛농 크림빛 주 버튼 면 + 진한 갈색 글자 — 흐름마다 화면에서 가장 밝은 단 하나의 면 */
  primary: 'bg-gradient-to-b from-[#f8e0b8] to-[#ecc38c] text-[#2b1b0c]',
}

/** 선택된 칩·세그먼트 — 촛불이 비친 듯한 옅은 호박빛 면 + 테두리 */
export const CANDLE_SELECTED: CSSProperties = {
  backgroundColor: 'rgba(255, 196, 120, 0.1)',
  borderColor: 'rgba(255, 208, 156, 0.5)',
  boxShadow: '0 8px 22px -12px rgba(255, 170, 90, 0.5)',
}
