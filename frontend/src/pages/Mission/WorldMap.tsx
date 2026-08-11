/**
 * 스타일라이즈드 세계지도 — 정확한 국경은 아니지만,
 * 모바일에서 빠르게 로드되고 선교지 위치를 시각화하기 위한 단순화된 SVG.
 * viewBox: 0 0 1000 500
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react'

export interface MapPoint {
  country: string
  x: number
  y: number
  color: string
  active: boolean
}

interface WorldMapProps {
  points: MapPoint[]
  onHover?: (country: string | null) => void
  /** 지도 점 탭 → 국가 선택 (모바일 터치 대응) */
  onSelect?: (country: string) => void
  /** 카드 클릭으로 선택된 국가 — 초강조 표시 */
  selectedCountry?: string | null
  /** true면 세계 전체, false면 활성 대륙으로 확대 */
  zoomOut?: boolean
}

interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

const WORLD_VIEW: ViewBox = { x: 0, y: 0, w: 1000, h: 500 }

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

/**
 * 활성 대륙 점들의 바운딩 박스에 여백을 더해 확대 뷰를 만든다.
 * 모바일 폭에서도 점·라벨이 읽히도록 하는 핵심 — 항상 2:1 비율 유지.
 */
const fitView = (points: MapPoint[]): ViewBox => {
  const active = points.filter(p => p.active)
  if (!active.length) return WORLD_VIEW
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of active) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  let w = Math.max(maxX - minX + 140, 380)
  let h = w / 2
  const needH = maxY - minY + 90
  if (needH > h) {
    h = needH
    w = h * 2
  }
  if (w >= 1000) return WORLD_VIEW
  return {
    x: clamp((minX + maxX) / 2 - w / 2, 0, 1000 - w),
    y: clamp((minY + maxY) / 2 - h / 2, 0, 500 - h),
    w,
    h,
  }
}

/** 파송의 출발점 — 서울 (viewBox 좌표) */
const SEOUL = { x: 806, y: 199 }

/** 단순화된 대륙 다각형(꼭짓점 목록) — 도트 매트릭스 채움의 밑그림 */
const CONTINENT_POLYS: [number, number][][] = [
  // North America
  [[120, 90], [160, 80], [210, 95], [260, 110], [280, 150], [260, 175], [230, 210], [180, 225], [140, 215], [110, 180], [95, 140]],
  [[200, 230], [240, 240], [250, 260], [220, 270], [200, 255]],
  // Central America
  [[230, 250], [260, 260], [290, 290], [260, 285], [240, 270]],
  // South America
  [[270, 300], [305, 300], [330, 340], [325, 400], [300, 435], [275, 425], [260, 380], [265, 335]],
  // Europe
  [[470, 155], [540, 145], [585, 160], [590, 195], [565, 215], [515, 215], [475, 195]],
  // Africa
  [[490, 230], [560, 225], [605, 260], [615, 325], [590, 380], [555, 410], [520, 395], [495, 340], [480, 285]],
  // Middle East
  [[585, 215], [640, 210], [660, 245], [630, 270], [595, 255]],
  // Russia (long horizontal)
  [[540, 100], [700, 85], [830, 100], [900, 130], [880, 165], [780, 175], [680, 170], [590, 155]],
  // Asia mainland / China
  [[670, 180], [780, 180], [830, 210], [820, 255], [760, 270], [700, 260], [660, 225]],
  // India
  [[680, 245], [720, 245], [730, 290], [705, 310], [685, 285]],
  // Southeast Asia
  [[735, 265], [775, 270], [790, 300], [765, 325], [740, 305]],
  // Indonesia
  [[760, 320], [820, 315], [840, 340], [805, 355], [775, 345]],
  // Japan
  [[830, 195], [855, 205], [860, 235], [840, 250], [825, 225]],
  // Australia
  [[790, 370], [860, 365], [895, 395], [870, 430], [815, 425], [785, 405]],
]

