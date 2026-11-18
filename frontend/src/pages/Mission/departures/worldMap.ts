// 등불 지도(LampMap) 재료 — 실제 국경(world-atlas 110m) + 그리기 도구.
// LampMap 은 PC 에서만 lazy 로 불러, 이 데이터(약 100KB)가 모바일 번들에 실리지 않는다.

import { feature, merge, mesh } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { Feature, MultiLineString, MultiPolygon, Polygon } from 'geojson'
import type { GeoProjection } from 'd3-geo'
import countriesTopo from 'world-atlas/countries-110m.json'

type CountryProps = { name: string }
const topo = countriesTopo as unknown as Topology<{ countries: GeometryCollection<CountryProps> }>
const nameOf = (g: { properties?: unknown }) => (g.properties as CountryProps | undefined)?.name

export type CountryFeature = Feature<Polygon | MultiPolygon, CountryProps>
// 남극은 뺀다 — 선교지가 없고 평면 지도 아래를 띠처럼 채운다
export const COUNTRIES = (feature(topo, topo.objects.countries).features as CountryFeature[]).filter(
  f => f.properties.name !== 'Antarctica',
)
/** 나라 경계 없이 하나로 합친 땅 — 해안 물빛·땅 그림자용 */
export const LAND = merge(
  topo,
  topo.objects.countries.geometries.filter(
    g => (g.type === 'Polygon' || g.type === 'MultiPolygon') && nameOf(g) !== 'Antarctica',
  ) as Parameters<typeof merge>[1],
)
export const BORDERS = mesh(topo, topo.objects.countries, (a, b) => a !== b) as MultiLineString

/** 부천 — 출발지 */
export const ORIGIN: [number, number] = [126.78, 37.5]
export const ORIGIN_COUNTRY = 'South Korea'

/** 선교지 한글 이름 → 지도 데이터의 나라 이름. 새 선교지를 넣으면 여기도 한 줄 */
export const COUNTRY_EN: Record<string, string> = {
  튀르키예: 'Turkey', 베트남: 'Vietnam', 태국: 'Thailand', 미얀마: 'Myanmar', 인도네시아: 'Indonesia',
  인도: 'India', 네팔: 'Nepal', 말레이시아: 'Malaysia', 필리핀: 'Philippines', 요르단: 'Jordan',
  위구르: 'China', 일본: 'Japan', 중국: 'China', 캄보디아: 'Cambodia', 포르투갈: 'Portugal',
  키르기스스탄: 'Kyrgyzstan', 아제르바이잔: 'Azerbaijan', 독일: 'Germany', 코소보: 'Kosovo',
  러시아: 'Russia', '러시아 연해주': 'Russia', 알바니아: 'Albania', 우크라이나: 'Ukraine',
  잠비아: 'Zambia', 우간다: 'Uganda', 남아프리카공화국: 'South Africa', 모로코: 'Morocco',
  탄자니아: 'Tanzania', 파라과이: 'Paraguay', 페루: 'Peru',
}

/** 평면 지도: 위도 띠(latTop~latBot)와 중심 경도 ±lngSpan 이 상자에 들어오게 크기·위치를 맞춘다 */
export const fitBand = (proj: GeoProjection, W: number, H: number, latTop: number, latBot: number, pad: number, lngSpan: number) => {
  proj.scale(1).translate([0, 0])
  const c = -proj.rotate()[0]
  const left = proj([c - lngSpan, 0])![0]
  const right = proj([c + lngSpan, 0])![0]
  const top = proj([c, latTop])![1]
  const bot = proj([c, latBot])![1]
  const s = Math.min((W - pad * 2) / (right - left), (H - pad * 2) / (bot - top))
  proj.scale(s).translate([W / 2 - ((left + right) / 2) * s, H / 2 - ((top + bot) / 2) * s])
  return proj
}

// ── 그리기 도구 ──────────────────────────────────────
export interface MapInk {
  lamp: string
  core: string
  glow: string // "r,g,b"
  brand: string
  brandRgb: string
  ink: string
  muted: string
  pill: string
  font: string
}

export const lampGlow = (ctx: CanvasRenderingContext2D, x: number, y: number, sc: number, flicker: number, c: MapInk) => {
  const r = 15 * sc * flicker
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, `rgba(${c.glow},0.95)`)
  g.addColorStop(1, `rgba(${c.glow},0)`)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

