import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { AtlasJourney } from '../atlasTypes'
import { layoutLabels, type LabelBox, type LabelInput } from '../labelLayout'
import { PLACES, placeLabel } from '../data/places'
import { useLandPath } from '../useLandPath'
import {
  MAP_VIEW,
  boundsOf,
  curveControl,
  curvePath,
  project,
  splitCurve,
  type Point,
} from '../projection'
import { MAP_DECOR } from '../decor'
import parchmentUrl from '../../../../assets/atlas/parchment.webp'
import seaUrl from '../../../../assets/atlas/sea.webp'
import parchmentNightUrl from '../../../../assets/atlas/parchment-night.webp'
import seaNightUrl from '../../../../assets/atlas/sea-night.webp'
import compassUrl from '../../../../assets/atlas/deco/compass.webp'
import compassNightUrl from '../../../../assets/atlas/deco/compass-night.webp'
import { useTheme } from '../../../../contexts/ThemeContext'
import { registerThemePair, warmPair, type ThemePair } from '../../../../utils/themeAssets'

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

/** 여백 삽화가 이보다 작아지면 그림이 아니라 얼룩이다 — 그리지 않는다 */
const DECOR_MIN_PX = 20
/** 나타나고 사라질 때 이 구간(px)에 걸쳐 흐려진다 — 줌 중에 툭 튀지 않게 */
const DECOR_FADE_PX = 16

/**
 * 여정을 맞출 때 비워 두는 테두리(화면 px).
 *
 * 캔버스 전체가 지도를 읽는 자리는 아니다 — 지명은 핀의 위·옆으로 길게 뻗고
 * (「앗달리아(밤빌리아)」처럼), 아래 오른쪽 구석은 줌 버튼이 차지한다. 캔버스
 * 한가운데에 맞추면 그 글자들이 가장자리에서 잘린다. 그래서 "실제로 보이는
 * 자리"의 한가운데에 맞춘다.
 *
 * ★bottom 이 76 이던 시절의 이유는 지도 위에 얹혀 있던 검은 자막 스크림이었다.
 *   자막이 지도 밖(아래 판)으로 내려가면서 그만큼 돌려받는다 — 대신 좌우를
 *   늘려, 왼쪽 끝 핀의 긴 지명이 잘리던 자리를 메운다.
 */
const FIT_INSET = { top: 32, side: 56, bottom: 38 }

/**
 * 지도 안쪽 그림도 낮/밤 두 벌이다(종이·물 질감, 나침반, 여백 삽화).
 *
 * 페이지 배경은 themeAssets 매니페스트가 맡지만 이 그림들은 거기 없어서, 테마를
 * 바꾸면 종이와 삽화만 맨땅에서 받기 시작했다 — 배경은 이미 바뀌었는데 지도만
 * 한 박자 늦게 따라오던 이유다. 지금 떠 있는 것으로 등록해 두면 토글 직전 선요청이
 * 반대 테마 파일까지 챙긴다.
 */
