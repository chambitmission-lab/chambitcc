// 말씀 사진 카드 — Canvas 합성 유틸.
// 미리보기와 최종 저장이 같은 drawVerseCard()를 쓰므로 화면에서 본 그대로 저장된다.
// 모든 좌표/크기는 이미지 크기 대비 비율로 저장해 해상도가 달라도 결과가 같다.

import { dayOfYear, getSeasonSegments } from '../../../utils/churchCalendar'
import type { ChurchSeason } from '../../../utils/churchCalendar'

export type CardFilterId = 'none' | 'clear' | 'film' | 'sepia' | 'mono' | 'dawn'
export type CardFrameId = 'none' | 'season' | 'polaroid' | 'film'
export type CardLayoutId = 'classic' | 'gallery' | 'quote' | 'focus' | 'vertical'
export type CardTextureId = 'grain' | 'leak' | 'vignette' | 'stamp'
export type CardRatioId = 'original' | '1:1' | '4:5' | '9:16'
export type CardTextBg = 'none' | 'scrim' | 'marker'

export interface VerseCardStyle {
  color: string
  /** 글자 크기 — 이미지 너비 대비 비율 (0.03 ~ 0.09) */
  fontScale: number
  fontFamily: 'sans' | 'serif' | 'hand'
  align: 'left' | 'center' | 'right'
  /** 텍스트 뒤 배경 — 반투명 박스 또는 형광펜 자국 */
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
  /** 절기 스탬프 언어 */
  lang: 'ko' | 'en'
}

export const DEFAULT_CARD_STYLE: VerseCardStyle = {
  color: '#ffffff',
  fontScale: 0.055,
  fontFamily: 'serif',
  align: 'center',
  textBg: 'none',
  showRef: true,
  pos: { x: 0.5, y: 0.42 },
  filter: 'none',
  frame: 'none',
  layout: 'classic',
  textures: [],
  ratio: 'original',
  lang: 'ko',
}

const FONT_STACKS: Record<VerseCardStyle['fontFamily'], string> = {
  sans: '"Pretendard", -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
  serif: '"Noto Serif KR", "Apple SD Gothic Neo", serif',
  hand: '"Nanum Pen Script", "Apple SD Gothic Neo", cursive',
}

// 손글씨는 같은 px에서 시각적으로 작게 보여 크기를 보정한다
const FONT_TUNING: Record<VerseCardStyle['fontFamily'], { weight: number; sizeMul: number; lineHeight: number }> = {
  sans: { weight: 600, sizeMul: 1, lineHeight: 1.55 },
  serif: { weight: 600, sizeMul: 1, lineHeight: 1.55 },
  hand: { weight: 400, sizeMul: 1.3, lineHeight: 1.42 },
}

