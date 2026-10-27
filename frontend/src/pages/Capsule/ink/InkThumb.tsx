// 손글씨 한 장의 작은 미리보기 — 작성 화면의 편지지 묶음에 쓴다.
// 그리기는 다음 프레임으로 미루고(rAF), 손글씨 시트가 위를 덮고 있는 동안(frozen)은 아예 건너뛴다 —
// 획 하나 확정될 때마다 보이지도 않는 썸네일이 전체 획 윤곽을 다시 계산하던 비용(획 수의 제곱)을 없앤다.
import { useEffect, useRef } from 'react'
import { INK_LINE_GAP, INK_LINE_TOP, INK_PAGE_W, type InkPage } from './inkModel'
import { clearCanvas, drawStrokes, fitCanvas } from './inkRender'

interface Props {
  page: InkPage
  width: number
  className?: string
  /** true 인 동안은 다시 그리지 않는다(가려져 있을 때). false 로 돌아오면 한 번 그린다 */
  frozen?: boolean
}

const InkThumb = ({ page, width, className = '', frozen = false }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null)
  const scale = width / INK_PAGE_W

  useEffect(() => {
    if (frozen) return
    let raf = requestAnimationFrame(() => {
      raf = 0
      const canvas = ref.current
      if (!canvas) return
      const fitted = fitCanvas(canvas, width)
      if (!fitted) return
      clearCanvas(fitted.ctx)
      drawStrokes(fitted.ctx, page.strokes, 'light')
    })
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [page.strokes, width, frozen])

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
