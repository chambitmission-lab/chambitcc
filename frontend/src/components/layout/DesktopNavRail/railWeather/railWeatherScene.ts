/* PC 좌측 레일 하단 삽화(언덕 위 예배당) 날씨 연출 엔진 — 캔버스 한 장.
 *
 * 좌표계: 시안과 같은 "248 × 400 상자"를 쓴다. 삽화(248 × 349)는 상자 바닥에 붙고(OY = 51),
 * 실제 칸이 400 보다 높으면 상자 위로 남는 하늘(this.top < 0)까지 비·눈·구름이 이어진다.
 * 레일 칸의 네 변 페이드 마스크는 부모(.rail-bottom-art)가 쥐므로 여기선 신경 쓰지 않는다.
 *
 *  - drizzle  : 가랑비 — 가늘고 짧은 빗방울이 드문드문 천천히, 커튼·물보라 거의 없음
 *  - rain     : A 빗속의 등불 — 세 겹 비 + 빗줄기 커튼, 번개 없음
 *  - storm    : B 폭풍 속 예배당 — 돌풍·물보라 + 가지 친 번개(화면 흔들림 없음)
 *  - snow     : C 첫눈 소복 — 능선 셋·지붕·창턱에 쌓임
 *  - blizzard : D 눈보라 — 옆바람·눈안개·드문 눈번개
 * 창 불빛은 어떤 날씨에도 꺼지지 않는다. */

export type RailWeatherMode = 'drizzle' | 'rain' | 'storm' | 'snow' | 'blizzard'
export type RailTheme = 'light' | 'dark'

const W = 248
const BOX_H = 400
const IH = 349
const OY = BOX_H - IH
/* 삽화를 칸 바닥 아래로 내리는 양 — 그림 밑 빈 바탕을 잘라낸다.
 * ★ DesktopNavRail.css 의 .rail-bottom-art background-position(100% + 76px)과 같은 값 */
const ART_DROP = 76
const WIN = { x: 183.7, y: 281.6 }
const SILL: [number, number, number] = [181.4, 186.0, 284.8]
// 지붕(왼쪽 처마 → 박공 꼭대기 → 용마루 끝 → 오른쪽 처마)과 십자가 팔
const ROOF: [number, number][] = [[157.5, 276], [166.9, 261], [187.5, 261.6], [193.8, 276]]
const ROOF_GABLE_R: [number, number] = [175.6, 276]
const ARM: [number, number][] = [[164.6, 254.8], [169.9, 254.8]]
// 그림 속 능선(이미지 기준 y) — 하늘 경계는 그림에서 읽고, 앞의 두 능선은 손으로 짚었다.
// 삽화(rail/bottom-*.webp)를 다시 구우면 이 좌표도 함께 확인해야 한다.
const RIDGE_L_PTS: [number, number][] = [[70, 207], [80, 212], [92, 218], [104, 221], [116, 223], [128, 226], [140, 231], [150, 235]]
const RIDGE_F_PTS: [number, number][] = [[34, 277], [44, 272], [56, 269], [68, 268], [80, 265], [92, 261], [104, 255], [116, 251], [128, 246],
  [140, 242], [152, 239.5], [158, 239], [194, 239.5], [200, 238.5], [212, 240], [224, 245], [236, 248], [246, 252]]

interface Variant {
  kind: 'rain' | 'snow'
  overlay: number
  clouds: number
  cloudSpeed: number
  glow: number
  bolt?: 'near' | 'snow'
  every?: [number, number]
  first?: number
  shake?: number
  // rain
  layers?: [number, number, number]
  speed?: number
  /** 빗줄기 길이·농도 배율(기본 1) — 가랑비는 짧고 옅게 */
  lenMul?: number
  alphaMul?: number
  slant?: number
  gustAmp?: number
  gustRate?: number
  veils?: number
  veilA?: number
  mist?: boolean
  splash?: number
  // snow
  count?: number
  fall?: [number, number]
  wind?: number
  gust?: boolean
  maxDepth?: number
  growth?: number
  fog?: boolean
  drift?: boolean
}

/* 입자 수는 시안의 약 75% — 레일은 모든 화면에 떠 있으므로 가볍게 */
const VARIANTS: Record<RailWeatherMode, Variant> = {
  // 가랑비: 방울 수 절반 이하·속도 0.4배·짧고 옅게 — 굵은 앞줄 비와 빗줄기 커튼은 없다
  drizzle: { kind: 'rain', layers: [34, 18, 0], speed: 0.4, lenMul: 0.6, alphaMul: 0.7, slant: -0.06, gustAmp: 0.03, gustRate: 0.25,
    overlay: 0.1, clouds: 2, cloudSpeed: 2.5, veils: 0, splash: 0.12, glow: 1.0 },
  rain: { kind: 'rain', layers: [68, 45, 5], speed: 0.8, slant: -0.12, gustAmp: 0.05, gustRate: 0.35,
    overlay: 0.26, clouds: 3, cloudSpeed: 4, veils: 2, veilA: 0.07, splash: 0.35, glow: 1.0 },
  storm: { kind: 'rain', layers: [128, 98, 18], speed: 1.3, slant: -0.3, gustAmp: 0.13, gustRate: 0.55,
    overlay: 0.52, clouds: 5, cloudSpeed: 13, veils: 4, veilA: 0.16, mist: true,
    bolt: 'near', every: [6, 11], first: 1.4, splash: 1, glow: 1.25 },
  // ★천둥 흔들림(shake)은 껐다(2026-11-14) — 그림 전체가 떨려 어지럽다는 피드백. 창 불빛 떨림은 유지
  snow: { kind: 'snow', count: 72, fall: [14, 30], wind: 5, overlay: 0.12, clouds: 2, cloudSpeed: 2,
    maxDepth: 5, growth: 0.15, glow: 1.05 },
  blizzard: { kind: 'snow', count: 190, fall: [55, 95], wind: -70, gust: true, overlay: 0.3, clouds: 4, cloudSpeed: 10,
    maxDepth: 6.4, growth: 0.32, fog: true, bolt: 'snow', every: [16, 28], first: 3.5, glow: 1.1, drift: true },
}

const RAIN_LAYER = [
  { v: [360, 430] as [number, number], len: [5, 8] as [number, number], w: 0.55, a: 0.32 },
  { v: [520, 640] as [number, number], len: [9, 14] as [number, number], w: 0.8, a: 0.48 },
  { v: [820, 1000] as [number, number], len: [22, 34] as [number, number], w: 1.35, a: 0.42 },
]

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const randIn = (r: [number, number]) => rand(r[0], r[1])

