// 성경 지도여행 — 경위도 ↔ 지도 좌표 투영.
//
// 베이스맵(data/basemap.ts)은 이 상자·이 식으로 미리 구운 SVG path 다.
// 여기 숫자를 바꾸면 해안선과 핀이 어긋나므로, 바꿨다면 반드시
//   node scripts/gen-atlas-basemap.mjs
// 를 다시 돌려야 한다.
//
// 메르카토르를 쓰는 이유: 위도 22~44도 구간에선 왜곡이 크지 않고,
// 사람들이 학교에서 본 지중해 모양과 가장 비슷해서 "아는 지도"로 읽힌다.

/** 지도가 담는 경위도 상자 — 서쪽 로마, 동쪽 우르, 남쪽 시내산, 북쪽 빌립보까지 */
export const MAP_BBOX = { west: 9.5, east: 50.5, south: 22, north: 44 } as const

/** SVG viewBox 크기 */
export const MAP_VIEW = { width: 1000, height: 647.2 } as const

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))

const Y_TOP = mercY(MAP_BBOX.north)
const Y_BOTTOM = mercY(MAP_BBOX.south)
const LON_SPAN = MAP_BBOX.east - MAP_BBOX.west

/** 경도 → 지도 x */
export const projectX = (lng: number): number =>
  ((lng - MAP_BBOX.west) / LON_SPAN) * MAP_VIEW.width

/** 위도 → 지도 y */
export const projectY = (lat: number): number =>
  ((Y_TOP - mercY(lat)) / (Y_TOP - Y_BOTTOM)) * MAP_VIEW.height

export interface Point {
  x: number
  y: number
}

export const project = (lat: number, lng: number): Point => ({
  x: projectX(lng),
  y: projectY(lat),
})

/** 두 지점 사이 대권거리(km) — 거리 체감 카드가 쓴다 */
export const distanceKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number => {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * 두 지점을 잇는 살짝 휜 곡선(2차 베지어).
 * 직선으로 이으면 지도가 종이 위 자 대고 그은 선처럼 딱딱해지고, 같은 구간을
 * 오갈 때(왕복) 선이 겹쳐 사라진다. 진행 방향 왼쪽으로 살짝 부풀린다.
 *
 * @param bow 휨 정도 — 0이면 직선. 왕복 구간은 부호를 반대로 줘서 갈라 놓는다.
 */
export const curveControl = (from: Point, to: Point, bow = 0.14): Point => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  // 중점에서 진행 방향의 수직으로 밀어낸 제어점
  return {
    x: (from.x + to.x) / 2 - dy * bow,
    y: (from.y + to.y) / 2 + dx * bow,
  }
}

export const curvePath = (from: Point, to: Point, bow = 0.14): string => {
  const c = curveControl(from, to, bow)
  return `M${from.x} ${from.y}Q${c.x} ${c.y} ${to.x} ${to.y}`
}

const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})

/**
 * 곡선을 t 지점에서 잘라 앞부분만 돌려준다 (드 카스텔조 분할).
 *
 * 걸어보기 재생에서 선이 자라나는 연출에 쓴다. stroke-dashoffset 으로 잘라도
 * 되지만 그건 호 길이 기준이라, 같은 t 로 찍은 이동 점과 선 끝이 미세하게
 * 어긋난다. 곡선 자체를 자르면 끝점이 곧 이동 점이라 항상 정확히 붙는다.
 */
export const splitCurve = (
  from: Point,
  to: Point,
  bow: number,
  t: number
): { d: string; point: Point } => {
  const c = curveControl(from, to, bow)
  const a = lerp(from, c, t)
  const b = lerp(c, to, t)
  const mid = lerp(a, b, t)
  return { d: `M${from.x} ${from.y}Q${a.x} ${a.y} ${mid.x} ${mid.y}`, point: mid }
}

/** 여러 지점을 감싸는 사각형 — 여정에 맞춰 지도를 자동으로 맞출 때 쓴다 */
export const boundsOf = (points: Point[]): { x: number; y: number; w: number; h: number } => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: MAP_VIEW.width, h: MAP_VIEW.height }
  return { x: minX, y: minY, w: Math.max(maxX - minX, 1), h: Math.max(maxY - minY, 1) }
}
