// 포인터 기반 세로 드래그 정렬 (마우스·터치 공용)
//
// 항목 DOM 순서는 바꾸지 않고 transform으로만 자리를 옮겨 보여주다가,
// 놓는 순간 onCommit(새 순서)을 호출한다. 서버가 갱신될 때까지는
// 낙관적 순서(settled)를 유지해 드래그 직후 화면이 튀지 않게 한다.
//
// 스크롤은 창이 아니라 '목록을 실제로 굴리는 상자'를 기준으로 잰다 — 관리자 화면은
// PC 에서 페이지가 스스로 스크롤하는 상자(lg:overflow-y-auto)라 window.scrollY 가 늘 0 이다.
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
  /** 목록을 굴리는 상자. null 이면 창(문서) 스크롤 */
  scroller: HTMLElement | null
  /** 스크롤 좌표 기준 시작 포인터 Y — 드래그 중 목록이 스크롤돼도 어긋나지 않는다 */
  startY: number
  /** 마지막 포인터 화면 Y — 가만히 들고 있어도 가장자리 자동 스크롤이 이어지게 */
  clientY: number
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

/** 가장자리 자동 스크롤 — 이 거리 안에 들어오면 굴리고, 깊이 들어올수록 빨라진다 */
const EDGE_ZONE = 90
const EDGE_MAX_SPEED = 16

const findScroller = (el: HTMLElement | undefined): HTMLElement | null => {
  let node = el?.parentElement ?? null
  // body 까지 본다 — 모바일에선 창이 아니라 body 가 스크롤한다(window.scrollY 는 0)
  while (node && node !== document.documentElement) {
    const overflowY = getComputedStyle(node).overflowY
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight)
      return node
    node = node.parentElement
  }
  return null
}

const scrollPos = (scroller: HTMLElement | null) => (scroller ? scroller.scrollTop : window.scrollY)

const resolveTarget = (s: DragSession, pointerY: number): number => {
  const center = s.centers[s.index] + (pointerY - s.startY)
  let target = 0
  s.centers.forEach((c, i) => {
    if (i !== s.index && c < center) target += 1
  })
  return target
}

/** 포인터가 가장자리에 있으면 한 프레임만큼 굴린다. 실제로 움직였으면 true */
const autoScroll = (s: DragSession): boolean => {
  const bounds = s.scroller?.getBoundingClientRect()
  const top = Math.max(0, bounds?.top ?? 0)
  const bottom = Math.min(window.innerHeight, bounds?.bottom ?? window.innerHeight)
  let step = 0
  if (s.clientY < top + EDGE_ZONE) step = -Math.min(1, (top + EDGE_ZONE - s.clientY) / EDGE_ZONE)
  else if (s.clientY > bottom - EDGE_ZONE)
    step = Math.min(1, (s.clientY - (bottom - EDGE_ZONE)) / EDGE_ZONE)
  if (!step) return false
  const before = scrollPos(s.scroller)
  ;(s.scroller ?? window).scrollBy(0, Math.round(step * EDGE_MAX_SPEED) || Math.sign(step))
  return scrollPos(s.scroller) !== before
}

export const useDragSort = (ids: number[], onCommit: (ordered: number[]) => void) => {
  const itemRefs = useRef(new Map<number, HTMLElement>())
  const session = useRef<DragSession | null>(null)
  const frame = useRef(0)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [settled, setSettled] = useState<number[] | null>(null)

  // 서버 데이터가 바뀌면 낙관적 순서를 내려놓는다
  const idsKey = ids.join(',')
  useEffect(() => setSettled(null), [idsKey])

  // 드래그 도중 화면을 떠나면 자동 스크롤 루프를 멈춘다
  useEffect(
    () => () => {
      session.current = null
      cancelAnimationFrame(frame.current)
    },
    [],
  )

  const orderedIds = useMemo(() => {
    if (settled && settled.length === ids.length && settled.every(id => ids.includes(id)))
      return settled
    return ids
  }, [settled, ids])

  const setItemRef = (id: number) => (el: HTMLElement | null) => {
    if (el) itemRefs.current.set(id, el)
    else itemRefs.current.delete(id)
  }

  const syncDrag = (s: DragSession) => {
    const y = s.clientY + scrollPos(s.scroller)
    const delta = Math.min(s.maxDelta, Math.max(s.minDelta, y - s.startY))
    setDrag({ id: s.id, delta, targetIndex: resolveTarget(s, y) })
  }

  const tick = () => {
    const s = session.current
    if (!s) return
    if (autoScroll(s)) syncDrag(s)
    frame.current = requestAnimationFrame(tick)
  }

  const endDrag = (commit: boolean, e: ReactPointerEvent) => {
    const s = session.current
    if (!s) return
    session.current = null
    cancelAnimationFrame(frame.current)
    setDrag(null)
    if (!commit) return
    const target = resolveTarget(s, e.clientY + scrollPos(s.scroller))
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
      const scroller = findScroller(itemRefs.current.get(id))
      const scroll = scrollPos(scroller)
      const tops = rects.map(r => r!.top + scroll)
      const heights = rects.map(r => r!.height)
      const index = orderedIds.indexOf(id)
      const last = orderedIds.length - 1
      session.current = {
        id,
        index,
        order: [...orderedIds],
        scroller,
        startY: e.clientY + scroll,
        clientY: e.clientY,
        centers: tops.map((top, i) => top + heights[i] / 2),
        height: heights[index],
        gap: last > 0 ? Math.max(0, tops[1] - tops[0] - heights[0]) : 0,
        minDelta: tops[0] - tops[index],
        maxDelta: tops[last] + heights[last] - (tops[index] + heights[index]),
      }
      setDrag({ id, delta: 0, targetIndex: index })
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(tick)
    },
    onPointerMove: (e: ReactPointerEvent) => {
      const s = session.current
      if (!s) return
      s.clientY = e.clientY
      syncDrag(s)
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