/** ray casting 점-다각형 포함 판정 */
const pointInPoly = (x: number, y: number, poly: [number, number][]) => {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/**
 * 도트 매트릭스 육지 — 대륙 다각형 안을 육각 오프셋 격자로 채운 점들.
 * 모듈 로드 시 1회 계산 (그리드 ~3천 점 검사, 결과 ~600점).
 */
const LAND_DOTS: { x: number; y: number }[] = (() => {
  const dots: { x: number; y: number }[] = []
  const step = 12
  for (let row = 0; ; row++) {
    const y = 74 + row * step
    if (y > 445) break
    const xOffset = row % 2 === 1 ? step / 2 : 0
    for (let x = 8 + xOffset; x < 1000; x += step) {
      if (CONTINENT_POLYS.some(poly => pointInPoly(x, y, poly))) {
        dots.push({ x, y })
      }
    }
  }
  return dots
})()

/** 서울 → 선교지 파송 곡선. 거리에 비례해 위로 떠오르는 아크 */
const arcPath = (x2: number, y2: number) => {
  const { x: x1, y: y1 } = SEOUL
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dist = Math.hypot(x2 - x1, y2 - y1)
  const lift = Math.min(95, 22 + dist * 0.2)
  return `M ${x1} ${y1} Q ${mx} ${my - lift} ${x2} ${y2}`
}

const WorldMap = ({ points, onHover, onSelect, selectedCountry, zoomOut }: WorldMapProps) => {
  const target = useMemo(
    () => (zoomOut ? WORLD_VIEW : fitView(points)),
    [points, zoomOut]
  )
  const [view, setView] = useState<ViewBox>(target)
  const viewRef = useRef(view)
  viewRef.current = view

  // viewBox는 CSS transition이 안 되므로 rAF로 부드럽게 보간
  useEffect(() => {
    const from = { ...viewRef.current }
    if (
      Math.abs(from.x - target.x) < 0.5 &&
      Math.abs(from.y - target.y) < 0.5 &&
      Math.abs(from.w - target.w) < 0.5
    ) {
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setView(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const duration = 650
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setView({
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
        h: from.h + (target.h - from.h) * e,
      })
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])

  return (
    <svg
      className="world-map"
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="참빛교회 해외 선교 지도"
    >
      <defs>
        <radialGradient id="mapBgGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(56,189,248,0.25)" />
          <stop offset="100%" stopColor="rgba(56,189,248,0)" />
        </radialGradient>
      </defs>

      {/* background glow */}
      <rect x="0" y="0" width="1000" height="500" fill="url(#mapBgGlow)" />

      {/* dot-matrix land */}
      <g className="map-land">
        {LAND_DOTS.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="1.7" />
        ))}
      </g>

      {/* dispatch arcs — 서울에서 각 선교지로 뻗어나가는 파송 라인 */}
      <g className="map-arcs">
        {points.map(p => {
          const isSelected = selectedCountry === p.country
          const lit = p.active || isSelected
          const d = arcPath(p.x, p.y)
          return (
            <g key={p.country}>
              <path
                d={d}
                className={`arc-base ${lit ? 'on' : ''}`}
                stroke={p.color}
              />
              {lit && (
                <path
                  d={d}
                  className={`arc-flow ${isSelected ? 'strong' : ''}`}
                  stroke={p.color}
                />
              )}
            </g>
          )
        })}
      </g>

      {/* home marker — 서울 */}
      <g className="map-home">
        <circle className="map-home-glow" cx={SEOUL.x} cy={SEOUL.y} r="11" fill="rgba(56,189,248,0.22)" />
        <circle
          cx={SEOUL.x}
          cy={SEOUL.y}
          r="4.2"
          fill="#ffffff"
          stroke="#38bdf8"
          strokeWidth="2"
          style={{ filter: 'drop-shadow(0 0 6px rgba(56,189,248,0.9))' }}
        />
        <text
          className="map-home-label"
          x={SEOUL.x}
          y={SEOUL.y - 13}
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          letterSpacing="2"
        >
          SEOUL
        </text>
      </g>

      {/* mission points */}
      <g>
        {points.map(p => {
          const isSelected = selectedCountry === p.country
          // 라벨: 이름 길이에 맞춰 폭 계산 + 현재 뷰 밖으로 나가지 않게 클램프
          const labelW = p.country.length * 12 + 18
          const labelX = clamp(p.x - labelW / 2, view.x + 6, view.x + view.w - labelW - 6)
          const labelAbove = p.y > view.y + 48
          const rectY = labelAbove ? p.y - 34 : p.y + 16
          return (
            <g
              key={p.country}
              className={`map-dot ${p.active ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
              style={{ color: p.color }}
            >
              {/* 선택된 국가: 넓은 외곽 halo */}
              {isSelected && (
                <>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="18"
                    fill={p.color}
                    opacity="0.15"
                    className="dot-halo-outer"
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="11"
                    fill={p.color}
                    opacity="0.3"
                    className="dot-halo-inner"
                  />
                  <circle
                    className="dot-pulse dot-pulse-strong"
                    cx={p.x}
                    cy={p.y}
                    r="3"
                    fill="none"
                    stroke={p.color}
                    strokeWidth="1.8"
                  />
                </>
              )}
              {p.active && !isSelected && (
                <circle
                  className="dot-pulse"
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill="none"
                  stroke={p.color}
                  strokeWidth="1.2"
                />
              )}
              <circle
                className="dot-core"
                cx={p.x}
                cy={p.y}
                r={isSelected ? 6 : p.active ? 4 : 2.5}
                fill={isSelected ? '#ffffff' : p.color}
                stroke={isSelected ? p.color : 'none'}
                strokeWidth={isSelected ? 2 : 0}
                opacity={p.active || isSelected ? 1 : 0.3}
                style={{
                  filter: isSelected
                    ? `drop-shadow(0 0 14px ${p.color}) drop-shadow(0 0 6px ${p.color})`
                    : p.active
                      ? `drop-shadow(0 0 6px ${p.color})`
                      : 'none',
                }}
              />
              {/* 선택 국가 라벨 */}
              {isSelected && (
                <g className="dot-label">
                  <rect
                    x={labelX}
                    y={rectY}
                    width={labelW}
                    height="20"
                    rx="10"
                    fill={p.color}
                    opacity="0.95"
                  />
                  <text
                    x={labelX + labelW / 2}
                    y={rectY + 14}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {p.country}
                  </text>
                </g>
              )}
              {/* 투명 히트 영역 — 모바일에서도 점을 탭할 수 있게 실제 점보다 크게 */}
              <circle
                cx={p.x}
                cy={p.y}
                r="18"
                fill="transparent"
                onMouseEnter={() => onHover?.(p.country)}
                onMouseLeave={() => onHover?.(null)}
                onClick={() => onSelect?.(p.country)}
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export default memo(WorldMap)
