// 손글씨 획 → 캔버스. 획의 윤곽은 perfect-freehand(필압·속도로 굵기가 변하는 붓획)로 만들고
// 논리 좌표(INK_PAGE_W 기준) 그대로 그린다 — 캔버스 transform이 화면 크기를 맡는다.
import { getStroke } from 'perfect-freehand'
import {
  INK_PAGE_H,
  INK_PAGE_W,
  inkColorFor,
  type InkPage,
  type InkStroke,
  type InkTheme,
} from './inkModel'

/** 백킹 스토어 상한 — 폰에서 zoom 2.5배 × DPR 3 이면 메모리가 수십 MB로 뛴다 */
const MAX_DPR = 2
/** 캔버스 한 장의 픽셀 상한(≈32MB). PC 760css × zoom 2.4 × DPR 2 는 3648×5159 = 75MB 라
    두 장(committed+live)이면 150MB — 사파리 캔버스 예산에 닿고 모바일 크롬은 소프트웨어 래스터로 떨어진다.
    넘으면 DPR 을 낮춘다(확대 상태라 글씨가 커서 1.3 DPR 로도 또렷하다) */
const MAX_BACKING_PIXELS = 8_000_000

const outlineOptions = (stroke: InkStroke, last: boolean) => ({
  size: stroke.s,
  thinning: 0.58,
  smoothing: 0.55,
  streamline: 0.42,
  simulatePressure: !!stroke.sim,
  last,
})

/** 획의 앞 `upTo`개 점까지만 — 개봉 재생에서 "지금 써지는 중"인 획 */
const pointsOf = (stroke: InkStroke, upTo?: number): number[][] => {
  const n = upTo == null ? stroke.p.length / 3 : Math.min(upTo, stroke.p.length / 3)
  const pts: number[][] = new Array(n)
  for (let i = 0; i < n; i++) pts[i] = [stroke.p[i * 3], stroke.p[i * 3 + 1], stroke.p[i * 3 + 2]]
  return pts
}

/** 윤곽 점들을 중점 2차 곡선으로 이은 Path2D (perfect-freehand 권장 방식) */
export const strokePath = (stroke: InkStroke, upTo?: number, last = true): Path2D | null => {
  const pts = pointsOf(stroke, upTo)
  if (pts.length === 0) return null
  const outline = getStroke(pts, outlineOptions(stroke, last))
  if (outline.length < 2) return null
  const path = new Path2D()
  const [x0, y0] = outline[0]
  path.moveTo(x0, y0)
  for (let i = 1; i < outline.length; i++) {
    const [x1, y1] = outline[i]
    const [x2, y2] = outline[(i + 1) % outline.length]
    path.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2)
  }
  path.closePath()
  return path
}

export const drawStroke = (
  ctx: CanvasRenderingContext2D,
  stroke: InkStroke,
  theme: InkTheme,
  upTo?: number,
  last = true,
): void => {
  const path = strokePath(stroke, upTo, last)
  if (!path) return
  ctx.fillStyle = inkColorFor(stroke.c, theme)
  ctx.fill(path)
}

export const drawStrokes = (
  ctx: CanvasRenderingContext2D,
  strokes: InkStroke[],
  theme: InkTheme,
): void => {
  for (const s of strokes) drawStroke(ctx, s, theme)
}

/** 캔버스를 CSS 크기에 맞추고, 논리 좌표(1000 × 1414)로 그릴 수 있게 transform을 건다.
    크기가 같으면 백킹 스토어를 건드리지 않는다(내용이 지워지므로). 반환값: 다시 잡았는지
    ★ desynchronized(저지연) 옵션은 쓰지 않는다 — 안드로이드 크롬은 그 캔버스를 불투명 검은 면으로
    합성해 종이와 아래 캔버스를 전부 가린다(2026-10-26 갤럭시 실기기 재현). */
