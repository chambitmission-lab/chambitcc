// 말씀 사진 카드 — Canvas 합성 유틸.
// 미리보기와 최종 저장이 같은 drawVerseCard()를 쓰므로 화면에서 본 그대로 저장된다.
// 모든 좌표/크기는 이미지 크기 대비 비율로 저장해 해상도가 달라도 결과가 같다.

export interface VerseCardStyle {
  color: string
  /** 글자 크기 — 이미지 너비 대비 비율 (0.03 ~ 0.09) */
  fontScale: number
  fontFamily: 'sans' | 'serif'
  align: 'left' | 'center' | 'right'
  /** 텍스트 뒤 반투명 배경 박스 */
  scrim: boolean
  /** 출처(책 장:절) 표기 */
  showRef: boolean
  /** 텍스트 블록 중심 — 0~1 비율 좌표 */
  pos: { x: number; y: number }
}

export const DEFAULT_CARD_STYLE: VerseCardStyle = {
  color: '#ffffff',
  fontScale: 0.055,
  fontFamily: 'serif',
  align: 'center',
  scrim: false,
  showRef: true,
  pos: { x: 0.5, y: 0.42 },
}

const FONT_STACKS: Record<VerseCardStyle['fontFamily'], string> = {
  sans: '"Pretendard", -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
  serif: '"Noto Serif KR", "Apple SD Gothic Neo", serif',
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

  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  if (!text) return

  const family = FONT_STACKS[style.fontFamily]
  const fontPx = Math.max(12, style.fontScale * w)
  const refPx = Math.max(10, fontPx * 0.55)
  const mainFont = `600 ${fontPx}px ${family}`
  const refFont = `400 ${refPx}px ${family}`
  const lineHeight = fontPx * 1.55
  const maxTextWidth = w * 0.84

  ctx.font = mainFont
  const lines = wrapVerseText(ctx, text, maxTextWidth)
  const lineWidths = lines.map((l) => ctx.measureText(l).width)
  ctx.font = refFont
  const withRef = style.showRef && !!refLabel
  const refWidth = withRef ? ctx.measureText(refLabel).width : 0

  const refGap = withRef ? fontPx * 0.85 : 0
  const blockW = Math.max(...lineWidths, refWidth)
  const blockH =
    (lines.length - 1) * lineHeight + fontPx + (withRef ? refGap + refPx : 0)

  // 중심 좌표(비율)를 실제 px로 바꾸되, 블록이 사진 밖으로 나가지 않게 조인다
  const pad = fontPx * 0.85 // 스크림 안쪽 여백
  const edge = w * 0.04 + (style.scrim ? pad : 0)
  const cx = Math.min(Math.max(style.pos.x * w, edge + blockW / 2), w - edge - blockW / 2)
  const top = Math.min(
    Math.max(style.pos.y * h - blockH / 2, edge),
    Math.max(edge, h - edge - blockH)
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

  if (withRef) {
    ctx.font = refFont
    ctx.globalAlpha = 0.92
    ctx.fillText(refLabel, anchorX, y - lineHeight + refGap + refPx * 0.83)
    ctx.globalAlpha = 1
  }

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
}

/** 원본 비율을 유지하며 긴 변을 maxSide 이하로 캡한 canvas를 만든다 */
export const createCardCanvas = (img: HTMLImageElement, maxSide: number): HTMLCanvasElement => {
  const longSide = Math.max(img.naturalWidth, img.naturalHeight)
  const scale = Math.min(1, maxSide / longSide)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  return canvas
}

// Canvas 텍스트는 CSS와 달리 폰트가 로드되어 있어야만 웹폰트로 그려진다.
// 실패해도 시스템 폰트로 대체되므로 조용히 넘어간다.
export const ensureCardFonts = async () => {
  try {
    await Promise.all([
      document.fonts.load('600 24px Pretendard'),
      document.fonts.load('600 24px "Noto Serif KR"'),
      document.fonts.load('400 16px "Noto Serif KR"'),
    ])
  } catch {
    // 폰트 로드 실패 — 시스템 폰트 폴백
  }
}