type Pt = [number, number]
interface Bolt { main: Pt[]; branches: Pt[][] }
interface Strike { t0: number; bolt: Bolt | null; bx: number }
interface RainDrop { L: number; x: number; y: number; v: number; len: number; jit: number; half: boolean }
interface Flake { x: number; y: number; r: number; v: number; ph: number; sway: number; depth: number; a: number; target: number }
interface Splash { x: number; y: number; t: number; drops: { x: number; y: number; vx: number; vy: number }[] }
interface Ridge { y: Float32Array; k: number; noise: Float32Array; d: Float32Array }
interface Cloud { x: number; y: number; s: number; v: number }
interface Veil { x: number; w: number; a: number; v: number }

interface ArtRes {
  img: HTMLImageElement
  sky: Float32Array
  ridgeL: Float32Array
  ridgeF: Float32Array
  cloud: HTMLCanvasElement
  flake: HTMLCanvasElement
}

/* 쌓인 눈은 레일이 잠깐 내려갔다 다시 떠도(삽화 없는 화면 → 돌아옴) 이어서 보이게 기억한다 */
let snowMemory: { ridges: Float32Array[]; roof: number; at: number } | null = null
const SNOW_MEMORY_MS = 1000 * 60 * 60 * 6

function ridgeFrom(pts: Pt[]): Float32Array {
  const out = new Float32Array(W).fill(NaN)
  for (let k = 0; k < pts.length - 1; k++) {
    const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]
    for (let x = Math.ceil(x0); x <= Math.min(W - 1, Math.floor(x1)); x++) out[x] = y0 + (y1 - y0) * (x - x0) / (x1 - x0) + OY
  }
  return out
}

/* 하늘 경계: 배경색과 처음 달라지는 y — 번개·구름·먼 비를 "언덕 뒤"로 자르는 선 */
function contourOf(img: HTMLImageElement, theme: RailTheme): Float32Array {
  const c = document.createElement('canvas'); c.width = W; c.height = IH
  const g = c.getContext('2d', { willReadFrequently: true })
  const out = new Float32Array(W)
  if (!g) return out.fill(OY + 200)
  g.drawImage(img, 0, 0, W, IH)
  const d = g.getImageData(0, 0, W, IH).data
  const lum = (x: number, y: number) => { const i = (y * W + x) * 4; return 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2] }
  const bg = lum(5, 5), th = theme === 'light' ? 6 : 14
  const raw = new Float32Array(W)
  for (let x = 0; x < W; x++) {
    let y0 = IH
    for (let y = 110; y < IH; y++) if (Math.abs(lum(x, y) - bg) > th) { y0 = y; break }
    raw[x] = y0 + OY
  }
  const firstX = Math.max(0, raw.findIndex((v) => v < BOX_H))
  let lastX = W - 1
  while (lastX > 0 && raw[lastX] >= BOX_H) lastX--
  for (let x = 0; x < firstX; x++) raw[x] = raw[firstX]
  for (let x = lastX + 1; x < W; x++) raw[x] = raw[lastX]
  /* 먼 언덕은 오른쪽 끝이 물에 풀려 사라지는데, 문턱값 판정은 그 자리에서 경계를 한 열 만에
   * 70px 떨어뜨린다 — 그 수직 절벽을 따라 구름(회색)이 잘려 예배당 오른쪽에 회색 기둥이 섰다
   * (2026-11-14). 경계가 내려가는 기울기를 묶어, 능선이 완만하게 이어 내려가게 한다
   * (옅은 물감 때문에 생긴 좁은 틈도 같이 메워진다). */
  const MAX_DROP = 0.8
  for (let x = 1; x < W; x++) raw[x] = Math.min(raw[x], raw[x - 1] + MAX_DROP)
  for (let x = W - 2; x >= 0; x--) raw[x] = Math.min(raw[x], raw[x + 1] + MAX_DROP)
  for (let x = 0; x < W; x++) {
    let s = 0, n = 0
    for (let k = -2; k <= 2; k++) { const xx = x + k; if (xx >= 0 && xx < W) { s += raw[xx]; n++ } }
    out[x] = s / n
  }
  return out
}

function makeCloud(theme: RailTheme): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = 220; c.height = 90
  const g = c.getContext('2d'); if (!g) return c
  const col = theme === 'light' ? '96,108,128' : '92,100,116'
  for (let i = 0; i < 9; i++) {
    const x = rand(40, 180), y = rand(35, 58), r = rand(22, 40)
    const gr = g.createRadialGradient(x, y, 0, x, y, r)
    gr.addColorStop(0, `rgba(${col},0.32)`); gr.addColorStop(1, `rgba(${col},0)`)
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
  }
  return c
}

function makeFlake(theme: RailTheme): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = c.height = 16
  const g = c.getContext('2d'); if (!g) return c
  const gr = g.createRadialGradient(8, 8, 0, 8, 8, 8)
  if (theme === 'light') {
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.95)')
    gr.addColorStop(0.62, 'rgba(120,138,165,0.35)'); gr.addColorStop(1, 'rgba(120,138,165,0)')
  } else {
    gr.addColorStop(0, 'rgba(240,246,255,1)'); gr.addColorStop(0.5, 'rgba(225,235,250,0.7)'); gr.addColorStop(1, 'rgba(225,235,250,0)')
  }
  g.fillStyle = gr; g.fillRect(0, 0, 16, 16)
  return c
}

/* 부드러운 1차원 잡음 — 눈 더미의 울퉁불퉁함과 쌓이는 속도 차이 */
function noise1d(seedCount = 4): Float32Array {
  const ph = Array.from({ length: seedCount }, () => [rand(0, 6.28), rand(0.04, 0.22), rand(0.3, 1)])
  const out = new Float32Array(W)
  let mn = Infinity, mx = -Infinity
  for (let x = 0; x < W; x++) {
    let v = 0
    for (const [p, f, a] of ph) v += a * Math.sin(x * f + p)
    out[x] = v; mn = Math.min(mn, v); mx = Math.max(mx, v)
  }
  for (let x = 0; x < W; x++) out[x] = (out[x] - mn) / (mx - mn || 1)
  return out
}

