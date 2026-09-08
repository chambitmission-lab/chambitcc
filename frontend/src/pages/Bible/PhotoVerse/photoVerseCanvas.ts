// 말씀 사진 카드 — Canvas 합성 유틸.
// 미리보기와 최종 저장이 같은 drawVerseCard()를 쓰므로 화면에서 본 그대로 저장된다.
// 모든 좌표/크기는 이미지 크기 대비 비율로 저장해 해상도가 달라도 결과가 같다.
//
// 품질 기준(벤치마크: YouVersion 말씀 이미지 · Unfold 템플릿 · VSCO 필름 프리셋):
//  - 사진 레이어는 톤 커브(LUT) + 블렌드 레이어로 색을 만들고, 한 번 만든 결과를 캐시한다
//  - 텍스트는 균형 줄바꿈(마지막 줄 고아 단어 방지) + 가벼운 웨이트 + 넓은 행간
//  - 가독성은 박스가 아니라 텍스트 뒤에 깃털처럼 퍼지는 라디얼 스크림이 맡고,
//    그 세기는 텍스트 아래 사진의 밝기를 실제로 재서 정한다
//  - 감성 배경은 그라데이션이 아니라 장면(새벽 하늘·별밭·보케·종이)이다

import { dayOfYear, getSeasonSegments } from '../../../utils/churchCalendar'
import type { ChurchSeason } from '../../../utils/churchCalendar'

export type CardFilterId =
  | 'none'
  | 'clear'
  | 'film'
  | 'fade'
  | 'warm'
  | 'cool'
  | 'golden'
  | 'sepia'
  | 'mono'
  | 'dawn'
export type CardFrameId = 'none' | 'season' | 'polaroid' | 'film'
export type CardLayoutId = 'classic' | 'gallery' | 'quote' | 'focus' | 'poster' | 'vertical'
export type CardTextureId = 'grain' | 'leak' | 'vignette' | 'stamp'
export type CardRatioId = 'original' | '1:1' | '4:5' | '9:16'
export type CardTextBg = 'none' | 'soft' | 'scrim' | 'marker'

export interface VerseCardStyle {
  color: string
  /** 글자 크기 — 이미지 너비 대비 비율 (0.03 ~ 0.09) */
  fontScale: number
  fontFamily: 'sans' | 'serif' | 'hand'
  align: 'left' | 'center' | 'right'
  /** 텍스트 뒤 배경 — 은은한 라디얼 스크림 / 반투명 박스 / 형광펜 자국 */
  textBg: CardTextBg
  /** 출처(책 장:절) 표기 */
  showRef: boolean
  /** 텍스트 블록 중심 — 사진 영역 대비 0~1 비율 좌표 (자유 레이아웃에서만 사용) */
  pos: { x: number; y: number }
  /** 감성 필터 */
  filter: CardFilterId
  /** 프레임 — 절기(교회력 스탬프) / 폴라로이드(여백+손글씨 출처) / 필름(비네트+날짜 스탬프) */
  frame: CardFrameId
  /** 타이포 레이아웃 프리셋 */
  layout: CardLayoutId
  /** 질감 레이어 — 다중 선택 */
  textures: CardTextureId[]
  /** 캔버스 비율 — 사진을 센터 크롭한다 */
  ratio: CardRatioId
  /** 절기 스탬프·서명 언어 */
  lang: 'ko' | 'en'
  /** 모서리의 작은 교회 서명 — 공유된 카드가 어디서 왔는지 조용히 말해준다 */
  signature: boolean
}

export const DEFAULT_CARD_STYLE: VerseCardStyle = {
  color: '#ffffff',
  fontScale: 0.055,
  fontFamily: 'serif',
  align: 'center',
  textBg: 'soft',
  showRef: true,
  pos: { x: 0.5, y: 0.45 },
  filter: 'none',
  frame: 'none',
  layout: 'classic',
  textures: [],
  ratio: 'original',
  lang: 'ko',
  signature: true,
}

const FONT_STACKS: Record<VerseCardStyle['fontFamily'], string> = {
  sans: '"Pretendard Variable", "Pretendard", -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
  serif: '"Noto Serif KR", "Apple SD Gothic Neo", serif',
  hand: '"Nanum Pen Script", "Apple SD Gothic Neo", cursive',
}

// 본문은 굵은 600 대신 500 — 사진 위에서 '인쇄물'처럼 보이는 건 가벼운 획과 넉넉한 행간이다.
// 손글씨는 같은 px에서 시각적으로 작게 보여 크기를 보정한다
const FONT_TUNING: Record<
  VerseCardStyle['fontFamily'],
  { weight: number; sizeMul: number; lineHeight: number; tracking: number }
> = {
  sans: { weight: 500, sizeMul: 1, lineHeight: 1.6, tracking: -0.005 },
  serif: { weight: 500, sizeMul: 1, lineHeight: 1.66, tracking: 0 },
  hand: { weight: 400, sizeMul: 1.3, lineHeight: 1.42, tracking: 0 },
}

// 출처 라벨은 본문 서체와 무관하게 고딕 자간 넓게 — 에디토리얼 인쇄물의 캡션 문법
const REF_FAMILY = FONT_STACKS.sans

const SIGNATURE_TEXT: Record<'ko' | 'en', string> = { ko: '참빛교회', en: 'CHAMBIT CHURCH' }

