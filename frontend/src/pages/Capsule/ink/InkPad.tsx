// 손글씨 편지지 한 장 — 펜(S펜·애플펜슬)·손가락·마우스로 쓰는 캔버스.
//
// 입력 규칙
//  - Pointer Events 로 받는다. pen 은 필압(pressure)을 그대로, touch/mouse 는 속도로 필압을 흉내 낸다.
//  - 펜이 한 번이라도 감지되면 '펜 모드'(penOnly): 손가락 한 개는 쓰지 않고 종이를 넘긴다(삼성 노트와 같은 규칙).
//    펜 모드가 아니면 손가락 하나는 쓰고, 둘은 넘긴다.
//  - 펜이 화면 가까이 있는 동안(hover) 들어오는 터치는 손바닥으로 보고 버린다. 갤럭시는 하드웨어가 먼저 막지만
//    그러지 못하는 기기도 있어 소프트웨어로 한 번 더 거른다.
//  - S펜 측면 버튼(buttons & 2)·지우개 끝(buttons & 32)을 누르고 쓰면 지우개가 된다.
//
// 그리기
//  - 완성된 획은 아래 캔버스(committed), 지금 긋는 획은 위 캔버스(live)에 그린다. 획 하나가 끝날 때마다
//    전체를 다시 그리지 않고 그 획만 아래 캔버스에 얹는다(되돌리기·지우개·크기 변경 때만 전체 다시 그림).
//  - 아래 캔버스는 종이 크기, 위 캔버스는 보이는 창 크기만이다. 위 캔버스는 스크롤러 안에서 sticky 로 창에 붙어
//    따라오고, 프레임마다 종이 위치를 재서 transform 을 건다 — 확대 2.4배에서도 백킹 스토어가 종이만큼 커지지 않는다.
//  - 좌표는 전부 논리 단위(1000 × 1414). 확대(zoom)는 종이 CSS 크기만 바꾸고 데이터는 건드리지 않는다.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  INK_LINE_GAP,
  INK_LINE_TOP,
  INK_MAX_STROKES_PER_PAGE,
  INK_PAGE_H,
  INK_PAGE_W,
  simplifyStrokePoints,
  type InkColorIndex,
  type InkPage,
  type InkStroke,
} from './inkModel'
import { clearCanvas, drawStroke, drawStrokes, fitCanvas, fitViewportCanvas, pointsBounds, strokeHits } from './inkRender'

export type InkTool = 'pen' | 'eraser'

interface Props {
  page: InkPage
  /** 획 하나가 끝났다 */
  onCommit: (stroke: InkStroke) => void
  /** 지우개가 닿은 획들을 뺀 새 획 목록 */
  onErase: (next: InkStroke[]) => void
  tool: InkTool
  color: InkColorIndex
  size: number
  zoom: number
  penOnly: boolean
  /** 펜 포인터를 처음 봤을 때 — 부모가 penOnly 로 올린다 */
  onPenDetected: () => void
  /** PC 에서 종이가 끝없이 넓어지지 않게 */
  maxBaseWidth?: number
}

/** 지우개 반경(논리 단위) — 손끝 크기만큼 */
const ERASER_RADIUS = 16

type Drawing = {
  pointerId: number
  mode: 'draw' | 'erase'
  stroke: InkStroke
}

const pressureOf = (e: PointerEvent, isPen: boolean): number =>
  isPen ? Math.max(0.06, Math.min(1, e.pressure || 0.5)) : 0.5

const isEraserButton = (e: PointerEvent): boolean =>
  // 32: 지우개 끝(eraser), 2: 측면(barrel) 버튼. 마우스 오른쪽 버튼도 2 라 함께 지우개로 쓴다
  (e.buttons & 32) !== 0 || (e.buttons & 2) !== 0

