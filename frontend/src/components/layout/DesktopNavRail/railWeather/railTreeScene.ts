/* PC 좌측 레일 하단 삽화 — 예배당 왼쪽 앞 언덕에 선 나무 한 그루의 사계절 (2026-11-22 시연).
 *
 * ★ 나무를 벡터 도형으로 '그려 넣으면' 클립아트가 된다(레일 삽화 2차 실패 이유). 그래서 붓 대신
 *   물감 번짐을 흉내 낸다: 잎 덩어리는 모양을 흔든 다각형을 아주 옅게 여러 겹 칠해 가장자리가
 *   번진 수채 얼룩으로 만들고, 가지는 가늘어지는 획을 조금씩 어긋나게 세 번 겹쳐 붓 자국처럼 무르게 한다.
 *   모양은 시드 고정 난수라 언제 그려도 같은 나무다.
 *
 * 계절은 한 해를 이어지는 값으로 본다(날짜 → TreeState). 칸막이 네 장이 아니라
 *   3월 눈 틔움 → 4월 초 꽃 → 꽃잎 날림·새잎 연두 → 6월 짙은 초록 → 9월 물들기 시작 →
 *   11월 잎이 성글어지며 낙엽 → 12월 빈 가지(눈 오면 가지 위에 눈) → 3월
 * 처럼 하루하루 조금씩 바뀐다.
 *
 * 그리는 비용: 나무(가지+잎+꽃+가지 위 눈)는 오프스크린 한 장으로 구워 두고, 프레임마다는
 * 밑동을 축으로 아주 살짝 기울여(바람) 그 한 장을 찍는다. 움직이는 것은 떨어지는 잎·꽃잎과
 * 땅의 새싹뿐이다. 구운 그림은 상태가 눈에 띄게 바뀔 때만 다시 굽는다. */

import type { RailTheme } from './railWeatherScene'
import { ART_DROP_PX, ART_H, backRidgeY, frontRidgeY } from './railGeometry'
import { takeArmed, type StrikeHit } from './railStrike'

export type TreeSeason = 'spring' | 'summer' | 'autumn' | 'winter'

/* ── 나무 자리 (이미지 기준 좌표) ─────────────────────────────
   ★ 2026-11-22 사용자 확정: front(앞 언덕). 뒷언덕을 2차로 만들어 나란히 비교한 뒤 앞 언덕이 낫다고 골랐다.
   back  : 왼쪽 뒷언덕 내리막(2차, 비교용). 멀리 있으니 0.72배 — 우체통(앞·왼쪽 아래)·나무(뒤·왼쪽 위)·
           예배당(오른쪽)이 삼각 구도가 되고 비어 있던 왼쪽 위 하늘이 찬다
   front : 우체통과 예배당 사이 앞 언덕 비탈(1차, 기본)
   줄기 밑동은 능선 살짝 아래에 묻힌다 */
export type TreePlacement = 'back' | 'front'
interface Place { x: number; y: number; scale: number; ground: (x: number) => number }
const PLACES: Record<TreePlacement, Place> = {
  back: { x: 76, y: backRidgeY(76) + 1.2, scale: 0.72, ground: backRidgeY },
  front: { x: 122, y: frontRidgeY(122) + 1.6, scale: 1, ground: frontRidgeY },
}

/* ── 한 해의 흐름 ─────────────────────────────────────────── */

export interface TreeState {
  /** 잎이 달린 정도 0 빈 가지 → 1 무성 */
  foliage: number
  /** 단풍 0 초록 → 1 다 물듦 */
  fall: number
  /** 새잎 연두빛 0 → 1 */
  fresh: number
  /** 가지 끝 눈(싹) */
  buds: number
  /** 꽃 */
  blossom: number
  /** 꽃잎 날림 (장/초) */
  petalRate: number
  /** 낙엽 (장/초) */
  leafRate: number
  /** 땅에 쌓인 낙엽 0 → 1 */
  fallen: number
  /** 언덕 새싹 0 → 1 */
  sprouts: number
}

type Key = [number, number][]
/* 1월 1일 = 0 인 날수(평년 기준). 값은 사이를 직선으로 잇고, 연말↔연초는 이어진다 */
const K: Record<keyof TreeState, Key> = {
  foliage: [[0, 0], [80, 0], [99, 0.06], [120, 0.55], [160, 1], [282, 1], [297, 0.86], [313, 0.56], [328, 0.2], [343, 0], [365, 0]],
  fall: [[0, 1], [60, 1], [61, 0], [243, 0], [262, 0.22], [282, 0.62], [297, 0.92], [312, 1], [365, 1]],
  fresh: [[0, 1], [99, 1], [139, 0.75], [172, 0], [365, 0]],
  buds: [[0, 0], [59, 0], [75, 0.6], [92, 1], [104, 0.45], [118, 0], [365, 0]],
  blossom: [[0, 0], [86, 0], [95, 0.75], [101, 1], [108, 0.85], [117, 0.22], [125, 0], [365, 0]],
  petalRate: [[0, 0], [98, 0], [104, 0.3], [112, 0.55], [120, 0.15], [127, 0], [365, 0]],
  leafRate: [[0, 0], [268, 0], [285, 0.16], [300, 0.36], [318, 0.48], [333, 0.26], [346, 0], [365, 0]],
  fallen: [[0, 0.3], [45, 0.1], [70, 0], [272, 0], [300, 0.35], [325, 0.8], [345, 0.92], [365, 0.3]],
  sprouts: [[0, 0], [62, 0], [82, 0.5], [100, 1], [140, 1], [172, 0], [365, 0]],
}

const at = (key: Key, d: number) => {
  for (let i = 0; i < key.length - 1; i++) {
    const [d0, v0] = key[i], [d1, v1] = key[i + 1]
    if (d <= d1) return d1 === d0 ? v1 : v0 + (v1 - v0) * (d - d0) / (d1 - d0)
  }
  return key[key.length - 1][1]
}

export const dayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 1)
  return Math.min(364.99, Math.max(0, (date.getTime() - start.getTime()) / 86400000))
}

export const treeStateFor = (date: Date): TreeState => {
  const d = dayOfYear(date)
  const s = {} as TreeState
  for (const k of Object.keys(K) as (keyof TreeState)[]) s[k] = at(K[k], d)
  return s
}

export const seasonOf = (date: Date): TreeSeason => {
  const m = date.getMonth()
  return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter'
}

/* ── 물감 ─────────────────────────────────────────────────── */

interface Palette {
  bark: string
  barkLight: string
  summer: string[]
  freshLeaf: string[]
  autumn: string[]
  /** 떨어지는 잎 — 나무에 달린 것보다 살짝 또렷하게 */
  leaf: string[]
  blossom: string[]
  bud: string
  sprout: string[]
  snow: string
  snowShade: string
  ground: string
  /** 잎 한 겹의 농도 */
  wash: number
}

/* 삽화는 회청 물감이 워터마크처럼 옅다 — 나무도 같은 옅기로(채도를 눌러 그림 속에 있게) */
const PALETTE: Record<RailTheme, Palette> = {
  light: {
    bark: '#7f7368',
    barkLight: '#a39789',
    summer: ['#86a596', '#7b9b8e', '#97b3a0', '#6f9083'],
    freshLeaf: ['#b4cd92', '#c3d69e', '#a7c58e'],
    autumn: ['#d9a35c', '#c9824f', '#e3bb72', '#b96f4a', '#d49a62'],
    leaf: ['#d7964f', '#c47548', '#e0ae5e', '#b8633f', '#cf8f4f'],
    blossom: ['#f3d3da', '#f7e3e7', '#eec3cd', '#fbf1f3'],
    bud: '#a7b97e',
    sprout: ['#9cbf86', '#88b07a', '#acc98f'],
    snow: '#ffffff',
    snowShade: '#b9c6d8',
    ground: '#8fa1b8',
    wash: 0.085,
  },
  dark: {
    bark: '#1f232a',
    barkLight: '#3b414b',
    summer: ['#3c5248', '#33483f', '#465c4f', '#2d4038'],
    freshLeaf: ['#5d7550', '#6a8058', '#536c4b'],
    // 밤 단풍 — 달빛 아래 색이 가라앉는다(2026-11-22: 한 단계 어둡고 덜 붉게, 밝으면 등불·열매처럼 읽혔다)
    autumn: ['#6c5636', '#634630', '#76603c', '#584030', '#6a5238'],
    leaf: ['#86683e', '#7a5536', '#917548', '#6c4a33', '#82633f'],
    blossom: ['#c9a9b2', '#d8c1c7', '#bc97a2', '#e2d3d7'],
    bud: '#5f6f48',
    sprout: ['#56714c', '#4b6744', '#628055'],
    snow: '#d9e0ea',
    snowShade: '#56647a',
    ground: '#0d1015',
    wash: 0.11,
  },
}