// letterSpacing은 최신 브라우저만 지원 — 미지원이면 조용히 무시된다
const setTracking = (ctx: CanvasRenderingContext2D, px: number) => {
  try {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px}px`
  } catch {
    /* 미지원 브라우저 */
  }
}

/** 썸네일(작은 캔버스)에서는 최소 px 클램프를 풀어 구도가 그대로 축소돼 보이게 한다 */
const THUMB_WIDTH = 300
const minPx = (pw: number, v: number, min: number) => (pw < THUMB_WIDTH ? v : Math.max(min, v))

// ── 색 유틸 ────────────────────────────────────────────────────
const parseHex = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const luminanceOf = (hex: string): number => {
  const [r, g, b] = parseHex(hex)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

const isLightColor = (hex: string) => luminanceOf(hex) > 0.55

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

// ── 비율 크롭 — 사진 중앙을 목표 비율로 잘라낸다 ──
const RATIO_VALUES: Record<Exclude<CardRatioId, 'original'>, number> = {
  '1:1': 1,
  '4:5': 4 / 5,
  '9:16': 9 / 16,
}

interface CropRect {
  sx: number
  sy: number
  sw: number
  sh: number
}

const cropRect = (img: HTMLImageElement, ratio: CardRatioId): CropRect => {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (ratio === 'original') return { sx: 0, sy: 0, sw: iw, sh: ih }
  const target = RATIO_VALUES[ratio]
  const current = iw / ih
  if (current > target) {
    const sw = ih * target
    return { sx: (iw - sw) / 2, sy: 0, sw, sh: ih }
  }
  const sh = iw / target
  return { sx: 0, sy: (ih - sh) / 2, sw: iw, sh }
}

// ── 사진 베이스 레이어 캐시 — 크롭+필터 결과를 재사용해 드래그·슬라이더 중 LUT 루프를 반복하지 않는다 ──
let imgSeq = 0
const imgIds = new WeakMap<HTMLImageElement, number>()
const imgId = (img: HTMLImageElement) => {
  let id = imgIds.get(img)
  if (id === undefined) {
    id = ++imgSeq
    imgIds.set(img, id)
  }
  return id
}

const BASE_CACHE_MAX = 14
const baseCache = new Map<string, HTMLCanvasElement>()

const getBaseLayer = (
  img: HTMLImageElement,
  filter: CardFilterId,
  ratio: CardRatioId,
  w: number,
  h: number,
): HTMLCanvasElement => {
  const key = `${imgId(img)}|${filter}|${ratio}|${w}x${h}`
  const hit = baseCache.get(key)
  if (hit) {
    // LRU — 최근 사용을 뒤로
    baseCache.delete(key)
    baseCache.set(key, hit)
    return hit
  }
  const crop = cropRect(img, ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, w, h)
    applyFilter(ctx, filter, 0, 0, w, h)
  }
  baseCache.set(key, canvas)
  if (baseCache.size > BASE_CACHE_MAX) {
    const oldest = baseCache.keys().next().value
    if (oldest) baseCache.delete(oldest)
  }
  return canvas
}

// ── 밝기 측정 — 텍스트가 놓일 자리의 사진 밝기를 재서 스크림 세기를 정한다 ──
let probe: HTMLCanvasElement | null = null
const PROBE = 12
const sampleLuminance = (source: HTMLCanvasElement, x: number, y: number, w: number, h: number): number => {
  if (w <= 0 || h <= 0) return 0.5
  if (!probe) {
    probe = document.createElement('canvas')
    probe.width = PROBE
    probe.height = PROBE
  }
  const pctx = probe.getContext('2d', { willReadFrequently: true })
  if (!pctx) return 0.5
  try {
    pctx.clearRect(0, 0, PROBE, PROBE)
    pctx.drawImage(source, x, y, w, h, 0, 0, PROBE, PROBE)
    const d = pctx.getImageData(0, 0, PROBE, PROBE).data
    let sum = 0
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
    return sum / (255 * PROBE * PROBE)
  } catch {
    return 0.5
  }
}

// ── 프레임 레이아웃 — 폴라로이드는 사진 주위에 여백이 붙어 canvas가 커진다 ──
const POLAROID = { side: 0.06, bottom: 0.2 } // 사진 너비 대비 비율

interface FrameLayout {
  canvasW: number
  canvasH: number
  /** 사진이 그려지는 영역 */
  px: number
  py: number
  pw: number
  ph: number
}

const frameLayout = (photoW: number, photoH: number, frame: CardFrameId): FrameLayout => {
  if (frame === 'polaroid') {
    const m = photoW * POLAROID.side
    return {
      canvasW: Math.round(photoW + m * 2),
      canvasH: Math.round(photoH + m + photoW * POLAROID.bottom),
      px: m,
      py: m,
      pw: photoW,
      ph: photoH,
    }
  }
  return { canvasW: Math.round(photoW), canvasH: Math.round(photoH), px: 0, py: 0, pw: photoW, ph: photoH }
}

/** canvas 크기에서 사진 영역을 역산한다 (frameLayout의 역함수) */
const layoutFromCanvas = (canvasW: number, canvasH: number, frame: CardFrameId): FrameLayout => {
  if (frame === 'polaroid') {
    const pw = canvasW / (1 + POLAROID.side * 2)
    const m = pw * POLAROID.side
    return { canvasW, canvasH, px: m, py: m, pw, ph: canvasH - m - pw * POLAROID.bottom }
  }
  return { canvasW, canvasH, px: 0, py: 0, pw: canvasW, ph: canvasH }
}

// ── 줄바꿈 ─────────────────────────────────────────────────────
// Canvas는 자동 줄바꿈이 없어 직접 계산한다.
// 공백 단위로 채우다가 넘치면 줄을 나누고, 한 단어가 한 줄보다 길면 글자 단위로 자른다.
const wrapGreedy = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const tryLine = line ? `${line} ${word}` : word
    if (ctx.measureText(tryLine).width <= maxWidth) {
      line = tryLine
      continue
    }
    if (line) {
      lines.push(line)
      line = ''
    }
    if (ctx.measureText(word).width <= maxWidth) {
      line = word
      continue
    }
    let chunk = ''
    for (const ch of word) {
      if (chunk && ctx.measureText(chunk + ch).width > maxWidth) {
        lines.push(chunk)
        chunk = ch
      } else {
        chunk += ch
      }
    }
    line = chunk
  }
  if (line) lines.push(line)
  return lines
}

/**
 * 균형 줄바꿈 — 줄 수는 그대로 두고 각 줄의 길이를 고르게 만든다.
 * "…하리라 / 참으로" 같은 마지막 줄 고아 단어가 사라져 시(詩)처럼 읽힌다.
 */
const wrapVerseText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const greedy = wrapGreedy(ctx, text, maxWidth)
  if (greedy.length < 2) return greedy
  const target = greedy.length
  let lo = maxWidth * 0.45
  let hi = maxWidth
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) / 2
    if (wrapGreedy(ctx, text, mid).length <= target) hi = mid
    else lo = mid
  }
  const balanced = wrapGreedy(ctx, text, hi)
  return balanced.length === target ? balanced : greedy
}

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** 필카 감성 날짜 스탬프 — '26 07 31 */
const drawDateStamp = (ctx: CanvasRenderingContext2D, l: FrameLayout) => {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const stamp = `'${yy} ${mm} ${dd}`
  const px = minPx(l.pw, l.pw * 0.036, 11)
  ctx.save()
  ctx.font = `700 ${px}px Orbitron, monospace`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(255, 130, 30, 0.85)'
  ctx.shadowBlur = px * 0.55
  ctx.fillStyle = 'rgba(255, 176, 77, 0.95)'
  ctx.fillText(stamp, l.px + l.pw - l.pw * 0.05, l.py + l.ph - l.pw * 0.05)
  ctx.restore()
}

/** 가장자리를 어둡게 하는 비네트 — 필름 프레임과 질감 옵션이 공유 */
const drawVignette = (ctx: CanvasRenderingContext2D, l: FrameLayout) => {
  const cx = l.px + l.pw / 2
  const cy = l.py + l.ph / 2
  const inner = Math.min(l.pw, l.ph) * 0.42
  const outer = Math.hypot(l.pw, l.ph) * 0.62
  const g = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(10,8,14,0.34)')
  ctx.save()
  ctx.fillStyle = g
  ctx.fillRect(l.px, l.py, l.pw, l.ph)
  ctx.restore()
}

// ── 질감 레이어 — 필름 그레인 / 빛샘 ─────────────────────────────
// 그레인 타일은 한 번 만들어 재사용한다
let grainTile: HTMLCanvasElement | null = null
const getGrainTile = (): HTMLCanvasElement | null => {
  if (grainTile) return grainTile
  const size = 128
  const tile = document.createElement('canvas')
  tile.width = size
  tile.height = size
  const tctx = tile.getContext('2d')
  if (!tctx) return null
  const data = tctx.createImageData(size, size)
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 128 + Math.round((Math.random() - 0.5) * 220)
    data.data[i] = v
    data.data[i + 1] = v
    data.data[i + 2] = v
    data.data[i + 3] = 255
  }
  tctx.putImageData(data, 0, 0)
  grainTile = tile
  return tile
}

/** 필름 그레인 — 미리보기·저장본에서 입자 크기가 같아 보이도록 해상도에 비례해 확대한다 */
const drawGrain = (ctx: CanvasRenderingContext2D, l: FrameLayout, alpha = 0.22) => {
  const tile = getGrainTile()
  if (!tile) return
  const pattern = ctx.createPattern(tile, 'repeat')
  if (!pattern) return
  const scale = Math.max(0.5, l.pw / 1080)
  try {
    pattern.setTransform(new DOMMatrix().scaleSelf(scale, scale))
  } catch {
    /* setTransform 미지원 — 입자가 조금 곱게 보일 뿐 무해 */
  }
  ctx.save()
  ctx.beginPath()
  ctx.rect(l.px, l.py, l.pw, l.ph)
  ctx.clip()
  ctx.globalCompositeOperation = 'overlay'
  ctx.globalAlpha = alpha
  ctx.fillStyle = pattern
  ctx.fillRect(l.px, l.py, l.pw, l.ph)
  ctx.restore()
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
}

/** 빛샘 — 오른쪽 위 모서리로 스며드는 따뜻한 빛 (필름 카메라의 라이트 리크) */
const drawLightLeak = (ctx: CanvasRenderingContext2D, l: FrameLayout) => {
  ctx.save()
  ctx.beginPath()
  ctx.rect(l.px, l.py, l.pw, l.ph)
  ctx.clip()
  ctx.globalCompositeOperation = 'screen'

  const cx = l.px + l.pw * 1.02
  const cy = l.py - l.ph * 0.04
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, l.pw * 0.85)
  glow.addColorStop(0, 'rgba(255, 110, 60, 0.5)')
  glow.addColorStop(0.45, 'rgba(255, 150, 80, 0.22)')
  glow.addColorStop(1, 'rgba(255, 170, 90, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(l.px, l.py, l.pw, l.ph)

  // 오른쪽 가장자리를 타고 흐르는 얇은 빛줄기
  const band = ctx.createLinearGradient(l.px + l.pw * 0.8, 0, l.px + l.pw, 0)
  band.addColorStop(0, 'rgba(255, 190, 120, 0)')
  band.addColorStop(1, 'rgba(255, 190, 120, 0.26)')
  ctx.fillStyle = band
  ctx.fillRect(l.px + l.pw * 0.8, l.py, l.pw * 0.2, l.ph)

  ctx.restore()
  ctx.globalCompositeOperation = 'source-over'
}

// ── 절기 에디션 — 교회력 계산(churchCalendar)으로 지금 절기의 스탬프를 찍는다 ──
interface SeasonTheme {
  labelKo: string
  labelEn: string
  accent: string
  /** 주차를 라벨에 붙일지 (사순 셋째 주 등) */
  weekly: boolean
  symbol: 'star' | 'cross' | 'flame' | 'sunrise' | 'leaf'
}

const SEASON_THEMES: Record<ChurchSeason, SeasonTheme> = {
  advent: { labelKo: '대림', labelEn: 'Advent', accent: '#a8bef2', weekly: true, symbol: 'flame' },
  christmas: { labelKo: '성탄절기', labelEn: 'Christmastide', accent: '#f6d488', weekly: false, symbol: 'star' },
  epiphany: { labelKo: '주현절기', labelEn: 'Epiphany', accent: '#cfe3f5', weekly: false, symbol: 'star' },
  lent: { labelKo: '사순', labelEn: 'Lent', accent: '#c9b3e8', weekly: true, symbol: 'cross' },
  easter: { labelKo: '부활', labelEn: 'Easter', accent: '#ffe8a8', weekly: true, symbol: 'sunrise' },
  ordinary: { labelKo: '연중', labelEn: 'Ordinary Time', accent: '#b5d6a8', weekly: false, symbol: 'leaf' },
}

