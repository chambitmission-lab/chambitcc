import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { AtlasJourney } from '../atlasTypes'
import { layoutLabels, type LabelBox, type LabelInput } from '../labelLayout'
import { PLACES, placeLabel } from '../data/places'
import { useLandPath } from '../useLandPath'
import {
  MAP_VIEW,
  boundsOf,
  curvePath,
  project,
  splitCurve,
  type Point,
} from '../projection'

/**
 * 성경 지도여행 — SVG 지도 캔버스.
 *
 * 왜 타일 지도(Leaflet·카카오)가 아니라 손으로 그린 SVG 인가
 * - 성경 시대 지명은 현대 타일에 없다. 어차피 핀·경로는 우리가 그린다.
 * - 타일은 다크모드에서 통째로 어긋나고, 사용량 요금과 오프라인 문제가 붙는다.
 * - SVG 면 색이 전부 CSS 토큰이라 라이트/다크가 자동으로 맞는다.
 *
 * 확대/이동은 viewBox 를 직접 옮긴다(transform 이 아니라). 그래야 확대해도
 * 선 굵기·핀 크기·글자 크기를 화면 픽셀 기준으로 일정하게 유지할 수 있다
 * (unit = 지도 단위 / 화면 픽셀 을 곱해 준다).
 */

interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

interface MapCanvasProps {
  journey: AtlasJourney
  /** 재생 중 도달한 지점 index. 재생이 아니면 마지막 index */
  revealedIndex: number
  /** revealedIndex → 다음 지점 구간의 진행도 0~1 */
  legProgress: number
  /** 재생 중인지 — 이동 점(여행자)을 보일지 결정 */
  traveling: boolean
  activePlaceId: string | null
  onSelectPlace: (placeId: string) => void
  /** 방문 도장이 찍힌 장소 — 핀에 체크 표시 */
  visitedPlaceIds?: Set<string>
  /**
   * 퀴즈 중 답 후보인 장소들. 값이 있으면 지도가 퀴즈 모드로 바뀐다 —
   * 후보만 또렷하게 남기고 나머지는 흐려지며, 지명은 전부 감춘다
   * (라벨이 보이면 문제가 성립하지 않는다).
   */
  quizChoices?: string[] | null
  /** 답을 고른 뒤 — 정답과 사용자가 고른 곳을 드러낸다 */
  quizRevealed?: { answer: string; picked: string } | null
}

const MIN_SPAN = 40 // 최대 확대 (지도 단위)
const MAX_SPAN = MAP_VIEW.width * 1.15 // 최대 축소

const clampView = (v: ViewBox, aspect: number): ViewBox => {
  const w = Math.min(Math.max(v.w, MIN_SPAN), MAX_SPAN)
  const h = w / aspect
  // 지도 밖으로 완전히 벗어나지 않도록 — 절반은 넘어갈 수 있게 여유를 둔다
  const padX = w * 0.5
  const padY = h * 0.5
  return {
    w,
    h,
    x: Math.min(Math.max(v.x, -padX), MAP_VIEW.width - w + padX),
    y: Math.min(Math.max(v.y, -padY), MAP_VIEW.height - h + padY),
  }
}

