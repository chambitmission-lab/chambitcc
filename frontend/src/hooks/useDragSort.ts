// 포인터 기반 세로 드래그 정렬 (마우스·터치 공용)
//
// 항목 DOM 순서는 바꾸지 않고 transform으로만 자리를 옮겨 보여주다가,
// 놓는 순간 onCommit(새 순서)을 호출한다. 서버가 갱신될 때까지는
// 낙관적 순서(settled)를 유지해 드래그 직후 화면이 튀지 않게 한다.
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'

interface DragSession {
  id: number
  index: number
  order: number[]
  /** 문서 좌표 기준 시작 포인터 Y — 드래그 중 페이지가 스크롤돼도 어긋나지 않는다 */
  startY: number
  centers: number[]
  height: number
  gap: number
  minDelta: number
  maxDelta: number
}

interface DragState {
  id: number
  delta: number
  targetIndex: number
}

const resolveTarget = (s: DragSession, pointerDocY: number): number => {
  const center = s.centers[s.index] + (pointerDocY - s.startY)
  let target = 0
  s.centers.forEach((c, i) => {
    if (i !== s.index && c < center) target += 1
  })
  return target
}

export const useDragSort = (ids: number[], onCommit: (ordered: number[]) => void) => {
  const itemRefs = useRef(new Map<number, HTMLElement>())
  const session = useRef<DragSession | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [settled, setSettled] = useState<number[] | null>(null)

  // 서버 데이터가 바뀌면 낙관적 순서를 내려놓는다
  const idsKey = ids.join(',')
  useEffect(() => setSettled(null), [idsKey])

  const orderedIds = useMemo(() => {
    if (settled && settled.length === ids.length && settled.every(id => ids.includes(id)))
      return settled
    return ids
  }, [settled, ids])

  const setItemRef = (id: number) => (el: HTMLElement | null) => {
    if (el) itemRefs.current.set(id, el)
    else itemRefs.current.delete(id)
  }

  const endDrag = (commit: boolean, e: ReactPointerEvent) => {
    const s = session.current
    if (!s) return
    session.current = null
    setDrag(null)
    if (!commit) return
    const target = resolveTarget(s, e.clientY + window.scrollY)
    if (target === s.index) return
    const order = [...s.order]
    order.splice(s.index, 1)
    order.splice(target, 0, s.id)
    setSettled(order)
    onCommit(order)
  }

  const handleProps = (id: number) => ({
    style: { touchAction: 'none' } as CSSProperties,
    onPointerDown: (e: ReactPointerEvent) => {
      if (session.current || orderedIds.length < 2) return
      const rects = orderedIds.map(oid => itemRefs.current.get(oid)?.getBoundingClientRect())
      if (rects.some(r => !r)) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      const scrollY = window.scrollY
      const tops = rects.map(r => r!.top + scrollY)
      const heights = rects.map(r => r!.height)
      const index = orderedIds.indexOf(id)
      const last = orderedIds.length - 1
      session.current = {
        id,
        index,
        order: [...orderedIds],
        startY: e.clientY + scrollY,
        centers: tops.map((top, i) => top + heights[i] / 2),
        height: heights[index],
        gap: last > 0 ? Math.max(0, tops[1] - tops[0] - heights[0]) : 0,
        minDelta: tops[0] - tops[index],
        maxDelta: tops[last] + heights[last] - (tops[index] + heights[index]),
      }
      setDrag({ id, delta: 0, targetIndex: index })
    },
    onPointerMove: (e: ReactPointerEvent) => {
      const s = session.current
      if (!s) return
      // 화면 가장자리에 닿으면 슬쩍 스크롤 (긴 목록 대응)
      if (e.clientY < 90) window.scrollBy(0, -12)
      else if (e.clientY > window.innerHeight - 90) window.scrollBy(0, 12)
      const y = e.clientY + window.scrollY
      const delta = Math.min(s.maxDelta, Math.max(s.minDelta, y - s.startY))
      setDrag({ id: s.id, delta, targetIndex: resolveTarget(s, y) })
    },
    onPointerUp: (e: ReactPointerEvent) => endDrag(true, e),
    onPointerCancel: (e: ReactPointerEvent) => endDrag(false, e),
  })

  const itemStyle = (id: number): CSSProperties | undefined => {
    const s = session.current
    if (!s || !drag) return undefined
    if (id === drag.id) {
      return {
        transform: `translateY(${drag.delta}px)`,
        zIndex: 30,
        position: 'relative',
        userSelect: 'none',
      }
    }
    const i = s.order.indexOf(id)
    if (i === -1) return undefined
    let shift = 0
    if (i < s.index && i >= drag.targetIndex) shift = s.height + s.gap
    else if (i > s.index && i <= drag.targetIndex) shift = -(s.height + s.gap)
    return {
      transform: shift ? `translateY(${shift}px)` : undefined,
      transition: 'transform 0.18s ease',
      userSelect: 'none',
    }
  }

  /** 커밋이 실패했을 때 낙관적 순서를 되돌린다 */
  const resetOrder = () => setSettled(null)

  return { orderedIds, setItemRef, handleProps, itemStyle, resetOrder, draggingId: drag?.id ?? null }
}