const KO_ORDINALS = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째']

export interface SeasonStamp {
  key: ChurchSeason
  week: number
  year: number
  label: string
  accent: string
}

/** 오늘이 속한 절기 + 주차 라벨 — UI(프레임 이름)와 캔버스가 함께 쓴다 */
export const getSeasonStamp = (lang: 'ko' | 'en', date = new Date()): SeasonStamp => {
  const doy = dayOfYear(date)
  const segment = getSeasonSegments(date.getFullYear()).find(
    (s) => doy >= dayOfYear(s.start) && doy <= dayOfYear(s.end),
  )
  const key = segment?.key ?? 'ordinary'
  const week = segment ? Math.floor((doy - dayOfYear(segment.start)) / 7) + 1 : 1
  const theme = SEASON_THEMES[key]
  let label: string
  if (lang === 'ko') {
    label = theme.weekly ? `${theme.labelKo} ${KO_ORDINALS[week - 1] ?? `${week}째`} 주` : theme.labelKo
  } else {
    label = theme.weekly ? `${theme.labelEn} · Week ${week}` : theme.labelEn
  }
  return { key, week, year: date.getFullYear(), label, accent: theme.accent }
}

/** 절기 심볼 — 작은 선화(line art) */
const drawSeasonSymbol = (
  ctx: CanvasRenderingContext2D,
  symbol: SeasonTheme['symbol'],
  cx: number,
  cy: number,
  s: number
) => {
  ctx.save()
  ctx.lineWidth = Math.max(1, s * 0.14)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  switch (symbol) {
    case 'star':
      // 4각 별 — 베들레헴의 별
      ctx.moveTo(cx, cy - s)
      ctx.quadraticCurveTo(cx, cy, cx + s, cy)
      ctx.quadraticCurveTo(cx, cy, cx, cy + s)
      ctx.quadraticCurveTo(cx, cy, cx - s, cy)
      ctx.quadraticCurveTo(cx, cy, cx, cy - s)
      break
    case 'cross':
      ctx.moveTo(cx, cy - s)
      ctx.lineTo(cx, cy + s)
      ctx.moveTo(cx - s * 0.62, cy - s * 0.3)
      ctx.lineTo(cx + s * 0.62, cy - s * 0.3)
      break
    case 'flame':
      // 촛불 — 심지 위 물방울 모양 불꽃
      ctx.moveTo(cx, cy + s)
      ctx.lineTo(cx, cy + s * 0.45)
      ctx.moveTo(cx, cy - s)
      ctx.bezierCurveTo(cx + s * 0.7, cy - s * 0.15, cx + s * 0.45, cy + s * 0.45, cx, cy + s * 0.45)
      ctx.bezierCurveTo(cx - s * 0.45, cy + s * 0.45, cx - s * 0.7, cy - s * 0.15, cx, cy - s)
      break
    case 'sunrise':
      // 떠오르는 해 — 반원과 세 가닥 빛
      ctx.arc(cx, cy + s * 0.5, s * 0.55, Math.PI, 0)
      ctx.moveTo(cx, cy - s * 0.9)
      ctx.lineTo(cx, cy - s * 0.35)
      ctx.moveTo(cx - s * 0.75, cy - s * 0.55)
      ctx.lineTo(cx - s * 0.45, cy - s * 0.15)
      ctx.moveTo(cx + s * 0.75, cy - s * 0.55)
      ctx.lineTo(cx + s * 0.45, cy - s * 0.15)
      ctx.moveTo(cx - s, cy + s * 0.5)
      ctx.lineTo(cx + s, cy + s * 0.5)
      break
    case 'leaf':
      // 새순 — 줄기와 잎 하나
      ctx.moveTo(cx, cy + s)
      ctx.quadraticCurveTo(cx - s * 0.1, cy, cx, cy - s * 0.9)
      ctx.moveTo(cx, cy - s * 0.1)
      ctx.quadraticCurveTo(cx + s * 0.95, cy - s * 0.35, cx + s * 0.5, cy - s * 1.05)
      ctx.quadraticCurveTo(cx - s * 0.05, cy - s * 0.75, cx, cy - s * 0.1)
      break
  }
  ctx.stroke()
  ctx.restore()
}

/** 절기 에디션 프레임 — 이중 괘선 + 하단 절기 스탬프. 지금 이 절기에만 만들 수 있는 카드. */
const drawSeasonFrame = (ctx: CanvasRenderingContext2D, l: FrameLayout, lang: 'ko' | 'en') => {
  const stamp = getSeasonStamp(lang)
  const theme = SEASON_THEMES[stamp.key]
  const inset = l.pw * 0.035

  ctx.save()
  // 이중 괘선 — 클래식 인쇄물의 테두리
  ctx.strokeStyle = theme.accent
  ctx.globalAlpha = 0.9
  ctx.lineWidth = Math.max(1.4, l.pw * 0.0022)
  ctx.strokeRect(l.px + inset, l.py + inset, l.pw - inset * 2, l.ph - inset * 2)
  ctx.globalAlpha = 0.55
  ctx.lineWidth = Math.max(0.8, l.pw * 0.001)
  const inner = inset + l.pw * 0.012
  ctx.strokeRect(l.px + inner, l.py + inner, l.pw - inner * 2, l.ph - inner * 2)
  ctx.globalAlpha = 1

  // 하단 중앙 스탬프 — 심볼 + "사순 셋째 주 · 2026"
  const labelPx = minPx(l.pw, l.pw * 0.026, 10)
  const text = `${stamp.label} · ${stamp.year}`
  ctx.font = `600 ${labelPx}px ${FONT_STACKS.serif}`
  setTracking(ctx, labelPx * 0.16)
  const textW = ctx.measureText(text).width
  const symS = labelPx * 0.72
  const gap = labelPx * 0.55
  const totalW = symS * 2 + gap + textW
  const cy = l.py + l.ph - inset - labelPx * 1.9
  const startX = l.px + l.pw / 2 - totalW / 2

  // 사진 위 가독성 — 은은한 어두운 필로우
  ctx.fillStyle = 'rgba(8, 8, 14, 0.3)'
  roundRect(
    ctx,
    startX - labelPx * 0.9,
    cy - labelPx * 0.95,
    totalW + labelPx * 1.8,
    labelPx * 1.95,
    labelPx
  )
  ctx.fill()

  ctx.strokeStyle = theme.accent
  ctx.fillStyle = theme.accent
  drawSeasonSymbol(ctx, theme.symbol, startX + symS, cy, symS)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, startX + symS * 2 + gap, cy + labelPx * 0.06)
  setTracking(ctx, 0)
  ctx.restore()
}

// ── 타이포 레이아웃 — 디자이너 프리셋. 옵션 조합이 아니라 완성된 구도를 고른다 ──
export const CARD_LAYOUTS: { id: CardLayoutId; nameKo: string; nameEn: string }[] = [
  { id: 'classic', nameKo: '자유', nameEn: 'Free' },
  { id: 'gallery', nameKo: '여백', nameEn: 'Gallery' },
  { id: 'quote', nameKo: '인용', nameEn: 'Quote' },
  { id: 'focus', nameKo: '한 단어', nameEn: 'One Word' },
  { id: 'poster', nameKo: '엽서', nameEn: 'Postcard' },
  { id: 'vertical', nameKo: '세로', nameEn: 'Vertical' },
]

// '한 단어' 레이아웃 — 구절에서 마음에 남을 핵심 단어를 골라 크게 띄운다
const KEYWORDS_KO = [
  '사랑', '믿음', '소망', '평안', '은혜', '기쁨', '감사', '축복', '구원', '생명',
  '능력', '지혜', '거룩', '영광', '찬양', '기도', '말씀', '진리', '위로', '자유',
  '치유', '회복', '강건', '담대', '빛',
]
const KEYWORDS_EN = [
  'love', 'faith', 'hope', 'peace', 'grace', 'joy', 'light', 'life', 'truth',
  'glory', 'mercy', 'strength', 'heart', 'blessed',
]

const pickEmphasisWord = (text: string): string => {
  for (const k of KEYWORDS_KO) {
    if (text.includes(k)) return k
  }
  const lower = text.toLowerCase()
  for (const k of KEYWORDS_EN) {
    const idx = lower.search(new RegExp(`\\b${k}`))
    if (idx >= 0) return text.slice(idx, idx + k.length)
  }
  // 마지막 수단 — 가장 긴 단어의 앞부분
  const longest = text
    .split(/\s+/)
    .map((w) => w.replace(/[^가-힣a-zA-Z]/g, ''))
    .reduce((a, b) => (b.length > a.length ? b : a), '')
  return longest.slice(0, 6) || text.slice(0, 4)
}

