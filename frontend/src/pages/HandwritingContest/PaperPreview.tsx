import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { InkPage } from '../Capsule/ink/inkModel'
import { drawStrokes } from '../Capsule/ink/inkRender'
import { inkBounds } from './inkCard'
import { usePaperSurface } from './paper'
import type { PaperFocus } from './paper'

const INSET = 0.07
const clampPct = (n: number) => Math.min(100, Math.max(0, n))

interface Props {
  page: InkPage
  paperId: string | null
  photoUrl?: string | null
  /** 종이 비율(세로/가로) 고정 — 내 사진 배경은 사진 모양을, 히어로 미리보기는 띠 모양을 따른다 */
  paperRatio?: number | null
  /** 사진에서 보일 자리 */
  focus?: PaperFocus | null
  /** 사진 원래 비율(세로/가로) — onFocusChange 와 함께 주면 사진을 끌어 보일 자리를 맞춘다 */
  photoRatio?: number | null
  onFocusChange?: (focus: PaperFocus) => void
  className?: string
}

/** 쓰는 화면의 미리보기 — 고른 배경 위에 지금까지 쓴 글씨를 갤러리와 같은 구도로 놓는다 */
const PaperPreview = ({ page, paperId, photoUrl, paperRatio, focus, photoRatio, onFocusChange, className = '' }: Props) => {
  const surface = usePaperSurface(paperId, photoUrl, focus)
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

  // 사진 끌기 — cover 로 깔린 사진이 종이 밖으로 넘치는 만큼만 움직인다
  const height = width * ratio
  const coverW = photoRatio ? Math.max(width, height / photoRatio) : width
  const overX = photoRatio && onFocusChange ? coverW - width : 0
  const overY = photoRatio && onFocusChange ? coverW * photoRatio - height : 0
  const canX = overX > 1
  const canY = overY > 1
  const draggable = canX || canY
  const drag = useRef<{ id: number; x: number; y: number; fx: number; fy: number } | null>(null)

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggable) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, fx: focus?.x ?? 50, fy: focus?.y ?? 50 }
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId || !onFocusChange) return
    // 사진을 손가락 쪽으로 끌면 보이는 자리는 반대로 옮겨 간다
    onFocusChange({
      x: canX ? clampPct(d.fx - ((e.clientX - d.x) / overX) * 100) : d.fx,
      y: canY ? clampPct(d.fy - ((e.clientY - d.y) / overY) * 100) : d.fy,
    })
  }
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null
  }

  return (
    <div
      ref={wrapRef}
      className={`hw-paper ${draggable ? 'cursor-grab active:cursor-grabbing select-none' : ''} ${className}`}
      style={{
        ...surface.style,
        aspectRatio: `1 / ${ratio}`,
        // 끄는 방향만 우리가 맡고, 나머지 방향은 화면 스크롤에 맡긴다
        touchAction: draggable ? (canX && canY ? 'none' : canY ? 'pan-x' : 'pan-y') : undefined,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <canvas ref={canvasRef} className="absolute pointer-events-none" style={{ left: `${INSET * 100}%`, top: `${INSET * 100}%` }} aria-hidden />
    </div>
  )
}

export default PaperPreview
