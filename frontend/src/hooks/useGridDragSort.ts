// 포인터 기반 격자(그리드) 드래그 정렬 — 마우스·터치 공용
//
// useDragSort 는 세로 한 줄 목록 전용이라, 썸네일 격자처럼 가로·세로로 흐르는
// 목록은 이 훅을 쓴다. 방식이 다르다:
//  - 끄는 카드는 제자리에 '빈 자리'로 남고, 손가락을 따라다니는 건 body 에 띄운 유령이다.
//    (유령을 body 에 두면 관리자 화면의 zoom·overflow 에 영향받지 않는다)
//  - 포인터가 다른 칸 위로 올라가면 그 즉시 onMove(from, to) 로 실제 순서를 바꾼다.
//    칸 크기가 같다는 전제라, 옮긴 뒤엔 끄는 카드의 자리가 포인터 밑에 온다.
//
// 마우스는 조금 움직이면 바로, 터치는 잠깐 꾹 눌러야 끌기가 시작된다 —
// 터치에서 바로 끌리면 격자 위에서 화면을 굴릴 수 없다.
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

export interface GridDragGhost {
  key: string
  /** 화면(viewport) 좌표 — position: fixed 로 그대로 쓴다 */
  x: number
  y: number
  width: number
  height: number
}

const MOUSE_START_DISTANCE = 5
const TOUCH_HOLD_MS = 220
const TOUCH_SLOP = 8
/** 한 번 자리를 바꾼 뒤 다음 판정까지 쉬는 시간 — 자리 옮김 애니메이션이 포인터 밑을 지나가며 되튀는 걸 막는다 */
const MOVE_COOLDOWN_MS = 200
const EDGE_ZONE = 70
const EDGE_MAX_SPEED = 14

const findScroller = (el: HTMLElement): HTMLElement | null => {
  let node = el.parentElement
  while (node && node !== document.documentElement) {
    const overflowY = getComputedStyle(node).overflowY
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight)
      return node
    node = node.parentElement
  }
  return null
}