interface TypeContext {
  ctx: CanvasRenderingContext2D
  l: FrameLayout
  text: string
  refLabel: string
  style: VerseCardStyle
  family: string
  tuning: (typeof FONT_TUNING)['serif']
  fontPx: number
  /** 폴라로이드가 아닐 때만 사진 위에 출처를 얹는다 */
  refOnPhoto: boolean
  /** 글자색이 밝은지 — 그림자·스크림 방향을 정한다 */
  lightText: boolean
}

/** 글자 그림자 — 밝은 글자는 어두운 그림자, 어두운 글자는 밝은 헤일로 */
const setTextShadow = (ctx: CanvasRenderingContext2D, fontPx: number, lightText: boolean) => {
  ctx.shadowColor = lightText ? 'rgba(0, 0, 0, 0.32)' : 'rgba(255, 255, 255, 0.35)'
  ctx.shadowBlur = fontPx * 0.5
  ctx.shadowOffsetY = lightText ? fontPx * 0.05 : 0
}

const clearTextShadow = (ctx: CanvasRenderingContext2D) => {
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
}

/**
 * 은은한 스크림 — 텍스트 블록 뒤에 깃털처럼 퍼지는 타원형 어둠(또는 밝음).
 * 박스처럼 보이지 않으면서 어떤 사진에서도 읽히게 한다.
 * 세기는 그 자리의 실제 사진 밝기에 비례한다 (어두운 사진엔 거의 안 보인다).
 */
const drawSoftScrim = (
  tc: TypeContext,
  cx: number,
  cy: number,
  blockW: number,
  blockH: number,
) => {
  const { ctx, l, lightText, fontPx } = tc
  const sx = Math.max(l.px, cx - blockW / 2)
  const sy = Math.max(l.py, cy - blockH / 2)
  const sw = Math.min(l.px + l.pw, cx + blockW / 2) - sx
  const sh = Math.min(l.py + l.ph, cy + blockH / 2) - sy
  const lum = sampleLuminance(ctx.canvas, sx, sy, sw, sh)
  // 밝은 글자: 사진이 밝을수록 더 어둡게 / 어두운 글자: 사진이 어두울수록 더 밝게
  const need = lightText ? lum : 1 - lum
  const strength = Math.min(0.55, 0.08 + need * 0.6)
  // 사진이 밝을수록 더 넓고 완만하게 — 좁고 진하면 '얼룩'처럼 보인다
  const spread = 2.4 + need * 1.8
  const rx = blockW / 2 + fontPx * spread
  const ry = blockH / 2 + fontPx * spread * 0.9
  const tint = lightText ? '0,0,0' : '255,255,255'

  ctx.save()
  ctx.beginPath()
  ctx.rect(l.px, l.py, l.pw, l.ph)
  ctx.clip()
  ctx.translate(cx, cy)
  ctx.scale(1, ry / rx)
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
  g.addColorStop(0, `rgba(${tint},${strength})`)
  g.addColorStop(0.35, `rgba(${tint},${strength * 0.85})`)
  g.addColorStop(0.7, `rgba(${tint},${strength * 0.32})`)
  g.addColorStop(1, `rgba(${tint},0)`)
  ctx.fillStyle = g
  ctx.fillRect(-rx, -rx, rx * 2, rx * 2)
  ctx.restore()
}

/** 출처 라벨 — 고딕 자간 넓게, 본문보다 한 톤 가라앉힌다 */
const setRefFont = (ctx: CanvasRenderingContext2D, refPx: number) => {
  ctx.font = `500 ${refPx}px ${REF_FAMILY}`
  setTracking(ctx, refPx * 0.16)
}

/** 장식 구분선 — 가는 선 · 작은 마름모 · 가는 선 */
const drawOrnamentRule = (ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, px: number) => {
  const d = px * 0.28
  const gap = px * 0.5
  ctx.save()
  ctx.lineWidth = Math.max(0.8, px * 0.05)
  ctx.beginPath()
  ctx.moveTo(cx - w / 2, cy)
  ctx.lineTo(cx - d - gap, cy)
  ctx.moveTo(cx + d + gap, cy)
  ctx.lineTo(cx + w / 2, cy)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, cy - d)
  ctx.lineTo(cx + d, cy)
  ctx.lineTo(cx, cy + d)
  ctx.lineTo(cx - d, cy)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** 작은 십자 — 서명·엽서 레이아웃의 상단 장식 */
const drawSmallCross = (ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) => {
  ctx.save()
  ctx.lineWidth = Math.max(0.8, s * 0.16)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx, cy - s)
  ctx.lineTo(cx, cy + s)
  ctx.moveTo(cx - s * 0.62, cy - s * 0.3)
  ctx.lineTo(cx + s * 0.62, cy - s * 0.3)
  ctx.stroke()
  ctx.restore()
}

/** 자유 레이아웃 — 드래그로 위치를 정하는 기존 방식 + 은은한 스크림/박스/형광펜 배경 */
const drawClassicLayout = (tc: TypeContext) => {
  const { ctx, l, text, refLabel, style, family, tuning, fontPx, refOnPhoto, lightText } = tc
  const refPx = minPx(l.pw, fontPx * 0.46, 10)
  const mainFont = `${tuning.weight} ${fontPx}px ${family}`
  const lineHeight = fontPx * tuning.lineHeight
  const maxTextWidth = l.pw * 0.82

  ctx.font = mainFont
  setTracking(ctx, fontPx * tuning.tracking)
  const lines = wrapVerseText(ctx, text, maxTextWidth)
  const lineWidths = lines.map((line) => ctx.measureText(line).width)
  setTracking(ctx, 0)
  setRefFont(ctx, refPx)
  const refWidth = refOnPhoto ? ctx.measureText(refLabel).width : 0
  setTracking(ctx, 0)

  const refGap = refOnPhoto ? fontPx * 0.95 : 0
  const blockW = Math.max(...lineWidths, refWidth)
  const blockH = (lines.length - 1) * lineHeight + fontPx + (refOnPhoto ? refGap + refPx : 0)

  // 중심 좌표(비율)를 사진 영역 px로 바꾸되, 블록이 사진 밖으로 나가지 않게 조인다
  const pad = style.textBg === 'scrim' ? fontPx * 0.85 : style.textBg === 'marker' ? fontPx * 0.4 : 0
  const edge = l.pw * 0.05 + pad
  const cx = Math.min(
    Math.max(l.px + style.pos.x * l.pw, l.px + edge + blockW / 2),
    l.px + l.pw - edge - blockW / 2
  )
  const top = Math.min(
    Math.max(l.py + style.pos.y * l.ph - blockH / 2, l.py + edge),
    Math.max(l.py + edge, l.py + l.ph - edge - blockH)
  )

  if (style.textBg === 'soft') drawSoftScrim(tc, cx, top + blockH / 2, blockW, blockH)

  if (style.textBg === 'scrim') {
    ctx.fillStyle = lightText ? 'rgba(0, 0, 0, 0.36)' : 'rgba(255, 255, 255, 0.55)'
    roundRect(ctx, cx - blockW / 2 - pad, top - pad, blockW + pad * 2, blockH + pad * 2, fontPx * 0.6)
    ctx.fill()
  }

  const anchorX =
    style.align === 'left' ? cx - blockW / 2 : style.align === 'right' ? cx + blockW / 2 : cx

  // 형광펜 — 성경에 밑줄 긋듯 각 줄 뒤에 마커 자국. 줄마다 살짝 기울여 손맛을 낸다
  if (style.textBg === 'marker') {
    ctx.save()
    ctx.fillStyle = 'rgba(255, 222, 89, 0.62)'
    lines.forEach((_, i) => {
      const w = lineWidths[i]
      const x0 =
        style.align === 'left' ? anchorX : style.align === 'right' ? anchorX - w : anchorX - w / 2
      const baselineY = top + fontPx * 0.83 + i * lineHeight
      const mx = x0 - fontPx * 0.35
      const my = baselineY - fontPx * 0.8
      const mw = w + fontPx * 0.7
      const mh = fontPx * 1.06
      ctx.save()
      ctx.translate(mx + mw / 2, my + mh / 2)
      ctx.rotate(((i % 2 === 0 ? -1 : 1) * 0.35 * Math.PI) / 180)
      roundRect(ctx, -mw / 2, -mh / 2, mw, mh, mh * 0.32)
      ctx.fill()
      ctx.restore()
    })
    ctx.restore()
  }

  ctx.textAlign = style.align
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = style.color
  // 박스/형광펜이 없을 때만 그림자를 준다
  if (style.textBg === 'none' || style.textBg === 'soft') setTextShadow(ctx, fontPx, lightText)

  ctx.font = mainFont
  setTracking(ctx, fontPx * tuning.tracking)
  let y = top + fontPx * 0.83 // 대략적인 ascent 보정
  for (const line of lines) {
    ctx.fillText(line, anchorX, y, maxTextWidth)
    y += lineHeight
  }
  setTracking(ctx, 0)

  if (refOnPhoto) {
    setRefFont(ctx, refPx)
    ctx.globalAlpha = 0.86
    ctx.fillText(refLabel, anchorX, y - lineHeight + refGap + refPx * 0.83)
    setTracking(ctx, 0)
    ctx.globalAlpha = 1
  }

  clearTextShadow(ctx)
}