const InkPad = ({
  page,
  onCommit,
  onErase,
  tool,
  color,
  size,
  zoom,
  penOnly,
  onPenDetected,
  maxBaseWidth = 760,
}: Props) => {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const committedRef = useRef<HTMLCanvasElement>(null)
  const liveRef = useRef<HTMLCanvasElement>(null)
  const [baseWidth, setBaseWidth] = useState(0)
  // 스크롤 창 크기 — 위(live) 캔버스는 이 크기만 잡는다
  const [viewport, setViewport] = useState({ w: 0, h: 0 })

  // 입력 상태는 전부 ref — 포인터 이벤트는 초당 수백 번이라 렌더를 타면 안 된다
  const drawingRef = useRef<Drawing | null>(null)
  const touchesRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const panningRef = useRef(false)
  const penNearRef = useRef(false)
  const rafRef = useRef(0)
  const dirtyRef = useRef(false)
  // 증분 렌더용 — 마지막으로 아래 캔버스에 그린 획 목록과 개수
  const drawnRef = useRef<{ list: InkStroke[]; count: number }>({ list: [], count: 0 })
  // 지금 긋는 획의 입력 종류 — 펜으로 긋는 동안 들어오는 터치는 손바닥이다
  const drawingTypeRef = useRef<string>('')
  // 위 캔버스에 마지막으로 그린 영역(캔버스 픽셀 x,y,w,h) — 다음 프레임은 전면이 아니라 이 영역만 지운다.
  // 픽셀 단위로 두는 건 그 사이 스크롤로 transform 이 바뀌어도 지운 자리가 어긋나지 않게
  const liveBoxRef = useRef<[number, number, number, number] | null>(null)
  // 지우개 — 이벤트마다 부모를 갱신하지 않고 한 프레임치 적중을 모아 한 번만 올린다
  const eraseHitsRef = useRef<Set<InkStroke>>(new Set())
  const eraseRafRef = useRef(0)

  // 최신 props 를 핸들러에서 ref 로 읽는다 (리스너 재등록 없이)
  const propsRef = useRef({ page, onCommit, onErase, tool, color, size, penOnly, onPenDetected })
  useLayoutEffect(() => {
    propsRef.current = { page, onCommit, onErase, tool, color, size, penOnly, onPenDetected }
  })

  // 종이 기본 폭 = 스크롤 영역 폭(PC 는 상한) — 확대는 여기에 zoom 을 곱한다. 24 = 종이 좌우 여백(ink.css)
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const measure = () => {
      setBaseWidth(Math.min(maxBaseWidth, Math.max(0, el.clientWidth - 24)))
      setViewport((v) => (v.w === el.clientWidth && v.h === el.clientHeight ? v : { w: el.clientWidth, h: el.clientHeight }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [maxBaseWidth])

  const cssWidth = baseWidth * zoom
  const scale = cssWidth / INK_PAGE_W

  // 아래 캔버스 — 크기가 바뀌면 전체, 획이 하나 늘었으면 그 획만
  useLayoutEffect(() => {
    const canvas = committedRef.current
    if (!canvas || cssWidth <= 0) return
    const fitted = fitCanvas(canvas, cssWidth)
    if (!fitted) return
    const { ctx, resized } = fitted
    const strokes = page.strokes
    const drawn = drawnRef.current
    const appended =
      !resized &&
      strokes.length >= drawn.count &&
      strokes.length - drawn.count <= 1 &&
      (drawn.count === 0 || strokes[drawn.count - 1] === drawn.list[drawn.count - 1])
    if (appended) {
      for (let i = drawn.count; i < strokes.length; i++) drawStroke(ctx, strokes[i], 'light')
    } else {
      clearCanvas(ctx)
      drawStrokes(ctx, strokes, 'light')
    }
    drawnRef.current = { list: strokes, count: strokes.length }
  }, [page.strokes, cssWidth])

  // 위 캔버스 — 보이는 창 크기만. 종이 확대와 무관하다
  useLayoutEffect(() => {
    const canvas = liveRef.current
    if (!canvas || viewport.w <= 0 || viewport.h <= 0) return
    fitViewportCanvas(canvas, viewport.w, viewport.h)
    liveBoxRef.current = null
  }, [viewport])

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current)
      cancelAnimationFrame(eraseRafRef.current)
    },
    [],
  )

  /** 화면 좌표 → 논리 좌표(종이 기준). rect 는 이벤트 묶음(coalesced)마다 한 번만 재서 넘긴다 */
  const toLogical = useCallback(
    (e: { clientX: number; clientY: number }, rect?: DOMRect): [number, number] => {
      const paper = committedRef.current
      if (!paper) return [0, 0]
      const r = rect ?? paper.getBoundingClientRect()
      return [((e.clientX - r.left) / r.width) * INK_PAGE_W, ((e.clientY - r.top) / r.height) * INK_PAGE_H]
    },
    [],
  )

  const renderLive = useCallback(() => {
    rafRef.current = 0
    if (!dirtyRef.current) return
    dirtyRef.current = false
    const canvas = liveRef.current
    const paper = committedRef.current
    const d = drawingRef.current
    if (!canvas || !paper) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const prev = liveBoxRef.current
    if (prev) ctx.clearRect(prev[0], prev[1], prev[2], prev[3])
    else ctx.clearRect(0, 0, canvas.width, canvas.height)
    liveBoxRef.current = null
    if (d && d.mode === 'draw') {
      // 창 캔버스 위에 종이 논리 좌표를 얹는 transform — 종이가 스크롤·확대로 어디 있든 프레임마다 다시 잰다
      const pr = paper.getBoundingClientRect()
      const lr = canvas.getBoundingClientRect()
      if (pr.width <= 0 || lr.width <= 0) return
      const dpr = canvas.width / lr.width
      const s = (pr.width / INK_PAGE_W) * dpr
      const tx = (pr.left - lr.left) * dpr
      const ty = (pr.top - lr.top) * dpr
      ctx.setTransform(s, 0, 0, s, tx, ty)
      drawStroke(ctx, d.stroke, 'light', undefined, false)
      const b = pointsBounds(d.stroke.p)
      if (b) {
        // 윤곽은 굵기만큼 점 바깥으로 나간다 — 넉넉히 잡아 잔상이 남지 않게 (캔버스 픽셀로 보관)
        const m = d.stroke.s * 1.5 + 4
        liveBoxRef.current = [
          (b[0] - m) * s + tx,
          (b[1] - m) * s + ty,
          (b[2] - b[0] + m * 2) * s,
          (b[3] - b[1] + m * 2) * s,
        ]
      }
    }
  }, [])

  const requestLive = useCallback(() => {
    dirtyRef.current = true
    if (!rafRef.current) rafRef.current = requestAnimationFrame(renderLive)
  }, [renderLive])

  /** 모아 둔 지우개 적중을 한 번에 부모로 — 전체 다시 그리기·썸네일 갱신이 프레임당 1회로 줄어든다.
      적중 집합은 지우개 제스처가 끝날 때까지 비우지 않는다 — 부모의 page 갱신이 한 프레임 늦게 와도
      같은 결과를 다시 계산할 뿐, 이미 지운 획이 되살아나지 않는다 */
  const flushErase = useCallback(() => {
    eraseRafRef.current = 0
    const hits = eraseHitsRef.current
    if (hits.size === 0) return
    const { page: cur, onErase: erase } = propsRef.current
    const next = cur.strokes.filter((s) => !hits.has(s))
    if (next.length !== cur.strokes.length) erase(next)
  }, [])

  const eraseAt = useCallback(
    (x: number, y: number) => {
      const { page: cur } = propsRef.current
      const r = ERASER_RADIUS / Math.max(0.35, Math.min(1, scale * 2.4))
      const hits = eraseHitsRef.current
      for (const s of cur.strokes) {
        if (!hits.has(s) && strokeHits(s, x, y, r)) hits.add(s)
      }
      if (hits.size > 0 && !eraseRafRef.current) eraseRafRef.current = requestAnimationFrame(flushErase)
    },
    [scale, flushErase],
  )

  const cancelDrawing = useCallback(() => {
    const d = drawingRef.current
    if (!d) return
    drawingRef.current = null
    liveBoxRef.current = null
    eraseHitsRef.current.clear()
    const canvas = liveRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) clearCanvas(ctx)
  }, [])

  const finishDrawing = useCallback(() => {
    const d = drawingRef.current
    if (!d) return
    drawingRef.current = null
    if (d.mode === 'erase') {
      cancelAnimationFrame(eraseRafRef.current)
      flushErase()
      eraseHitsRef.current.clear()
    } else if (d.stroke.p.length >= 3) {
      const { page: cur, onCommit: commit } = propsRef.current
      if (cur.strokes.length < INK_MAX_STROKES_PER_PAGE) {
        // 확정할 때 점을 솎는다 — 화면은 같고 JSON·재생·되돌리기 비용은 점 수에 비례해 준다
        commit({ ...d.stroke, p: simplifyStrokePoints(d.stroke.p) })
      }
    }
    // 아래 캔버스에 얹힌 뒤 위 캔버스를 비운다 — 같은 프레임이라 깜빡임이 없다
    dirtyRef.current = true
    renderLive()
  }, [renderLive, flushErase])

  const handlePointerDown = (re: ReactPointerEvent<HTMLCanvasElement>) => {
    const e = re.nativeEvent
    const { tool: curTool, color: curColor, size: curSize, penOnly: curPenOnly, onPenDetected: detected } =
      propsRef.current

    if (e.pointerType === 'pen') {
      detected()
      penNearRef.current = true
    }

    if (e.pointerType === 'touch') {
      // 펜이 떠 있거나 펜으로 긋는 동안의 터치 = 손바닥
      if (penNearRef.current || (drawingRef.current && drawingTypeRef.current === 'pen')) return
      touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const fingers = touchesRef.current.size
      if (curPenOnly || fingers >= 2) {
        // 넘기기 — 손가락 하나로 그리던 중 둘째 손가락이 닿으면 그 획은 버린다(의도치 않은 선)
        if (drawingRef.current && drawingRef.current.pointerId !== e.pointerId) cancelDrawing()
        if (drawingRef.current?.pointerId === e.pointerId) cancelDrawing()
        panningRef.current = true
        re.currentTarget.setPointerCapture(e.pointerId)
        return
      }
    }

    if (drawingRef.current) return
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return

    const [x, y] = toLogical(e)
    const erasing = curTool === 'eraser' || isEraserButton(e)
    re.currentTarget.setPointerCapture(e.pointerId)
    drawingTypeRef.current = e.pointerType
    if (erasing) {
      drawingRef.current = { pointerId: e.pointerId, mode: 'erase', stroke: { c: 0, s: 0, p: [] } }
      eraseAt(x, y)
      return
    }
    const isPen = e.pointerType === 'pen'
    drawingRef.current = {
      pointerId: e.pointerId,
      mode: 'draw',
      stroke: {
        c: curColor,
        s: curSize,
        ...(isPen ? {} : { sim: 1 as const }),
        p: [x, y, pressureOf(e, isPen)],
      },
    }
    requestLive()
  }

  const handlePointerMove = (re: ReactPointerEvent<HTMLCanvasElement>) => {
    const e = re.nativeEvent

    // 넘기기 — 손가락 위치 변화만큼 스크롤
    const touch = touchesRef.current.get(e.pointerId)
    if (touch && panningRef.current) {
      const scroller = scrollerRef.current
      if (scroller) {
        const n = touchesRef.current.size
        scroller.scrollLeft -= (e.clientX - touch.x) / n
        scroller.scrollTop -= (e.clientY - touch.y) / n
      }
      touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      return
    }

    const d = drawingRef.current
    if (!d || d.pointerId !== e.pointerId) return
    const events: PointerEvent[] =
      typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length > 0
        ? e.getCoalescedEvents()
        : [e]
    const rect = committedRef.current?.getBoundingClientRect()
    if (d.mode === 'erase') {
      for (const ev of events) {
        const [x, y] = toLogical(ev, rect)
        eraseAt(x, y)
      }
      return
    }
    const isPen = e.pointerType === 'pen'
    const p = d.stroke.p
    for (const ev of events) {
      const [x, y] = toLogical(ev, rect)
      // 같은 자리 중복 샘플은 버린다 — 윤곽 계산 비용과 JSON 크기 절약
      const n = p.length
      if (n >= 3 && Math.abs(p[n - 3] - x) < 0.35 && Math.abs(p[n - 2] - y) < 0.35) continue
      p.push(x, y, pressureOf(ev, isPen))
    }
    requestLive()
  }

  const handlePointerUp = (re: ReactPointerEvent<HTMLCanvasElement>) => {
    const e = re.nativeEvent
    if (touchesRef.current.delete(e.pointerId) && touchesRef.current.size === 0) {
      panningRef.current = false
    }
    const d = drawingRef.current
    if (d && d.pointerId === e.pointerId) {
      if (re.type === 'pointercancel') cancelDrawing()
      else finishDrawing()
    }
  }

  // 펜 호버 추적 — 떠 있는 동안 손바닥 터치를 버린다
  const handlePointerEnter = (re: ReactPointerEvent<HTMLCanvasElement>) => {
    if (re.pointerType === 'pen') penNearRef.current = true
  }
  const handlePointerLeave = (re: ReactPointerEvent<HTMLCanvasElement>) => {
    if (re.pointerType === 'pen') penNearRef.current = false
  }

  const cssHeight = (cssWidth * INK_PAGE_H) / INK_PAGE_W
  const cursorClass = tool === 'eraser' ? 'ink-pad__live--eraser' : ''

  return (
    <div ref={scrollerRef} className="ink-pad">
      {/* 위(live) 캔버스 — 창 크기, sticky 로 창에 붙어 따라온다. 입력도 전부 여기서 받는다 */}
      <div className="ink-pad__live-wrap">
        <canvas
          ref={liveRef}
          className={`ink-pad__live ${cursorClass}`}
          role="img"
          aria-label="손글씨 편지지 — 펜이나 손가락으로 쓰세요"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onLostPointerCapture={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      <div
        className="ink-pad__paper"
        style={{
          width: cssWidth || undefined,
          height: cssWidth ? cssHeight : undefined,
          ['--ink-gap' as string]: `${INK_LINE_GAP * scale}px`,
          ['--ink-top' as string]: `${INK_LINE_TOP * scale}px`,
          ['--ink-margin' as string]: `${72 * scale}px`,
        }}
      >
        <canvas ref={committedRef} className="ink-pad__canvas" aria-hidden />
      </div>
    </div>
  )
}

export default InkPad