/* 중점 변위로 번개 줄기 + 곁가지 */
function makeBolt(x0: number, y0: number, x1: number, y1: number, rough: number, depth: number): Bolt {
  let pts: Pt[] = [[x0, y0], [x1, y1]]
  let off = rough
  for (let i = 0; i < 6; i++) {
    const next: Pt[] = [pts[0]]
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[k + 1]
      next.push([(ax + bx) / 2 + rand(-off, off), (ay + by) / 2 + rand(-off * 0.25, off * 0.25)])
      next.push(pts[k + 1])
    }
    pts = next; off *= 0.55
  }
  const branches: Pt[][] = []
  if (depth > 0) {
    const n = depth === 2 ? 3 : 1
    for (let b = 0; b < n; b++) {
      const i = Math.floor(rand(pts.length * 0.2, pts.length * 0.6))
      const [bx, by] = pts[i]
      const len = rand(25, 55), dir = Math.random() < 0.5 ? -1 : 1
      branches.push(makeBolt(bx, by, bx + dir * len * 0.7, by + len, rough * 0.4, 0).main)
    }
  }
  return { main: pts, branches }
}

/* 번쩍임 곡선(ms): 번쩍 → 꺼짐 → 다시 번쩍 → 서서히 사라짐 */
const flashEnv = (t: number) => t < 0 ? 0 : t < 60 ? 1 : t < 130 ? 0.22 : t < 200 ? 0.85 : Math.max(0, 0.85 * Math.exp(-(t - 200) / 230))

const resCache = new Map<string, ArtRes>()
export function buildArtRes(img: HTMLImageElement, theme: RailTheme): ArtRes {
  const key = `${theme}:${img.src}`
  const hit = resCache.get(key)
  if (hit) return hit
  const res: ArtRes = {
    img, sky: contourOf(img, theme), ridgeL: ridgeFrom(RIDGE_L_PTS), ridgeF: ridgeFrom(RIDGE_F_PTS),
    cloud: makeCloud(theme), flake: makeFlake(theme),
  }
  resCache.set(key, res)
  return res
}

export class RailWeatherScene {
  private cv: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private layer: HTMLCanvasElement
  private lctx: CanvasRenderingContext2D
  private cfg: Variant
  private theme: RailTheme = 'light'
  private bg = '#f1f3f6'
  private res: ArtRes | null = null
  private scale = 1
  /* 캔버스 맨 위가 상자 좌표로 어디인지 — 칸이 400 보다 높으면 음수 */
  private top = 0
  private h = BOX_H
  private time = 0
  private strike: Strike | null = null
  private nextStrike: number
  private rain: RainDrop[] = []
  private flakes: Flake[] = []
  private splashes: Splash[] = []
  private landed: { x: number; y: number; r: number; t: number }[] = []
  private sparkles: { x: number; y: number; t: number; life: number }[] = []
  private ridges: Ridge[] = []
  private roof = 0
  private clouds: Cloud[] = []
  private veils: Veil[] = []
  private curSlant: number
  private lamp = 1

  constructor(canvas: HTMLCanvasElement, mode: RailWeatherMode) {
    this.cv = canvas
    this.cfg = VARIANTS[mode]
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    this.layer = document.createElement('canvas')
    this.lctx = this.layer.getContext('2d') as CanvasRenderingContext2D
    this.nextStrike = this.cfg.first ?? Infinity
    this.curSlant = this.cfg.slant ?? 0
  }

  setArt(res: ArtRes, theme: RailTheme, bg: string) {
    const first = !this.res
    this.res = res; this.theme = theme; this.bg = bg
    if (first) {
      this.ridges = [
        { y: res.sky, k: 0.62, noise: noise1d(), d: new Float32Array(W) },
        { y: res.ridgeL, k: 0.82, noise: noise1d(), d: new Float32Array(W) },
        { y: res.ridgeF, k: 1, noise: noise1d(), d: new Float32Array(W) },
      ]
      if (this.cfg.kind === 'snow' && snowMemory && Date.now() - snowMemory.at < SNOW_MEMORY_MS) {
        snowMemory.ridges.forEach((d, i) => this.ridges[i].d.set(d))
        this.roof = snowMemory.roof
      }
      this.spawnAll()
    } else {
      // 테마가 바뀌면 하늘 경계만 갈아 끼운다 — 쌓인 눈은 그대로
      this.ridges[0].y = res.sky
    }
  }

  /* cssW·cssH 는 칸의 실제 크기(px) */
  resize(cssW: number, cssH: number, dpr: number) {
    const s = cssW / W
    this.h = cssH / s
    // 칸이 400 보다 높으면 음수(위로 하늘이 더), 낮으면 양수(삽화 윗부분이 잘린다 — CSS 배경과 같은 바닥 정렬)
    this.top = BOX_H - this.h - ART_DROP
    this.cv.width = this.layer.width = Math.max(1, Math.round(cssW * dpr))
    this.cv.height = this.layer.height = Math.max(1, Math.round(cssH * dpr))
    this.scale = s * dpr
    this.clouds = Array.from({ length: this.cfg.clouds }, () => ({
      x: rand(-200, W), y: this.top + rand(8, 150 - this.top * 0.5), s: rand(0.8, 1.5), v: this.cfg.cloudSpeed * rand(0.6, 1.3),
    }))
    this.veils = Array.from({ length: this.cfg.veils ?? 0 }, () => ({
      x: rand(-60, W + 60), w: rand(40, 90), a: (this.cfg.veilA ?? 0) * rand(0.6, 1.1), v: rand(0.7, 1.2),
    }))
  }

  /* 언마운트 때 쌓인 눈을 기억해 둔다 */
  dispose() {
    if (this.cfg.kind === 'snow' && this.ridges.length) {
      snowMemory = { ridges: this.ridges.map((r) => new Float32Array(r.d)), roof: this.roof, at: Date.now() }
    }
  }

  private get bottom() { return BOX_H + 40 }

  private spawnAll() {
    const c = this.cfg
    if (c.kind === 'rain') {
      this.rain = []
      ;(c.layers ?? [0, 0, 0]).forEach((n, L) => { for (let i = 0; i < n; i++) this.rain.push(this.spawnRain(L, true)) })
    } else {
      this.flakes = Array.from({ length: c.count ?? 0 }, () => this.spawnSnow(true))
    }
  }