/** 여백 레이아웃 — 사진은 그대로, 하단 그라데이션 위에 갤러리 캡션처럼 얹는다 */
const drawGalleryLayout = (tc: TypeContext) => {
  const { ctx, l, text, refLabel, style, family, tuning, fontPx, refOnPhoto, lightText } = tc
  const bodyPx = fontPx * 0.82
  const lineHeight = bodyPx * tuning.lineHeight
  const refPx = minPx(l.pw, bodyPx * 0.5, 10)
  const maxW = l.pw * 0.82
  const left = l.px + l.pw * 0.09
  const bottom = l.py + l.ph - l.ph * 0.09

  // 하단 그라데이션 — 어떤 사진에서도 텍스트가 읽히게 한다. 세기는 아래쪽 밝기에 맞춘다
  if (style.textBg !== 'none') {
    const lum = sampleLuminance(ctx.canvas, l.px, l.py + l.ph * 0.55, l.pw, l.ph * 0.45)
    const need = lightText ? lum : 1 - lum
    const strength = Math.min(0.72, 0.28 + need * 0.6)
    const tint = lightText ? '0,0,0' : '255,255,255'
    const g = ctx.createLinearGradient(0, l.py + l.ph * 0.38, 0, l.py + l.ph)
    g.addColorStop(0, `rgba(${tint},0)`)
    g.addColorStop(0.35, `rgba(${tint},${strength * 0.22})`)
    g.addColorStop(0.7, `rgba(${tint},${strength * 0.7})`)
    g.addColorStop(1, `rgba(${tint},${strength})`)
    ctx.save()
    ctx.fillStyle = g
    ctx.fillRect(l.px, l.py + l.ph * 0.38, l.pw, l.ph * 0.62)
    ctx.restore()
  }

  ctx.font = `${tuning.weight} ${bodyPx}px ${family}`
  setTracking(ctx, bodyPx * tuning.tracking)
  const lines = wrapVerseText(ctx, text, maxW)
  const textH = (lines.length - 1) * lineHeight + bodyPx

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = style.color
  setTextShadow(ctx, bodyPx, lightText)

  let y = bottom - textH + bodyPx * 0.83
  for (const line of lines) {
    ctx.fillText(line, left, y, maxW)
    y += lineHeight
  }
  setTracking(ctx, 0)

  // 출처는 본문 위 — 짧은 액센트 선과 함께 전시 라벨처럼
  if (refOnPhoto) {
    const refY = bottom - textH - bodyPx * 1.0
    ctx.globalAlpha = 0.9
    ctx.fillRect(left, refY - refPx * 1.6, bodyPx * 1.4, Math.max(1, bodyPx * 0.06))
    setRefFont(ctx, refPx)
    ctx.fillText(refLabel, left, refY)
    setTracking(ctx, 0)
    ctx.globalAlpha = 1
  }
  clearTextShadow(ctx)
}

/** 인용 레이아웃 — 큰 따옴표가 여는 클래식한 인용 구도 */
const drawQuoteLayout = (tc: TypeContext) => {
  const { ctx, l, text, refLabel, style, family, tuning, fontPx, refOnPhoto, lightText } = tc
  const maxW = l.pw * 0.76
  const lineHeight = fontPx * tuning.lineHeight
  const quotePx = fontPx * 2.7
  const refPx = minPx(l.pw, fontPx * 0.46, 10)

  ctx.font = `${tuning.weight} ${fontPx}px ${family}`
  setTracking(ctx, fontPx * tuning.tracking)
  const lines = wrapVerseText(ctx, text, maxW)
  const widest = Math.max(...lines.map((ln) => ctx.measureText(ln).width))
  setTracking(ctx, 0)
  const textH = (lines.length - 1) * lineHeight + fontPx

  const quoteH = quotePx * 0.5
  const gapQ = fontPx * 0.5
  const divGap = fontPx * 1.0
  const refBlock = refOnPhoto ? divGap * 2 + refPx : 0
  const total = quoteH + gapQ + textH + refBlock
  const cx = l.px + l.pw / 2
  let y = l.py + l.ph / 2 - total / 2

  if (style.textBg !== 'none') drawSoftScrim(tc, cx, l.py + l.ph / 2, widest, total)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = style.color
  setTextShadow(ctx, fontPx, lightText)

  // 여는 따옴표는 항상 명조 — 인용 부호의 품위
  ctx.font = `700 ${quotePx}px ${FONT_STACKS.serif}`
  ctx.globalAlpha = 0.8
  ctx.fillText('“', cx, y + quoteH)
  ctx.globalAlpha = 1

  ctx.font = `${tuning.weight} ${fontPx}px ${family}`
  setTracking(ctx, fontPx * tuning.tracking)
  y += quoteH + gapQ + fontPx * 0.83
  for (const line of lines) {
    ctx.fillText(line, cx, y, maxW)
    y += lineHeight
  }
  setTracking(ctx, 0)

  if (refOnPhoto) {
    y = y - lineHeight + divGap
    ctx.globalAlpha = 0.75
    ctx.strokeStyle = style.color
    drawOrnamentRule(ctx, cx, y, fontPx * 2.6, fontPx)
    ctx.globalAlpha = 0.9
    setRefFont(ctx, refPx)
    ctx.fillText(refLabel, cx, y + divGap + refPx * 0.3)
    setTracking(ctx, 0)
    ctx.globalAlpha = 1
  }
  clearTextShadow(ctx)
}

/** 한 단어 레이아웃 — 핵심 단어를 크게 띄우고 구절 전체가 그 아래를 받친다 */
const drawFocusLayout = (tc: TypeContext) => {
  const { ctx, l, text, refLabel, style, family, tuning, fontPx, refOnPhoto, lightText } = tc
  const word = pickEmphasisWord(text)
  const bigPx = fontPx * 2.35
  const bodyPx = fontPx * 0.76
  const lineHeight = bodyPx * tuning.lineHeight
  const refPx = minPx(l.pw, bodyPx * 0.62, 10)
  const maxW = l.pw * 0.78

  ctx.font = `${tuning.weight} ${bodyPx}px ${family}`
  const lines = wrapVerseText(ctx, text, maxW)
  const widest = Math.max(...lines.map((ln) => ctx.measureText(ln).width))
  const textH = (lines.length - 1) * lineHeight + bodyPx

  const gap = fontPx * 0.75
  const refBlock = refOnPhoto ? gap * 0.9 + refPx : 0
  const total = bigPx + gap + textH + refBlock
  const cx = l.px + l.pw / 2
  let y = l.py + l.ph / 2 - total / 2

  if (style.textBg !== 'none') drawSoftScrim(tc, cx, l.py + l.ph / 2, Math.max(widest, l.pw * 0.5), total)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = style.color
  setTextShadow(ctx, fontPx, lightText)

  ctx.font = `700 ${bigPx}px ${family}`
  setTracking(ctx, bigPx * 0.04)
  ctx.fillText(word, cx, y + bigPx * 0.83, l.pw * 0.9)
  setTracking(ctx, 0)

  ctx.font = `${tuning.weight} ${bodyPx}px ${family}`
  ctx.globalAlpha = 0.92
  y += bigPx + gap + bodyPx * 0.83 - bodyPx * 0.35
  for (const line of lines) {
    ctx.fillText(line, cx, y, maxW)
    y += lineHeight
  }
  ctx.globalAlpha = 1

  if (refOnPhoto) {
    ctx.globalAlpha = 0.8
    setRefFont(ctx, refPx)
    ctx.fillText(refLabel, cx, y - lineHeight + gap * 0.9 + refPx)
    setTracking(ctx, 0)
    ctx.globalAlpha = 1
  }
  clearTextShadow(ctx)
}

/**
 * 엽서 레이아웃 — 가는 괘선 액자 안에 작은 십자 · 말씀 · 장식선과 출처.
 * 청첩장·타이포 포스터의 문법. 사진이 평범해도 '만든 카드'처럼 보인다.
 */