/* ── 난수 ─────────────────────────────────────────────────── */

const mulberry = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
type Rng = () => number
const gauss = (r: Rng) => (r() + r() + r() - 1.5) / 1.5

const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b)
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')
}
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/* ── 나무 모양 (시드 고정) ────────────────────────────────── */

interface Seg {
  x0: number; y0: number; cx: number; cy: number; x1: number; y1: number
  w0: number; w1: number; depth: number; ang: number
}
interface Cluster {
  x: number; y: number; r: number
  /** 이 덩어리가 잎을 잃는 차례(낮을수록 오래 버틴다) */
  u: number
  /** 단풍이 드는 차례 */
  turn: number
  ci: number
  seed: number
}
interface Shape { segs: Seg[]; tips: Seg[]; clusters: Cluster[] }

const MAX_DEPTH = 6

function buildShape(): Shape {
  const r = mulberry(1129)
  const segs: Seg[] = []
  const grow = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
    const a1 = a + (r() - 0.5) * 0.22
    const x1 = x + Math.sin(a1) * len
    const y1 = y - Math.cos(a1) * len
    // 살짝 굽은 획 — 가운데를 결의 직각 방향으로 민다
    const bow = (r() - 0.5) * 0.24 * len
    const cx = (x + x1) / 2 + Math.cos(a1) * bow
    const cy = (y + y1) / 2 + Math.sin(a1) * bow
    const w1 = Math.max(0.28, w * 0.68)
    segs.push({ x0: x, y0: y, cx, cy, x1, y1, w0: w, w1, depth, ang: a1 })
    if (depth === MAX_DEPTH) return
    const n = depth === 0 ? 2 : r() < 0.28 ? 3 : 2
    const spread = 0.5 + r() * 0.2
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * spread * (n === 3 ? 0.85 : 1) + (r() - 0.5) * 0.25
      // 위로 자라려는 힘 — 바깥 가지일수록 수직 쪽으로 살짝 되돌린다(둥근 수관)
      let ca = (a1 + off) * 0.9
      if (depth >= 3) ca *= 0.92
      const cl = len * (0.7 + r() * 0.1) * (depth === 0 && i === 0 ? 0.92 : 1)
      grow(x1, y1, ca, cl, w1 * (i === Math.floor(n / 2) ? 1 : 0.9), depth + 1)
    }
  }
  // 줄기 — 살짝 기울어 선 나무(반듯한 수직은 인형 같다)
  grow(0, 0, -0.05, 12.5, 3.1, 0)

  const tips = segs.filter((s) => s.depth === MAX_DEPTH)
  const clusters: Cluster[] = []
  const cr = mulberry(77)
  // 잎 덩어리는 4단 가지 끝마다 하나 — 사이사이를 5·6단 끝 작은 덩어리가 메운다
  for (const s of segs) {
    if (s.depth < 4) continue
    if (s.depth === 6 && cr() < 0.55) continue
    const big = s.depth === 4
    clusters.push({
      x: s.x1 + gauss(cr) * 1.2,
      y: s.y1 + gauss(cr) * 1.2 - (big ? 1.5 : 0),
      r: big ? 5.6 + cr() * 2.2 : s.depth === 5 ? 3.6 + cr() * 1.4 : 2.6 + cr(),
      // 바깥·꼭대기 덩어리가 먼저 진다 — 높이와 바깥 거리를 섞는다
      u: clamp01(0.15 + cr() * 0.6 + (Math.abs(s.x1) / 30) * 0.25 - (s.y1 / -45) * 0.05),
      turn: cr(),
      ci: Math.floor(cr() * 5),
      seed: Math.floor(cr() * 1e9),
    })
  }
  return { segs, tips, clusters }
}

let shapeCache: Shape | null = null
const shape = () => (shapeCache ??= buildShape())

/* ── 수채 붓 ──────────────────────────────────────────────── */

type Poly = [number, number][]

/* 다각형 모양 흔들기 — 변마다 가운데 점을 끼우고 아무 쪽으로나 민다(물감이 종이에 번지는 결) */
function deform(poly: Poly, iters: number, k: number, r: Rng): Poly {
  let p = poly
  for (let it = 0; it < iters; it++) {
    const out: Poly = []
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length]
      out.push(a)
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      out.push([(a[0] + b[0]) / 2 + gauss(r) * len * k, (a[1] + b[1]) / 2 + gauss(r) * len * k])
    }
    p = out
  }
  return p
}

const fillPoly = (ctx: CanvasRenderingContext2D, p: Poly) => {
  ctx.beginPath()
  ctx.moveTo(p[0][0], p[0][1])
  for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1])
  ctx.closePath()
  ctx.fill()
}

/* 수채 얼룩 한 점 — 흔든 바탕 모양을 다시 조금씩 흔들어 옅게 여러 겹. 겹이 많이 겹친 가운데는
   짙고, 한두 겹만 닿은 가장자리는 옅게 번진다 */
function stain(ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, color: string, alpha: number, r: Rng,
  opts: { layers?: number; squash?: number } = {}) {
  const layers = opts.layers ?? 9
  const sq = opts.squash ?? 0.86
  const base: Poly = []
  const n = 9
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.3
    const rr = rad * (0.78 + r() * 0.34)
    base.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * sq])
  }
  const b = deform(base, 2, 0.32, r)
  ctx.fillStyle = color
  ctx.globalAlpha = alpha
  for (let l = 0; l < layers; l++) fillPoly(ctx, deform(b, 2, 0.22, r))
  ctx.globalAlpha = 1
}

/* 가늘어지는 굽은 획 하나를 다각형으로 */
function segPoly(s: Seg, grow = 0): Poly {
  const N = 5
  const left: Poly = [], right: Poly = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const mt = 1 - t
    const x = mt * mt * s.x0 + 2 * mt * t * s.cx + t * t * s.x1
    const y = mt * mt * s.y0 + 2 * mt * t * s.cy + t * t * s.y1
    const dx = 2 * mt * (s.cx - s.x0) + 2 * t * (s.x1 - s.cx)
    const dy = 2 * mt * (s.cy - s.y0) + 2 * t * (s.y1 - s.cy)
    const L = Math.hypot(dx, dy) || 1
    const w = (s.w0 + (s.w1 - s.w0) * t) / 2 + grow
    left.push([x - (dy / L) * w, y + (dx / L) * w])
    right.push([x + (dy / L) * w, y - (dx / L) * w])
  }
  return [...left, ...right.reverse()]
}

const pointOn = (s: Seg, t: number): [number, number] => {
  const mt = 1 - t
  return [mt * mt * s.x0 + 2 * mt * t * s.cx + t * t * s.x1, mt * mt * s.y0 + 2 * mt * t * s.cy + t * t * s.y1]
}

/* ── 굽기 ─────────────────────────────────────────────────── */

/* 구운 그림의 나무 좌표 범위(밑동 = 0,0) */
const BX0 = -40, BX1 = 40, BY0 = -62, BY1 = 6
const BAKE_SCALE = 3

export interface BakeInput {
  state: TreeState
  /** 첫 등장 때 꽃·새잎이 피어나는 정도 0 → 1 */
  bloomIn: number
  /** 가지 위 눈 0 → 1 */
  snow: number
}

