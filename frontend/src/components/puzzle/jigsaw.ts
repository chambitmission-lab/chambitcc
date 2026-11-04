// 직소 조각 모양 — 그림 한 장을 3×3 조각으로 자르는 SVG 경로를 코드로 만든다.
// 단위 좌표: 한 칸 = 1, 조각의 칸 왼쪽 위가 (0, 0). 탭(볼록·오목)은 칸 밖으로 TAB 만큼 나온다.
// 이웃한 두 조각은 같은 모서리를 반대 부호로 공유하므로 정확히 맞물린다.

export const GRID = 3
/** 조각 SVG 가 칸 바깥으로 갖는 여백(탭 높이보다 조금 크게) */
export const MARGIN = 0.3

// 한 모서리의 탭 — u: 모서리 방향(0→1), v: 바깥쪽 법선(볼록이면 +)
// 좌우 대칭이라 반대 방향으로 따라가도 같은 모양이 된다.
const TAB: Array<[number, number, number, number, number, number]> = [
  [0.4, 0, 0.42, 0.05, 0.38, 0.1],
  [0.32, 0.2, 0.4, 0.28, 0.5, 0.28],
  [0.6, 0.28, 0.68, 0.2, 0.62, 0.1],
  [0.58, 0.05, 0.6, 0, 0.66, 0],
]

const f = (n: number) => Number(n.toFixed(4))

/** (x0,y0)→(x1,y1) 모서리. sign: 0 평평, 1 볼록(바깥), -1 오목 */
const edge = (x0: number, y0: number, x1: number, y1: number, sign: number): string => {
  if (sign === 0) return `L ${f(x1)} ${f(y1)}`
  const dx = x1 - x0
  const dy = y1 - y0
  // 시계 방향으로 도는 경로에서 바깥쪽 법선 = 진행 방향을 -90° 회전
  const nx = dy * sign
  const ny = -dx * sign
  const p = (u: number, v: number) => `${f(x0 + dx * u + nx * v)} ${f(y0 + dy * u + ny * v)}`
  let d = `L ${p(0.34, 0)}`
  for (const [a, b, c, e, g, h] of TAB) d += ` C ${p(a, b)} ${p(c, e)} ${p(g, h)}`
  return `${d} L ${p(1, 0)}`
}

export interface PieceEdges {
  top: number
  right: number
  bottom: number
  left: number
}

/** 퍼즐 키로 고정된 탭 배치 — 같은 퍼즐은 늘 같은 모양 */
export const buildEdges = (seedKey: string): PieceEdges[] => {
  let seed = 0
  for (const ch of seedKey) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  // h[r][c]: r행 조각의 아래 모서리, v[r][c]: c열 조각의 오른쪽 모서리 (+1 = 그 조각에서 볼록)
  const h = Array.from({ length: GRID - 1 }, () => Array.from({ length: GRID }, () => (rand() < 0.5 ? 1 : -1)))
  const v = Array.from({ length: GRID }, () => Array.from({ length: GRID - 1 }, () => (rand() < 0.5 ? 1 : -1)))
  const out: PieceEdges[] = []
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      out.push({
        top: r === 0 ? 0 : -h[r - 1][c],
        bottom: r === GRID - 1 ? 0 : h[r][c],
        left: c === 0 ? 0 : -v[r][c - 1],
        right: c === GRID - 1 ? 0 : v[r][c],
      })
    }
  }
  return out
}

/** 조각 외곽선 경로(단위 좌표) */
export const piecePath = (e: PieceEdges): string =>
  [
    'M 0 0',
    edge(0, 0, 1, 0, e.top),
    edge(1, 0, 1, 1, e.right),
    edge(1, 1, 0, 1, e.bottom),
    edge(0, 1, 0, 0, e.left),
    'Z',
  ].join(' ')