export const originMark = (ctx: CanvasRenderingContext2D, x: number, y: number, sc: number, t: number, c: MapInk, still: boolean) => {
  if (!still) {
    for (let k = 0; k < 2; k++) {
      const p = (t / 2200 + k / 2) % 1
      ctx.strokeStyle = `rgba(${c.brandRgb},${(1 - p) * 0.5})`
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(x, y, (4 + p * 16) * sc, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(x, y, 4.6 * sc, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.brand
  ctx.beginPath()
  ctx.arc(x, y, 3.4 * sc, 0, Math.PI * 2)
  ctx.fill()
}

/** 위에서 본 여객기 — 기수 +x, 길이 약 22 단위. 반쪽 외곽선을 대칭으로 접는다 */
const PLANE_HALF: [number, number][] = [
  [11, 0], [9.8, -1.1], [7.5, -1.55], [2.6, -1.6], [-1.2, -10.6], [-3.9, -10.6], [-1.9, -1.6],
  [-7.4, -1.3], [-9.5, -4.7], [-11.3, -4.7], [-10.2, -0.9], [-11.2, 0],
]
const PLANE: [number, number][] = [...PLANE_HALF, ...PLANE_HALF.slice(1, -1).reverse().map(([a, b]) => [a, -b] as [number, number])]

const drawPlane = (ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, s: number, color: string) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.scale(s, s)
  ctx.fillStyle = color
  ctx.beginPath()
  PLANE.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** 경로 B(u)를 따라 비행운 + 그림자 + 여객기 + 꼬리 점멸등 */
export const drawFlight = (
  ctx: CanvasRenderingContext2D,
  B: (u: number) => [number, number],
  p: number,
  sc: number,
  t: number,
  c: MapInk,
) => {
  const N = 28
  const from = Math.max(0, p - 0.3)
  ctx.lineCap = 'round'
  for (let k = 0; k < N; k++) {
    const [a0, b0] = B(from + ((p - from) * k) / N)
    const [a1, b1] = B(from + ((p - from) * (k + 1)) / N)
    const w = k / N
    ctx.strokeStyle = `rgba(${c.glow},${(w * 0.7).toFixed(3)})`
    ctx.lineWidth = (0.6 + w * 2.2) * sc
    ctx.beginPath()
    ctx.moveTo(a0, b0)
    ctx.lineTo(a1, b1)
    ctx.stroke()
  }
  const [x, y] = B(p)
  const [fx, fy] = B(Math.min(1, p + 0.01))
  const [bx, by] = B(Math.max(0, p - 0.01))
  const ang = Math.atan2(fy - by, fx - bx)
  const alt = Math.sin(p * Math.PI)
  const size = (0.62 + 0.38 * alt) * sc
  const off = (2 + alt * 9) * sc
  drawPlane(ctx, x + off, y + off, ang, size, 'rgba(0,0,0,0.2)')
  drawPlane(ctx, x, y, ang, size, c.ink)
  if (Math.floor(t / 500) % 2) {
    ctx.fillStyle = '#ff4d4f'
    ctx.beginPath()
    ctx.arc(x - Math.cos(ang) * 10.5 * size, y - Math.sin(ang) * 10.5 * size, 1.2 * sc, 0, Math.PI * 2)
    ctx.fill()
  }
}

export const easeInOut = (raw: number) => (raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2)

// ── 이름표 — 겹치면 우선순위 낮은 쪽을 숨긴다 ───────────────
export interface LabelItem {
  text: string
  x: number
  y: number
  /** 클수록 먼저 자리를 잡는다 */
  priority: number
  kind: 'pill' | 'origin' | 'code'
}

type Rect = [number, number, number, number]
const hit = (a: Rect, b: Rect) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]

export const placeLabels = (ctx: CanvasRenderingContext2D, items: LabelItem[], sc: number, c: MapInk, W: number, H: number) => {
  const placed: Rect[] = []
  const fs = 11 * sc
  const sorted = [...items].sort((a, b) => b.priority - a.priority)
  for (const it of sorted) {
    const boxed = it.kind !== 'code'
    ctx.font = boxed ? `700 ${fs}px ${c.font}` : `600 ${10 * sc}px ui-monospace, Menlo, Consolas, monospace`
    const w = ctx.measureText(it.text).width
    const padX = boxed ? 7 * sc : 0
    const h = fs + (boxed ? 8 * sc : 2)
    const bw = w + padX * 2
    const gap = 7 * sc
    // 오른쪽 → 왼쪽 → 위 → 아래 순으로 빈자리를 찾는다
    const spots: [number, number][] = [
      [it.x + gap, it.y - h / 2],
      [it.x - gap - bw, it.y - h / 2],
      [it.x - bw / 2, it.y - gap - h],
      [it.x - bw / 2, it.y + gap],
    ]
    const spot = spots.find(([x, y]) => {
      const r: Rect = [x - 2, y - 1, x + bw + 2, y + h + 1]
      return x > 2 && y > 2 && x + bw < W - 2 && y + h < H - 2 && !placed.some(p => hit(p, r))
    })
    if (!spot) continue
    const [x, y] = spot
    placed.push([x - 2, y - 1, x + bw + 2, y + h + 1])
    if (boxed) {
      ctx.save()
      ctx.shadowColor = 'rgba(15,30,60,0.22)'
      ctx.shadowBlur = 6 * sc
      ctx.shadowOffsetY = 2 * sc
      ctx.fillStyle = it.kind === 'origin' ? c.brand : c.pill
      ctx.beginPath()
      ctx.roundRect(x, y, bw, h, h / 2)
      ctx.fill()
      ctx.restore()
      ctx.fillStyle = it.kind === 'origin' ? '#fff' : c.ink
    } else {
      ctx.fillStyle = c.muted
    }
    ctx.textBaseline = 'middle'
    ctx.fillText(it.text, x + padX, y + h / 2 + 0.5)
    ctx.textBaseline = 'alphabetic'
  }
}
