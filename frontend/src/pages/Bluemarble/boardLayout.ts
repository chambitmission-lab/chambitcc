// 24칸 보드 레이아웃 - 7x7 그리드 둘레에 배치
// position 0(출발) = 우하단, 시계 반대방향(좌측)으로 진행

export interface GridCoord {
  row: number // 1~7
  col: number // 1~7
}

// position(0~23) → 7x7 grid 좌표
export const POSITION_TO_GRID: GridCoord[] = [
  // 0: 우하단 (시작)
  { row: 7, col: 7 },
  // 1~5: 하단 (오른쪽 → 왼쪽)
  { row: 7, col: 6 },
  { row: 7, col: 5 },
  { row: 7, col: 4 },
  { row: 7, col: 3 },
  { row: 7, col: 2 },
  // 6: 좌하단
  { row: 7, col: 1 },
  // 7~11: 좌측 (아래 → 위)
  { row: 6, col: 1 },
  { row: 5, col: 1 },
  { row: 4, col: 1 },
  { row: 3, col: 1 },
  { row: 2, col: 1 },
  // 12: 좌상단
  { row: 1, col: 1 },
  // 13~17: 상단 (왼쪽 → 오른쪽)
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  // 18: 우상단
  { row: 1, col: 7 },
  // 19~23: 우측 (위 → 아래)
  { row: 2, col: 7 },
  { row: 3, col: 7 },
  { row: 4, col: 7 },
  { row: 5, col: 7 },
  { row: 6, col: 7 },
]

export const BOARD_SIZE = 24

// position이 어느 변에 있는지 ('top'|'bottom'|'left'|'right'|'corner')
export const getTileSide = (
  position: number
): 'corner-br' | 'corner-bl' | 'corner-tl' | 'corner-tr' | 'top' | 'bottom' | 'left' | 'right' => {
  if (position === 0) return 'corner-br'
  if (position === 6) return 'corner-bl'
  if (position === 12) return 'corner-tl'
  if (position === 18) return 'corner-tr'
  if (position >= 1 && position <= 5) return 'bottom'
  if (position >= 7 && position <= 11) return 'left'
  if (position >= 13 && position <= 17) return 'top'
  return 'right'
}

// 이동 경로: from -> to (시계방향 진행)
// 한 바퀴 보드: position이 BOARD_SIZE를 넘으면 0부터 다시
export const getPathPositions = (from: number, to: number): number[] => {
  const path: number[] = []
  let p = from
  // to가 from보다 작으면 한 바퀴 돌았다는 뜻
  while (p !== to) {
    p = (p + 1) % BOARD_SIZE
    path.push(p)
  }
  return path
}
