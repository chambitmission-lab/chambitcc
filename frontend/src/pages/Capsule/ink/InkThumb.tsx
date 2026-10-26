// 손글씨 한 장의 작은 미리보기 — 작성 화면의 편지지 묶음에 쓴다
import { useLayoutEffect, useRef } from 'react'
import { INK_LINE_GAP, INK_LINE_TOP, INK_PAGE_W, type InkPage } from './inkModel'
import { clearCanvas, drawStrokes, fitCanvas } from './inkRender'

interface Props {
  page: InkPage
  width: number
  className?: string
}

const InkThumb = ({ page, width, className = '' }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null)
  const scale = width / INK_PAGE_W

  useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const fitted = fitCanvas(canvas, width)
    if (!fitted) return
    clearCanvas(fitted.ctx)
    drawStrokes(fitted.ctx, page.strokes, 'light')
  }, [page.strokes, width])

  return (
    <div
      className={`ink-thumb ${className}`}
      style={{
        width,
        ['--ink-gap' as string]: `${INK_LINE_GAP * scale}px`,
        ['--ink-top' as string]: `${INK_LINE_TOP * scale}px`,
        ['--ink-margin' as string]: `${72 * scale}px`,
      }}
    >
      <canvas ref={ref} aria-hidden />
    </div>
  )
}

export default InkThumb
