// 120칸 발자취 경로 레이아웃 (12행 × 10열 serpentine)
// position 0~119 → row(0~11) × col(0~9) 매핑
// 짝수 행: 좌→우, 홀수 행: 우→좌

export const JOURNEY_LENGTH = 120
export const JOURNEY_COLS = 10
export const JOURNEY_ROWS = 12

export interface JourneyCoord {
  row: number // 0~11
  col: number // 0~9
}

export const positionToCoord = (position: number): JourneyCoord => {
  const row = Math.floor(position / JOURNEY_COLS)
  const indexInRow = position % JOURNEY_COLS
  const col = row % 2 === 0 ? indexInRow : JOURNEY_COLS - 1 - indexInRow
  return { row, col }
}

// 두 인접 칸 사이가 "행 전환점"인지 ( 9→10, 19→20 등)
export const isRowTransition = (from: number, to: number): boolean => {
  if (to !== from + 1) return false
  return Math.floor(from / JOURNEY_COLS) !== Math.floor(to / JOURNEY_COLS)
}

// fog of war 상태
export type FogState = 'revealed' | 'silhouette' | 'hidden'

export const getFogState = (
  position: number,
  currentPosition: number,
): FogState => {
  if (position <= currentPosition) return 'revealed'
  if (position === currentPosition + 1) return 'silhouette'
  return 'hidden'
}

// phase 별 컬러 (배경 그라데이션용)
export const PHASE_COLORS: Record<string, string> = {
  '여행의 시작': '#fde68a',
  '탄생과 어린 시절': '#fbcfe8',
  '공생애 시작': '#a7f3d0',
  '갈릴리 사역 1기': '#bae6fd',
  '갈릴리 사역 2기': '#c7d2fe',
  '예루살렘 향하여': '#fed7aa',
  '고난 주간': '#fecaca',
  '십자가와 부활': '#fde68a',
  // Phase 9-12: 사도행전~계시록
  '성령강림과 오순절': '#fed7aa',
  '초대교회의 사도들': '#bbf7d0',
  '바울의 선교 여행': '#c4b5fd',
  '땅끝까지': '#fde68a',
}

export const getPhaseRange = (phase: string): { start: number; end: number } => {
  switch (phase) {
    case '여행의 시작': return { start: 0, end: 0 }
    case '탄생과 어린 시절': return { start: 1, end: 10 }
    case '공생애 시작': return { start: 11, end: 20 }
    case '갈릴리 사역 1기': return { start: 21, end: 35 }
    case '갈릴리 사역 2기': return { start: 36, end: 50 }
    case '예루살렘 향하여': return { start: 51, end: 65 }
    case '고난 주간': return { start: 66, end: 75 }
    case '십자가와 부활': return { start: 76, end: 79 }
    case '성령강림과 오순절': return { start: 80, end: 89 }
    case '초대교회의 사도들': return { start: 90, end: 99 }
    case '바울의 선교 여행': return { start: 100, end: 109 }
    case '땅끝까지': return { start: 110, end: 119 }
    default: return { start: 0, end: 119 }
  }
}