export const fitCanvas = (
  canvas: HTMLCanvasElement,
  cssWidth: number,
): { ctx: CanvasRenderingContext2D; resized: boolean } | null => {
  const cssHeight = (cssWidth * INK_PAGE_H) / INK_PAGE_W
  const dpr = Math.min(
    window.devicePixelRatio || 1,
    MAX_DPR,
    Math.sqrt(MAX_BACKING_PIXELS / Math.max(1, cssWidth * cssHeight)),
  )
  const bw = Math.max(1, Math.round(cssWidth * dpr))
  const bh = Math.max(1, Math.round(cssHeight * dpr))
  let resized = false
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw
    canvas.height = bh
    resized = true
  }
  canvas.style.width = `${cssWidth}px`
  canvas.style.height = `${cssHeight}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const scale = bw / INK_PAGE_W
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  return { ctx, resized }
}

/** 보이는 창 크기만큼의 캔버스(InkPad 의 live) — 종이가 아니라 스크롤 창에 맞추므로 확대해도 백킹 스토어가 안 커진다.
    논리 좌표 transform 은 호출자가 프레임마다 종이 위치에 맞춰 건다(스크롤·확대가 바뀌어도 같은 캔버스) */
export const fitViewportCanvas = (
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
): CanvasRenderingContext2D | null => {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  const bw = Math.max(1, Math.round(cssWidth * dpr))
  const bh = Math.max(1, Math.round(cssHeight * dpr))
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw
    canvas.height = bh
  }
  canvas.style.width = `${cssWidth}px`
  canvas.style.height = `${cssHeight}px`
  return canvas.getContext('2d')
}

export const clearCanvas = (ctx: CanvasRenderingContext2D): void => {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
}

/** 한 장을 투명 PNG로 — 잉크만 담는다(종이는 개봉 화면이 테마에 맞춰 깐다) */
export const exportInkPagePng = async (page: InkPage, pxWidth = 1500): Promise<Blob> => {
  const canvas = document.createElement('canvas')
  canvas.width = pxWidth
  canvas.height = Math.round((pxWidth * INK_PAGE_H) / INK_PAGE_W)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d 컨텍스트를 만들 수 없습니다')
  const scale = pxWidth / INK_PAGE_W
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  drawStrokes(ctx, page.strokes, 'light')
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG 변환 실패'))), 'image/png')
  })
}

export type InkBox = [minX: number, minY: number, maxX: number, maxY: number]

/** 점 배열의 경계 상자(논리 좌표) — 빈 배열이면 null */
export const pointsBounds = (p: number[]): InkBox | null => {
  if (p.length < 3) return null
  let minX = p[0]
  let maxX = p[0]
  let minY = p[1]
  let maxY = p[1]
  for (let i = 3; i < p.length; i += 3) {
    const x = p[i]
    const y = p[i + 1]
    if (x < minX) minX = x
    else if (x > maxX) maxX = x
    if (y < minY) minY = y
    else if (y > maxY) maxY = y
  }
  return [minX, minY, maxX, maxY]
}

/** 확정된 획(불변)의 경계 상자 — 한 번 계산해 획 객체에 묶어 둔다. 지우개가 매 이벤트 전체 획을 훑을 때
    점 하나하나 거리를 재기 전에 상자로 먼저 거른다 */
const boundsCache = new WeakMap<InkStroke, InkBox | null>()
export const strokeBounds = (stroke: InkStroke): InkBox | null => {
  let b = boundsCache.get(stroke)
  if (b === undefined) {
    b = pointsBounds(stroke.p)
    boundsCache.set(stroke, b)
  }
  return b
}

/** 지우개 판정 — 획의 점 중 하나라도 반경 안이면 그 획 전체를 지운다(획 단위 지우개) */
export const strokeHits = (stroke: InkStroke, x: number, y: number, radius: number): boolean => {
  const b = strokeBounds(stroke)
  if (!b || x < b[0] - radius || x > b[2] + radius || y < b[1] - radius || y > b[3] + radius) return false
  const r2 = radius * radius
  const p = stroke.p
  for (let i = 0; i < p.length; i += 3) {
    const dx = p[i] - x
    const dy = p[i + 1] - y
    if (dx * dx + dy * dy <= r2) return true
  }
  // 점이 성긴 빠른 획 — 선분 중점도 본다
  for (let i = 3; i < p.length; i += 3) {
    const mx = (p[i] + p[i - 3]) / 2
    const my = (p[i + 1] + p[i - 2]) / 2
    const dx = mx - x
    const dy = my - y
    if (dx * dx + dy * dy <= r2) return true
  }
  return false
}
