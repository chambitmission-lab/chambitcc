// 감성 필터 — 톤 커브(LUT) + 블렌드 레이어. Safari가 ctx.filter 를 지원하지 않아 직접 만든다.

import type { CardFilterId } from './cardStyle'
// ── 감성 필터 — 톤 커브(LUT) + 블렌드 레이어. Safari가 ctx.filter를 지원하지 않아 직접 만든다 ──
interface FilterLayer {
  blend: GlobalCompositeOperation
  color: string
  alpha: number
}

type Curve = (t: number) => number

interface FilterDef {
  /** 채널별 톤 커브 — 없으면 원본 */
  curves?: { r: Curve; g: Curve; b: Curve }
  layers: FilterLayer[]
}

export const CARD_FILTERS: { id: CardFilterId; nameKo: string; nameEn: string }[] = [
  { id: 'none', nameKo: '원본', nameEn: 'Original' },
  { id: 'clear', nameKo: '맑음', nameEn: 'Clear' },
  { id: 'film', nameKo: '필름', nameEn: 'Film' },
  { id: 'fade', nameKo: '매트', nameEn: 'Matte' },
  { id: 'warm', nameKo: '온기', nameEn: 'Warm' },
  { id: 'golden', nameKo: '황금빛', nameEn: 'Golden' },
  { id: 'cool', nameKo: '서늘', nameEn: 'Cool' },
  { id: 'dawn', nameKo: '새벽', nameEn: 'Dawn' },
  { id: 'sepia', nameKo: '세피아', nameEn: 'Sepia' },
  { id: 'mono', nameKo: '흑백', nameEn: 'Mono' },
]

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
/** 블랙을 들어올리고 화이트를 살짝 눌러 '인화지'처럼 만든다 */
const lift = (black: number, white: number): Curve => (t) => black + t * (white - black)
/** 완만한 S 커브 — 중간톤 대비 */
const sCurve = (k: number): Curve => (t) => t - k * 0.5 * Math.sin(2 * Math.PI * t)
const compose = (...fns: Curve[]): Curve => (t) => fns.reduce((v, f) => f(v), t)
/** 그림자에만 더하는 색 기울기 (t=0 에서 amt, t=1 에서 0) */
const shadowTint = (amt: number): Curve => (t) => t + amt * (1 - t) * (1 - t)
/** 하이라이트에만 더하는 색 기울기 */
const highlightTint = (amt: number): Curve => (t) => t + amt * t * t

