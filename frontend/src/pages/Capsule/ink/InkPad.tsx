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
  type InkColorIndex,
  type InkPage,
  type InkStroke,
} from './inkModel'
import { clearCanvas, drawStroke, drawStrokes, fitCanvas, strokeHits } from './inkRender'

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

  // 최신 props 를 핸들러에서 ref 로 읽는다 (리스너 재등록 없이)
  const propsRef = useRef({ page, onCommit, onErase, tool, color, size, penOnly, onPenDetected })
  useLayoutEffect(() => {
    propsRef.current = { page, onCommit, onErase, tool, color, size, penOnly, onPenDetected }
  })

  // 종이 기본 폭 = 스크롤 영역 폭(PC 는 상한) — 확대는 여기에 zoom 을 곱한다
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const measure = () => setBaseWidth(Math.min(maxBaseWidth, Math.max(0, el.clientWidth - 24)))
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

  // 위 캔버스 — 크기만 맞춰 둔다(지연이 적은 desynchronized 컨텍스트)
  useLayoutEffect(() => {
    const canvas = liveRef.current
    if (!canvas || cssWidth <= 0) return
    fitCanvas(canvas, cssWidth, { desynchronized: true })
  }, [cssWidth])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const toLogical = useCallback((e: { clientX: number; clientY: number }): [number, number] => {
    const canvas = liveRef.current
    if (!canvas) return [0, 0]
    const rect = canvas.getBoundingClientRect()
    return [
      ((e.clientX - rect.left) / rect.width) * INK_PAGE_W,
      ((e.clientY - rect.top) / rect.height) * INK_PAGE_H,
    ]
  }, [])

  const renderLive = useCallback(() => {
    rafRef.current = 0
    if (!dirtyRef.current) return
    dirtyRef.current = false
    const canvas = liveRef.current
    const d = drawingRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { desynchronized: true })
    if (!ctx) return
    clearCanvas(ctx)
    if (d && d.mode === 'draw') drawStroke(ctx, d.stroke, 'light', undefined, false)
  }, [])

  const requestLive = useCallback(() => {
    dirtyRef.current = true
    if (!rafRef.current) rafRef.current = requestAnimationFrame(renderLive)
  }, [renderLive])

  const eraseAt = useCallback(
    (x: number, y: number) => {
      const { page: cur, onErase: erase } = propsRef.current
      const r = ERASER_RADIUS / Math.max(0.35, Math.min(1, scale * 2.4))
      let hit = false
      const next = cur.strokes.filter((s) => {
        const h = strokeHits(s, x, y, r)
        if (h) hit = true
        return !h
      })
      if (hit) erase(next)
    },
    [scale],
  )

  const cancelDrawing = useCallback(() => {
    const d = drawingRef.current
    if (!d) return
    drawingRef.current = null
    const canvas = liveRef.current
    const ctx = canvas?.getContext('2d', { desynchronized: true })
    if (ctx) clearCanvas(ctx)
  }, [])

  const finishDrawing = useCallback(() => {
    const d = drawingRef.current
    if (!d) return
    drawingRef.current = null
    if (d.mode === 'draw' && d.stroke.p.length >= 3) {
      const { page: cur, onCommit: commit } = propsRef.current
      if (cur.strokes.length < INK_MAX_STROKES_PER_PAGE) commit(d.stroke)
    }
    // 아래 캔버스에 얹힌 뒤 위 캔버스를 비운다 — 같은 프레임이라 깜빡임이 없다
    dirtyRef.current = true
    renderLive()
  }, [renderLive])

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
    if (d.mode === 'erase') {
      for (const ev of events) {
        const [x, y] = toLogical(ev)
        eraseAt(x, y)
      }
      return
    }
    const isPen = e.pointerType === 'pen'
    const p = d.stroke.p
    for (const ev of events) {
      const [x, y] = toLogical(ev)
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
  const cursorClass = tool === 'eraser' ? 'ink-pad__paper--eraser' : ''

  return (
    <div ref={scrollerRef} className="ink-pad">
      <div
        className={`ink-pad__paper ${cursorClass}`}
        style={{
          width: cssWidth || undefined,
          height: cssWidth ? cssHeight : undefined,
          ['--ink-gap' as string]: `${INK_LINE_GAP * scale}px`,
          ['--ink-top' as string]: `${INK_LINE_TOP * scale}px`,
          ['--ink-margin' as string]: `${72 * scale}px`,
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={committedRef} className="ink-pad__canvas" aria-hidden />
        <canvas
          ref={liveRef}
          className="ink-pad__canvas ink-pad__canvas--live"
          role="img"
          aria-label="손글씨 편지지 — 펜이나 손가락으로 쓰세요"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onLostPointerCapture={handlePointerUp}
        />
      </div>
    </div>
  )
}

export default InkPad