  private spawnRain(L: number, initial: boolean): RainDrop {
    const s = RAIN_LAYER[L], sp = this.cfg.speed ?? 1
    return {
      L, x: rand(-20, W + 140), y: initial ? rand(this.top - BOX_H, BOX_H) : rand(this.top - 80, this.top - 10),
      v: randIn(s.v) * sp, len: randIn(s.len) * (sp > 1 ? 1.15 : 1) * (this.cfg.lenMul ?? 1), jit: rand(-0.04, 0.04), half: Math.random() < 0.5,
    }
  }

  private spawnSnow(initial: boolean): Flake {
    const c = this.cfg, depth = Math.random()
    // 어느 능선에 내려앉을지 깊이로 정한다. 가장 가까운 눈송이는 화면 밖으로 지나감
    const target = depth < 0.38 ? 0 : depth < 0.66 ? 1 : depth < 0.9 ? 2 : -1
    return {
      x: (c.wind ?? 0) < -20 ? rand(0, W + 160) : rand(-20, W + 20),
      y: initial ? rand(this.top - 20, BOX_H) : rand(this.top - 30, this.top - 6),
      r: 0.7 + depth * 2.2 + (target < 0 ? 1 : 0), v: randIn(c.fall ?? [20, 30]) * (0.5 + depth * 0.7), ph: rand(0, 6.28),
      sway: rand(5, 14), depth, a: 0.55 + depth * 0.45, target,
    }
  }

  private trigger() {
    const c = this.cfg, res = this.res
    if (!c.bolt || !res) return
    let bolt: Bolt | null = null
    if (c.bolt === 'near') {
      const ex = Math.random() < 0.5 ? rand(120, 158) : rand(196, 215)
      bolt = makeBolt(ex + rand(-40, 40), this.top - 10, ex, res.sky[Math.round(ex)] + 2, 28, 2)
    }
    this.strike = { t0: this.time, bolt, bx: bolt ? bolt.main[bolt.main.length - 1][0] : rand(60, 190) }
    this.nextStrike = this.time + randIn(c.every ?? [10, 20])
  }

  /* 비의 기울기(dx/dy) — 느린 너울 + 가끔 돌풍 */
  private gustStrength(t: number) {
    return Math.max(0, Math.sin(t * (this.cfg.gustRate ?? 0) * 0.7 + 1.3)) ** 3
  }
  private slant(t: number) {
    const c = this.cfg, amp = c.gustAmp ?? 0, rate = c.gustRate ?? 0
    return (c.slant ?? 0) + amp * (0.5 * Math.sin(t * rate) + 0.3 * Math.sin(t * rate * 2.3 + 2)) - amp * 1.4 * this.gustStrength(t)
  }
  private wind(t: number) {
    const c = this.cfg
    if (!c.gust) return c.wind ?? 0
    const g = 0.55 + 0.45 * Math.sin(t * 0.45) + 0.25 * Math.sin(t * 1.7 + 1)
    return (c.wind ?? 0) * Math.max(0.15, g)
  }

  private rainStop(p: RainDrop, res: ArtRes) {
    const xi = Math.round(p.x)
    if (xi < 0 || xi >= W) return this.bottom
    if (p.L === 1) {
      const l = res.ridgeL[xi]
      // 왼쪽 언덕이 있는 곳은 반쯤 거기서, 나머지는 앞 언덕에서 멈춘다
      if (!Number.isNaN(l) && p.half) return l
      const f = res.ridgeF[xi]
      return Number.isNaN(f) ? this.bottom : f
    }
    if (p.L === 0) return res.sky[xi] + 6 // 먼 비는 하늘 클립으로 언덕 뒤에서 사라진다
    return this.bottom
  }

  update(dt: number) {
    const c = this.cfg, res = this.res
    if (!res) return
    this.time += dt
    if (c.bolt && this.time >= this.nextStrike) this.trigger()
    const cloudDir = c.gust ? Math.sign(this.wind(this.time)) : 1
    for (const cl of this.clouds) {
      cl.x += cl.v * dt * cloudDir * (c.kind === 'rain' ? 1 + this.gustStrength(this.time) : 1)
      if (cl.x > W + 20) cl.x = -230
      if (cl.x < -240) cl.x = W + 10
    }
    if (c.kind === 'rain') this.updateRain(dt, res)
    else this.updateSnow(dt)
  }