const MapCanvas = ({
  journey,
  revealedIndex,
  legProgress,
  traveling,
  activePlaceId,
  onSelectPlace,
  visitedPlaceIds,
  quizChoices,
  quizRevealed,
}: MapCanvasProps) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  // 해안선은 따로 받는다 — 도착 전에도 바다·경로·핀은 먼저 그려진다
  const landPath = useLandPath()
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [view, setView] = useState<ViewBox>({
    x: 0,
    y: 0,
    w: MAP_VIEW.width,
    h: MAP_VIEW.height,
  })

  // 여정의 모든 지점을 지도 좌표로
  const stopPoints = useMemo<Point[]>(
    () =>
      journey.stops.map((stop) => {
        const place = PLACES[stop.place]
        return place ? project(place.lat, place.lng) : { x: 0, y: 0 }
      }),
    [journey]
  )

  // 화면에 그릴 핀 — 장소당 하나. 번호는 그 장소에 처음 도착한 순서
  const pins = useMemo(() => {
    const seen = new Map<string, number>()
    journey.stops.forEach((stop, i) => {
      if (!seen.has(stop.place)) seen.set(stop.place, i)
    })
    return [...seen.entries()].map(([placeId, firstIndex]) => ({
      placeId,
      firstIndex,
      order: [...seen.keys()].indexOf(placeId) + 1,
      point: stopPoints[firstIndex],
      place: PLACES[placeId],
    }))
  }, [journey, stopPoints])

  const aspect = size.w && size.h ? size.w / size.h : MAP_VIEW.width / MAP_VIEW.height

  // 컨테이너 크기 추적 — 확대 배율(unit) 계산에 필요
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      setSize((prev) =>
        prev.w === rect.width && prev.h === rect.height ? prev : { w: rect.width, h: rect.height }
      )
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /** 여정 전체가 화면에 들어오는 viewBox */
  const computeFit = useCallback(
    (w: number, h: number): ViewBox | null => {
      if (!w || !h) return null
      const b = boundsOf(stopPoints)
      const ratio = w / h
      // 여백 — 핀 라벨과 하단 자막이 지점을 가리지 않도록 넉넉히
      const padded = { w: b.w * 1.5 + 40, h: b.h * 1.9 + 40 }
      const span = Math.min(Math.max(Math.max(padded.w, padded.h * ratio), MIN_SPAN), MAX_SPAN)
      return clampView(
        {
          x: b.x + b.w / 2 - span / 2,
          y: b.y + b.h / 2 - span / ratio / 2,
          w: span,
          h: span / ratio,
        },
        ratio
      )
    },
    [stopPoints]
  )

  const fitToJourney = useCallback(() => {
    const next = computeFit(size.w, size.h)
    if (next) setView(next)
  }, [computeFit, size.w, size.h])

  // 여정이 바뀌면(그리고 처음 크기를 잰 순간) 지도를 맞춘다.
  // effect 가 아니라 렌더 중 상태 조정으로 처리한다 — effect 로 하면 맞추기 전의
  // 잘못된 viewBox 가 한 프레임 먼저 그려져 지도가 튄다.
  const [fitKey, setFitKey] = useState<string | null>(null)
  const [lastAspect, setLastAspect] = useState(0)
  if (size.w && size.h) {
    const ratio = size.w / size.h
    if (fitKey !== journey.id) {
      setFitKey(journey.id)
      setLastAspect(ratio)
      const next = computeFit(size.w, size.h)
      if (next) setView(next)
    } else if (Math.abs(ratio - lastAspect) > 0.001) {
      // 창 크기가 바뀌어 비율이 달라지면 높이만 다시 맞춘다.
      // 그냥 두면 SVG 가 레터박스로 맞춰지면서 확대 배율(unit) 계산이 어긋나
      // 핀·글자 크기가 화면에서 미묘하게 달라진다.
      setLastAspect(ratio)
      setView((v) => {
        const h = v.w / ratio
        return clampView({ ...v, y: v.y + (v.h - h) / 2, h }, ratio)
      })
    }
  }

  // ── 이동/확대 (포인터) ──────────────────────────────────────
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ dist: number; w: number } | null>(null)
  const draggedRef = useRef(false)

  const unit = size.w ? view.w / size.w : 1 // 지도 단위 / 화면 px

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    draggedRef.current = false
    if (pointers.current.size === 1) e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size >= 2) {
      // 핀치 — 두 손가락 거리 변화로 확대
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (!pinchRef.current) {
        pinchRef.current = { dist, w: view.w }
      } else if (dist > 0) {
        const nextW = pinchRef.current.w * (pinchRef.current.dist / dist)
        setView((v) => {
          const cx = v.x + v.w / 2
          const cy = v.y + v.h / 2
          const w = Math.min(Math.max(nextW, MIN_SPAN), MAX_SPAN)
          return clampView({ x: cx - w / 2, y: cy - w / aspect / 2, w, h: w / aspect }, aspect)
        })
      }
      draggedRef.current = true
      return
    }

    const dx = e.clientX - prev.x
    const dy = e.clientY - prev.y
    if (Math.abs(dx) + Math.abs(dy) > 2) draggedRef.current = true
    setView((v) => clampView({ ...v, x: v.x - dx * unit, y: v.y - dy * unit }, aspect))
  }

  const endPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchRef.current = null
  }

  // 휠 확대 — 커서를 기준점으로 잡아야 "그 지점을 향해" 확대되는 느낌이 난다
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      setView((v) => {
        const factor = Math.exp(e.deltaY * 0.0015)
        const w = Math.min(Math.max(v.w * factor, MIN_SPAN), MAX_SPAN)
        const h = w / aspect
        const anchorX = v.x + v.w * px
        const anchorY = v.y + v.h * py
        return clampView({ x: anchorX - w * px, y: anchorY - h * py, w, h }, aspect)
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [aspect])

  const zoomBy = (factor: number) => {
    setView((v) => {
      const cx = v.x + v.w / 2
      const cy = v.y + v.h / 2
      const w = Math.min(Math.max(v.w * factor, MIN_SPAN), MAX_SPAN)
      const h = w / aspect
      return clampView({ x: cx - w / 2, y: cy - h / 2, w, h }, aspect)
    })
  }

  // ── 경로 ────────────────────────────────────────────────────
  // 구간 i 는 지점 i-1 → i 를 잇는다. revealedIndex 까지는 완성, 그 다음 하나는 자라는 중
  const legs = useMemo(
    () =>
      journey.stops.slice(1).map((stop, i) => ({
        from: stopPoints[i],
        to: stopPoints[i + 1],
        bow: stop.bow ?? 0.14,
        sea: !!stop.sea,
        index: i + 1,
      })),
    [journey, stopPoints]
  )

  const growing = legs[revealedIndex] // 지금 자라고 있는 구간 (없으면 끝까지 그린 상태)
  const growingSplit =
    growing && legProgress > 0
      ? splitCurve(growing.from, growing.to, growing.bow, Math.min(legProgress, 1))
      : null

  const strokeW = unit * 2.6
  const pinScale = unit // 핀은 화면 픽셀 기준으로 일정하게

  // 지명이 서로 겹치지 않도록 매 렌더마다 자리를 다시 고른다.
  // 성경의 도시들은 실제로 붙어 있어(버가–앗달리아 17km) 고정 위치로는 해결되지 않는다.
  const labelBoxes = useMemo(() => {
    if (!size.w) return new Map<string, LabelBox | null>()
    const inputs: LabelInput[] = pins
      .filter((pin) => pin.place && pin.firstIndex <= revealedIndex)
      .filter((pin) => !quizChoices || quizRevealed?.answer === pin.placeId)
      .map((pin) => ({
        id: pin.placeId,
        screen: { x: (pin.point.x - view.x) / unit, y: (pin.point.y - view.y) / unit },
        text: placeLabel(pin.place!),
        priority: pin.firstIndex,
      }))
    return layoutLabels(inputs)
  }, [pins, revealedIndex, view.x, view.y, unit, size.w, quizChoices, quizRevealed])

  return (
    <div className="atl-canvas" ref={wrapRef}>
      <svg
        className="atl-svg"
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        role="img"
        aria-label={`${journey.title} 지도`}
      >
        {/* 바다 — viewBox 전체를 덮는다 (지도 밖으로 나가도 배경이 끊기지 않게 넉넉히) */}
        <rect
          x={-MAP_VIEW.width}
          y={-MAP_VIEW.height}
          width={MAP_VIEW.width * 3}
          height={MAP_VIEW.height * 3}
          className="atl-sea"
        />

        {/* 육지 — 미리 구운 해안선 (data/landPath.ts, 동적 로드) */}
        {landPath && <path d={landPath} className="atl-land" fillRule="evenodd" />}

        {/* 경로 */}
        <g fill="none" strokeLinecap="round">
          {legs.map((leg) => {
            const done = leg.index <= revealedIndex
            if (!done) return null
            return (
              <path
                key={`leg-${leg.index}`}
                d={curvePath(leg.from, leg.to, leg.bow)}
                stroke={journey.color}
                strokeWidth={strokeW}
                strokeDasharray={leg.sea ? `${strokeW * 2.2} ${strokeW * 1.8}` : undefined}
                className="atl-leg"
              />
            )
          })}

          {/* 자라는 중인 구간 — 곡선을 t 에서 잘라 그린다 */}
          {growingSplit && growing && (
            <path
              d={growingSplit.d}
              stroke={journey.color}
              strokeWidth={strokeW}
              strokeDasharray={growing.sea ? `${strokeW * 2.2} ${strokeW * 1.8}` : undefined}
              className="atl-leg atl-leg--growing"
            />
          )}
        </g>

        {/* 여행자 — 자라는 선의 끝에 정확히 붙는다 */}
        {traveling && growingSplit && (
          <g transform={`translate(${growingSplit.point.x} ${growingSplit.point.y})`}>
            <circle r={pinScale * 11} fill={journey.color} opacity={0.18} className="atl-walker-halo" />
            <circle r={pinScale * 4.5} fill={journey.color} stroke="#fff" strokeWidth={pinScale * 1.6} />
          </g>
        )}

        {/* 핀 */}
        {pins.map((pin) => {
          if (!pin.place) return null
          const reached = pin.firstIndex <= revealedIndex
          if (!reached) return null
          const isActive = activePlaceId === pin.placeId
          const isCurrent = journey.stops[revealedIndex]?.place === pin.placeId
          const visited = visitedPlaceIds?.has(pin.placeId)

          // 퀴즈 모드 — 후보가 아닌 핀은 흐려지고 눌리지 않는다
          const isChoice = !quizChoices || quizChoices.includes(pin.placeId)
          const isQuizAnswer = quizRevealed?.answer === pin.placeId
          const isWrongPick =
            !!quizRevealed && quizRevealed.picked === pin.placeId && !isQuizAnswer
          const dimmed = !!quizChoices && !isChoice
          const s = pinScale
          const nudge = pin.place.labelNudge
          const label = labelBoxes.get(pin.placeId)
          return (
            <g
              key={pin.placeId}
              transform={`translate(${pin.point.x} ${pin.point.y})`}
              className={`atl-pin${isActive ? ' atl-pin--active' : ''}${
                isCurrent ? ' atl-pin--current' : ''
              }${dimmed ? ' atl-pin--dimmed' : ''}${
                quizChoices && isChoice && !quizRevealed ? ' atl-pin--choice' : ''
              }${isQuizAnswer ? ' atl-pin--answer' : ''}${
                isWrongPick ? ' atl-pin--wrong' : ''
              }`}
              onClick={() => {
                if (draggedRef.current || dimmed) return
                onSelectPlace(pin.placeId)
              }}
              role="button"
              tabIndex={0}
              aria-label={placeLabel(pin.place)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectPlace(pin.placeId)
                }
              }}
            >
              {/* 현재 지점 파동 — 재생 중 "지금 여기"를 알린다 */}
              {isCurrent && traveling && !quizChoices && (
                <circle
                  cy={-s * 15}
                  r={s * 9}
                  fill="none"
                  stroke={journey.color}
                  strokeWidth={s * 1.2}
                  className="atl-pin__pulse"
                />
              )}
              {/* 퀴즈 후보 파동 — "여기 중 하나" 를 손가락에 알려 준다 */}
              {quizChoices && isChoice && !quizRevealed && (
                <circle
                  cy={-s * 15}
                  r={s * 9}
                  fill="none"
                  stroke={journey.color}
                  strokeWidth={s * 1.4}
                  className="atl-pin__pulse"
                />
              )}

              {/* 그림자 — 핀이 지도 위에 떠 있게 */}
              <ellipse cx={0} cy={s * 1.2} rx={s * 3.4} ry={s * 1.2} className="atl-pin__shadow" />
              <path
                d={`M0 0 c${-s * 4.6} ${-s * 6.8} ${-s * 8.4} ${-s * 11} ${-s * 8.4} ${-s * 15.2} a${
                  s * 8.4
                } ${s * 8.4} 0 1 1 ${s * 16.8} 0 c0 ${s * 4.2} ${-s * 3.8} ${s * 8.4} ${-s * 8.4} ${
                  s * 15.2
                } z`}
                fill={journey.color}
                stroke="#fff"
                strokeWidth={s * 1.3}
              />
              {visited ? (
                <path
                  d={`M${-s * 3.4} ${-s * 15.2} l${s * 2.4} ${s * 2.6} l${s * 4.6} ${-s * 5.4}`}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={s * 1.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <text
                  y={-s * 15.2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize={s * 9}
                  fontWeight={800}
                  className="atl-pin__no"
                >
                  {pin.order}
                </text>
              )}

              {/* 지명 — 확대해도 글자 크기는 그대로, 자리는 겹침을 피해 자동으로.
                  자리가 없어 멀리 밀린 라벨은 어느 핀의 것인지 지시선으로 잇는다 */}
              {label?.leader && (
                <line
                  x1={0}
                  y1={-s * 13}
                  x2={label.dx * s}
                  y2={label.dy * s}
                  className="atl-pin__leader"
                  strokeWidth={s}
                />
              )}
              {label && (
                <text
                  x={(label.dx + (nudge?.x ?? 0)) * s}
                  y={(label.dy + (nudge?.y ?? 0)) * s}
                  textAnchor={label.anchor}
                  dominantBaseline="middle"
                  fontSize={s * 12}
                  fontWeight={700}
                  className="atl-pin__label"
                  paintOrder="stroke"
                  strokeWidth={s * 3.4}
                  strokeLinejoin="round"
                >
                  {placeLabel(pin.place)}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* 확대 컨트롤 — 데스크톱 휠·모바일 핀치를 모르는 사람을 위한 보조 장치 */}
      <div className="atl-zoom">
        <button type="button" onClick={() => zoomBy(0.65)} aria-label="확대">
          <span className="material-icons-round">add</span>
        </button>
        <button type="button" onClick={() => zoomBy(1.55)} aria-label="축소">
          <span className="material-icons-round">remove</span>
        </button>
        <button type="button" onClick={fitToJourney} aria-label="여정 전체 보기">
          <span className="material-icons-round">filter_center_focus</span>
        </button>
      </div>
    </div>
  )
}

export default MapCanvas
