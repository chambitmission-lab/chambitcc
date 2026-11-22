// 장면 캔버스 공용 도구
/** 캔버스를 화면 크기·DPR 에 맞춘다 */
export const fitCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, maxDpr = 2) => {
  const dpr = Math.min(maxDpr, window.devicePixelRatio || 1)
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { w, h, dpr }
}