  private updateRain(dt: number, res: ArtRes) {
    const c = this.cfg, sl = this.slant(this.time), gs = 1 + 0.5 * this.gustStrength(this.time)
    this.curSlant = sl
    for (let i = 0; i < this.rain.length; i++) {
      const p = this.rain[i]
      const v = p.v * gs
      p.y += v * dt; p.x += v * (sl + p.jit) * dt
      const stop = this.rainStop(p, res)
      if (p.y > stop) {
        if (p.L === 1 && c.splash && p.x > 6 && p.x < W - 6 && Math.random() < c.splash) this.splash(p.x, stop)
        this.rain[i] = this.spawnRain(p.L, false)
      }
    }
    // 빗줄기 커튼은 바람 방향으로 흘러간다
    for (const vl of this.veils) {
      vl.x += sl * 90 * vl.v * gs * dt
      if (vl.x < -160) { vl.x = W + 160; vl.w = rand(40, 90) }
      if (vl.x > W + 170) vl.x = -150
    }
    for (const s of this.splashes) {
      s.t += dt
      for (const d of s.drops) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 260 * dt }
    }
    this.splashes = this.splashes.filter((s) => s.t < 0.32)
  }

  private splash(x: number, y: number) {
    if (this.splashes.length > 60) return
    const n = (this.cfg.splash ?? 0) >= 1 ? 3 : 2
    const drops = Array.from({ length: n }, () => ({ x, y, vx: rand(-22, 22) + this.curSlant * 30, vy: rand(-55, -25) }))
    this.splashes.push({ x, y, t: 0, drops })
  }

  private updateSnow(dt: number) {
    const c = this.cfg, w = this.wind(this.time), maxDepth = c.maxDepth ?? 4
    for (let i = 0; i < this.flakes.length; i++) {
      const p = this.flakes[i]
      p.y += p.v * dt
      p.x += (Math.sin(this.time * 1.1 + p.ph) * p.sway * (1 - Math.abs(w) / 120) + w * (0.5 + p.depth * 0.7)) * dt
      const xi = Math.round(p.x)
      if (p.target >= 0 && xi >= 0 && xi < W) {
        let R = this.ridges[p.target]
        if (p.target === 1 && Number.isNaN(R.y[xi])) R = this.ridges[2]
        const ry = R.y[xi]
        if (!Number.isNaN(ry)) {
          // 지붕 위로 떨어지는 앞 능선 눈송이는 지붕에 얹힌다
          if (p.target === 2 && p.x > 157 && p.x < 194) {
            const roofY = this.roofYAt(p.x) - this.roof * 0.6
            if (p.y > roofY) {
              this.roof = Math.min(maxDepth * 0.85, this.roof + 0.06)
              this.land(p, roofY)
              this.flakes[i] = this.spawnSnow(false)
              continue
            }
          }
          const top = ry - R.d[xi] * 0.8
          if (p.y > top) {
            const amt = 0.09 * R.k
            for (let k = -4; k <= 4; k++) {
              const xx = xi + k
              if (xx >= 0 && xx < W) R.d[xx] = Math.min(maxDepth * R.k * (0.7 + 0.3 * R.noise[xx]), R.d[xx] + amt * Math.exp(-k * k / 5))
            }
            this.land(p, top)
            this.flakes[i] = this.spawnSnow(false)
            continue
          }
        }
      }
      if (p.y > BOX_H + 10 || p.x < -30 || p.x > W + 200) this.flakes[i] = this.spawnSnow(false)
    }
    // 고르게 조금씩 + 잡음만큼 차이 나게. 눈보라는 바람 받는 비탈이 더 쌓인다
    for (const R of this.ridges) {
      const d = R.d, cap = maxDepth * R.k
      for (let x = 0; x < W; x++) {
        if (Number.isNaN(R.y[x])) continue
        let g = (c.growth ?? 0) * R.k * (0.45 + 0.9 * R.noise[x])
        if (c.drift && x > 1) { const s = R.y[x] - R.y[x - 1]; if (!Number.isNaN(s)) g *= 1 + Math.max(0, s * 1.2 + 0.3) }
        d[x] = Math.min(cap * (0.7 + 0.3 * R.noise[x]), d[x] + g * dt)
      }
      for (let x = 1; x < W - 1; x++) d[x] += 0.12 * ((d[x - 1] + d[x + 1]) / 2 - d[x])
    }
    this.roof = Math.min(maxDepth * 0.85, this.roof + (c.growth ?? 0) * 0.9 * dt)
    for (const l of this.landed) l.t += dt
    this.landed = this.landed.filter((l) => l.t < 1.6)
    // 반짝임
    if (Math.random() < dt * (this.theme === 'dark' ? 3 : 1.6)) {
      const R = this.ridges[Math.random() < 0.7 ? 2 : 1], x = Math.floor(rand(20, 228))
      if (!Number.isNaN(R.y[x]) && R.d[x] > 1) this.sparkles.push({ x, y: R.y[x] - R.d[x] * 0.7 + rand(0, 1.2), t: 0, life: rand(0.5, 1.1) })
    }
    for (const s of this.sparkles) s.t += dt
    this.sparkles = this.sparkles.filter((s) => s.t < s.life)
  }

  private land(p: Flake, y: number) {
    if (this.landed.length < 80) this.landed.push({ x: p.x, y: y + rand(-0.4, 0.6), r: Math.min(p.r, 2), t: 0 })
  }

  private roofYAt(x: number) {
    for (let k = 0; k < ROOF.length - 1; k++) {
      const [x0, y0] = ROOF[k], [x1, y1] = ROOF[k + 1]
      if (x >= x0 && x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    }
    return 276
  }

  private skyClip(g: CanvasRenderingContext2D, res: ArtRes) {
    const con = res.sky
    g.beginPath(); g.moveTo(-10, this.top - 10); g.lineTo(W + 10, this.top - 10); g.lineTo(W + 10, con[W - 1] + 1)
    for (let x = W - 1; x >= 0; x--) g.lineTo(x, con[x] + 1)
    g.lineTo(-10, con[0] + 1)
    g.closePath(); g.clip()
  }

  draw() {
    const res = this.res
    if (!res) return
    const g = this.ctx, c = this.cfg, light = this.theme === 'light'
    const st = this.strike
    const ts = st ? (this.time - st.t0) * 1000 : -1
    const f = st ? flashEnv(ts) : 0
    if (st && ts > 1600) this.strike = null
    const top = this.top
    g.setTransform(this.scale, 0, 0, this.scale, 0, -top * this.scale)
    if (c.shake && st && ts > 260 && ts < 900) {
      const k = c.shake * (1 - (ts - 260) / 640)
      g.translate(rand(-k, k), rand(-k * 0.6, k * 0.6))
    }
    g.fillStyle = this.bg
    g.fillRect(-4, top - 4, W + 8, BOX_H - top + 8)
    g.drawImage(res.img, 0, OY, W, IH)

    // 1. 흐린 하늘
    const ov = c.overlay
    const sky = g.createLinearGradient(0, top, 0, BOX_H)
    if (light) {
      sky.addColorStop(0, `rgba(78,92,114,${ov})`); sky.addColorStop(0.62, `rgba(78,92,114,${ov * 0.5})`)
      // 언덕 아래 빈 바탕까지 회색으로 물들면 라이트에서 뿌연 상자가 보인다 — 바닥으로 갈수록 0
      sky.addColorStop(0.8, `rgba(78,92,114,${ov * 0.12})`); sky.addColorStop(0.9, 'rgba(78,92,114,0)')
      g.globalCompositeOperation = 'multiply'
    } else {
      sky.addColorStop(0, `rgba(0,0,0,${ov * 0.5})`); sky.addColorStop(1, `rgba(0,0,0,${ov * 0.35})`)
    }
    g.fillStyle = sky; g.fillRect(-4, top - 4, W + 8, BOX_H - top + 8)
    g.globalCompositeOperation = 'source-over'

    // 2. 언덕 뒤 하늘: 구름 · 먼 비 · 번개
    g.save(); this.skyClip(g, res)
    if (light) g.globalCompositeOperation = 'multiply'
    for (const cl of this.clouds) {
      g.globalAlpha = c.kind === 'snow' ? 0.7 : 1
      g.drawImage(res.cloud, cl.x, cl.y, 220 * cl.s, 90 * cl.s)
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
    if (c.kind === 'rain') this.drawRainLayer(g, 0, light, f)
    if (st && f > 0) {
      const hue = c.bolt === 'snow' ? '214,200,255' : '225,235,255'
      const gr = g.createRadialGradient(st.bx, 90, 10, st.bx, 120, 260)
      gr.addColorStop(0, `rgba(${hue},${0.75 * f})`); gr.addColorStop(1, `rgba(${hue},0)`)
      g.globalCompositeOperation = light ? 'screen' : 'lighter'
      g.fillStyle = gr; g.fillRect(0, top, W, BOX_H - top)
      g.globalCompositeOperation = 'source-over'
      if (st.bolt && ts < 700) this.drawBolt(g, st.bolt, f)
    }
    g.restore()

    // 3. 언덕까지 함께 드러나는 순간 빛
    if (f > 0) {
      const k = c.bolt === 'near' ? 0.55 : 0.32
      g.globalCompositeOperation = light ? 'screen' : 'lighter'
      g.fillStyle = c.bolt === 'snow' ? `rgba(200,190,255,${k * f})` : `rgba(210,225,255,${k * f * (light ? 1 : 0.7)})`
      g.fillRect(-4, top - 4, W + 8, BOX_H - top + 8)
      g.globalCompositeOperation = 'source-over'
    }

    // 4. 눈안개 띠
    if (c.fog) {
      const w = this.wind(this.time)
      for (let i = 0; i < 3; i++) {
        const y = 230 + i * 38
        const x = ((this.time * (20 + i * 9) * Math.sign(w) + i * 140) % (W + 300) + (W + 300)) % (W + 300) - 150
        const gr = g.createRadialGradient(x, y, 0, x, y, 130)
        const col = light ? '255,255,255' : '170,180,196'
        gr.addColorStop(0, `rgba(${col},${light ? 0.55 : 0.16})`); gr.addColorStop(1, `rgba(${col},0)`)
        g.fillStyle = gr; g.save(); g.translate(x, y); g.scale(1.8, 0.35); g.translate(-x, -y)
        g.beginPath(); g.arc(x, y, 130, 0, Math.PI * 2); g.fill(); g.restore()
      }
    }

    // 5. 쌓인 눈
    if (c.kind === 'snow') this.drawSnowCover(g, light, f, res)

    // 6. 창 불빛 — 날씨가 궂을수록 더 또렷하게
    let lamp = c.glow * (0.92 + 0.08 * Math.sin(this.time * 7.3) * Math.sin(this.time * 3.1))
    if (st && c.bolt === 'near' && ts > 250 && ts < 800) lamp *= 0.45 + 0.55 * Math.abs(Math.sin(ts / 40))
    this.lamp = lamp
    const lr = 26 * lamp
    const lg = g.createRadialGradient(WIN.x, WIN.y, 0, WIN.x, WIN.y, lr)
    if (light) {
      lg.addColorStop(0, `rgba(255,196,96,${0.55 * lamp})`); lg.addColorStop(0.35, `rgba(255,190,90,${0.22 * lamp})`); lg.addColorStop(1, 'rgba(255,190,90,0)')
    } else {
      lg.addColorStop(0, `rgba(255,190,90,${0.55 * lamp})`); lg.addColorStop(0.4, `rgba(255,160,60,${0.18 * lamp})`); lg.addColorStop(1, 'rgba(255,160,60,0)')
      g.globalCompositeOperation = 'lighter'
    }
    g.fillStyle = lg; g.fillRect(WIN.x - lr, WIN.y - lr, lr * 2, lr * 2)
    g.globalCompositeOperation = 'source-over'

    // 7. 비 · 눈
    if (c.kind === 'rain') {
      this.drawVeils(g, light, f)
      if (c.mist) this.drawMist(g, light, res)
      this.drawRainLayer(g, 1, light, f)
      this.drawSplashes(g, light)
      this.drawRainLayer(g, 2, light, f)
    } else {
      this.drawSnow(g, res)
    }
  }

  private drawBolt(g: CanvasRenderingContext2D, bolt: Bolt, f: number) {
    const line = (pts: Pt[]) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); g.stroke() }
    g.lineJoin = 'round'; g.lineCap = 'round'
    g.globalCompositeOperation = this.theme === 'light' ? 'source-over' : 'lighter'
    g.strokeStyle = `rgba(170,200,255,${0.35 * f})`; g.lineWidth = 6; line(bolt.main)
    g.lineWidth = 3; for (const b of bolt.branches) line(b)
    g.strokeStyle = `rgba(255,255,255,${Math.min(1, f * 1.2)})`; g.lineWidth = 1.5; line(bolt.main)
    g.lineWidth = 0.8; for (const b of bolt.branches) line(b)
    g.globalCompositeOperation = 'source-over'
  }

  private rainColor(light: boolean, f: number, L: number) {
    if (f > 0.25) return '255,255,255'
    if (light) return L === 2 ? '92,110,138' : '76,94,122'
    return L === 0 ? '170,186,210' : '200,216,240'
  }

  /* 한 층을 한 번에: 꼬리(흐림) + 머리(또렷) 두 획으로 끝이 가늘어지는 빗줄기 */
  private drawRainLayer(g: CanvasRenderingContext2D, L: number, light: boolean, f: number) {
    const s = RAIN_LAYER[L], sl = this.curSlant
    const col = this.rainColor(light, f, L)
    const a = Math.min(1, s.a * (this.cfg.alphaMul ?? 1) * (light ? 1 : 0.9) + f * 0.35)
    g.lineCap = 'round'
    const warm: RainDrop[] = []
    g.beginPath()
    for (const p of this.rain) {
      if (p.L !== L) continue
      const dx = (sl + p.jit) * p.len
      g.moveTo(p.x - dx, p.y - p.len); g.lineTo(p.x - dx * 0.45, p.y - p.len * 0.45)
    }
    g.strokeStyle = `rgba(${col},${a * 0.32})`; g.lineWidth = s.w; g.stroke()
    g.beginPath()
    for (const p of this.rain) {
      if (p.L !== L) continue
      const dx = (sl + p.jit) * p.len
      g.moveTo(p.x - dx * 0.45, p.y - p.len * 0.45); g.lineTo(p.x, p.y)
      if (L > 0) { const ddx = p.x - WIN.x, ddy = p.y - WIN.y; if (ddx * ddx + ddy * ddy < 900) warm.push(p) }
    }
    g.strokeStyle = `rgba(${col},${a})`; g.lineWidth = s.w; g.stroke()
    if (L === 2) {
      // 가장 가까운 비는 살짝 번진 듯 한 겹 더
      g.beginPath()
      for (const p of this.rain) {
        if (p.L !== 2) continue
        const dx = (sl + p.jit) * p.len
        g.moveTo(p.x - dx, p.y - p.len); g.lineTo(p.x, p.y)
      }
      g.strokeStyle = `rgba(${col},${a * 0.12})`; g.lineWidth = s.w * 3; g.stroke()
    }
    // 창 불빛을 받은 빗방울
    for (const p of warm) {
      const k = (1 - Math.hypot(p.x - WIN.x, p.y - WIN.y) / 30) * this.lamp
      const dx = (sl + p.jit) * p.len
      g.strokeStyle = `rgba(255,${light ? 176 : 196},${light ? 80 : 110},${0.85 * k})`; g.lineWidth = s.w
      g.beginPath(); g.moveTo(p.x - dx * 0.5, p.y - p.len * 0.5); g.lineTo(p.x, p.y); g.stroke()
    }
  }

  private drawVeils(g: CanvasRenderingContext2D, light: boolean, f: number) {
    if (!this.veils.length) return
    const sl = this.curSlant, gs = 0.7 + 0.6 * this.gustStrength(this.time)
    const col = f > 0.25 ? '235,242,255' : light ? '232,238,246' : '110,124,146'
    for (const vl of this.veils) {
      g.save()
      g.setTransform(this.scale, 0, sl * this.scale, this.scale, vl.x * this.scale, -this.top * this.scale)
      const gr = g.createLinearGradient(-vl.w, 0, vl.w, 0)
      const a = vl.a * gs * (light ? 1 : 0.8) + f * 0.1
      gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.5, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`)
      g.fillStyle = gr; g.fillRect(-vl.w, this.top, vl.w * 2, BOX_H - this.top)
      g.restore()
    }
  }

  /* 앞 능선을 따라 낮게 깔리는 물보라 */
  private drawMist(g: CanvasRenderingContext2D, light: boolean, res: ArtRes) {
    const F = res.ridgeF, t = this.time
    const col = light ? '238,242,248' : '150,165,185'
    for (let x = 30; x < W; x += 10) {
      const y = F[x]
      if (Number.isNaN(y)) continue
      const a = (light ? 0.35 : 0.1) * (0.6 + 0.4 * Math.sin(x * 0.11 - t * 1.4))
      const gr = g.createRadialGradient(x, y + 1, 0, x, y + 1, 14)
      gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`)
      g.fillStyle = gr; g.fillRect(x - 14, y - 13, 28, 28)
    }
  }

  private drawSplashes(g: CanvasRenderingContext2D, light: boolean) {
    const col = light ? '84,104,134' : '214,228,250'
    g.fillStyle = `rgba(${col},0.75)`
    g.strokeStyle = `rgba(${col},0.45)`; g.lineWidth = 0.6
    for (const s of this.splashes) {
      const k = s.t / 0.32
      g.globalAlpha = 1 - k
      for (const d of s.drops) { g.beginPath(); g.arc(d.x, d.y, 0.55, 0, Math.PI * 2); g.fill() }
      if (k < 0.5) { const r = 1 + k * 6; g.beginPath(); g.moveTo(s.x - r, s.y); g.lineTo(s.x + r, s.y); g.stroke() }
    }
    g.globalAlpha = 1
  }

  private drawSnow(g: CanvasRenderingContext2D, res: ArtRes) {
    const fl = res.flake
    for (const l of this.landed) {
      const s = l.r * 2.4; g.globalAlpha = 0.9 * (1 - l.t / 1.6)
      g.drawImage(fl, l.x - s / 2, l.y - s / 2, s, s)
    }
    for (const p of this.flakes) {
      const s = p.r * 2.6; g.globalAlpha = p.target < 0 ? p.a * 0.6 : p.a
      g.drawImage(fl, p.x - s / 2, p.y - s / 2, s, s)
    }
    g.globalAlpha = 1
  }

  private overlapsFront(x: number, res: ArtRes) {
    const f = res.ridgeF[x]
    return !Number.isNaN(f) && Math.abs(f - res.sky[x]) < 5
  }

  /* 쌓인 눈을 별도 층에 그린 뒤 창 불빛을 그 눈에만 입혀 합친다 */
  private drawSnowCover(g: CanvasRenderingContext2D, light: boolean, f: number, res: ArtRes) {
    const L = this.lctx
    L.setTransform(1, 0, 0, 1, 0, 0); L.clearRect(0, 0, this.layer.width, this.layer.height)
    L.setTransform(this.scale, 0, 0, this.scale, 0, -this.top * this.scale)
    const body = light ? '255,255,255' : '222,230,243'
    const shade = light ? 'rgba(104,124,156,0.26)' : 'rgba(0,0,0,0.35)'
    this.ridges.forEach((R, ri) => {
      // 눈 띠는 능선이 이어진 구간마다, 양 끝은 가늘게. 절벽처럼 끊기는 곳에서 나눈다
      const runs: [number, number][] = []
      let cur: [number, number] | null = null
      for (let x = 0; x < W; x++) {
        const ok = !Number.isNaN(R.y[x]) && R.d[x] > 0.08 && !(ri === 0 && this.overlapsFront(x, res))
          && !(x > 0 && Math.abs(R.y[x] - R.y[x - 1]) > 2.5)
        if (ok) { if (!cur) cur = [x, x]; else cur[1] = x } else if (cur) { runs.push(cur); cur = null }
      }
      if (cur) runs.push(cur)
      for (const [a, b] of runs) {
        if (b - a < 3) continue
        const taper = (x: number) => Math.min(1, (x - a) / 7, (b - x) / 7)
        const top = (x: number) => R.y[x] - R.d[x] * taper(x) * (0.75 + 0.35 * R.noise[(x * 3) % W])
        const bot = (x: number) => R.y[x] + R.d[x] * taper(x) * 0.3
        // 아래 그림자: 눈 더미에 두께가 보이게
        L.beginPath(); L.moveTo(a, bot(a))
        for (let x = a; x <= b; x++) L.lineTo(x, bot(x) + R.d[x] * taper(x) * 0.45 * R.k)
        for (let x = b; x >= a; x--) L.lineTo(x, bot(x) - 0.2)
        L.closePath(); L.fillStyle = shade; L.fill()
        // 몸통: 위는 밝고 아래로 살짝 푸르게
        L.beginPath(); L.moveTo(a, top(a))
        for (let x = a; x <= b; x++) L.lineTo(x, top(x))
        for (let x = b; x >= a; x--) L.lineTo(x, bot(x))
        L.closePath()
        const yMid = R.y[(a + b) >> 1]
        const gr = L.createLinearGradient(0, yMid - 4, 0, yMid + 2)
        gr.addColorStop(0, `rgba(${body},${light ? 1 : 0.95})`)
        gr.addColorStop(1, light ? 'rgba(226,234,246,0.95)' : 'rgba(170,184,206,0.85)')
        L.fillStyle = gr; L.fill()
        // 윗면 빛줄
        if (!light) {
          L.beginPath()
          for (let x = a; x <= b; x++) { if (x === a) L.moveTo(x, top(x) + 0.3); else L.lineTo(x, top(x) + 0.3) }
          L.strokeStyle = 'rgba(255,255,255,0.75)'; L.lineWidth = 0.5; L.stroke()
        }
      }
    })
    this.drawChurchSnow(L, light, body)
    // 창 불빛이 비친 눈
    L.globalCompositeOperation = 'source-atop'
    const wr = L.createRadialGradient(WIN.x, WIN.y + 4, 0, WIN.x, WIN.y + 4, 34)
    wr.addColorStop(0, `rgba(255,186,96,${(light ? 0.2 : 0.38) * this.lamp})`); wr.addColorStop(1, 'rgba(255,186,96,0)')
    L.fillStyle = wr; L.fillRect(WIN.x - 50, WIN.y - 50, 100, 100)
    if (f > 0) { L.fillStyle = `rgba(215,205,255,${0.4 * f})`; L.fillRect(0, this.top, W, BOX_H - this.top) }
    L.globalCompositeOperation = 'source-over'
    // 반짝임
    for (const s of this.sparkles) {
      const k = Math.sin(Math.PI * s.t / s.life), r = 1.6 * k
      const near = Math.hypot(s.x - WIN.x, s.y - WIN.y) < 40
      L.strokeStyle = near ? `rgba(255,214,150,${k})` : light ? `rgba(140,180,240,${k})` : `rgba(255,255,255,${k})`
      L.lineWidth = 0.5
      L.beginPath(); L.moveTo(s.x - r, s.y); L.lineTo(s.x + r, s.y); L.moveTo(s.x, s.y - r); L.lineTo(s.x, s.y + r); L.stroke()
    }
    g.save()
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.drawImage(this.layer, 0, 0)
    g.restore()
  }

  private drawChurchSnow(L: CanvasRenderingContext2D, light: boolean, body: string) {
    const r = this.roof
    if (r < 0.15) return
    const fill = `rgba(${body},${light ? 1 : 0.95})`
    const [le, pk, rd, re] = ROOF
    const GR = ROOF_GABLE_R
    const k = Math.min(1, r / 2.6)
    // 지붕면이 점점 하얗게 덮인다
    L.beginPath(); L.moveTo(pk[0], pk[1]); L.lineTo(rd[0], rd[1]); L.lineTo(re[0], re[1]); L.lineTo(GR[0], GR[1]); L.closePath()
    const rg = L.createLinearGradient(0, pk[1], 0, re[1])
    rg.addColorStop(0, `rgba(${body},${0.95 * k})`)
    rg.addColorStop(1, light ? `rgba(222,231,244,${0.9 * k})` : `rgba(176,190,212,${0.85 * k})`)
    L.fillStyle = rg; L.fill()
    // 용마루 위로 둥글게 부푼 눈 더미
    L.fillStyle = fill
    L.beginPath()
    L.moveTo(pk[0] - 0.5, pk[1] + 0.4)
    L.quadraticCurveTo((pk[0] + rd[0]) / 2, pk[1] - r * 1.15, rd[0] + 0.5, rd[1] - r * 0.1)
    L.lineTo(rd[0] + 0.2, rd[1] + 0.9); L.lineTo(pk[0] + 1, pk[1] + 1.2)
    L.closePath(); L.fill()
    // 박공 왼쪽 가파른 비탈은 아주 얇게
    L.strokeStyle = fill; L.lineCap = 'round'; L.lineJoin = 'round'
    L.lineWidth = Math.min(1, r * 0.35)
    L.beginPath(); L.moveTo(le[0] + 0.4, le[1] - 0.6); L.lineTo(pk[0], pk[1] - 0.4); L.stroke()
    // 처마를 따라 매달린 눈 (작은 물결) + 끝의 눈덩이
    if (r > 0.8) {
      const e = Math.min(1, (r - 0.8) / 1.8)
      for (let i = 0; i <= 5; i++) {
        const x = GR[0] + (re[0] - GR[0]) * i / 5
        L.beginPath(); L.arc(x, 276.2, (0.55 + 0.25 * ((i * 37) % 3) / 2) * e + 0.15, 0, Math.PI * 2); L.fill()
      }
      L.beginPath(); L.arc(re[0] + 0.3, re[1] - 0.1, 1.1 * e, 0, Math.PI * 2); L.fill()
      L.beginPath(); L.arc(le[0] + 0.3, le[1] + 0.1, 0.8 * e, 0, Math.PI * 2); L.fill()
      // 처마 아래로 늘어진 작은 끝
      L.beginPath(); L.moveTo(re[0] - 0.7, re[1] + 0.5); L.lineTo(re[0] - 0.2, re[1] + 0.5 + 1.8 * e); L.lineTo(re[0] + 0.4, re[1] + 0.5); L.fill()
      L.beginPath(); L.moveTo(GR[0] + 3.2, 276.5); L.lineTo(GR[0] + 3.5, 276.5 + 1.2 * e); L.lineTo(GR[0] + 3.9, 276.5); L.fill()
    }
    // 창턱 · 십자가 팔 · 십자가 꼭대기
    L.lineWidth = Math.min(1.3, r * 0.4)
    L.beginPath(); L.moveTo(SILL[0], SILL[2] - 0.3); L.lineTo(SILL[1], SILL[2] - 0.3); L.stroke()
    L.lineWidth = Math.min(1.1, r * 0.35)
    L.beginPath(); L.moveTo(ARM[0][0] + 0.2, ARM[0][1] - 0.7); L.lineTo(ARM[1][0] - 0.2, ARM[1][1] - 0.7); L.stroke()
    L.beginPath(); L.arc(166.9, 250.6, Math.min(0.9, r * 0.3), 0, Math.PI * 2); L.fill()
  }
}