const drawPosterLayout = (tc: TypeContext) => {
  const { ctx, l, text, refLabel, style, family, tuning, fontPx, refOnPhoto, lightText } = tc
  const inset = l.pw * 0.07
  const maxW = l.pw - inset * 2 - fontPx * 1.6
  const lineHeight = fontPx * tuning.lineHeight
  const refPx = minPx(l.pw, fontPx * 0.44, 10)
  const crossS = fontPx * 0.5

  ctx.font = `${tuning.weight} ${fontPx}px ${family}`
  setTracking(ctx, fontPx * tuning.tracking)
  const lines = wrapVerseText(ctx, text, maxW)
  const widest = Math.max(...lines.map((ln) => ctx.measureText(ln).width))
  setTracking(ctx, 0)
  const textH = (lines.length - 1) * lineHeight + fontPx

  const gapTop = fontPx * 1.1
  const gapBottom = fontPx * 1.1
  const refBlock = refOnPhoto ? gapBottom + fontPx * 0.4 + refPx : 0
  const total = crossS * 2 + gapTop + textH + refBlock
  const cx = l.px + l.pw / 2
  const cy = l.py + l.ph / 2
  let y = cy - total / 2

  // 은은한 스크림은 액자 전체를 살짝 가라앉혀 액자 안이 '종이'처럼 읽히게 한다
  if (style.textBg !== 'none') drawSoftScrim(tc, cx, cy, Math.max(widest, l.pw * 0.55), total + fontPx * 0.5)

  ctx.save()
  ctx.strokeStyle = style.color
  ctx.fillStyle = style.color
  setTextShadow(ctx, fontPx, lightText)

  // 괘선 액자 — 바깥 가는 선 하나, 안쪽 더 가는 선 하나
  ctx.globalAlpha = 0.72
  ctx.lineWidth = Math.max(0.8, l.pw * 0.0018)
  ctx.strokeRect(l.px + inset, l.py + inset, l.pw - inset * 2, l.ph - inset * 2)
  ctx.globalAlpha = 0.4
  ctx.lineWidth = Math.max(0.6, l.pw * 0.0009)
  const in2 = inset + l.pw * 0.012
  ctx.strokeRect(l.px + in2, l.py + in2, l.pw - in2 * 2, l.ph - in2 * 2)

  ctx.globalAlpha = 0.85
  drawSmallCross(ctx, cx, y + crossS, crossS)

  ctx.globalAlpha = 1
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `${tuning.weight} ${fontPx}px ${family}`
  setTracking(ctx, fontPx * tuning.tracking)
  y += crossS * 2 + gapTop + fontPx * 0.83
  for (const line of lines) {
    ctx.fillText(line, cx, y, maxW)
    y += lineHeight
  }
  setTracking(ctx, 0)

  if (refOnPhoto) {
    y = y - lineHeight + gapBottom
    ctx.globalAlpha = 0.7
    drawOrnamentRule(ctx, cx, y, Math.min(widest, l.pw * 0.5), fontPx)
    ctx.globalAlpha = 0.9
    setRefFont(ctx, refPx)
    ctx.fillText(refLabel, cx, y + fontPx * 0.4 + refPx)
    setTracking(ctx, 0)
  }
  ctx.restore()
  clearTextShadow(ctx)
}

/** 세로 레이아웃 — 오른쪽에서 왼쪽으로 흐르는 세로쓰기 (붓글씨 족자의 구도) */
const drawVerticalLayout = (tc: TypeContext) => {
  const { ctx, l, text, refLabel, style, family, tuning, refOnPhoto, lightText } = tc
  let fontPx = tc.fontPx
  const chars = Array.from(text)

  // 글이 길면 폭 안에 들어올 때까지 글자를 줄인다
  const usableH = l.ph * 0.74
  const topY = l.py + l.ph * 0.13
  let charStep = fontPx * 1.18
  let colStep = fontPx * 1.42
  let cols = 1
  for (let attempt = 0; attempt < 8; attempt++) {
    charStep = fontPx * 1.18
    colStep = fontPx * 1.42
    const perCol = Math.max(4, Math.floor(usableH / charStep))
    cols = Math.ceil(chars.length / perCol)
    if (cols * colStep <= l.pw * 0.76 || fontPx <= 12) break
    fontPx *= 0.88
  }

  const right = l.px + l.pw - l.pw * 0.11
  if (style.textBg !== 'none') {
    const blockW = cols * colStep
    drawSoftScrim(tc, right - blockW / 2, topY + usableH / 2, blockW, usableH)
  }

  ctx.font = `${tuning.weight} ${fontPx}px ${family}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = style.color
  setTextShadow(ctx, fontPx, lightText)

  let x = right - fontPx / 2
  let y = topY + charStep / 2
  const maxY = topY + usableH
  for (const ch of chars) {
    if (ch === ' ') {
      y += charStep * 0.5
      if (y > maxY) {
        x -= colStep
        y = topY + charStep / 2
      }
      continue
    }
    ctx.fillText(ch, x, y)
    y += charStep
    if (y > maxY) {
      x -= colStep
      y = topY + charStep / 2
    }
  }

  // 출처 — 왼쪽 아래에 낙관처럼 가로로 작게
  if (refOnPhoto) {
    const refPx = minPx(l.pw, fontPx * 0.46, 10)
    setRefFont(ctx, refPx)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.globalAlpha = 0.85
    ctx.fillText(refLabel, l.px + l.pw * 0.09, l.py + l.ph - l.ph * 0.07)
    setTracking(ctx, 0)
    ctx.globalAlpha = 1
  }
  clearTextShadow(ctx)
}

/** 모서리 서명 — 작은 십자 + 교회 이름. 공유된 카드가 어디서 왔는지 조용히 말해준다 */
const drawSignature = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, l: FrameLayout, style: VerseCardStyle) => {
  const px = minPx(l.pw, l.pw * 0.021, 9)
  // 괘선 액자(엽서 레이아웃·절기 프레임) 안쪽으로 들어가 선과 겹치지 않게 한다
  const inset = style.layout === 'poster' ? l.pw * 0.105 : style.frame === 'season' ? l.pw * 0.075 : l.pw * 0.055
  const text = SIGNATURE_TEXT[style.lang]
  const hasStamp = style.frame === 'film' || style.textures.includes('stamp')
  // 날짜 스탬프가 오른쪽 아래를 쓰면 왼쪽으로, 세로쓰기 낙관까지 겹치면 생략
  const side: 'right' | 'left' | null = hasStamp ? (style.layout === 'vertical' ? null : 'left') : 'right'
  if (!side) return

  ctx.save()
  setRefFont(ctx, px)
  ctx.textBaseline = 'alphabetic'
  const textW = ctx.measureText(text).width
  const crossS = px * 0.55
  const gap = px * 0.55

  let baseY: number
  let color: string
  let alpha: number
  if (style.frame === 'polaroid') {
    // 하단 여백 오른쪽 끝, 손글씨 출처보다 한 톤 옅게
    baseY = canvas.height - l.pw * 0.05
    color = '#8a8275'
    alpha = 0.8
  } else {
    baseY = l.py + l.ph - inset + px * 0.35
    const lightText = isLightColor(style.color)
    color = lightText ? '#ffffff' : '#1c1a17'
    alpha = 0.7
    ctx.shadowColor = lightText ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'
    ctx.shadowBlur = px * 0.6
  }
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.strokeStyle = color

  if (side === 'right') {
    const x = l.px + l.pw - inset
    ctx.textAlign = 'right'
    ctx.fillText(text, x, baseY)
    drawSmallCross(ctx, x - textW - gap - crossS * 0.3, baseY - px * 0.36, crossS)
  } else {
    const x = l.px + inset
    ctx.textAlign = 'left'
    drawSmallCross(ctx, x + crossS * 0.3, baseY - px * 0.36, crossS)
    ctx.fillText(text, x + crossS * 0.6 + gap, baseY)
  }
  setTracking(ctx, 0)
  ctx.restore()
}

/** 사진 전체의 평균 밝기(0~1) — 밝은 사진은 어두운 글자로 시작해야 읽힌다 */
export const measureImageLuminance = (img: HTMLImageElement): number => {
  const c = document.createElement('canvas')
  c.width = 32
  c.height = 32
  const ctx = c.getContext('2d')
  if (!ctx) return 0.5
  try {
    ctx.drawImage(img, 0, 0, 32, 32)
  } catch {
    return 0.5
  }
  return sampleLuminance(c, 0, 0, 32, 32)
}

/** 사진 + 말씀 텍스트를 canvas에 합성한다. canvas 크기는 호출자가 정한다. */
export const drawVerseCard = (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  text: string,
  refLabel: string,
  style: VerseCardStyle
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const l = layoutFromCanvas(canvas.width, canvas.height, style.frame)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (style.frame === 'polaroid') {
    ctx.fillStyle = '#fbfaf5'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const pw = Math.max(1, Math.round(l.pw))
  const ph = Math.max(1, Math.round(l.ph))
  const base = getBaseLayer(img, style.filter, style.ratio, pw, ph)
  ctx.drawImage(base, l.px, l.py, l.pw, l.ph)

  // 비네트는 텍스트 아래(가독성), 그레인·빛샘은 텍스트 위(인화지의 물성)
  if (style.frame === 'film' || style.textures.includes('vignette')) drawVignette(ctx, l)
  if (style.frame === 'polaroid') {
    // 사진과 여백 사이 미세한 경계선 — 실물 인화지 느낌
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    ctx.lineWidth = Math.max(1, l.pw * 0.0015)
    ctx.strokeRect(l.px, l.py, l.pw, l.ph)
  }

  // 폴라로이드에서는 출처를 하단 여백에 손글씨로 적는다 (사진 위에는 생략)
  const refOnPhoto = style.showRef && !!refLabel && style.frame !== 'polaroid'

  if (text) {
    const family = FONT_STACKS[style.fontFamily]
    const tuning = FONT_TUNING[style.fontFamily]
    const fontPx = minPx(l.pw, style.fontScale * l.pw * tuning.sizeMul, 12)
    const tc: TypeContext = {
      ctx,
      l,
      text,
      refLabel,
      style,
      family,
      tuning,
      fontPx,
      refOnPhoto,
      lightText: isLightColor(style.color),
    }
    switch (style.layout) {
      case 'gallery':
        drawGalleryLayout(tc)
        break
      case 'quote':
        drawQuoteLayout(tc)
        break
      case 'focus':
        drawFocusLayout(tc)
        break
      case 'poster':
        drawPosterLayout(tc)
        break
      case 'vertical':
        drawVerticalLayout(tc)
        break
      default:
        drawClassicLayout(tc)
    }
  }

  if (style.textures.includes('leak')) drawLightLeak(ctx, l)
  if (style.textures.includes('grain')) drawGrain(ctx, l)

  if (style.frame === 'season') drawSeasonFrame(ctx, l, style.lang)

  // 폴라로이드 하단 여백 — 손글씨 출처
  if (style.frame === 'polaroid' && style.showRef && refLabel) {
    const px = minPx(l.pw, l.pw * 0.058, 13)
    ctx.save()
    ctx.font = `400 ${px}px ${FONT_STACKS.hand}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#5f574c'
    const marginTop = l.py + l.ph
    ctx.fillText(refLabel, canvas.width / 2, marginTop + (canvas.height - marginTop) / 2)
    ctx.restore()
  }

  if (style.frame === 'film' || style.textures.includes('stamp')) drawDateStamp(ctx, l)

  if (style.signature && text) drawSignature(ctx, canvas, l, style)
}