function bakeTree(theme: RailTheme, inp: BakeInput, dpr: number): HTMLCanvasElement {
  const P = PALETTE[theme]
  const { segs, tips, clusters } = shape()
  const { state: st, bloomIn, snow } = inp
  const sc = BAKE_SCALE * Math.max(1, dpr / 2)
  const cv = document.createElement('canvas')
  cv.width = Math.ceil((BX1 - BX0) * sc)
  cv.height = Math.ceil((BY1 - BY0) * sc)
  const ctx = cv.getContext('2d')!
  ctx.setTransform(sc, 0, 0, sc, -BX0 * sc, -BY0 * sc)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  // 밑동 그늘 — 언덕에 발 딛고 선 느낌(없으면 나무가 그림 위에 떠 보인다)
  const gr = mulberry(5)
  stain(ctx, 1.5, 1.2, 9, P.ground, theme === 'dark' ? 0.06 : 0.045, gr, { layers: 6, squash: 0.22 })

  // 잎 덩어리 — 가지보다 먼저 뒤쪽 그림자 겹, 가지, 그 위에 앞 겹(가지가 잎 사이로 비친다)
  const leafy = st.foliage > 0.01
  const visible = (c: Cluster) => clamp01((st.foliage - c.u * 0.92) * 6)
  const leafColor = (c: Cluster) => {
    const k = clamp01(st.fall * 1.35 - c.turn * 0.35)
    const green = mix(P.summer[c.ci % P.summer.length], P.freshLeaf[c.ci % P.freshLeaf.length], st.fresh)
    return mix(green, P.autumn[c.ci % P.autumn.length], k)
  }
  const grownIn = st.fresh > 0.3 ? bloomIn : 1

  if (leafy) {
    // 그림자 겹 — 오른쪽 아래로 살짝 밀린 한 톤 짙은 얼룩(빛은 왼쪽 위에서)
    for (const c of clusters) {
      const v = visible(c) * grownIn
      if (v <= 0.01 || c.r < 4) continue
      const r = mulberry(c.seed + 1)
      stain(ctx, c.x + 1.3, c.y + 1.6, c.r * 0.95, P.bark, P.wash * 0.35 * v, r, { layers: 5 })
    }
  }

  // 가지 — 세 번 어긋나게 겹쳐 가장자리를 무르게
  const br = mulberry(31)
  for (let pass = 0; pass < 3; pass++) {
    ctx.fillStyle = P.bark
    ctx.globalAlpha = pass === 0 ? 0.55 : 0.28
    for (const s of segs) {
      const j = pass === 0 ? 0 : 0.22
      const p = segPoly(s, pass === 2 ? 0.12 : 0).map(([x, y]) => [x + gauss(br) * j, y + gauss(br) * j] as [number, number])
      fillPoly(ctx, p)
    }
  }
  // 줄기·굵은 가지 왼쪽에 빛 한 줄(입체감)
  ctx.globalAlpha = theme === 'dark' ? 0.35 : 0.45
  ctx.strokeStyle = P.barkLight
  for (const s of segs) {
    if (s.depth > 2) continue
    ctx.lineWidth = Math.max(0.3, s.w0 * 0.22)
    ctx.beginPath()
    const o = s.w0 * 0.22
    ctx.moveTo(s.x0 - o, s.y0)
    ctx.quadraticCurveTo(s.cx - o, s.cy, s.x1 - o * 0.6, s.y1)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // 가지 끝 눈(싹) — 꽃보다 먼저 온다
  if (st.buds > 0.02) {
    const r = mulberry(9)
    ctx.fillStyle = P.bud
    for (const t of tips) {
      if (r() > st.buds) continue
      ctx.globalAlpha = 0.75 * st.buds * bloomIn
      ctx.beginPath()
      ctx.ellipse(t.x1, t.y1, 0.75, 0.55, t.ang, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // 앞 잎 겹
  /* 다크에서 잎이 성글 때(늦가을·이른 봄) — 동그란 얼룩 몇 개만 따로 남으면 밤하늘 앞에서 등불·열매처럼 읽혔다
     (2026-11-22). 얼룩은 옅은 기운으로만 남기고, 그 자리에 작은 잎 조각을 흩어 가지에 몇 잎씩 매달린 모습으로 */
  const sparse = theme === 'dark' ? clamp01((0.65 - st.foliage) / 0.4) : 0
  if (leafy) {
    for (const c of clusters) {
      const v = visible(c) * grownIn
      if (v <= 0.01) continue
      const r = mulberry(c.seed)
      const col = leafColor(c)
      stain(ctx, c.x, c.y, c.r * (0.55 + 0.45 * Math.min(1, st.foliage * 1.3)), col, P.wash * v * (1 - sparse * 0.75), r)
      // 빛 받는 왼쪽 위 — 한 톤 밝은 얼룩을 작게
      if (c.r > 4) stain(ctx, c.x - c.r * 0.3, c.y - c.r * 0.35, c.r * 0.45, P.freshLeaf[0], P.wash * 0.45 * v * (1 - sparse), r, { layers: 4 })
      if (sparse > 0.01) {
        // 잎 조각 — 덩어리 둘레(가운데보다 가장자리)에 흩는다. 끝이 뾰족한 작은 잎, 방향은 제각각
        const n = Math.round(c.r * 2.4 * v * sparse)
        const lr = mulberry(c.seed + 7)
        for (let i = 0; i < n; i++) {
          const a = lr() * Math.PI * 2
          const d = Math.pow(lr(), 0.6) * c.r * 1.05
          const x = c.x + Math.cos(a) * d
          const y = c.y + Math.sin(a) * d * 0.85
          const L = 0.75 + lr() * 0.45, Wd = 0.42 + lr() * 0.2
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(lr() * Math.PI)
          ctx.fillStyle = mix(col, P.bark, lr() * 0.35)
          ctx.globalAlpha = (0.5 + lr() * 0.3) * v * sparse
          ctx.beginPath()
          ctx.moveTo(-L, 0)
          ctx.quadraticCurveTo(0, -Wd * 1.6, L, 0)
          ctx.quadraticCurveTo(0, Wd * 1.6, -L, 0)
          ctx.fill()
          ctx.restore()
        }
        ctx.globalAlpha = 1
      }
    }
  }

  // 꽃 — 가지 끝 덩어리마다 작은 점들. 한 송이 = 옅은 테두리 번짐 + 밝은 속
  if (st.blossom > 0.02) {
    const r = mulberry(4242)
    for (const c of clusters) {
      const n = Math.round((c.r > 4 ? 9 : 4) * st.blossom * bloomIn)
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2
        const d = Math.sqrt(r()) * c.r * 0.95
        const x = c.x + Math.cos(a) * d
        const y = c.y + Math.sin(a) * d * 0.85
        const rad = 0.65 + r() * 0.55
        const col = P.blossom[Math.floor(r() * P.blossom.length)]
        ctx.fillStyle = col
        ctx.globalAlpha = 0.35
        ctx.beginPath()
        ctx.arc(x, y, rad * 1.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 0.85
        ctx.beginPath()
        ctx.arc(x, y, rad, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  // 가지 위 눈 — 가로로 누운 가지일수록 두껍게, 선 줄기엔 거의 안 앉는다. 아래에 옅은 푸른 그늘
  if (snow > 0.01) {
    for (const pass of [0, 1] as const) {
      ctx.strokeStyle = pass === 0 ? P.snowShade : P.snow
      for (const s of segs) {
        const flat = Math.abs(Math.sin(s.ang))
        const th = snow * (0.35 + flat * 1.25) * (0.55 + Math.min(1.6, s.w0) * 0.45)
        if (th < 0.12) continue
        // 가지 윗면 — 획의 바깥쪽 위로 두께 절반만큼 올린다
        const up = s.w0 / 2 + th * 0.35
        ctx.globalAlpha = pass === 0 ? 0.45 : 0.95
        ctx.lineWidth = th * (pass === 0 ? 1.15 : 1)
        ctx.beginPath()
        const t0 = 0.08, t1 = s.depth >= 5 ? 0.8 : 0.95
        const [ax, ay] = pointOn(s, t0)
        ctx.moveTo(ax, ay - up + (pass === 0 ? 0.35 : 0))
        for (let i = 1; i <= 4; i++) {
          const [x, y] = pointOn(s, t0 + ((t1 - t0) * i) / 4)
          ctx.lineTo(x, y - up + (pass === 0 ? 0.35 : 0))
        }
        ctx.stroke()
      }
    }
    // 가지가 갈라지는 오금에 소복이
    ctx.fillStyle = P.snow
    for (const s of segs) {
      if (s.depth < 1 || s.depth > 3) continue
      ctx.globalAlpha = 0.9 * snow
      ctx.beginPath()
      ctx.ellipse(s.x0, s.y0 - s.w0 * 0.55, s.w0 * 0.75 * snow + 0.2, s.w0 * 0.4 * snow + 0.1, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
  return cv
}

/* ── 떨어지는 것들 ────────────────────────────────────────── */

interface Fly {
  kind: 'leaf' | 'petal'
  x0: number; x: number; y: number; t: number
  vy: number; drift: number; amp: number; w: number; ph: number
  rot: number; spin: number; flip: number; flipV: number
  size: number; color: string
  /** 땅에 닿은 뒤 */
  landed: boolean; land: number; life: number; age: number
}

interface Sprout { x: number; y: number; blades: { a: number; len: number; bend: number }[]; color: string; delay: number }

/* ── 번개 맞은 나무 (다크·폭풍, 아주 드물게) ────────────────
   번개 한 번에 3% — 폭풍은 6~11초마다 치니 폭풍 속에서 대략 5분에 한 번꼴. 한 번 타면 10분은 다시 안 탄다.
   불은 빗속이라 오래 못 간다: 1.5초에 번져 9초까지 타오르다 24초쯤 꺼지고, 김·연기가 조금 더 남는다 */
const FIRE_CHANCE = 0.03
const FIRE_COOLDOWN_MS = 10 * 60 * 1000
const FIRE_LEN = 24
/* 꺼진 뒤 김·연기가 남는 시간 — 2026-11-22 "꺼질 때 연기가 더 나면 자연스럽겠다"로 10 → 18초 */
const SMOKE_TAIL = 18
let lastFireAt = -Infinity

/* 번쩍임 세기 — 날씨 엔진(railWeatherScene flashEnv)과 같은 곡선이라 번쩍임과 번개 줄기가 함께 뛴다 */
const flashEnv = (t: number) => t < 0 ? 0 : t < 60 ? 1 : t < 130 ? 0.22 : t < 200 ? 0.85 : Math.max(0, 0.85 * Math.exp(-(t - 200) / 230))

/* 불의 세기 0 → 1 → 0 */
const fireLevel = (t: number) => t < 0 ? 0 : t < 1.5 ? t / 1.5 : t < 9 ? 1 : t < FIRE_LEN ? Math.pow(1 - (t - 9) / (FIRE_LEN - 9), 1.4) : 0

/* tone — 연기만: 0 잿빛 연기(타는 동안) → 1 하얀 김(빗물에 꺼질 때) */
type Spark = { kind: 'flame' | 'ember' | 'smoke'; x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; tone: number }

/* 가운데만 밝고 가장자리는 사라지는 둥근 빛 한 점 — 색별로 한 번만 굽는다 */
const spriteCache = new Map<string, HTMLCanvasElement>()
const sprite = (rgb: string) => {
  let c = spriteCache.get(rgb)
  if (c) return c
  c = document.createElement('canvas')
  c.width = c.height = 32
  const g = c.getContext('2d')!
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  gr.addColorStop(0, `rgba(${rgb},1)`)
  gr.addColorStop(0.45, `rgba(${rgb},0.45)`)
  gr.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = gr
  g.fillRect(0, 0, 32, 32)
  spriteCache.set(rgb, c)
  return c
}

function jaggedBolt(x0: number, y0: number, x1: number, y1: number): { main: Pt2[]; branches: Pt2[][] } {
  let pts: Pt2[] = [[x0, y0], [x1, y1]]
  let off = Math.abs(y1 - y0) * 0.14
  for (let it = 0; it < 5; it++) {
    const next: Pt2[] = []
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[k + 1]
      next.push([ax, ay], [(ax + bx) / 2 + (Math.random() - 0.5) * 2 * off, (ay + by) / 2 + (Math.random() - 0.5) * off * 0.4])
    }
    next.push(pts[pts.length - 1])
    pts = next
    off *= 0.55
  }
  const branches: Pt2[][] = []
  for (let i = 4; i < pts.length - 6; i += 5) {
    if (Math.random() > 0.45) continue
    const [bx, by] = pts[i]
    const dir = Math.random() < 0.5 ? -1 : 1
    const len = 8 + Math.random() * 14
    branches.push([[bx, by], [bx + dir * len * 0.35, by + len * 0.45], [bx + dir * len * 0.7, by + len]])
  }
  return { main: pts, branches }
}
type Pt2 = [number, number]

/* ── 나무에 내리는 비 ─────────────────────────────────────
   비는 날씨 캔버스(나무 뒤)에 그려져 나무 앞을 지나가지 않았다 — 잎에 부딪히지도, 불을 끄지도 않아 보였다(2026-11-22).
   나무 둘레에만 빗줄기를 한 겹 더 그린다: 좌우로 갈수록 옅어져 뒤의 비와 이어지고, 잎에 맞으면 튀고,
   불꽃에 맞으면 치익 하고 작은 김이 오른다. 불 가까이 지나는 빗줄기는 불빛을 받아 주황으로 물든다.
   빠르기·기울기는 날씨 엔진(railWeatherScene VARIANTS)의 가랑비·비·폭풍 값에 맞췄다 */
export type TreeRain = 'drizzle' | 'rain' | 'storm'
const TREE_RAIN: Record<TreeRain, { rate: number; v: number; slant: number; len: number; a: number; drips: number }> = {
  drizzle: { rate: 22, v: 220, slant: -0.06, len: 4, a: 0.4, drips: 0.8 },
  rain: { rate: 60, v: 470, slant: -0.12, len: 9, a: 0.55, drips: 2 },
  storm: { rate: 105, v: 720, slant: -0.3, len: 13, a: 0.62, drips: 3.5 },
}
/* 나무 둘레 빗줄기 폭(이미지 px, 반폭) */
const RAIN_RX = 46
interface Drop { x: number; y: number; v: number; len: number; age: number }
interface Splat { x: number; y: number; t: number; bits: { vx: number; vy: number }[]; hot?: boolean }
interface Drip { x: number; y: number; vy: number; delay: number }

export interface TreeSceneOpts {
  /** 동작 줄이기 — 루프 없이 한 장 */
  still?: boolean
  /** 시연 — 꽃 피어나기·새싹 돋기를 처음 몇 초에 보여 주고, 낙엽·눈을 조금 더 잦게 */
  demo?: boolean
  /** 나무 자리 — 기본 앞 언덕 */
  placement?: TreePlacement
  /** 불이 붙고 꺼질 때 — 타는 동안은 궂은 날 가라앉힘 필터를 푼다(불꽃까지 칙칙해지지 않게) */
  onBurning?: (burning: boolean) => void
}

export class RailTreeScene {
  private ctx: CanvasRenderingContext2D
  private theme: RailTheme = 'light'
  private w = 0
  private h = 0
  private dpr = 1
  private state: TreeState
  private baked: HTMLCanvasElement | null = null
  private bakedKey = ''
  private time = 0
  private bloomIn = 1
  private snow = 0
  private snowing = false
  private rainMode: TreeRain | null = null
  private drops: Drop[] = []
  private splats: Splat[] = []
  private drips: Drip[] = []
  private wind = 1
  private flies: Fly[] = []
  private sprouts: Sprout[] = []
  private nextLeaf = 0
  private nextGust: number
  private rnd = Math.random
  private opts: TreeSceneOpts

  private canvas: HTMLCanvasElement
  private place: Place
  /* 번개 맞은 뒤 흐른 시간(초) — 없으면 null */
  private fireT: number | null = null
  private bolt: { main: Pt2[]; branches: Pt2[][] } | null = null
  private sparks: Spark[] = []
  private emitters: Pt2[] = []

  constructor(canvas: HTMLCanvasElement, date: Date, opts: TreeSceneOpts = {}) {
    this.canvas = canvas
    this.place = PLACES[opts.placement ?? 'front']
    this.ctx = canvas.getContext('2d')!
    this.opts = opts
    this.state = treeStateFor(date)
    this.nextGust = 8 + Math.random() * 10
    // 봄 첫 등장은 피어나는 모습부터(시연), 평소엔 이미 핀 채로
    this.bloomIn = opts.demo && !opts.still && (this.state.blossom > 0.05 || this.state.fresh > 0.3) ? 0 : 1
    this.buildSprouts()
    this.seedFallen()
  }

  setTheme(theme: RailTheme) {
    if (theme === this.theme) return
    this.theme = theme
    this.bakedKey = ''
    for (const f of this.flies) f.color = this.recolor(f)
    for (const s of this.sprouts) s.color = PALETTE[theme].sprout[Math.floor(Math.random() * 3)]
  }

  /** 날짜를 바꾼다(시연 슬라이더) — 떨어진 잎은 새 날짜에 맞춰 다시 깐다 */
  setDate(date: Date) {
    this.state = treeStateFor(date)
    this.bloomIn = 1
    this.flies = []
    this.seedFallen()
  }

  /** 지금 눈이 오는가 / 바람 세기(1 = 보통, 폭풍 ≈ 3) */
  setWeather(snowing: boolean, wind = 1, rain: TreeRain | null = null) {
    this.rainMode = rain
    this.snowing = snowing
    this.wind = wind
  }

  /** 가지 위 눈을 바로 정한다(눈 그친 뒤 다시 떴을 때 이어 붙이기) */
  setSnow(level: number) {
    this.snow = clamp01(level)
  }
  get snowLevel() {
    return this.snow
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w
    this.h = h
    this.dpr = dpr
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
    this.bakedKey = ''
  }

  /* 이미지 y → 캔버스 y */
  private get oy() {
    return this.h - (ART_H - ART_DROP_PX)
  }

  private recolor(f: Fly) {
    const P = PALETTE[this.theme]
    const list = f.kind === 'leaf' ? P.leaf : P.blossom
    return list[Math.floor(Math.random() * list.length)]
  }

  private buildSprouts() {
    const r = mulberry(303)
    const P = PALETTE[this.theme]
    this.sprouts = []
    // 앞 언덕 비탈에 드문드문 — 예배당(157~194) 바로 앞과 우체통 기둥(64~70)은 피한다
    const spots = [86, 94, 101, 108, 113, 131, 137, 146, 151, 201, 209, 218, 228, 79, 118, 142, 205]
    for (const sx of spots) {
      const x = sx + (r() - 0.5) * 3
      const y = frontRidgeY(x) + 1.5 + r() * 9
      const n = 2 + Math.floor(r() * 3)
      const blades = []
      for (let i = 0; i < n; i++) blades.push({ a: (i - (n - 1) / 2) * 0.42 + (r() - 0.5) * 0.25, len: 1.8 + r() * 2.2, bend: (r() - 0.5) * 0.6 })
      this.sprouts.push({ x, y, blades, color: P.sprout[Math.floor(r() * P.sprout.length)], delay: r() * 0.6 })
    }
  }

  /* 이미 떨어져 있던 낙엽 — 밑동 둘레, 비탈 아래쪽으로 더 */
  private seedFallen() {
    const n = Math.round(this.state.fallen * 30)
    for (let i = 0; i < n; i++) {
      const { x: px, scale } = this.place
      const x = px + 3 * scale + gauss(this.rnd) * 19 * scale
      const f = this.makeFly('leaf', x, 0)
      this.settle(f, true)
      f.age = Math.random() * f.life * 0.5
      this.flies.push(f)
    }
  }

  private makeFly(kind: Fly['kind'], x: number, y: number): Fly {
    const P = PALETTE[this.theme]
    const leaf = kind === 'leaf'
    const list = leaf ? P.leaf : P.blossom
    const k = this.place.scale
    return {
      kind, x0: x, x, y, t: 0,
      vy: (leaf ? 7 + Math.random() * 5 : 4 + Math.random() * 3) * (0.4 + 0.6 * k),
      drift: (leaf ? 1.6 : 2.6) + Math.random() * 2,
      amp: ((leaf ? 2.2 : 3) + Math.random() * 3) * k,
      w: 1.3 + Math.random() * 1.1,
      ph: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 3,
      flip: Math.random() * Math.PI * 2,
      flipV: 2.5 + Math.random() * 3,
      size: (leaf ? 1 + Math.random() * 0.45 : 0.7 + Math.random() * 0.25) * (0.3 + 0.7 * k),
      color: list[Math.floor(Math.random() * list.length)],
      landed: false, land: 0, life: leaf ? 140 + Math.random() * 120 : 18 + Math.random() * 14, age: 0,
    }
  }

  /* 땅에 눕힌다 — 비탈 앞쪽(보는 사람 쪽)으로 조금씩 흩어 언덕 표면에 앉은 것처럼 */
  private settle(f: Fly, seeded = false) {
    const ridge = this.place.ground(f.x)
    f.landed = true
    // 비탈 면에 넓게 — 능선 바로 밑에만 모이면 한 무더기로 보인다(1차 피드백)
    f.land = ridge + 1 + Math.pow(Math.random(), 0.8) * (seeded ? 16 : 12) * this.place.scale
    f.y = f.land
    f.rot = (Math.random() - 0.5) * 0.9
    f.flip = Math.PI / 2 - 0.9 - Math.random() * 0.4 // 납작하게 누운 잎
  }

  private spawn(kind: Fly['kind']) {
    const { clusters } = shape()
    const live = clusters.filter((c) => (kind === 'leaf' ? this.state.foliage - c.u * 0.92 > -0.05 : c.r > 3))
    const c = live.length ? live[Math.floor(Math.random() * live.length)] : clusters[Math.floor(Math.random() * clusters.length)]
    const { x: px, y: py, scale: k } = this.place
    const f = this.makeFly(kind, px + (c.x + (Math.random() - 0.5) * c.r * 1.4) * k, py + (c.y + (Math.random() - 0.5) * c.r) * k)
    this.flies.push(f)
  }

  /** 날씨 엔진이 번개를 칠 때 묻는다 — 다크 테마·폭풍(바람 세기 ≥ 2.9)에서만, 아주 드물게 받는다 */
  claimStrike(): StrikeHit | null {
    if (this.theme !== 'dark' || this.opts.still || this.fireT !== null || this.wind < 2.9) return null
    const forced = takeArmed()
    if (!forced && (Math.random() > FIRE_CHANCE || Date.now() - lastFireAt < FIRE_COOLDOWN_MS)) return null
    lastFireAt = Date.now()
    const { x: px, y: py, scale: k } = this.place
    // 불붙는 자리 — 잎이 있으면 잎 덩어리, 빈 가지면 가지 끝. 꼭대기 쪽일수록 자주
    const { clusters, tips } = shape()
    const live = clusters.filter((c) => this.state.foliage - c.u * 0.92 > 0)
    const src: Pt2[] = (live.length >= 4 ? live.map((c) => [c.x, c.y] as Pt2) : tips.map((t) => [t.x1, t.y1] as Pt2))
      .sort((a, b) => a[1] - b[1])
      .slice(0, 14)
    this.emitters = src.map(([x, y]) => [px + x * k, py + y * k])
    const top = this.emitters.reduce((m, p) => (p[1] < m[1] ? p : m), this.emitters[0] ?? [px, py - 40 * k])
    // 칸 꼭대기(이미지 y = -oy)에서 나무 꼭대기로
    this.bolt = jaggedBolt(top[0] + (Math.random() - 0.5) * 50, -this.oy - 6, top[0], top[1])
    this.fireT = 0
    this.opts.onBurning?.(true)
    return { x: top[0] }
  }

  private updateFire(dt: number) {
    if (this.fireT === null) return
    this.fireT += dt
    const t = this.fireT - 0.25 // 번개가 닿은 뒤 한 박자 뒤에 붙는다
    if (t > FIRE_LEN + SMOKE_TAIL && !this.sparks.length) {
      this.fireT = null
      this.bolt = null
      this.opts.onBurning?.(false)
      return
    }
    const I = fireLevel(t)
    const k = this.place.scale
    const em = this.emitters
    const pick = () => {
      // 위쪽 덩어리에 더 자주 — 앞쪽 몇 개에 가중
      const p = em[Math.floor(Math.pow(Math.random(), 1.6) * em.length)]
      return p ?? [this.place.x, this.place.y - 30 * k]
    }
    const spawn = (kind: Spark['kind'], n: number, tone = 0) => {
      let whole = Math.floor(n)
      if (Math.random() < n - whole) whole++
      for (let i = 0; i < whole; i++) {
        const [x, y] = pick()
        const flame = kind === 'flame'
        this.sparks.push({
          kind,
          x: x + (Math.random() - 0.5) * 4 * k,
          y: y + (Math.random() - 0.3) * 3 * k,
          vx: (Math.random() - 0.5) * 2 + this.wind * (kind === 'smoke' ? 2.2 : kind === 'ember' ? 1.6 : 0.5),
          vy: flame ? -(7 + Math.random() * 7) * k : kind === 'ember' ? -(9 + Math.random() * 8) * k : -(3.5 + Math.random() * 3),
          age: 0,
          life: flame ? 0.35 + Math.random() * 0.45 : kind === 'ember' ? 1.2 + Math.random() * 1.6 : 4.5 + Math.random() * 3.5,
          size: flame ? (2.2 + Math.random() * 2.4) * k : kind === 'ember' ? 0.5 + Math.random() * 0.4 : 2.5 + Math.random() * 3,
          tone: Math.max(0, Math.min(1, tone + (Math.random() - 0.5) * 0.3)),
        })
      }
    }
    if (t >= 0) {
      spawn('flame', 70 * I * dt)
      spawn('ember', 5 * I * dt)
      /* 연기·김 — 타는 동안은 잿빛 연기가 가늘게, 빗물에 사그라들수록 하얀 김이 굵어지고,
         꺼지는 순간(마지막 2초~꺼진 뒤 1초) 한 번 확 피어오른 뒤, 꺼진 자리에서 가늘게 오래 남는다 */
      if (t < FIRE_LEN) {
        const dying = (1 - I) * Math.min(1, t / 6)
        spawn('smoke', (1.2 + 10 * dying) * dt, dying)
      } else if (t < FIRE_LEN + SMOKE_TAIL) {
        const u = (t - FIRE_LEN) / SMOKE_TAIL
        spawn('smoke', 7 * Math.pow(1 - u, 1.5) * dt, 0.85 - u * 0.5)
      }
      if (t > FIRE_LEN - 2 && t < FIRE_LEN + 1) spawn('smoke', 9 * dt, 1)
    }
    for (const p of this.sparks) {
      p.age += dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.kind === 'ember') {
        p.vx += (Math.random() - 0.5) * 12 * dt
        p.vy += 3 * dt // 빗방울에 눌려 곧 처진다
      } else if (p.kind === 'smoke') {
        // 오르며 느려지고 퍼진다 — 바람에 점점 더 눕는다
        p.size += 3.2 * dt
        p.vy *= 1 - 0.22 * dt
        p.vx += this.wind * 0.6 * dt
      }
    }
    this.sparks = this.sparks.filter((p) => p.age < p.life)
  }

  private drawFire(ctx: CanvasRenderingContext2D) {
    if (this.fireT === null) return
    const ts = this.fireT * 1000
    const t = this.fireT - 0.25
    const I = fireLevel(t)
    const flick = 0.82 + 0.18 * Math.sin(this.time * 17) * Math.sin(this.time * 5.3 + 1)

    // 연기 — 불보다 뒤에, 어두운 하늘에 옅은 잿빛
    for (const p of this.sparks) {
      if (p.kind !== 'smoke') continue
      const u = p.age / p.life
      // 빨리 피어나 천천히 흩어진다
      ctx.globalAlpha = Math.min(1, u / 0.12) * Math.pow(1 - u, 1.3) * (0.16 + 0.08 * p.tone)
      const sz = p.size
      ctx.drawImage(sprite(p.tone > 0.5 ? '188,194,204' : '122,126,134'), p.x - sz, p.y - sz, sz * 2, sz * 2)
    }

    ctx.globalCompositeOperation = 'lighter'
    // 둘레를 물들이는 불빛 — 언덕·예배당 벽까지 은은하게
    if (I > 0) {
      const [cx, cy] = this.emitters[0] ?? [this.place.x, this.place.y - 30]
      const R = 46 * this.place.scale
      const gr = ctx.createRadialGradient(cx, cy + 8, 2, cx, cy + 8, R)
      gr.addColorStop(0, `rgba(255,150,60,${0.32 * I * flick})`)
      gr.addColorStop(0.5, `rgba(230,100,40,${0.12 * I * flick})`)
      gr.addColorStop(1, 'rgba(200,80,30,0)')
      ctx.globalAlpha = 1
      ctx.fillStyle = gr
      ctx.fillRect(cx - R, cy + 8 - R, R * 2, R * 2)
    }
    // 불꽃 혀 — 갓 생긴 것은 노란 흰빛, 늙을수록 주황→붉게 식으며 작아진다
    for (const p of this.sparks) {
      if (p.kind === 'smoke') continue
      const u = p.age / p.life
      if (p.kind === 'flame') {
        const rgb = u < 0.25 ? '255,236,170' : u < 0.6 ? '255,164,64' : '214,84,36'
        const sz = p.size * (1 - u * 0.6)
        ctx.globalAlpha = (1 - u) * 0.55 * flick
        ctx.drawImage(sprite(rgb), p.x - sz, p.y - sz * 1.5, sz * 2, sz * 3)
      } else {
        ctx.globalAlpha = (1 - u) * (0.6 + 0.4 * Math.sin(p.age * 30 + p.x))
        const sz = p.size * 2
        ctx.drawImage(sprite('255,190,110'), p.x - sz, p.y - sz, sz * 2, sz * 2)
      }
    }
    // 번개 줄기 — 처음 0.7초
    if (this.bolt && ts < 700) {
      const f = flashEnv(ts)
      const line = (pts: Pt2[]) => {
        ctx.beginPath()
        ctx.moveTo(pts[0][0], pts[0][1])
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
        ctx.stroke()
      }
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = 1
      ctx.strokeStyle = `rgba(170,200,255,${0.35 * f})`
      ctx.lineWidth = 6
      line(this.bolt.main)
      ctx.lineWidth = 3
      for (const b of this.bolt.branches) line(b)
      ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, f * 1.2)})`
      ctx.lineWidth = 1.5
      line(this.bolt.main)
      ctx.lineWidth = 0.8
      for (const b of this.bolt.branches) line(b)
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

  /* 지금 잎이 달린 덩어리(이미지 좌표 원) — 빗방울이 부딪히는 자리 */
  private canopyHits(): [number, number, number][] {
    const { x: px, y: py, scale: k } = this.place
    return shape().clusters
      .filter((c) => this.state.foliage - c.u * 0.92 > 0.02)
      .map((c) => [px + c.x * k, py + c.y * k, c.r * k * 0.85])
  }

  private updateRain(dt: number) {
    const cfg = this.rainMode ? TREE_RAIN[this.rainMode] : null
    const { x: px, y: py, scale: k } = this.place
    const topY = py - 52 * k
    if (cfg) {
      let n = cfg.rate * dt
      while (n > 0) {
        if (n < 1 && Math.random() > n) break
        n -= 1
        this.drops.push({
          x: px + (Math.random() * 2 - 1) * RAIN_RX - cfg.slant * 40,
          y: topY - 40 - Math.random() * 30,
          v: cfg.v * (0.85 + Math.random() * 0.3),
          len: cfg.len * (0.8 + Math.random() * 0.5),
          age: 0,
        })
      }
      // 불붙은 자리에는 비를 더 모은다 — 시선이 가는 곳이라 거기서 빗줄기가 불을 때리는 게 보여야 한다
      const burningNow = this.fireT !== null ? fireLevel(this.fireT - 0.25) : 0
      if (burningNow > 0.03 && this.emitters.length) {
        let m = cfg.rate * 0.55 * burningNow * dt
        while (m > 0) {
          if (m < 1 && Math.random() > m) break
          m -= 1
          const [ex, ey] = this.emitters[Math.floor(Math.random() * this.emitters.length)]
          const fall = 40 + Math.random() * 30
          this.drops.push({
            // 기울어 떨어지므로 그만큼 바람 위쪽에서 출발시켜 불 자리에 닿게 한다
            x: ex + (Math.random() - 0.5) * 8 * k - cfg.slant * fall,
            y: ey - fall,
            v: cfg.v * (0.85 + Math.random() * 0.3),
            len: cfg.len * (0.8 + Math.random() * 0.5),
            age: 0,
          })
        }
      }
      // 잎 끝에 맺혔다 떨어지는 물방울
      if (Math.random() < cfg.drips * dt) {
        const hits = this.canopyHits()
        const h = hits[Math.floor(Math.random() * hits.length)]
        if (h) this.drips.push({ x: h[0] + (Math.random() - 0.5) * h[2], y: h[1] + h[2] * 0.7, vy: 0, delay: 0.15 + Math.random() * 0.3 })
      }
    }
    if (!this.drops.length && !this.splats.length && !this.drips.length) return

    const hits = this.drops.length ? this.canopyHits() : []
    const burning = this.fireT !== null ? fireLevel(this.fireT - 0.25) : 0
    const slant = cfg?.slant ?? -0.12
    const keep: Drop[] = []
    for (const d of this.drops) {
      d.age += dt
      d.y += d.v * dt
      d.x += slant * d.v * dt
      let gone = false
      // 불꽃에 떨어진 빗방울 — 치익: 불티 섞인 물보라 + 김 한 줌 + 그 자리 불꽃이 잠깐 죽는다
      if (burning > 0.03 && Math.random() < 0.55 && this.nearFire(d.x, d.y, 8 * k)) {
        this.fireHit(d.x, d.y, k)
        gone = true
      }
      // 잎 덩어리에 맞는다 — 다 맞지는 않는다(사이로 빠져나가는 비)
      if (!gone) for (const [hx, hy, hr] of hits) {
        const dx = d.x - hx, dy = d.y - hy
        if (dx * dx + dy * dy < hr * hr && Math.random() < 0.18) {
          this.splat(d.x, d.y, 2 + Math.floor(Math.random() * 2))
          // 불꽃에 맞은 빗방울 — 치익, 작은 김
          if (burning > 0.03 && this.nearFire(d.x, d.y, 7 * k)) {
            this.sparks.push({ kind: 'smoke', x: d.x, y: d.y, vx: (Math.random() - 0.5) * 3, vy: -(6 + Math.random() * 6), age: 0,
              life: 0.6 + Math.random() * 0.7, size: 1.1 + Math.random() * 1.2, tone: 1 })
          }
          gone = true
          break
        }
      }
      if (!gone && d.y > this.place.ground(d.x) + 2 + Math.random() * 6) {
        if (Math.random() < 0.35) this.splat(d.x, d.y, 2)
        gone = true
      }
      if (!gone) keep.push(d)
    }
    this.drops = keep
    for (const sp of this.splats) sp.t += dt
    this.splats = this.splats.filter((sp) => sp.t < 0.28)
    for (const dr of this.drips) {
      if (dr.delay > 0) { dr.delay -= dt; continue }
      dr.vy += 260 * dt
      dr.y += dr.vy * dt
    }
    this.drips = this.drips.filter((dr) => dr.y < this.place.ground(dr.x) + 4)
  }

  private fireHit(x: number, y: number, k: number) {
    // 맞은 자리 불꽃을 걷어낸다 — 불길이 빗방울에 눌려 깜빡 꺼지는 결
    this.sparks = this.sparks.filter((p) => p.kind !== 'flame' || (p.x - x) ** 2 + (p.y - y) ** 2 > (3.2 * k) ** 2)
    this.sparks.push({ kind: 'smoke', x, y: y - 1, vx: (Math.random() - 0.5) * 4, vy: -(8 + Math.random() * 8), age: 0,
      life: 0.8 + Math.random() * 0.8, size: 1.6 + Math.random() * 1.6, tone: 1 })
    const bits = []
    for (let i = 0; i < 4; i++) bits.push({ vx: (Math.random() - 0.5) * 46, vy: -(18 + Math.random() * 26) })
    this.splats.push({ x, y, t: 0, bits, hot: true })
  }

  private splat(x: number, y: number, n: number) {
    const bits = []
    for (let i = 0; i < n; i++) bits.push({ vx: (Math.random() - 0.5) * 40, vy: -(14 + Math.random() * 22) })
    this.splats.push({ x, y, t: 0, bits })
  }

  private nearFire(x: number, y: number, r: number) {
    for (const [ex, ey] of this.emitters) if ((x - ex) ** 2 + (y - ey) ** 2 < r * r) return true
    return false
  }

  private drawRain(ctx: CanvasRenderingContext2D) {
    if (!this.drops.length && !this.splats.length && !this.drips.length) return
    const cfg = TREE_RAIN[this.rainMode ?? 'rain']
    const dark = this.theme === 'dark'
    const base = dark ? [200, 216, 240] : [76, 94, 122]
    const px = this.place.x
    const burning = this.fireT !== null ? fireLevel(this.fireT - 0.25) : 0
    const [fx, fy] = this.emitters[0] ?? [px, this.place.y - 30]
    const lit = (x: number, y: number) => {
      if (burning <= 0 || !dark) return 0
      const d = Math.hypot(x - fx, y - fy - 6)
      return d < 38 ? (1 - d / 38) * burning : 0
    }
    /* 불빛을 받은 빗줄기는 주황이 아니라 따뜻한 흰빛 — 주황으로 물들이면 불꽃 색에 묻혀 비가 안 보였다.
       불 앞을 지나는 물방울은 역광을 받아 반짝이는 쪽이 실제에 가깝다 */
    const col = (k: number, a: number) =>
      `rgba(${Math.round(base[0] + (255 - base[0]) * k)},${Math.round(base[1] + (234 - base[1]) * k)},${Math.round(base[2] + (196 - base[2]) * k)},${a})`
    ctx.lineCap = 'round'
    ctx.lineWidth = 0.7
    for (const d of this.drops) {
      // 좌우 가장자리로 갈수록 옅게 — 뒤의 비와 이어진다
      const edge = Math.max(0, 1 - Math.abs(d.x - px) / RAIN_RX)
      const a = cfg.a * Math.pow(edge, 0.8) * Math.min(1, d.age / 0.08)
      if (a < 0.02) continue
      const k = lit(d.x, d.y)
      ctx.strokeStyle = col(k, Math.min(1, a * (1 + 1.4 * k)))
      ctx.lineWidth = 0.7 + 0.4 * k
      const dx = cfg.slant * d.len
      ctx.beginPath()
      ctx.moveTo(d.x - dx, d.y - d.len)
      ctx.lineTo(d.x, d.y)
      ctx.stroke()
    }
    // 튀는 물방울 — 불에 떨어진 것은 불빛을 받은 물보라(따뜻한 흰빛·조금 크게)
    for (const sp of this.splats) {
      const t = sp.t
      ctx.fillStyle = sp.hot ? 'rgba(255,226,170,0.95)' : dark ? 'rgba(214,226,244,0.8)' : 'rgba(96,114,142,0.7)'
      ctx.globalAlpha = 1 - t / 0.28
      for (const b of sp.bits) {
        ctx.beginPath()
        ctx.arc(sp.x + b.vx * t, sp.y + b.vy * t + 130 * t * t, sp.hot ? 0.5 : 0.38, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    // 잎 끝 물방울 — 떨어질수록 길쭉하게
    for (const dr of this.drips) {
      const k = lit(dr.x, dr.y)
      ctx.globalAlpha = dr.delay > 0 ? 0.5 : 0.85
      ctx.fillStyle = col(k, 1)
      ctx.beginPath()
      ctx.ellipse(dr.x, dr.y, 0.45, 0.5 + Math.min(1.6, dr.vy / 60), 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  get animating() {
    return !this.opts.still
  }

  update(dt: number) {
    this.time += dt
    const st = this.state
    const demo = !!this.opts.demo

    if (this.bloomIn < 1) {
      this.bloomIn = Math.min(1, this.bloomIn + dt / 4.5)
    }
    // 가지 위 눈 — 오는 동안 쌓이고(시연 25초·평소 2분), 그치면 아주 천천히 녹는다
    if (this.snowing) this.snow = Math.min(1, this.snow + dt / (demo ? 25 : 120))
    else if (this.snow > 0) this.snow = Math.max(0, this.snow - dt / 1500)

    // 낙엽·꽃잎
    const rate = st.leafRate * (demo ? 1.6 : 1) * (0.6 + this.wind * 0.4)
    const prate = st.petalRate * (demo ? 1.6 : 1)
    this.nextLeaf -= dt
    if (this.nextLeaf <= 0 && (rate > 0.01 || prate > 0.01)) {
      const total = rate + prate
      this.spawn(Math.random() * total < rate ? 'leaf' : 'petal')
      this.nextLeaf = (-Math.log(1 - Math.random() * 0.95) / Math.max(0.02, total))
    }
    // 이따금 지나가는 바람 — 몇 장이 한꺼번에 떨어진다
    this.nextGust -= dt
    if (this.nextGust <= 0) {
      this.nextGust = 14 + Math.random() * 18
      const n = st.leafRate > 0.05 ? 3 + Math.floor(Math.random() * 3) : st.petalRate > 0.05 ? 4 + Math.floor(Math.random() * 4) : 0
      for (let i = 0; i < n; i++) this.spawn(st.leafRate > 0.05 ? 'leaf' : 'petal')
      this.gustT = 0
    }
    if (this.gustT < 6) this.gustT += dt
    this.updateFire(dt)
    this.updateRain(dt)

    for (const f of this.flies) {
      if (f.landed) {
        f.age += dt
        continue
      }
      f.t += dt
      const gust = this.gustT < 6 ? Math.sin((this.gustT / 6) * Math.PI) * 6 : 0
      f.x0 += (f.drift * this.wind + gust) * dt
      f.x = f.x0 + Math.sin(f.t * f.w + f.ph) * f.amp
      // 흔들릴 때(옆으로 미끄러질 때) 덜 떨어진다 — 잎이 공기를 타는 결
      const swing = Math.abs(Math.cos(f.t * f.w + f.ph))
      f.y += f.vy * (0.55 + 0.45 * swing) * dt
      f.rot += f.spin * dt
      f.flip += f.flipV * dt
      const gy = this.place.ground(f.x) + 1
      if (f.y >= gy) {
        if (f.kind === 'petal' || Math.random() < 0.85) this.settle(f)
        else f.landed = true
        if (f.y < gy) f.y = gy
      }
      if (f.x > 252 || f.y > ART_H) f.age = f.life
    }
    // 수명 다한 것 거두기 + 땅에 쌓인 잎 수 상한
    this.flies = this.flies.filter((f) => f.age < f.life)
    const landed = this.flies.filter((f) => f.landed)
    if (landed.length > 46) {
      landed.sort((a, b) => b.age - a.age)
      const drop = new Set(landed.slice(0, landed.length - 46))
      this.flies = this.flies.filter((f) => !drop.has(f))
    }
  }
  private gustT = 99

  draw() {
    const { ctx, dpr } = this
    if (!this.w || !this.h) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    const oy = this.oy

    // 새싹 — 나무보다 먼저(뒤)
    const st = this.state
    if (st.sprouts > 0.02) {
      const P = PALETTE[this.theme]
      ctx.setTransform(dpr, 0, 0, dpr, 0, oy * dpr)
      ctx.lineCap = 'round'
      const grow = this.opts.demo && !this.opts.still ? clamp01(this.time / 3.5) : 1
      for (const s of this.sprouts) {
        const g = clamp01((grow - s.delay * 0.5) / 0.5) * st.sprouts
        if (g <= 0) continue
        ctx.strokeStyle = s.color || P.sprout[0]
        ctx.globalAlpha = theme(this.theme, 0.75, 0.85)
        ctx.lineWidth = 0.55
        const sway = Math.sin(this.time * 1.3 + s.x * 0.3) * 0.12 * this.wind
        for (const b of s.blades) {
          const L = b.len * (0.25 + 0.75 * g)
          const a = b.a + sway
          const ex = s.x + Math.sin(a) * L
          const ey = s.y - Math.cos(a) * L
          ctx.beginPath()
          ctx.moveTo(s.x, s.y)
          ctx.quadraticCurveTo(s.x + Math.sin(a + b.bend) * L * 0.5, s.y - L * 0.55, ex, ey)
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1
    }

    // 나무 — 구운 한 장을 밑동 축으로 살짝 기울여 찍는다
    const key = this.bakeKey()
    if (key !== this.bakedKey) {
      this.baked = bakeTree(this.theme, { state: st, bloomIn: this.bloomIn, snow: this.snow }, dpr)
      this.bakedKey = key
    }
    if (this.baked) {
      const sway = this.opts.still
        ? 0
        : (Math.sin(this.time * 0.9) * 0.6 + Math.sin(this.time * 2.3 + 1) * 0.25) * 0.012 * this.wind *
          (0.4 + st.foliage * 0.6) + (this.gustT < 6 ? Math.sin((this.gustT / 6) * Math.PI) * 0.02 : 0)
      const { x: px, y: py, scale: k } = this.place
      ctx.setTransform(dpr * k, 0, 0, dpr * k, px * dpr, (py + oy) * dpr)
      // x' = x - sway·y (y 는 위로 음수) → 꼭대기일수록 바람 방향으로
      ctx.transform(1, 0, -sway, 1, 0, 0)
      ctx.drawImage(this.baked, BX0, BY0, BX1 - BX0, BY1 - BY0)
    }

    // 떨어지는·떨어진 잎
    ctx.setTransform(dpr, 0, 0, dpr, 0, oy * dpr)
    for (const f of this.flies) {
      const fade = f.landed ? clamp01((f.life - f.age) / Math.min(30, f.life * 0.4)) : clamp01(f.t / 0.4)
      if (fade <= 0) continue
      ctx.save()
      ctx.translate(f.x, f.y)
      ctx.rotate(f.rot)
      ctx.scale(1, Math.max(0.18, Math.abs(Math.cos(f.flip))))
      ctx.fillStyle = f.color
      // 땅에 누운 잎 — 다크에선 언덕에 스며들게 한 톤 더 낮춘다(어두운 언덕 위에서 불티처럼 반짝였다)
      ctx.globalAlpha = (f.kind === 'leaf' ? 0.82 : 0.9) * fade * (f.landed ? (this.theme === 'dark' ? 0.5 : 0.85) : 1)
      ctx.beginPath()
      if (f.kind === 'leaf') {
        // 끝이 뾰족한 잎 — 두 호를 맞댄 모양
        const L = 1.7 * f.size, W = 0.85 * f.size
        ctx.moveTo(-L, 0)
        ctx.quadraticCurveTo(0, -W * 1.6, L, 0)
        ctx.quadraticCurveTo(0, W * 1.6, -L, 0)
      } else {
        ctx.ellipse(0, 0, 1.05 * f.size, 0.75 * f.size, 0, 0, Math.PI * 2)
      }
      ctx.fill()
      ctx.restore()
    }
    ctx.globalAlpha = 1

    // 번개 맞은 나무 — 잎·나무 위에, 같은 이미지 좌표계
    this.drawFire(ctx)
    // 나무 앞을 지나는 비 — 불보다도 앞
    this.drawRain(ctx)
  }

  /* 다시 구울지 — 피어나기는 1/20, 눈은 1/40 단위로 끊어 굽는다(매 프레임 굽지 않게) */
  private bakeKey() {
    const s = this.state
    return [this.theme, this.dpr, s.foliage.toFixed(3), s.fall.toFixed(3), s.blossom.toFixed(3), s.buds.toFixed(3), s.fresh.toFixed(3),
      Math.round(this.bloomIn * 20), Math.round(this.snow * 40)].join('|')
  }

  dispose() {
    this.flies = []
    this.baked = null
  }
}

const theme = (t: RailTheme, light: number, dark: number) => (t === 'dark' ? dark : light)