// letterSpacing은 최신 브라우저만 지원 — 미지원이면 조용히 무시된다
const setTracking = (ctx: CanvasRenderingContext2D, px: number) => {
  try {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px}px`
  } catch {
    /* 미지원 브라우저 */
  }
}

// ── 감성 필터 — Safari가 ctx.filter를 지원하지 않아 블렌드 레이어로 구현한다 ──
interface FilterLayer {
  blend: GlobalCompositeOperation
  color: string
  alpha: number
}

export const CARD_FILTERS: { id: CardFilterId; nameKo: string; nameEn: string }[] = [
  { id: 'none', nameKo: '원본', nameEn: 'Original' },
  { id: 'clear', nameKo: '맑음', nameEn: 'Clear' },
  { id: 'film', nameKo: '필름', nameEn: 'Film' },
  { id: 'sepia', nameKo: '세피아', nameEn: 'Sepia' },
  { id: 'mono', nameKo: '흑백', nameEn: 'Mono' },
  { id: 'dawn', nameKo: '새벽', nameEn: 'Dawn' },
]

const FILTER_LAYERS: Record<CardFilterId, FilterLayer[]> = {
  none: [],
  clear: [
    { blend: 'soft-light', color: '#ffffff', alpha: 0.35 },
    { blend: 'overlay', color: '#eaf2fb', alpha: 0.12 },
  ],
  film: [
    { blend: 'soft-light', color: '#ffb37a', alpha: 0.3 },
    // 어두운 부분을 살짝 들어올려 빛바랜 필름 느낌
    { blend: 'lighten', color: '#2a2436', alpha: 0.18 },
    { blend: 'overlay', color: '#c9a06a', alpha: 0.1 },
  ],
  sepia: [
    { blend: 'saturation', color: '#808080', alpha: 1 },
    { blend: 'color', color: '#a1866b', alpha: 0.85 },
    { blend: 'soft-light', color: '#f4e3c8', alpha: 0.2 },
  ],
  mono: [
    { blend: 'saturation', color: '#808080', alpha: 1 },
    { blend: 'soft-light', color: '#ffffff', alpha: 0.12 },
  ],
  dawn: [
    { blend: 'color', color: '#41507a', alpha: 0.35 },
    { blend: 'soft-light', color: '#2b3a5e', alpha: 0.35 },
    { blend: 'lighten', color: '#1c2340', alpha: 0.12 },
  ],
}

const applyFilterLayers = (
  ctx: CanvasRenderingContext2D,
  id: CardFilterId,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  const layers = FILTER_LAYERS[id]
  if (!layers.length) return
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  for (const layer of layers) {
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

// Canvas는 자동 줄바꿈이 없어 직접 계산한다.
// 공백 단위로 채우다가 넘치면 줄을 나누고, 한 단어가 한 줄보다 길면 글자 단위로 자른다.
const wrapVerseText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
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
  const px = Math.max(11, l.pw * 0.036)
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
const drawGrain = (ctx: CanvasRenderingContext2D, l: FrameLayout) => {
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
  ctx.globalAlpha = 0.24
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
  const labelPx = Math.max(10, l.pw * 0.026)
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
}

const setTextShadow = (ctx: CanvasRenderingContext2D, fontPx: number) => {
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
  ctx.shadowBlur = fontPx * 0.22
  ctx.shadowOffsetY = fontPx * 0.06
}

const clearTextShadow = (ctx: CanvasRenderingContext2D) => {
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
}

/** 자유 레이아웃 — 드래그로 위치를 정하는 기존 방식 + 박스/형광펜 배경 */
const drawClassicLayout = (tc: TypeContext) => {
  const { ctx, l, text, refLabel, style, family, tuning, fontPx, refOnPhoto } = tc
  const refPx = Math.max(10, fontPx * 0.55)
  const mainFont = `${tuning.weight} ${fontPx}px ${family}`
  const refFont = `400 ${refPx}px ${family}`
  const lineHeight = fontPx * tuning.lineHeight
  const maxTextWidth = l.pw * 0.84

  ctx.font = mainFont
  const lines = wrapVerseText(ctx, text, maxTextWidth)
  const lineWidths = lines.map((line) => ctx.measureText(line).width)
  ctx.font = refFont
  const refWidth = refOnPhoto ? ctx.measureText(refLabel).width : 0

  const refGap = refOnPhoto ? fontPx * 0.85 : 0
  const blockW = Math.max(...lineWidths, refWidth)
  const blockH = (lines.length - 1) * lineHeight + fontPx + (refOnPhoto ? refGap + refPx : 0)

  // 중심 좌표(비율)를 사진 영역 px로 바꾸되, 블록이 사진 밖으로 나가지 않게 조인다
  const pad = style.textBg === 'scrim' ? fontPx * 0.85 : style.textBg === 'marker' ? fontPx * 0.4 : 0
  const edge = l.pw * 0.04 + pad
  const cx = Math.min(
    Math.max(l.px + style.pos.x * l.pw, l.px + edge + blockW / 2),
    l.px + l.pw - edge - blockW / 2
  )
  const top = Math.min(
    Math.max(l.py + style.pos.y * l.ph - blockH / 2, l.py + edge),
    Math.max(l.py + edge, l.py + l.ph - edge - blockH)
  )

  if (style.textBg === 'scrim') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)'
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
  // 밝은 사진 위 가독성 — 박스/형광펜이 없을 때만 그림자를 준다
  if (style.textBg === 'none') setTextShadow(ctx, fontPx)

  ctx.font = mainFont
  let y = top + fontPx * 0.83 // 대략적인 ascent 보정
  for (const line of lines) {
    ctx.fillText(line, anchorX, y, maxTextWidth)
    y += lineHeight
  }

  if (refOnPhoto) {
    ctx.font = refFont
    ctx.globalAlpha = 0.92
    ctx.fillText(refLabel, anchorX, y - lineHeight + refGap + refPx * 0.83)
    ctx.globalAlpha = 1
  }

  clearTextShadow(ctx)
}

/** 여백 레이아웃 — 사진은 그대로, 하단 그라데이션 위에 갤러리 캡션처럼 얹는다 */
const drawGalleryLayout = (tc: TypeContext) => {
  const { ctx, l, text, refLabel, style, family, tuning, fontPx, refOnPhoto } = tc
  const bodyPx = fontPx * 0.82
  const lineHeight = bodyPx * tuning.lineHeight
  const refPx = Math.max(10, bodyPx * 0.52)
  const maxW = l.pw * 0.82
  const left = l.px + l.pw * 0.09
  const bottom = l.py + l.ph - l.ph * 0.08

  // 하단 그라데이션 — 어떤 사진에서도 텍스트가 읽히게 한다
  const g = ctx.createLinearGradient(0, l.py + l.ph * 0.45, 0, l.py + l.ph)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.58)')
  ctx.save()
  ctx.fillStyle = g
  ctx.fillRect(l.px, l.py + l.ph * 0.45, l.pw, l.ph * 0.55)
  ctx.restore()

  ctx.font = `${tuning.weight} ${bodyPx}px ${family}`
  const lines = wrapVerseText(ctx, text, maxW)
  const textH = (lines.length - 1) * lineHeight + bodyPx

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = style.color
  setTextShadow(ctx, bodyPx)

  let y = bottom - textH + bodyPx * 0.83
  for (const line of lines) {
    ctx.fillText(line, left, y, maxW)
    y += lineHeight
  }

  // 출처는 본문 위 — 짧은 액센트 선과 함께 전시 라벨처럼
  if (refOnPhoto) {
    const refY = bottom - textH - bodyPx * 0.9
    ctx.globalAlpha = 0.9
    ctx.fillRect(left, refY - refPx * 1.5, bodyPx * 1.5, Math.max(1.5, bodyPx * 0.07))
    ctx.font = `600 ${refPx}px ${family}`
    setTracking(ctx, refPx * 0.2)
    ctx.fillText(refLabel, left, refY)
    setTracking(ctx, 0)
    ctx.globalAlpha = 1
  }
  clearTextShadow(ctx)
}

/** 인용 레이아웃 — 큰 따옴표가 여는 클래식한 인용 구도 */
const drawQuoteLayout = (tc: TypeContext) => {
  const { ctx, l, text, refLabel, style, family, tuning, fontPx, refOnPhoto } = tc
  const maxW = l.pw * 0.76
  const lineHeight = fontPx * tuning.lineHeight
  const quotePx = fontPx * 2.7
  const refPx = Math.max(10, fontPx * 0.5)

  ctx.font = `${tuning.weight} ${fontPx}px ${family}`
  const lines = wrapVerseText(ctx, text, maxW)
  const textH = (lines.length - 1) * lineHeight + fontPx

  const quoteH = quotePx * 0.5
  const gapQ = fontPx * 0.5
  const divGap = fontPx * 0.95
  const refBlock = refOnPhoto ? divGap * 2 + refPx : 0
  const total = quoteH + gapQ + textH + refBlock
  const cx = l.px + l.pw / 2
  let y = l.py + l.ph / 2 - total / 2

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = style.color
  setTextShadow(ctx, fontPx)

  // 여는 따옴표는 항상 명조 — 인용 부호의 품위
  ctx.font = `700 ${quotePx}px ${FONT_STACKS.serif}`
  ctx.globalAlpha = 0.88
  ctx.fillText('“', cx, y + quoteH)
  ctx.globalAlpha = 1

  ctx.font = `${tuning.weight} ${fontPx}px ${family}`
  y += quoteH + gapQ + fontPx * 0.83
  for (const line of lines) {
    ctx.fillText(line, cx, y, maxW)
    y += lineHeight
  }

  if (refOnPhoto) {
    y = y - lineHeight + divGap
    ctx.globalAlpha = 0.7
    ctx.fillRect(cx - fontPx * 0.8, y, fontPx * 1.6, Math.max(1.2, fontPx * 0.05))
    ctx.globalAlpha = 0.92
    ctx.font = `500 ${refPx}px ${family}`
    setTracking(ctx, refPx * 0.18)
    ctx.fillText(refLabel, cx, y + divGap + refPx * 0.3)
    setTracking(ctx, 0)
    ctx.globalAlpha = 1
  }
  clearTextShadow(ctx)
}

/** 한 단어 레이아웃 — 핵심 단어를 크게 띄우고 구절 전체가 그 아래를 받친다 */
const drawFocusLayout = (tc: TypeContext) => {
  const { ctx, l, text, refLabel, style, family, tuning, fontPx, refOnPhoto } = tc
  const word = pickEmphasisWord(text)
  const bigPx = fontPx * 2.35
  const bodyPx = fontPx * 0.76
  const lineHeight = bodyPx * tuning.lineHeight
  const refPx = Math.max(10, bodyPx * 0.68)
  const maxW = l.pw * 0.78

  ctx.font = `${tuning.weight} ${bodyPx}px ${family}`
  const lines = wrapVerseText(ctx, text, maxW)
  const textH = (lines.length - 1) * lineHeight + bodyPx

  const gap = fontPx * 0.75
  const refBlock = refOnPhoto ? gap * 0.9 + refPx : 0
  const total = bigPx + gap + textH + refBlock
  const cx = l.px + l.pw / 2
  let y = l.py + l.ph / 2 - total / 2

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = style.color
  setTextShadow(ctx, fontPx)

  ctx.font = `700 ${bigPx}px ${family}`
  ctx.fillText(word, cx, y + bigPx * 0.83, l.pw * 0.9)

  ctx.font = `${tuning.weight} ${bodyPx}px ${family}`
  ctx.globalAlpha = 0.92
  y += bigPx + gap + bodyPx * 0.83 - bodyPx * 0.35
  for (const line of lines) {
    ctx.fillText(line, cx, y, maxW)
    y += lineHeight
  }
  ctx.globalAlpha = 1

  if (refOnPhoto) {
    ctx.globalAlpha = 0.78
    ctx.font = `500 ${refPx}px ${family}`
    setTracking(ctx, refPx * 0.16)
    ctx.fillText(refLabel, cx, y - lineHeight + gap * 0.9 + refPx)
    setTracking(ctx, 0)
    ctx.globalAlpha = 1
  }
  clearTextShadow(ctx)
}

/** 세로 레이아웃 — 오른쪽에서 왼쪽으로 흐르는 세로쓰기 (붓글씨 족자의 구도) */
const drawVerticalLayout = (tc: TypeContext) => {
  const { ctx, l, text, refLabel, style, family, tuning, refOnPhoto } = tc
  let fontPx = tc.fontPx
  const chars = Array.from(text)

  // 글이 길면 폭 안에 들어올 때까지 글자를 줄인다
  const usableH = l.ph * 0.74
  const topY = l.py + l.ph * 0.13
  let charStep = fontPx * 1.18
  let colStep = fontPx * 1.42
  for (let attempt = 0; attempt < 8; attempt++) {
    charStep = fontPx * 1.18
    colStep = fontPx * 1.42
    const perCol = Math.max(4, Math.floor(usableH / charStep))
    const cols = Math.ceil(chars.length / perCol)
    if (cols * colStep <= l.pw * 0.76 || fontPx <= 12) break
    fontPx *= 0.88
  }

  ctx.font = `${tuning.weight} ${fontPx}px ${family}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = style.color
  setTextShadow(ctx, fontPx)

  let x = l.px + l.pw - l.pw * 0.11 - fontPx / 2
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
    const refPx = Math.max(10, fontPx * 0.5)
    ctx.font = `500 ${refPx}px ${family}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.globalAlpha = 0.85
    setTracking(ctx, refPx * 0.14)
    ctx.fillText(refLabel, l.px + l.pw * 0.09, l.py + l.ph - l.ph * 0.07)
    setTracking(ctx, 0)
    ctx.globalAlpha = 1
  }
  clearTextShadow(ctx)
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
  const crop = cropRect(img, style.ratio)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (style.frame === 'polaroid') {
    ctx.fillStyle = '#fbfaf5'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, l.px, l.py, l.pw, l.ph)
  applyFilterLayers(ctx, style.filter, l.px, l.py, l.pw, l.ph)

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
    const fontPx = Math.max(12, style.fontScale * l.pw * tuning.sizeMul)
    const tc: TypeContext = { ctx, l, text, refLabel, style, family, tuning, fontPx, refOnPhoto }
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
    const px = Math.max(13, l.pw * 0.058)
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
  const s = Math.min(img.naturalWidth, img.naturalHeight)
  const sx = (img.naturalWidth - s) / 2
  const sy = (img.naturalHeight - s) / 2
  ctx.clearRect(0, 0, size, size)
  ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size)
  applyFilterLayers(ctx, filter, 0, 0, size, size)
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

// ── 감성 배경 — 사진이 없어도 그라데이션 배경으로 카드를 만들 수 있다 ──
export interface VerseBackground {
  id: string
  nameKo: string
  nameEn: string
  stops: string[]
  /** 배경 위 기본 글자색 — 밝은 배경은 어두운 글자로 시작 */
  textColor: string
}

export const BACKGROUNDS: VerseBackground[] = [
  { id: 'dawn', nameKo: '새벽', nameEn: 'Dawn', stops: ['#1e2a52', '#5b6ea6', '#c9a7a6'], textColor: '#ffffff' },
  { id: 'sunset', nameKo: '노을', nameEn: 'Sunset', stops: ['#f6d365', '#fda085'], textColor: '#ffffff' },
  { id: 'sea', nameKo: '바다', nameEn: 'Sea', stops: ['#a8c8e8', '#3b6ea5'], textColor: '#ffffff' },
  { id: 'lavender', nameKo: '라벤더', nameEn: 'Lavender', stops: ['#e6dcf5', '#a58fd0'], textColor: '#ffffff' },
  { id: 'midnight', nameKo: '깊은 밤', nameEn: 'Midnight', stops: ['#0f1626', '#2c3e66'], textColor: '#ffffff' },
  { id: 'sage', nameKo: '세이지', nameEn: 'Sage', stops: ['#dde5d8', '#9db29a'], textColor: '#2f3a2f' },
  { id: 'cream', nameKo: '크림', nameEn: 'Cream', stops: ['#faf3e7', '#e8d9c3'], textColor: '#5c4f3d' },
  { id: 'rose', nameKo: '로즈', nameEn: 'Rose', stops: ['#fbe4e6', '#e8a3ad'], textColor: '#6b3540' },
]

/** 미리보기 스와치용 CSS 그라데이션 */
export const backgroundCss = (bg: VerseBackground) =>
  `linear-gradient(160deg, ${bg.stops.join(', ')})`

/** 배경 그라데이션을 4:5 이미지로 만든다 — 이후 사진과 동일한 파이프라인을 탄다 */
export const createBackgroundImage = async (bg: VerseBackground): Promise<HTMLImageElement> => {
  const W = 1080
  const H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')

  // 160deg 근사 — 좌상단에서 우하단으로
  const g = ctx.createLinearGradient(W * 0.15, 0, W * 0.85, H)
  bg.stops.forEach((stop, i) => g.addColorStop(bg.stops.length === 1 ? 0 : i / (bg.stops.length - 1), stop))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // 은은한 빛 — 상단에 밝은 기운을 더해 밋밋함을 줄인다
  const glow = ctx.createRadialGradient(W * 0.72, H * 0.16, 0, W * 0.72, H * 0.16, W * 0.9)
  glow.addColorStop(0, 'rgba(255,255,255,0.16)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // 미세한 노이즈 — 그라데이션 밴딩(줄무늬)을 없애 인화지 질감을 준다
  const noise = ctx.getImageData(0, 0, W, H)
  const data = noise.data
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 8
    data[i] += n
    data[i + 1] += n
    data[i + 2] += n
  }
  ctx.putImageData(noise, 0, 0)

  const img = new Image()
  img.src = canvas.toDataURL('image/jpeg', 0.92)
  await img.decode()
  return img
}

// Canvas 텍스트는 CSS와 달리 폰트가 로드되어 있어야만 웹폰트로 그려진다.
// 실패해도 시스템 폰트로 대체되므로 조용히 넘어간다.
export const ensureCardFonts = async () => {
  try {
    await Promise.all([
      document.fonts.load('600 24px Pretendard'),
      document.fonts.load('600 24px "Noto Serif KR"'),
      document.fonts.load('700 24px "Noto Serif KR"'),
      document.fonts.load('400 16px "Noto Serif KR"'),
      document.fonts.load('400 24px "Nanum Pen Script"'),
      document.fonts.load('700 16px Orbitron'),
    ])
  } catch {
    // 폰트 로드 실패 — 시스템 폰트 폴백
  }
}
