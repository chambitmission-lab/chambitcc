import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { InkPage } from '../Capsule/ink/inkModel'
import { drawStrokes } from '../Capsule/ink/inkRender'
import { inkBounds } from './inkCard'
import { usePaperSurface } from './paper'

const INSET = 0.07

/** 쓰는 화면의 미리보기 — 고른 배경 위에 지금까지 쓴 글씨를 갤러리와 같은 구도로 놓는다 */
const PaperPreview = ({
  page,
  paperId,
  photoUrl,
  paperRatio,
  className = '',
}: {
  page: InkPage
  paperId: string | null
  photoUrl?: string | null
  /** 종이 비율(세로/가로) 고정 — 내 사진 배경은 사진 모양을 따른다 */
  paperRatio?: number | null
  className?: string
}) => {
  const surface = usePaperSurface(paperId, photoUrl)
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(0)
  const b = inkBounds(page)
  const ratio = paperRatio ?? Math.min(1.25, Math.max(0.55, b.h / b.w))

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width <= 0) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const areaW = width * (1 - INSET * 2)
    const areaH = width * ratio * (1 - INSET * 2)
    canvas.width = Math.round(areaW * dpr)
    canvas.height = Math.round(areaH * dpr)
    canvas.style.width = `${areaW}px`
    canvas.style.height = `${areaH}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const box = inkBounds(page)
    const s = Math.min(areaW / box.w, areaH / box.h) * dpr
    ctx.setTransform(s, 0, 0, s, (canvas.width - box.w * s) / 2 - box.x * s, (canvas.height - box.h * s) / 2 - box.y * s)
    drawStrokes(ctx, page.strokes, surface.theme)
  }, [page, width, ratio, surface.theme])

  return (
    <div ref={wrapRef} className={`hw-paper ${className}`} style={{ ...surface.style, aspectRatio: `1 / ${ratio}` }}>
      <canvas ref={canvasRef} className="absolute" style={{ left: `${INSET * 100}%`, top: `${INSET * 100}%` }} aria-hidden />
    </div>
  )
}

export default PaperPreview
