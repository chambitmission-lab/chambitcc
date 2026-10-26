// 필사대회 글씨 → 이미지 두 가지.
//  1) 출품 PNG: 쓴 자리만 잘라 낸 투명 PNG — 갤러리에서 짧은 구절도 종이 가운데 꽉 차 보인다.
//  2) 말씀카드: 감성 배경(말씀 사진 카드와 같은 장면) 위에 획 JSON 을 배경에 맞는 색으로 다시 칠한다.
//     PNG 가 아니라 획으로 그리니 어떤 비율·해상도에서도 선명하고, 밤 배경엔 흰 잉크가 된다.
import { createBackgroundImage, type VerseBackground } from '../Bible/PhotoVerse/canvas/backgrounds'
import { INK_PAGE_H, INK_PAGE_W, type InkPage } from '../Capsule/ink/inkModel'
import { drawStrokes, strokePath } from '../Capsule/ink/inkRender'

const SERIF = '"Noto Serif KR", "Apple SD Gothic Neo", serif'
const SANS = '"Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", sans-serif'

export interface InkBox {
  x: number
  y: number
  w: number
  h: number
}

/** 획이 닿은 영역(논리 단위) + 여백. 아무것도 안 썼으면 종이 전체 */
export const inkBounds = (page: InkPage, pad = 36): InkBox => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const s of page.strokes) {
    const r = s.s
    for (let i = 0; i < s.p.length; i += 3) {
      const x = s.p[i]
      const y = s.p[i + 1]
      if (x - r < minX) minX = x - r
      if (y - r < minY) minY = y - r
      if (x + r > maxX) maxX = x + r
      if (y + r > maxY) maxY = y + r
    }
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: INK_PAGE_W, h: INK_PAGE_H }
  const x = Math.max(0, minX - pad)
  const y = Math.max(0, minY - pad)
  return {
    x,
    y,
    w: Math.min(INK_PAGE_W, maxX + pad) - x,
    h: Math.min(INK_PAGE_H, maxY + pad) - y,
  }
}

/** 출품 PNG — 쓴 자리만, 논리 1단위 = 1.5px (종이 폭 1000 → 최대 1500px) */
export const exportCroppedInkPng = async (page: InkPage): Promise<{ png: Blob; width: number; height: number }> => {
  const box = inkBounds(page)
  const scale = 1.5
  const width = Math.max(1, Math.round(box.w * scale))
  const height = Math.max(1, Math.round(box.h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d 컨텍스트를 만들 수 없습니다')
  ctx.setTransform(scale, 0, 0, scale, -box.x * scale, -box.y * scale)
  drawStrokes(ctx, page.strokes, 'light')
  const png = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG 변환 실패'))), 'image/png')
  })
  return { png, width, height }
}

// ── 말씀카드 ───────────────────────────────────────────────────

export type CardRatio = '4:5' | '1:1' | '9:16'

export const CARD_RATIOS: { id: CardRatio; label: string; w: number; h: number }[] = [
  { id: '4:5', label: '4:5 피드', w: 1080, h: 1350 },
  { id: '1:1', label: '1:1 정사각', w: 1080, h: 1080 },
  { id: '9:16', label: '9:16 스토리', w: 1080, h: 1920 },
]

export interface InkCardInput {
  page: InkPage
  bg: VerseBackground
  ratio: CardRatio
  verseRef: string
  /** 아래 작은 줄 — '참빛 손글씨 필사대회 · 1등 · 홍길동'. null 이면 생략 */
  credit: string | null
}

/** 카드에 쓸 글자로 웹폰트 조각을 먼저 받는다 — 안 기다리면 폴백 서체로 구워진다 */
export const ensureInkCardFonts = async (sample: string): Promise<void> => {
  try {
    await Promise.all([
      document.fonts.load(`600 34px ${SERIF}`, sample),
      document.fonts.load(`600 24px ${SANS}`, sample),
    ])
  } catch {
    /* 폰트 로드 실패 — 시스템 폰트로 그린다 */
  }
}

const drawCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) => {
  const s = Math.max(W / img.width, H / img.height)
  const dw = img.width * s
  const dh = img.height * s
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
}

/** 말씀카드 한 장을 canvas 에 그린다 (미리보기·저장 공용) */
export const drawInkCard = async (canvas: HTMLCanvasElement, input: InkCardInput): Promise<void> => {
  const spec = CARD_RATIOS.find((r) => r.id === input.ratio) ?? CARD_RATIOS[0]
  const W = spec.w
  const H = spec.h
  const tall = H / W > 1.5
  const bgImg = await createBackgroundImage(input.bg, tall)
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d 컨텍스트를 만들 수 없습니다')
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  drawCover(ctx, bgImg, W, H)

  const ink = input.bg.textColor
  // 글씨 상자 — 아래쪽은 출처·크레딧 자리
  const captionH = H * (tall ? 0.2 : 0.22)
  const boxX = W * 0.09
  const boxY = H * (tall ? 0.14 : 0.09)
  const boxW = W - boxX * 2
  const boxH = H - boxY - captionH
  const b = inkBounds(input.page, 12)
  const scale = Math.min(boxW / b.w, boxH / b.h, 2.4)
  const ox = boxX + (boxW - b.w * scale) / 2 - b.x * scale
  const oy = boxY + (boxH - b.h * scale) / 2 - b.y * scale
  ctx.save()
  ctx.setTransform(scale, 0, 0, scale, ox, oy)
  ctx.fillStyle = ink
  for (const s of input.page.strokes) {
    const path = strokePath(s)
    if (path) ctx.fill(path)
  }
  ctx.restore()

  // 출처 — 가는 줄 하나 위에 명조로
  const capTop = H - captionH
  ctx.fillStyle = ink
  ctx.globalAlpha = 0.35
  ctx.fillRect(W / 2 - 28, capTop + captionH * 0.18, 56, 2)
  ctx.globalAlpha = 1
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `600 ${Math.round(W * 0.034)}px ${SERIF}`
  ctx.fillText(input.verseRef, W / 2, capTop + captionH * 0.42, W * 0.84)
  if (input.credit) {
    ctx.globalAlpha = 0.72
    ctx.font = `600 ${Math.round(W * 0.022)}px ${SANS}`
    ctx.fillText(input.credit, W / 2, capTop + captionH * 0.66, W * 0.84)
    ctx.globalAlpha = 1
  }
}

export const canvasToPng = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지를 만들지 못했어요'))), 'image/png')
  })