/** 필터 선택 썸네일 — 사진 중앙을 정사각형으로 잘라 필터를 입혀 그린다 */
export const drawFilterThumb = (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  filter: CardFilterId
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const size = canvas.width
  ctx.clearRect(0, 0, size, size)
  ctx.drawImage(getBaseLayer(img, filter, '1:1', size, size), 0, 0)
}

/** 크롭 후 비율을 유지하며 사진의 긴 변을 maxSide 이하로 캡한 canvas를 만든다 (프레임 여백 포함) */
export const createCardCanvas = (
  img: HTMLImageElement,
  maxSide: number,
  frame: CardFrameId = 'none',
  ratio: CardRatioId = 'original'
): HTMLCanvasElement => {
  const crop = cropRect(img, ratio)
  const longSide = Math.max(crop.sw, crop.sh)
  const scale = Math.min(1, maxSide / longSide)
  const photoW = Math.max(1, crop.sw * scale)
  const photoH = Math.max(1, crop.sh * scale)
  const l = frameLayout(photoW, photoH, frame)
  const canvas = document.createElement('canvas')
  canvas.width = l.canvasW
  canvas.height = l.canvasH
  return canvas
}

// ── 감성 배경 — 사진이 없어도 '장면'으로 카드를 만들 수 있다 ──────────
// 그라데이션 한 장이 아니라 하늘·별·안개·보케·종이 결을 직접 그린다.
export interface VerseBackground {
  id: string
  nameKo: string
  nameEn: string
  /** 스와치 미리보기용 대표색 (CSS 그라데이션) */
  stops: string[]
  /** 배경 위 기본 글자색 — 밝은 배경은 어두운 글자로 시작 */
  textColor: string
}

export const BACKGROUNDS: VerseBackground[] = [
  { id: 'dawn', nameKo: '새벽', nameEn: 'Dawn', stops: ['#1b2447', '#5a6fa8', '#f2c9b0'], textColor: '#ffffff' },
  { id: 'midnight', nameKo: '별밤', nameEn: 'Starry Night', stops: ['#0a1024', '#1c2a52'], textColor: '#ffffff' },
  { id: 'sunset', nameKo: '노을', nameEn: 'Sunset', stops: ['#3b2a4f', '#c75f5f', '#fbd07a'], textColor: '#ffffff' },
  { id: 'sea', nameKo: '바다', nameEn: 'Sea', stops: ['#a8c8e8', '#5a8fc4', '#2f5f95'], textColor: '#ffffff' },
  { id: 'ink', nameKo: '먹빛', nameEn: 'Ink', stops: ['#232228', '#141317'], textColor: '#ffffff' },
  { id: 'bokeh', nameKo: '보케', nameEn: 'Bokeh', stops: ['#2a1b2c', '#5a3340', '#e8a25c'], textColor: '#ffffff' },
  { id: 'lavender', nameKo: '라벤더', nameEn: 'Lavender', stops: ['#7d72c4', '#b79ddd', '#d9b8d6'], textColor: '#ffffff' },
  { id: 'sage', nameKo: '세이지', nameEn: 'Sage', stops: ['#dfe6da', '#a9bca5'], textColor: '#2f3a2f' },
  { id: 'cream', nameKo: '종이', nameEn: 'Paper', stops: ['#fbf5ea', '#ecdfc9'], textColor: '#5c4a36' },
  { id: 'rose', nameKo: '로즈', nameEn: 'Rose', stops: ['#fbe4e6', '#e8a3ad'], textColor: '#6b3540' },
]

/** 미리보기 스와치용 CSS 그라데이션 */
export const backgroundCss = (bg: VerseBackground) =>
  `linear-gradient(160deg, ${bg.stops.join(', ')})`

// 결정적 난수 — 같은 배경은 언제 만들어도 같은 별자리·같은 보케가 나온다
const seeded = (seed: number) => {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

type Painter = (ctx: CanvasRenderingContext2D, W: number, H: number, rnd: () => number) => void

const vertical = (ctx: CanvasRenderingContext2D, W: number, H: number, stops: [number, string][]) => {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  for (const [at, color] of stops) g.addColorStop(at, color)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

const glow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rgb: string,
  alpha: number,
  blend: GlobalCompositeOperation = 'screen',
) => {
  ctx.save()
  ctx.globalCompositeOperation = blend
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, `rgba(${rgb},${alpha})`)
  g.addColorStop(0.5, `rgba(${rgb},${alpha * 0.45})`)
  g.addColorStop(1, `rgba(${rgb},0)`)
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
  ctx.restore()
}

