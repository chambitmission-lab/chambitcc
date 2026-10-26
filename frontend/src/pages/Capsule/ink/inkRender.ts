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
    크기가 같으면 백킹 스토어를 건드리지 않는다(내용이 지워지므로). 반환값: 다시 잡았는지 */
export const fitCanvas = (
  canvas: HTMLCanvasElement,
  cssWidth: number,
  options: { desynchronized?: boolean } = {},
): { ctx: CanvasRenderingContext2D; resized: boolean } | null => {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  const cssHeight = (cssWidth * INK_PAGE_H) / INK_PAGE_W
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
  const ctx = canvas.getContext('2d', options.desynchronized ? { desynchronized: true } : undefined)
  if (!ctx) return null
  const scale = bw / INK_PAGE_W
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  return { ctx, resized }
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

/** 지우개 판정 — 획의 점 중 하나라도 반경 안이면 그 획 전체를 지운다(획 단위 지우개) */
export const strokeHits = (stroke: InkStroke, x: number, y: number, radius: number): boolean => {
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