const TEXTURE_PAIRS: ThemePair[] = [
  { light: seaUrl, dark: seaNightUrl },
  { light: parchmentUrl, dark: parchmentNightUrl },
  { light: compassUrl, dark: compassNightUrl },
]
/** 삽화는 지금 그려진 것만 등록한다 — 화면 밖 그림까지 기다리면 토글이 늘 늦어진다 */
const DECOR_PAIRS = new Map<string, ThemePair>(
  MAP_DECOR.map((item) => [item.id, { light: item.src, dark: item.night }])
)

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
  // 여백의 삽화·나침반은 낮/밤 두 벌이다. CSS 로 감췄다 켜면 두 벌을 다 받으므로
  // 여기서 골라 한 벌만 그린다
  const { theme } = useTheme()
  const night = theme === 'dark'
  // 해안선은 따로 받는다 — 도착 전에도 바다·경로·핀은 먼저 그려진다
  const landPath = useLandPath()
  /**
   * 종이·물 질감 — 낮/밤 두 벌 중 지금 테마의 것만 받는다(예전엔 네 장을 다 받아
   * 절반은 쓰지도 않고 디코딩까지 했다).
   *
   * 아이디는 네 개를 그대로 둔다. 어느 아이디를 칠할지는 CSS(--atl-sea/--atl-land)가
   * 테마로 고르는데, 그 전환과 이 렌더의 순서는 보장되지 않는다. 네 아이디가 모두
   * "지금 질감"을 가리키면 어느 쪽이 먼저 바뀌든 칠이 비는 프레임이 없다.
   */
  const textures = useMemo(() => {
    const sea = night ? seaNightUrl : seaUrl
    const land = night ? parchmentNightUrl : parchmentUrl
    return [
      { id: 'atl-tex-sea', href: sea },
      { id: 'atl-tex-sea-night', href: sea },
      { id: 'atl-tex-land', href: land },
      { id: 'atl-tex-land-night', href: land },
    ]
  }, [night])
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

  // 화면에 들어와야 하는 점들 — 지점뿐 아니라 곡선이 가장 부풀어 오르는 곳까지.
  // 경로는 휘어 있어서(bow) 지점 상자만 재면 바다를 크게 도는 구간의 선이 잘린다.
  const fitPoints = useMemo<Point[]>(() => {
    const pts = [...stopPoints]
    journey.stops.slice(1).forEach((stop, i) => {
      const from = stopPoints[i]
      const to = stopPoints[i + 1]
      const c = curveControl(from, to, stop.bow ?? 0.14)
      // 2차 베지어의 중점 — 휨이 가장 큰 자리
      pts.push({ x: (from.x + 2 * c.x + to.x) / 4, y: (from.y + 2 * c.y + to.y) / 4 })
    })
    return pts
  }, [journey, stopPoints])

  /** 여정 전체가 "실제로 보이는 자리"에 들어오는 viewBox */
  const computeFit = useCallback(
    (w: number, h: number): ViewBox | null => {
      if (!w || !h) return null
      const b = boundsOf(fitPoints)
      const ratio = w / h
      // 캔버스가 작을 땐 테두리를 그대로 빼면 남는 자리가 없다 — 비율로 묶는다
      const side = Math.min(FIT_INSET.side, w * 0.16)
      const top = Math.min(FIT_INSET.top, h * 0.12)
      const bottom = Math.min(FIT_INSET.bottom, h * 0.32)
      const usableW = w - side * 2
      const usableH = h - top - bottom
      // 여정 상자가 그 자리에 꼭 맞는 배율(= viewBox 폭)
      const span = Math.min(
        Math.max(Math.max((b.w * w) / usableW, ((b.h * h) / usableH) * ratio), MIN_SPAN),
        MAX_SPAN
      )
      const fitUnit = span / w
      return clampView(
        {
          // 여정의 한가운데를 캔버스가 아니라 "보이는 자리"의 한가운데에 둔다
          x: b.x + b.w / 2 - (side + usableW / 2) * fitUnit,
          y: b.y + b.h / 2 - (top + usableH / 2) * fitUnit,
          w: span,
          h: span / ratio,
        },
        ratio
      )
    },
    [fitPoints]
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

  /**
   * 손가락·휠은 프레임보다 자주 들어온다(120Hz 기기에선 초당 120번). 그때마다
   * viewBox 를 바꾸면 그 수만큼 지도 전체 — 해안선 path, 질감 패턴, 핀과 지명 —
   * 를 다시 래스터라이즈한다. 그래서 들어온 만큼 모아 두고 프레임당 한 번만 반영한다.
   * 손가락이 지나간 거리는 더해서 쓰므로 움직임이 잘리지 않는다.
   */
  const pendingRef = useRef<{
    dx: number
    dy: number
    /** 핀치가 목표로 하는 viewBox 폭 */
    pinchW: number | null
    /** 휠 누적량과 마지막 커서 위치(0~1) */
    wheel: { dy: number; px: number; py: number } | null
  }>({ dx: 0, dy: 0, pinchW: null, wheel: null })
  const frameRef = useRef(0)

  const flushView = useCallback(() => {
    frameRef.current = 0
    const { dx, dy, pinchW, wheel } = pendingRef.current
    pendingRef.current = { dx: 0, dy: 0, pinchW: null, wheel: null }
    if (!dx && !dy && pinchW == null && !wheel) return
    setView((v) => {
      let next = v
      if (pinchW != null) {
        const cx = v.x + v.w / 2
        const cy = v.y + v.h / 2
        const w = Math.min(Math.max(pinchW, MIN_SPAN), MAX_SPAN)
        next = { x: cx - w / 2, y: cy - w / aspect / 2, w, h: w / aspect }
      }
      if (wheel) {
        const w = Math.min(Math.max(next.w * Math.exp(wheel.dy * 0.0015), MIN_SPAN), MAX_SPAN)
        const h = w / aspect
        // 커서가 가리키던 지점을 그대로 붙잡아 둔다 — "그 지점을 향해" 확대되는 느낌
        const anchorX = next.x + next.w * wheel.px
        const anchorY = next.y + next.h * wheel.py
        next = { x: anchorX - w * wheel.px, y: anchorY - h * wheel.py, w, h }
      }
      if (dx || dy) {
        // 배율은 이번 프레임의 것으로 — 핀치·휠과 같은 프레임에 들어와도 어긋나지 않게
        const u = size.w ? next.w / size.w : 1
        next = { ...next, x: next.x - dx * u, y: next.y - dy * u }
      }
      return clampView(next, aspect)
    })
  }, [aspect, size.w])

  const scheduleFlush = useCallback(() => {
    if (frameRef.current) return
    frameRef.current = requestAnimationFrame(flushView)
  }, [flushView])

  // 화면을 떠날 때 예약된 프레임을 거둔다
  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    },
    []
  )

  /** 끌기가 시작된 뒤에만 캡처를 잡는다 — 이유는 onPointerDown 주석 참고 */
  const capturePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // 이미 놓친 포인터 — 팬은 캡처 없이도 캔버스 안에서는 계속된다
    }
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    draggedRef.current = false
    // ★여기서 캡처를 잡으면 안 된다. 캡처 중에는 마우스 down/up 이 캔버스(svg)로
    // 되겨냥돼 브라우저가 계산하는 click 타깃도 svg 가 되고, 핀 <g onClick> 이
    // 영원히 안 불린다(퀴즈에서 반짝이는 핀을 눌러도 반응이 없던 원인).
    // 캡처는 손가락이 캔버스를 벗어나도 팬을 이어받으려는 장치이므로,
    // 실제로 끌기 시작한 순간(onPointerMove 임계치)에 잡는다.
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
        pendingRef.current.pinchW = pinchRef.current.w * (pinchRef.current.dist / dist)
        scheduleFlush()
      }
      draggedRef.current = true
      capturePointer(e)
      return
    }

    const dx = e.clientX - prev.x
    const dy = e.clientY - prev.y
    if (Math.abs(dx) + Math.abs(dy) > 2) {
      draggedRef.current = true
      capturePointer(e)
    }
    pendingRef.current.dx += dx
    pendingRef.current.dy += dy
    scheduleFlush()
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
      const prev = pendingRef.current.wheel
      // 트랙패드는 한 번 미는 동안 수십 번 들어온다 — 양은 더하고, 기준점은 마지막 커서
      pendingRef.current.wheel = {
        dy: (prev?.dy ?? 0) + e.deltaY,
        px: (e.clientX - rect.left) / rect.width,
        py: (e.clientY - rect.top) / rect.height,
      }
      scheduleFlush()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [scheduleFlush])

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
    // 좌표에서 view 를 빼지 않는다 — layoutLabels 는 핀들의 '서로 간 거리'만 보고
    // 자리를 고르므로(화면 가장자리를 보지 않는다) 지도를 옮겨도 답이 같다. view 를
    // 넣으면 손가락을 끄는 내내 수십 개 라벨의 충돌 검사를 프레임마다 다시 돌게 된다.
    const inputs: LabelInput[] = pins
      .filter((pin) => pin.place && pin.firstIndex <= revealedIndex)
      .filter((pin) => !quizChoices || quizRevealed?.answer === pin.placeId)
      .map((pin) => ({
        id: pin.placeId,
        screen: { x: pin.point.x / unit, y: pin.point.y / unit },
        text: placeLabel(pin.place!),
        priority: pin.firstIndex,
      }))
    return layoutLabels(inputs)
  }, [pins, revealedIndex, unit, size.w, quizChoices, quizRevealed])

  /**
   * 화면에 실제로 그릴 여백 삽화.
   *
   * 삽화는 "빈 자리"에만 머물러야 읽힌다. 두 가지 이유로 자리를 잃는다.
   *
   * 1. 지도를 줄이면 그림이 덮는 땅이 넓어진다. 크기가 화면 px 기준이라
   *    배율과 무관하게 같은 크기로 그려지는데, 지도가 멀어질수록 그 크기가
   *    더 넓은 땅을 가린다 — 모바일 기본 배율에서 바다에 띄운 돛단배가
   *    해안을 넘어 육지에 올라앉아 보이던 이유다. 그래서 제 자리(item.span)
   *    보다 커지지 않게 묶고, 그 바람에 알아볼 수 없이 작아지면 숨긴다.
   * 2. 좁은 화면에서는 핀·지명과 한 덩어리로 뭉친다. 핀과 지명 둘 다
   *    비켜야 할 자리로 보고, 그 둘레에 들어오는 삽화는 비켜 준다.
   *
   * 둘 다 갑자기 사라지면 눈에 걸리므로 경계에서 서서히 흐려진다.
   */
  const decorItems = useMemo(() => {
    if (!size.w || !size.h) return []
    // 핀·지명 둘레에 비워 둘 거리(화면 px) — 화면이 좁을수록 넉넉히
    const clearPx = size.w < 560 ? 30 : 20
    const occupied: Point[] = []
    for (const pin of pins) {
      if (!pin.place || pin.firstIndex > revealedIndex) continue
      const sx = (pin.point.x - view.x) / unit
      const sy = (pin.point.y - view.y) / unit
      occupied.push({ x: sx, y: sy - 13 }) // 핀은 끝점 위로 뻗는다
      const label = labelBoxes.get(pin.placeId)
      if (label) occupied.push({ x: sx + label.dx, y: sy + label.dy })
    }

    const out: {
      id: string
      href: string
      x: number
      y: number
      w: number
      h: number
      opacity: number
    }[] = []
    for (const item of MAP_DECOR) {
      const w = Math.min(item.px * unit, item.span)
      const screenW = w / unit
      if (screenW < DECOR_MIN_PX) continue
      const h = w * item.ratio
      const p = project(item.lat, item.lng)
      const sx = (p.x - view.x) / unit
      const sy = (p.y - view.y) / unit
      const screenH = screenW * item.ratio
      // 화면 밖은 그리지 않는다
      if (
        sx < -screenW ||
        sy < -screenH ||
        sx > size.w + screenW ||
        sy > size.h + screenH
      )
        continue
      // 그림 테두리에서 재는 거리 — 가운데에서 재면 낮고 긴 그림(낙타 행렬)이
      // 실제로는 닿지도 않는 핀 때문에 통째로 사라진다
      let near = Infinity
      for (const o of occupied) {
        const gapX = Math.max(Math.abs(o.x - sx) - screenW / 2, 0)
        const gapY = Math.max(Math.abs(o.y - sy) - screenH / 2, 0)
        const dist = Math.hypot(gapX, gapY)
        if (dist < near) near = dist
      }
      const fadeSize = Math.min((screenW - DECOR_MIN_PX) / DECOR_FADE_PX, 1)
      const fadeCrowd = Math.min((near - clearPx) / 24, 1)
      // 거의 보이지 않을 그림은 그리지 않는다 — 얼룩만 남고 디코딩 값은 다 치른다
      const opacity = Math.min(fadeSize, fadeCrowd)
      if (opacity < 0.06) continue
      out.push({
        id: item.id,
        href: night ? item.night : item.src,
        x: p.x - w / 2,
        y: p.y - h / 2,
        w,
        h,
        opacity,
      })
    }
    return out
  }, [pins, revealedIndex, labelBoxes, view, unit, size, night])

  // 팬·줌마다 바뀌는 것은 투명도뿐이므로, 그려진 '목록'이 실제로 달라질 때만 다시 등록한다
  const decorKey = decorItems.map((item) => item.id).join('|')
  useEffect(() => {
    const pairs = [
      ...TEXTURE_PAIRS,
      ...decorKey
        .split('|')
        .map((id) => DECOR_PAIRS.get(id))
        .filter((pair): pair is ThemePair => !!pair),
    ]
    const unregister = pairs.map(registerThemePair)
    // 현재 테마 파일은 이미 SVG 가 요청했다 — 여기서 얻는 것은 유휴 시간의 '반대 테마' 선요청
    pairs.forEach((pair) => void warmPair(pair))
    return () => unregister.forEach((off) => off())
  }, [decorKey])

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
        {/* 종이·물 질감 — --atl-sea/--atl-land 가 테마에 따라 낮/밤 패턴을 가리킨다.
            타일은 지도 단위로 크게 잡는다. 확대하면 결도 같이 커지지만, 대비가 거의
            없는 워시라 결보다 "종이 위의 지도"라는 인상이 먼저 읽힌다.
            밤 질감은 런타임 filter 가 아니라 미리 어둡게 구운 파일이다 — 필터는
            팬·줌·재생 때마다 다시 래스터라이즈돼 프레임을 잡아먹는다. */}
        <defs>
          {textures.map((tex) => (
            <pattern
              key={tex.id}
              id={tex.id}
              patternUnits="userSpaceOnUse"
              width={900}
              height={900}
            >
              <image
                href={tex.href}
                width={900}
                height={900}
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          ))}
        </defs>

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

        {/* 여백의 삽화 — 경로·핀보다 먼저 깔아 절대 위를 덮지 않는다 */}
        <g className="atl-decor" aria-hidden>
          {decorItems.map((item) => (
            <image
              key={item.id}
              href={item.href}
              x={item.x}
              y={item.y}
              width={item.w}
              height={item.h}
              opacity={item.opacity}
            />
          ))}
        </g>

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

      {/* 나침반 — 지도와 함께 움직이지 않는다. 이건 지도 위의 물건이 아니라
          "지도를 읽는 도구"라서, 옛 지도의 도장처럼 모서리에 붙어 있어야 한다 */}
      <img
        className="atl-compass"
        src={night ? compassNightUrl : compassUrl}
        alt=""
        aria-hidden
        decoding="async"
      />

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
