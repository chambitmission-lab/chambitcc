// 타이포 레이아웃 — 완성된 구도 6종과 그것이 쓰는 장식(스크림·괘선·인장·서명).

import { FONT_STACKS, FONT_TUNING, REF_FAMILY, SIGNATURE_TEXT, isLightColor, minPx, parseHex, setTracking } from './cardStyle'
import type { CardLayoutId, VerseCardStyle } from './cardStyle'
import { roundRect, wrapVerseText } from './text'
import { sampleLuminance } from './baseLayer'
import type { FrameLayout } from './frames'
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

/** 먹 번짐 — 붓 서체는 그림자 대신 글자색이 종이에 스민 듯 살짝 번지게 한다 */
const setInkBleed = (ctx: CanvasRenderingContext2D, fontPx: number, color: string) => {
  const [r, g, b] = parseHex(color)
  ctx.shadowColor = `rgba(${r},${g},${b},0.55)`
  ctx.shadowBlur = fontPx * 0.07
  ctx.shadowOffsetY = 0
}

/** 서체에 맞는 글자 그림자 — 붓은 먹 번짐, 나머지는 드롭 섀도 */
const setTypeShadow = (tc: TypeContext, fontPx: number) => {
  if (tc.style.fontFamily === 'brush') setInkBleed(tc.ctx, fontPx, tc.style.color)
  else setTextShadow(tc.ctx, fontPx, tc.lightText)
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

/**
 * 낙관 — 붉은 인장. 족자·서예 작품의 서명 문법이라 세로쓰기 레이아웃의 서명이 이것으로 바뀐다.
 * 주사(朱砂) 빛 사각 도장 안에 흰 글자, 테두리 한 줄, 살짝 기울임과 찍힘 얼룩.
 */
const drawSeal = (ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, lang: 'ko' | 'en') => {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((-2.5 * Math.PI) / 180)
  ctx.shadowColor = 'rgba(120, 20, 10, 0.25)'
  ctx.shadowBlur = s * 0.12
  ctx.fillStyle = 'rgba(196, 48, 36, 0.9)'
  roundRect(ctx, -s / 2, -s / 2, s, s, s * 0.08)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  // 인주가 고르지 않게 찍힌 얼룩 — 모서리를 살짝 비워 손도장의 물성
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.ellipse(s * 0.38, -s * 0.36, s * 0.16, s * 0.1, 0.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(-s * 0.4, s * 0.34, s * 0.12, s * 0.08, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  // 테두리
  ctx.strokeStyle = 'rgba(255, 240, 230, 0.85)'
  ctx.lineWidth = Math.max(0.6, s * 0.035)
  const inset = s * 0.11
  roundRect(ctx, -s / 2 + inset, -s / 2 + inset, s - inset * 2, s - inset * 2, s * 0.03)
  ctx.stroke()
  // 글자 — 한글은 두 자 세로, 영문은 십자
  ctx.fillStyle = 'rgba(255, 244, 236, 0.95)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (lang === 'ko') {
    const px = s * 0.36
    ctx.font = `600 ${px}px ${FONT_STACKS.serif}`
    ctx.fillText('참', 0, -s * 0.2)
    ctx.fillText('빛', 0, s * 0.2)
  } else {
    ctx.strokeStyle = 'rgba(255, 244, 236, 0.95)'
    drawSmallCross(ctx, 0, s * 0.02, s * 0.26)
  }
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
  if (style.textBg === 'none' || style.textBg === 'soft') setTypeShadow(tc, fontPx)

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
  setTypeShadow(tc, bodyPx)

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
  const { ctx, l, text, refLabel, style, family, tuning, fontPx, refOnPhoto } = tc
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
  setTypeShadow(tc, fontPx)

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
  const { ctx, l, text, refLabel, style, family, tuning, fontPx, refOnPhoto } = tc
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
  setTypeShadow(tc, fontPx)

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
  const { ctx, l, text, refLabel, style, family, tuning, fontPx, refOnPhoto } = tc
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
  setTypeShadow(tc, fontPx)

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
  const { ctx, l, text, refLabel, style, family, tuning, refOnPhoto } = tc
  let fontPx = tc.fontPx
  const chars = Array.from(text)
  const brush = style.fontFamily === 'brush'

  // 글이 길면 폭 안에 들어올 때까지 글자를 줄인다
  const usableH = l.ph * 0.74
  const topY = l.py + l.ph * 0.13
  const stepMul = brush ? 1.08 : 1.18
  const colMul = brush ? 1.3 : 1.42
  let charStep = fontPx * stepMul
  let colStep = fontPx * colMul
  let cols = 1
  for (let attempt = 0; attempt < 8; attempt++) {
    charStep = fontPx * stepMul
    colStep = fontPx * colMul
    const perCol = Math.max(4, Math.floor(usableH / charStep))
    cols = Math.ceil(chars.length / perCol)
    if (cols * colStep <= l.pw * 0.76 || fontPx <= 12) break
    fontPx *= 0.88
  }

  // 열 균형 — 마지막 열에 한두 글자만 남지 않게 글자 수를 열마다 고르게 나눈다 (띄어쓰기는 반 칸)
  const effLen = chars.reduce((n, ch) => n + (ch === ' ' ? 0.5 : 1), 0)
  const perColSteps = Math.max(1, Math.ceil(effLen / cols))
  const colH = Math.min(usableH, perColSteps * charStep)

  const right = l.px + l.pw - l.pw * 0.11
  if (style.textBg !== 'none') {
    const blockW = cols * colStep
    drawSoftScrim(tc, right - blockW / 2, topY + colH / 2, blockW, colH)
  }

  ctx.font = `${tuning.weight} ${fontPx}px ${family}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = style.color
  setTypeShadow(tc, fontPx)

  let x = right - fontPx / 2
  let y = topY + charStep / 2
  const maxY = topY + colH
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

  // 출처 — 왼쪽 아래에 가로로 작게. 붓 서체면 출처도 붓으로 쓴다
  if (refOnPhoto) {
    const refPx = minPx(l.pw, fontPx * (brush ? 0.62 : 0.46), 10)
    if (brush) ctx.font = `400 ${refPx}px ${family}`
    else setRefFont(ctx, refPx)
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
  // 세로쓰기는 글자 서명 대신 낙관 — 출처 위, 왼쪽 아래
  if (style.layout === 'vertical') {
    const size = minPx(l.pw, l.pw * 0.075, 18)
    const refLift = style.showRef ? l.ph * 0.07 + size * 0.75 : l.ph * 0.07
    drawSeal(ctx, l.px + l.pw * 0.09 + size / 2, l.py + l.ph - refLift - size * 0.6, size, style.lang)
    return
  }
  const px = minPx(l.pw, l.pw * 0.021, 9)
  // 괘선 액자(엽서 레이아웃·절기 프레임) 안쪽으로 들어가 선과 겹치지 않게 한다
  const inset = style.layout === 'poster' ? l.pw * 0.105 : style.frame === 'season' ? l.pw * 0.075 : l.pw * 0.055
  const text = SIGNATURE_TEXT[style.lang]
  const hasStamp = style.frame === 'film' || style.textures.includes('stamp')
  // 날짜 스탬프가 오른쪽 아래를 쓰면 왼쪽으로
  const side: 'right' | 'left' = hasStamp ? 'left' : 'right'

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


// ── photoVerseCanvas 내부 공유 ──
export { KEYWORDS_KO, KEYWORDS_EN, pickEmphasisWord, setTextShadow, setInkBleed, setTypeShadow, clearTextShadow, drawSoftScrim, setRefFont, drawOrnamentRule, drawSmallCross, drawSeal, drawClassicLayout, drawGalleryLayout, drawQuoteLayout, drawFocusLayout, drawPosterLayout, drawVerticalLayout, drawSignature }
export type { TypeContext }
