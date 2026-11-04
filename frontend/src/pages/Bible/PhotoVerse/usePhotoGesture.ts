import { useRef } from 'react'
import type { Dispatch, PointerEvent as ReactPointerEvent, SetStateAction } from 'react'
import { LOCK_SAFE, cropRect } from './photoVerseCanvas'
import type { VerseCardStyle } from './photoVerseCanvas'

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

export type DragMode = 'text' | 'photo' | null

interface PhotoGestureArgs {
  /** 말씀이 없으면 캔버스를 만져도 아무 일도 없다 */
  hasVerse: boolean
  photo: HTMLImageElement | null
  style: VerseCardStyle
  setStyle: Dispatch<SetStateAction<VerseCardStyle>>
  /** 자유 레이아웃에서 사용자가 고른 끌기 대상 */
  dragTarget: 'text' | 'photo'
}

/**
 * 캔버스 제스처 — 한 손가락: 글(자유 레이아웃) 또는 사진 크롭 이동, 두 손가락: 글자 크기.
 * 사진 옮기기는 비율로 잘렸을 때만 의미가 있다.
 */
export const usePhotoGesture = ({ hasVerse, photo, style, setStyle, dragTarget }: PhotoGestureArgs) => {
  // 캔버스 위 손가락들과 진행 중인 제스처 (끌기: 글/사진, 벌리기: 글자 크기)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const gestureRef = useRef<
    | { kind: 'text' | 'photo'; startX: number; startY: number; origin: { x: number; y: number } }
    | { kind: 'pinch'; dist: number; scale: number }
    | null
  >(null)

  const isLock = style.ratio === 'lock'
  const canPan = style.ratio !== 'original'
  const dragMode: DragMode = !hasVerse
    ? null
    : style.layout === 'classic' && (dragTarget === 'text' || !canPan)
      ? 'text'
      : canPan
        ? 'photo'
        : null

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!hasVerse) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const pts = pointersRef.current
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pts.size === 2) {
      const [a, b] = [...pts.values()]
      gestureRef.current = { kind: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, scale: style.fontScale }
      return
    }
    if (pts.size !== 1 || !dragMode) return
    gestureRef.current = {
      kind: dragMode,
      startX: e.clientX,
      startY: e.clientY,
      origin: dragMode === 'text' ? { ...style.pos } : { ...style.focus },
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const pts = pointersRef.current
    if (!pts.has(e.pointerId)) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gestureRef.current
    if (!g) return
    if (g.kind === 'pinch') {
      if (pts.size < 2) return
      const [a, b] = [...pts.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      setStyle((s) => ({ ...s, fontScale: clamp(g.scale * (d / g.dist), 0.03, 0.09) }))
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - g.startX) / rect.width
    const dy = (e.clientY - g.startY) / rect.height
    if (g.kind === 'text') {
      // 잠금화면은 글 자리가 가운데 띠라 같은 손가락 이동이 더 큰 비율 변화다
      const band = isLock ? LOCK_SAFE.bottom - LOCK_SAFE.top : 1
      setStyle((s) => ({
        ...s,
        pos: {
          x: clamp(g.origin.x + dx, 0.05, 0.95),
          y: clamp(g.origin.y + dy / band, 0.05, 0.95),
        },
      }))
      return
    }
    if (!photo) return
    // 사진 옮기기 — 손가락을 오른쪽으로 끌면 사진의 왼쪽이 드러난다 (손가락에 붙어 움직이는 느낌)
    const crop = cropRect(photo, style.ratio)
    const spareX = photo.naturalWidth - crop.sw
    const spareY = photo.naturalHeight - crop.sh
    setStyle((s) => ({
      ...s,
      focus: {
        x: spareX > 1 ? clamp(g.origin.x - (dx * crop.sw) / spareX, 0, 1) : 0.5,
        y: spareY > 1 ? clamp(g.origin.y - (dy * crop.sh) / spareY, 0, 1) : 0.5,
      },
    }))
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const pts = pointersRef.current
    pts.delete(e.pointerId)
    // 두 손가락 중 하나를 떼면 크기 조절 끝 — 남은 손가락으로 끌려가지 않게 제스처를 비운다
    if (pts.size === 0 || gestureRef.current?.kind === 'pinch') gestureRef.current = null
  }

  return { canPan, dragMode, onPointerDown, onPointerMove, onPointerUp }
}