/** 별밭 — 크기·밝기가 제각각인 점 + 몇 개의 빛나는 별 */
const stars = (ctx: CanvasRenderingContext2D, W: number, H: number, rnd: () => number, count: number, maxY: number, fade: boolean) => {
  ctx.save()
  for (let i = 0; i < count; i++) {
    const x = rnd() * W
    const y = rnd() * H * maxY
    const size = (0.5 + rnd() * rnd() * 1.9) * (W / 1080)
    let a = 0.25 + rnd() * 0.7
    if (fade) a *= 1 - y / (H * maxY)
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  // 빛나는 별 몇 개
  for (let i = 0; i < 7; i++) {
    const x = rnd() * W
    const y = rnd() * H * maxY * 0.9
    glow(ctx, x, y, (6 + rnd() * 10) * (W / 1080), '255,250,235', 0.5)
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.beginPath()
    ctx.arc(x, y, 1.3 * (W / 1080), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** 부드러운 가로 띠 — 안개·물결·구름 */
const softBand = (ctx: CanvasRenderingContext2D, W: number, y: number, h: number, rgb: string, alpha: number, blend: GlobalCompositeOperation = 'screen') => {
  ctx.save()
  ctx.globalCompositeOperation = blend
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2)
  g.addColorStop(0, `rgba(${rgb},0)`)
  g.addColorStop(0.5, `rgba(${rgb},${alpha})`)
  g.addColorStop(1, `rgba(${rgb},0)`)
  ctx.fillStyle = g
  ctx.fillRect(0, y - h / 2, W, h)
  ctx.restore()
}

/** 종이 섬유 — 짧고 옅은 선을 무작위로 흩뿌린다 */
const fibers = (ctx: CanvasRenderingContext2D, W: number, H: number, rnd: () => number, count: number, rgb: string) => {
  ctx.save()
  ctx.lineCap = 'round'
  for (let i = 0; i < count; i++) {
    const x = rnd() * W
    const y = rnd() * H
    const len = (4 + rnd() * 18) * (W / 1080)
    const ang = rnd() * Math.PI
    ctx.strokeStyle = `rgba(${rgb},${0.03 + rnd() * 0.06})`
    ctx.lineWidth = (0.6 + rnd() * 0.9) * (W / 1080)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len)
    ctx.stroke()
  }
  ctx.restore()
}

const PAINTERS: Record<string, Painter> = {
  dawn: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#161d3d'],
      [0.42, '#3f4f8c'],
      [0.7, '#8d8db8'],
      [0.86, '#d9aeb0'],
      [1, '#f5cfb4'],
    ])
    stars(ctx, W, H, rnd, 140, 0.55, true)
    // 지평선의 여명
    glow(ctx, W * 0.5, H * 0.92, W * 0.75, '255,205,170', 0.55)
    glow(ctx, W * 0.5, H * 0.96, W * 0.35, '255,236,205', 0.5)
    // 낮게 깔린 안개
    softBand(ctx, W, H * 0.8, H * 0.08, '255,230,220', 0.12)
    softBand(ctx, W, H * 0.88, H * 0.06, '255,240,230', 0.1)
  },
  midnight: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#070b1c'],
      [0.6, '#111a3a'],
      [1, '#1f2d5a'],
    ])
    // 은하수 — 비스듬한 옅은 띠
    ctx.save()
    ctx.translate(W * 0.5, H * 0.45)
    ctx.rotate(-0.5)
    softBand(ctx, W * 2.4, 0, H * 0.34, '170,185,230', 0.16)
    softBand(ctx, W * 2.4, H * 0.02, H * 0.14, '215,220,245', 0.12)
    ctx.restore()
    stars(ctx, W, H, rnd, 320, 1, false)
    glow(ctx, W * 0.5, H * 1.02, W * 0.6, '70,95,170', 0.35)
  },
  sunset: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#2f2445'],
      [0.35, '#7a4a6a'],
      [0.6, '#d0665f'],
      [0.8, '#f29a5c'],
      [1, '#fbd28a'],
    ])
    // 해 — 지평선 아래로 반쯤 잠긴 빛
    glow(ctx, W * 0.6, H * 0.84, W * 0.55, '255,190,110', 0.55)
    glow(ctx, W * 0.6, H * 0.84, W * 0.18, '255,240,200', 0.85)
    // 얇게 걸린 구름 줄
    for (let i = 0; i < 6; i++) {
      const y = H * (0.3 + rnd() * 0.35)
      const w = W * (0.35 + rnd() * 0.5)
      const x = rnd() * W
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.translate(x, y)
      ctx.scale(1, 0.12 + rnd() * 0.08)
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2)
      g.addColorStop(0, 'rgba(255,200,160,0.28)')
      g.addColorStop(1, 'rgba(255,200,160,0)')
      ctx.fillStyle = g
      ctx.fillRect(-w / 2, -w / 2, w, w)
      ctx.restore()
    }
  },
  sea: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#b7d3ec'],
      [0.5, '#7fb0d8'],
      [0.56, '#3b78b0'],
      [1, '#1f4d80'],
    ])
    glow(ctx, W * 0.5, H * 0.1, W * 0.8, '255,255,255', 0.28)
    // 수평선의 밝은 띠
    softBand(ctx, W, H * 0.555, H * 0.02, '235,245,255', 0.55)
    // 물결의 반짝임
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < 90; i++) {
      const t = rnd()
      const y = H * (0.57 + t * t * 0.43)
      const w = W * (0.03 + rnd() * 0.16) * (0.4 + t)
      const x = rnd() * W
      ctx.fillStyle = `rgba(255,255,255,${0.04 + rnd() * 0.1})`
      ctx.beginPath()
      ctx.ellipse(x, y, w / 2, Math.max(0.6, H * 0.0015 * (0.5 + t)), 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  },
  ink: (ctx, W, H) => {
    vertical(ctx, W, H, [
      [0, '#26252b'],
      [1, '#121114'],
    ])
    // 왼쪽 위에서 비치는 금빛 — 검은 종이 위 촛불의 온기
    glow(ctx, W * 0.12, H * 0.08, W * 0.7, '205,165,95', 0.14)
    glow(ctx, W * 0.9, H * 0.95, W * 0.5, '80,75,105', 0.28)
  },
  bokeh: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#1e1522'],
      [0.6, '#3a2230'],
      [1, '#5a3340'],
    ])
    const palette = ['255,207,138', '255,154,118', '255,228,184', '240,170,120']
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < 44; i++) {
      const x = rnd() * W
      const y = H * (0.05 + rnd() * 0.9)
      const r = W * (0.025 + rnd() * rnd() * 0.11)
      const rgb = palette[Math.floor(rnd() * palette.length)]
      const a = 0.1 + rnd() * 0.24
      // 보케 원 — 가장자리가 살짝 더 밝은 렌즈 흐림
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(${rgb},${a * 0.75})`)
      g.addColorStop(0.82, `rgba(${rgb},${a})`)
      g.addColorStop(1, `rgba(${rgb},0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    glow(ctx, W * 0.5, H * 1.05, W * 0.7, '232,162,92', 0.3)
  },
  lavender: (ctx, W, H) => {
    vertical(ctx, W, H, [
      [0, '#8b80cc'],
      [1, '#c7a9de'],
    ])
    glow(ctx, W * 0.15, H * 0.2, W * 0.8, '240,205,225', 0.45)
    glow(ctx, W * 0.9, H * 0.75, W * 0.75, '150,140,225', 0.5, 'multiply')
    glow(ctx, W * 0.8, H * 0.1, W * 0.5, '255,235,245', 0.35)
    glow(ctx, W * 0.3, H * 0.95, W * 0.6, '225,190,225', 0.35)
  },
  sage: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#e3e9de'],
      [1, '#a7baa2'],
    ])
    glow(ctx, W * 0.2, H * 0.15, W * 0.7, '250,252,245', 0.5)
    glow(ctx, W * 0.85, H * 0.85, W * 0.7, '120,145,115', 0.35, 'multiply')
    fibers(ctx, W, H, rnd, 1400, '60,80,55')
  },
  cream: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#fcf7ee'],
      [1, '#eee1cc'],
    ])
    fibers(ctx, W, H, rnd, 2600, '120,95,60')
    // 모서리가 살짝 바랜 종이
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    const v = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.35, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.6)
    v.addColorStop(0, 'rgba(210,190,150,0)')
    v.addColorStop(1, 'rgba(200,175,130,0.35)')
    ctx.fillStyle = v
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
  },
  rose: (ctx, W, H) => {
    vertical(ctx, W, H, [
      [0, '#fbe6e8'],
      [1, '#e9a9b3'],
    ])
    glow(ctx, W * 0.2, H * 0.2, W * 0.75, '255,245,240', 0.6)
    glow(ctx, W * 0.85, H * 0.8, W * 0.7, '215,135,150', 0.4, 'multiply')
    glow(ctx, W * 0.75, H * 0.15, W * 0.45, '255,225,215', 0.4)
  },
}

const bgImageCache = new Map<string, Promise<HTMLImageElement>>()

/** 배경 장면을 4:5 이미지로 만든다 — 이후 사진과 동일한 파이프라인을 탄다. 한 번 만든 장면은 재사용한다 */
export const createBackgroundImage = (bg: VerseBackground): Promise<HTMLImageElement> => {
  const cached = bgImageCache.get(bg.id)
  if (cached) return cached
  const job = (async () => {
    const W = 1080
    const H = 1350
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas unavailable')

    const rnd = seeded(Array.from(bg.id).reduce((a, c) => a * 31 + c.charCodeAt(0), 7))
    const painter = PAINTERS[bg.id]
    if (painter) {
      painter(ctx, W, H, rnd)
    } else {
      const g = ctx.createLinearGradient(W * 0.15, 0, W * 0.85, H)
      bg.stops.forEach((stop, i) => g.addColorStop(bg.stops.length === 1 ? 0 : i / (bg.stops.length - 1), stop))
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
    }

    // 미세한 노이즈 — 그라데이션 밴딩(줄무늬)을 없애 인화지 질감을 준다
    const noise = ctx.getImageData(0, 0, W, H)
    const data = noise.data
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 7
      data[i] += n
      data[i + 1] += n
      data[i + 2] += n
    }
    ctx.putImageData(noise, 0, 0)

    const img = new Image()
    img.src = canvas.toDataURL('image/jpeg', 0.92)
    await img.decode()
    return img
  })()
  bgImageCache.set(bg.id, job)
  job.catch(() => bgImageCache.delete(bg.id))
  return job
}

// Canvas 텍스트는 CSS와 달리 폰트가 로드되어 있어야만 웹폰트로 그려진다.
// 한글 웹폰트는 유니코드 범위별 서브셋 조각으로 나뉘어 배포되는데, canvas는
// 안 받아진 조각을 기다리지 않고 폴백으로 그려버려 글자가 섞여 보인다.
// 그릴 텍스트를 load()에 넘기면 그 글자들이 속한 조각까지 전부 받아온다.
// 실패해도 시스템 폰트로 대체되므로 조용히 넘어간다.
export const ensureCardFonts = async (sampleText?: string) => {
  const sample = sampleText?.trim() || undefined
  try {
    await Promise.all([
      document.fonts.load('500 24px "Pretendard Variable"', sample),
      document.fonts.load('600 24px "Pretendard Variable"', sample),
      document.fonts.load('500 24px "Noto Serif KR"', sample),
      document.fonts.load('600 24px "Noto Serif KR"', sample),
      document.fonts.load('700 24px "Noto Serif KR"', sample),
      document.fonts.load('400 24px "Nanum Pen Script"', sample),
      document.fonts.load('700 16px Orbitron'), // 날짜 스탬프 — 숫자뿐이라 샘플 불필요
    ])
  } catch {
    // 폰트 로드 실패 — 시스템 폰트 폴백
  }
}
