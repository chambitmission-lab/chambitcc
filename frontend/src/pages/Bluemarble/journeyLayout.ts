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
