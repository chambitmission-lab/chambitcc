// 손글씨 층 — 서체로 조판하는 대신, 사용자가 직접 쓴 획을 사진 위에 그대로 얹는다.
// 획은 그림(PNG)이 아니라 좌표라서 어떤 해상도로 저장해도 선명하고, 잉크색은 카드의 글자색을 따른다.
// 필사대회·타임캡슐과 같은 획 모델(Capsule/ink)을 쓴다.

import { DEFAULT_CARD_STYLE, minPx } from './cardStyle'
import { drawSoftScrim, setRefFont, setTextShadow } from './layouts'
import type { TypeContext } from './layouts'
import { INK_PAGE_W } from '../../../Capsule/ink/inkModel'
import type { InkPage, InkStroke } from '../../../Capsule/ink/inkModel'
import { strokePath } from '../../../Capsule/ink/inkRender'

/** 글씨 자리 — 사진 영역의 위·가운데·아래 (가로는 늘 가운데) */
export type InkPlace = 'top' | 'center' | 'bottom'

export interface CardInk {
  page: InkPage
  place: InkPlace
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

// 획 윤곽(perfect-freehand) 계산이 그리기 비용의 대부분이다 — 획은 불변이라 한 번만 만든다
const pathCache = new WeakMap<InkStroke, Path2D | null>()
const pathOf = (s: InkStroke): Path2D | null => {
  if (pathCache.has(s)) return pathCache.get(s) ?? null
  const p = strokePath(s)
  pathCache.set(s, p)
  return p
}

const boundsCache = new WeakMap<InkPage, Box | null>()
/** 획이 닿은 영역(논리 단위) — 아무것도 안 썼으면 null */
const boundsOf = (page: InkPage): Box | null => {
  if (boundsCache.has(page)) return boundsCache.get(page) ?? null
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
  const box = Number.isFinite(minX) ? { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) } : null
  boundsCache.set(page, box)
  return box
}

// 끌기·필터 바꾸기처럼 글씨는 그대로인 다시 그리기가 잦다 — 마지막으로 구운 큰 글씨 한 장은 다시 쓴다
let lastBake: { page: InkPage; w: number; h: number; color: string; canvas: HTMLCanvasElement } | null = null
const BAKE_CACHE_MIN_W = 320

/**
 * 글씨만 따로 굽는다. 획마다 그림자를 주면 뒤에 쓴 획의 그림자가 앞 획 위에 얹혀 글씨가 얼룩지므로,
 * 그림자 없이 한 장으로 구운 뒤 그 한 장에 그림자를 준다.
 */
const bakeInk = (page: InkPage, b: Box, scale: number, color: string): HTMLCanvasElement | null => {
  const w = Math.max(1, Math.ceil(b.w * scale))
  const h = Math.max(1, Math.ceil(b.h * scale))
  if (lastBake && lastBake.page === page && lastBake.w === w && lastBake.h === h && lastBake.color === color) {
    return lastBake.canvas
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(scale, 0, 0, scale, -b.x * scale, -b.y * scale)
  ctx.fillStyle = color
  for (const s of page.strokes) {
    const path = pathOf(s)
    if (path) ctx.fill(path)
  }
  if (w >= BAKE_CACHE_MIN_W) lastBake = { page, w, h, color, canvas }
  return canvas
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

/**
 * 손글씨 블록 — 글 영역 안에 자동으로 맞춰 넣고(가로 가운데), 위·가운데·아래 중 한 자리에 놓는다.
 * 크기는 글자 크기 값(슬라이더·두 손가락)을 그대로 따라 키우고 줄인다. 출처는 글씨 바로 아래.
 */
export const drawInkBlock = (tc: TypeContext, ink: CardInk) => {
  const { ctx, l, style } = tc
  const b = boundsOf(ink.page)
  if (!b) return

  const padX = l.pw * 0.09
  const padTop = l.pw * 0.09
  // 아래쪽은 서명·날짜 스탬프 자리를 남긴다
  const padBottom = l.pw * 0.11
  const refPx = minPx(l.pw, l.pw * 0.03, 10)
  const refH = tc.refOnPhoto ? refPx * 2.8 : 0
  const availW = l.pw - padX * 2
  const availH = l.ph - padTop - padBottom - refH
  if (availW <= 0 || availH <= 0) return

  // 기본은 넉넉히 읽히는 크기(폭 92%·높이 60% 안), 짧은 글씨가 지나치게 커지지 않게 상한을 둔다
  const comfy = Math.min((availW * 0.92) / b.w, (availH * 0.6) / b.h, (l.pw / INK_PAGE_W) * 2.4)
  const size = clamp(style.fontScale / DEFAULT_CARD_STYLE.fontScale, 0.5, 1.6)
  const scale = Math.min(comfy * size, availW / b.w, availH / b.h)
  const blockW = b.w * scale
  const blockH = b.h * scale
  const groupH = blockH + refH
  const cx = l.px + l.pw / 2
  const top =
    ink.place === 'top'
      ? l.py + padTop
      : ink.place === 'bottom'
        ? l.py + l.ph - padBottom - groupH
        : l.py + padTop + (availH + refH - groupH) / 2

  // 손글씨에는 박스·형광펜이 어울리지 않는다 — 글 배경을 켰으면 모두 은은한 스크림으로
  if (style.textBg !== 'none') {
    drawSoftScrim({ ...tc, fontPx: l.pw * 0.045 }, cx, top + groupH / 2, blockW, groupH)
  }

  const baked = bakeInk(ink.page, b, scale, style.color)
  if (baked) {
    ctx.save()
    setTextShadow(ctx, l.pw * 0.04, tc.lightText)
    ctx.drawImage(baked, cx - blockW / 2, top, blockW, blockH)
    ctx.restore()
  }

  if (tc.refOnPhoto) {
    ctx.save()
    setRefFont(ctx, refPx)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = style.color
    ctx.globalAlpha = 0.92
    setTextShadow(ctx, refPx, tc.lightText)
    ctx.fillText(tc.refLabel, cx, top + blockH + refH * 0.64, availW)
    ctx.restore()
  }
}