const FILTERS: Record<CardFilterId, FilterDef> = {
  none: { layers: [] },
  clear: {
    curves: { r: sCurve(0.06), g: sCurve(0.06), b: sCurve(0.06) },
    layers: [
      { blend: 'soft-light', color: '#ffffff', alpha: 0.28 },
      { blend: 'overlay', color: '#eaf2fb', alpha: 0.1 },
    ],
  },
  film: {
    // 들린 블랙 + 살짝 눌린 화이트, 그림자는 틸, 하이라이트는 따뜻하게 (스플릿 토닝)
    curves: {
      r: compose(sCurve(0.1), lift(0.06, 0.97), highlightTint(0.04)),
      g: compose(sCurve(0.1), lift(0.06, 0.965), shadowTint(0.02)),
      b: compose(sCurve(0.08), lift(0.09, 0.93), shadowTint(0.06)),
    },
    layers: [{ blend: 'soft-light', color: '#ffb37a', alpha: 0.14 }],
  },
  fade: {
    // 매트 — 블랙을 크게 들어올리고 채도를 낮춘다
    curves: { r: lift(0.13, 0.95), g: lift(0.13, 0.95), b: lift(0.15, 0.94) },
    layers: [
      { blend: 'saturation', color: '#808080', alpha: 0.28 },
      { blend: 'soft-light', color: '#f1ece6', alpha: 0.12 },
    ],
  },
  warm: {
    curves: {
      r: compose(sCurve(0.05), highlightTint(0.06), lift(0.02, 1)),
      g: compose(sCurve(0.05), highlightTint(0.02)),
      b: compose(sCurve(0.05), lift(0, 0.95)),
    },
    layers: [{ blend: 'soft-light', color: '#ffd2a0', alpha: 0.2 }],
  },
  golden: {
    // 골든아워 — 대비를 조금 세우고 하이라이트에 금빛, 그림자는 갈색으로
    curves: {
      r: compose(sCurve(0.12), highlightTint(0.08), lift(0.03, 1)),
      g: compose(sCurve(0.1), highlightTint(0.03), lift(0.02, 0.98)),
      b: compose(sCurve(0.08), lift(0.02, 0.9)),
    },
    layers: [
      { blend: 'overlay', color: '#f0b060', alpha: 0.14 },
      { blend: 'soft-light', color: '#ffe0b0', alpha: 0.16 },
    ],
  },
  cool: {
    curves: {
      r: compose(sCurve(0.05), lift(0, 0.97)),
      g: compose(sCurve(0.05), highlightTint(0.01)),
      b: compose(sCurve(0.05), highlightTint(0.05), lift(0.03, 1)),
    },
    layers: [{ blend: 'soft-light', color: '#cfe0ff', alpha: 0.18 }],
  },
  sepia: {
    curves: { r: lift(0.05, 0.98), g: lift(0.05, 0.96), b: lift(0.05, 0.9) },
    layers: [
      { blend: 'saturation', color: '#808080', alpha: 1 },
      { blend: 'color', color: '#a1866b', alpha: 0.85 },
      { blend: 'soft-light', color: '#f4e3c8', alpha: 0.2 },
    ],
  },
  mono: {
    curves: { r: compose(sCurve(0.14), lift(0.04, 1)), g: compose(sCurve(0.14), lift(0.04, 1)), b: compose(sCurve(0.14), lift(0.04, 1)) },
    layers: [
      { blend: 'saturation', color: '#808080', alpha: 1 },
      { blend: 'soft-light', color: '#ffffff', alpha: 0.1 },
    ],
  },
  dawn: {
    curves: {
      r: compose(sCurve(0.06), lift(0.04, 0.96)),
      g: compose(sCurve(0.06), lift(0.05, 0.97)),
      b: compose(sCurve(0.06), lift(0.1, 1), shadowTint(0.05)),
    },
    layers: [
      { blend: 'color', color: '#41507a', alpha: 0.3 },
      { blend: 'soft-light', color: '#2b3a5e', alpha: 0.3 },
    ],
  },
}

// 커브는 256단계 LUT로 한 번만 구워 재사용한다
const lutCache = new Map<CardFilterId, { r: Uint8ClampedArray; g: Uint8ClampedArray; b: Uint8ClampedArray }>()
const getLut = (id: CardFilterId) => {
  const def = FILTERS[id]
  if (!def.curves) return null
  const cached = lutCache.get(id)
  if (cached) return cached
  const build = (c: Curve) => {
    const arr = new Uint8ClampedArray(256)
    for (let i = 0; i < 256; i++) arr[i] = Math.round(clamp01(c(i / 255)) * 255)
    return arr
  }
  const lut = { r: build(def.curves.r), g: build(def.curves.g), b: build(def.curves.b) }
  lutCache.set(id, lut)
  return lut
}

const applyFilter = (ctx: CanvasRenderingContext2D, id: CardFilterId, x: number, y: number, w: number, h: number) => {
  const def = FILTERS[id]
  const lut = getLut(id)
  if (lut && w > 0 && h > 0) {
    try {
      const image = ctx.getImageData(x, y, w, h)
      const d = image.data
      const { r, g, b } = lut
      for (let i = 0; i < d.length; i += 4) {
        d[i] = r[d[i]]
        d[i + 1] = g[d[i + 1]]
        d[i + 2] = b[d[i + 2]]
      }
      ctx.putImageData(image, x, y)
    } catch {
      /* tainted canvas 등 — 커브 없이 레이어만 */
    }
  }
  if (!def.layers.length) return
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  for (const layer of def.layers) {
    ctx.globalCompositeOperation = layer.blend
    ctx.globalAlpha = layer.alpha
    ctx.fillStyle = layer.color
    ctx.fillRect(x, y, w, h)
  }
  ctx.restore()
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
}


// ── photoVerseCanvas 내부 공유 ──
export { clamp01, lift, sCurve, compose, shadowTint, highlightTint, FILTERS, lutCache, getLut, applyFilter }
export type { FilterLayer, Curve, FilterDef }
