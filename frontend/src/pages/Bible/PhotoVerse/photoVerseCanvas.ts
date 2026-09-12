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
//
// 합성 파이프라인은 canvas/ 아래로 나뉘어 있고, 이 파일은 그 조립과 공개 API만 맡는다.
//   canvas/cardStyle.ts    옵션 타입 · 기본값 · 서체 · 색 유틸
//   canvas/filters.ts      톤 커브(LUT) 필터
//   canvas/baseLayer.ts    비율 크롭 · 필터 적용본 캐시 · 밝기 측정
//   canvas/text.ts         줄바꿈 · 둥근 사각형
//   canvas/frames.ts       프레임 여백 · 질감 · 절기 에디션
//   canvas/layouts.ts      타이포 구도 6종 · 장식 · 서명
//   canvas/backgrounds.ts  사진 없이 그리는 장면 배경

export type {
  CardFilterId,
  CardFrameId,
  CardLayoutId,
  CardRatioId,
  CardTextBg,
  CardTextureId,
  VerseCardStyle,
} from './canvas/cardStyle'
export { DEFAULT_CARD_STYLE } from './canvas/cardStyle'
export { CARD_FILTERS } from './canvas/filters'
export { CARD_LAYOUTS } from './canvas/layouts'
export { getSeasonStamp } from './canvas/frames'
export type { SeasonStamp } from './canvas/frames'
export { BACKGROUNDS, backgroundCss, createBackgroundImage } from './canvas/backgrounds'
export type { VerseBackground } from './canvas/backgrounds'

import { FONT_STACKS, FONT_TUNING, isLightColor, minPx } from './canvas/cardStyle'
import type { CardFilterId, CardFrameId, CardRatioId, VerseCardStyle } from './canvas/cardStyle'
import { cropRect, getBaseLayer, sampleLuminance } from './canvas/baseLayer'
import {
  drawDateStamp,
  drawGrain,
  drawLightLeak,
  drawSeasonFrame,
  drawVignette,
  frameLayout,
  layoutFromCanvas,
} from './canvas/frames'
import {
  drawClassicLayout,
  drawFocusLayout,
  drawGalleryLayout,
  drawPosterLayout,
  drawQuoteLayout,
  drawSignature,
  drawVerticalLayout,
} from './canvas/layouts'
import type { TypeContext } from './canvas/layouts'

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
      document.fonts.load('400 24px "Nanum Brush Script"', sample),
      document.fonts.load('700 16px Orbitron'), // 날짜 스탬프 — 숫자뿐이라 샘플 불필요
    ])
  } catch {
    // 폰트 로드 실패 — 시스템 폰트 폴백
  }
}