export const useGridDragSort = (keys: string[], onMove: (from: number, to: number) => void) => {
  const els = useRef(new Map<string, HTMLElement>())
  const keysRef = useRef(keys)
  const onMoveRef = useRef(onMove)
  const [ghost, setGhost] = useState<GridDragGhost | null>(null)
  const draggingKeyRef = useRef<string | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  // 끄는 도중 화면을 떠나면 창에 건 리스너를 걷는다
  useEffect(() => () => cleanupRef.current?.(), [])

  // 끄는 동안 순서가 바뀌면 밀려난 카드들이 새 자리로 미끄러져 가게 한다(FLIP)
  const signature = keys.join('|')
  const prevSignature = useRef(signature)
  const prevRects = useRef(new Map<string, DOMRect>())
  useLayoutEffect(() => {
    keysRef.current = keys
    onMoveRef.current = onMove
    const rects = new Map<string, DOMRect>()
    els.current.forEach((el, key) => rects.set(key, el.getBoundingClientRect()))
    if (draggingKeyRef.current && prevSignature.current !== signature) {
      rects.forEach((rect, key) => {
        const before = prevRects.current.get(key)
        const el = els.current.get(key)
        if (!before || !el || key === draggingKeyRef.current) return
        const dx = before.left - rect.left
        const dy = before.top - rect.top
        if (!dx && !dy) return
        // zoom 안의 transform px 은 zoom 배율만큼 커진다 — 화면 좌표 차이를 배율로 나눈다
        const zoom = (el as HTMLElement & { currentCSSZoom?: number }).currentCSSZoom || 1
        el.animate(
          [{ transform: `translate(${dx / zoom}px, ${dy / zoom}px)` }, { transform: 'none' }],
          { duration: 180, easing: 'ease' },
        )
      })
    }
    prevSignature.current = signature
    prevRects.current = rects
  })

  const setItemRef = (key: string) => (el: HTMLElement | null) => {
    if (el) els.current.set(key, el)
    else els.current.delete(key)
  }

  const onPointerDown = (key: string) => (e: ReactPointerEvent) => {
    if (cleanupRef.current || keysRef.current.length < 2) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // 카드 안의 버튼(제거·화살표)은 그대로 눌리게 둔다
    if ((e.target as HTMLElement).closest('button, a, input')) return
    const el = els.current.get(key)
    if (!el) return

    const isTouch = e.pointerType !== 'mouse'
    const pointerId = e.pointerId
    const startX = e.clientX
    const startY = e.clientY
    const rect = el.getBoundingClientRect()
    const offsetX = startX - rect.left
    const offsetY = startY - rect.top
    let px = startX
    let py = startY
    let active = false
    let holdTimer = 0
    let frame = 0
    let scroller: HTMLElement | null = null
    let lockedSignature: string | null = null
    let lockedUntil = 0

    const hitTest = () => {
      const order = keysRef.current
      // 방금 요청한 자리 바꿈이 아직 화면에 반영되지 않았으면 기다린다
      if (lockedSignature === order.join('|') || performance.now() < lockedUntil) return
      lockedSignature = null
      for (let i = 0; i < order.length; i++) {
        if (order[i] === key) continue
        const r = els.current.get(order[i])?.getBoundingClientRect()
        if (!r || px < r.left || px > r.right || py < r.top || py > r.bottom) continue
        const from = order.indexOf(key)
        if (from === -1) return
        lockedSignature = order.join('|')
        lockedUntil = performance.now() + MOVE_COOLDOWN_MS
        onMoveRef.current(from, i)
        return
      }
    }

    const tick = () => {
      if (!active) return
      const bounds = scroller?.getBoundingClientRect()
      const top = Math.max(0, bounds?.top ?? 0)
      const bottom = Math.min(window.innerHeight, bounds?.bottom ?? window.innerHeight)
      let step = 0
      if (py < top + EDGE_ZONE) step = -Math.min(1, (top + EDGE_ZONE - py) / EDGE_ZONE)
      else if (py > bottom - EDGE_ZONE) step = Math.min(1, (py - (bottom - EDGE_ZONE)) / EDGE_ZONE)
      if (step) {
        ;(scroller ?? window).scrollBy(0, Math.round(step * EDGE_MAX_SPEED) || Math.sign(step))
        hitTest()
      }
      frame = requestAnimationFrame(tick)
    }

    const syncGhost = () =>
      setGhost({ key, x: px - offsetX, y: py - offsetY, width: rect.width, height: rect.height })

    const start = () => {
      active = true
      draggingKeyRef.current = key
      scroller = findScroller(el)
      window.getSelection()?.removeAllRanges()
      syncGhost()
      frame = requestAnimationFrame(tick)
    }

    const finish = () => {
      active = false
      draggingKeyRef.current = null
      window.clearTimeout(holdTimer)
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleEnd)
      window.removeEventListener('pointercancel', handleEnd)
      window.removeEventListener('touchmove', blockTouchScroll)
      window.removeEventListener('contextmenu', blockContextMenu)
      cleanupRef.current = null
      setGhost(null)
    }

    const handleMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      px = ev.clientX
      py = ev.clientY
      if (!active) {
        const distance = Math.hypot(px - startX, py - startY)
        if (isTouch) {
          // 꾹 누르기 전에 움직였으면 스크롤하려는 것 — 끌기를 포기한다
          if (distance > TOUCH_SLOP) finish()
          return
        }
        if (distance < MOUSE_START_DISTANCE) return
        start()
      }
      syncGhost()
      hitTest()
    }

    const handleEnd = (ev: PointerEvent) => {
      if (ev.pointerId === pointerId) finish()
    }

    // 끌기가 시작된 뒤엔 브라우저가 화면을 굴리지 못하게 한다
    const blockTouchScroll = (ev: TouchEvent) => {
      if (active && ev.cancelable) ev.preventDefault()
    }
    // 꾹 누르기가 이미지 저장 메뉴로 새지 않게
    const blockContextMenu = (ev: Event) => ev.preventDefault()

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleEnd)
    window.addEventListener('pointercancel', handleEnd)
    if (isTouch) {
      window.addEventListener('touchmove', blockTouchScroll, { passive: false })
      window.addEventListener('contextmenu', blockContextMenu)
      holdTimer = window.setTimeout(start, TOUCH_HOLD_MS)
    }
    cleanupRef.current = finish
  }

  return { setItemRef, onPointerDown, ghost, draggingKey: ghost?.key ?? null }
}
