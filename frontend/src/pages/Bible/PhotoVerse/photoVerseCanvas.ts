// 말씀 사진 카드 — Canvas 합성 유틸.
// 미리보기와 최종 저장이 같은 drawVerseCard()를 쓰므로 화면에서 본 그대로 저장된다.
// 모든 좌표/크기는 이미지 크기 대비 비율로 저장해 해상도가 달라도 결과가 같다.

export type CardFilterId = 'none' | 'clear' | 'film' | 'sepia' | 'mono' | 'dawn'
export type CardFrameId = 'none' | 'polaroid' | 'film'

export interface VerseCardStyle {
  color: string
  /** 글자 크기 — 이미지 너비 대비 비율 (0.03 ~ 0.09) */
  fontScale: number
  fontFamily: 'sans' | 'serif' | 'hand'
  align: 'left' | 'center' | 'right'
  /** 텍스트 뒤 반투명 배경 박스 */
  scrim: boolean
  /** 출처(책 장:절) 표기 */
  showRef: boolean
  /** 텍스트 블록 중심 — 사진 영역 대비 0~1 비율 좌표 */
  pos: { x: number; y: number }
  /** 감성 필터 */
  filter: CardFilterId
  /** 프레임 — 폴라로이드(여백+손글씨 출처) / 필름(비네트+날짜 스탬프) */
  frame: CardFrameId
}

export const DEFAULT_CARD_STYLE: VerseCardStyle = {
  color: '#ffffff',
  fontScale: 0.055,
  fontFamily: 'serif',
  align: 'center',
  scrim: false,
  showRef: true,
  pos: { x: 0.5, y: 0.42 },
  filter: 'none',
  frame: 'none',
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

/** 필름 프레임 — 가장자리를 어둡게 하는 비네트 */
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

  ctx.drawImage(img, l.px, l.py, l.pw, l.ph)
  applyFilterLayers(ctx, style.filter, l.px, l.py, l.pw, l.ph)

  if (style.frame === 'film') drawVignette(ctx, l)
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
    const blockH =
      (lines.length - 1) * lineHeight + fontPx + (refOnPhoto ? refGap + refPx : 0)

    // 중심 좌표(비율)를 사진 영역 px로 바꾸되, 블록이 사진 밖으로 나가지 않게 조인다
    const pad = fontPx * 0.85 // 스크림 안쪽 여백
    const edge = l.pw * 0.04 + (style.scrim ? pad : 0)
    const cx = Math.min(
      Math.max(l.px + style.pos.x * l.pw, l.px + edge + blockW / 2),
      l.px + l.pw - edge - blockW / 2
    )
    const top = Math.min(
      Math.max(l.py + style.pos.y * l.ph - blockH / 2, l.py + edge),
      Math.max(l.py + edge, l.py + l.ph - edge - blockH)
    )

    if (style.scrim) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)'
      roundRect(ctx, cx - blockW / 2 - pad, top - pad, blockW + pad * 2, blockH + pad * 2, fontPx * 0.6)
      ctx.fill()
    }

    const anchorX =
      style.align === 'left' ? cx - blockW / 2 : style.align === 'right' ? cx + blockW / 2 : cx
    ctx.textAlign = style.align
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = style.color
    // 밝은 사진 위 가독성 — 스크림이 없을 때만 그림자를 준다
    if (!style.scrim) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
      ctx.shadowBlur = fontPx * 0.22
      ctx.shadowOffsetY = fontPx * 0.06
    }

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

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }

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

  if (style.frame === 'film') drawDateStamp(ctx, l)
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

/** 원본 비율을 유지하며 사진의 긴 변을 maxSide 이하로 캡한 canvas를 만든다 (프레임 여백 포함) */
export const createCardCanvas = (
  img: HTMLImageElement,
  maxSide: number,
  frame: CardFrameId = 'none'
): HTMLCanvasElement => {
  const longSide = Math.max(img.naturalWidth, img.naturalHeight)
  const scale = Math.min(1, maxSide / longSide)
  const photoW = Math.max(1, img.naturalWidth * scale)
  const photoH = Math.max(1, img.naturalHeight * scale)
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
      document.fonts.load('400 16px "Noto Serif KR"'),
      document.fonts.load('400 24px "Nanum Pen Script"'),
      document.fonts.load('700 16px Orbitron'),
    ])
  } catch {
    // 폰트 로드 실패 — 시스템 폰트 폴백
  }
}
