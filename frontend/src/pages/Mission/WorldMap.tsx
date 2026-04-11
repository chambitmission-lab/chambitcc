/**
 * 스타일라이즈드 세계지도 — 정확한 국경은 아니지만,
 * 모바일에서 빠르게 로드되고 선교지 위치를 시각화하기 위한 단순화된 SVG.
 * viewBox: 0 0 1000 500
 */
import { memo } from 'react'

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
  /** 카드 클릭으로 선택된 국가 — 초강조 표시 */
  selectedCountry?: string | null
}

/** 단순화된 대륙 경로들 — 모양새만 알아볼 수 있도록 */
const CONTINENTS: string[] = [
  // North America
  'M 120 90 Q 160 80 210 95 L 260 110 L 280 150 L 260 175 L 230 210 L 180 225 L 140 215 L 110 180 L 95 140 Z',
  'M 200 230 L 240 240 L 250 260 L 220 270 L 200 255 Z',
  // Central America
  'M 230 250 L 260 260 L 290 290 L 260 285 L 240 270 Z',
  // South America
  'M 270 300 L 305 300 L 330 340 L 325 400 L 300 435 L 275 425 L 260 380 L 265 335 Z',
  // Europe
  'M 470 155 L 540 145 L 585 160 L 590 195 L 565 215 L 515 215 L 475 195 Z',
  // Africa
  'M 490 230 L 560 225 L 605 260 L 615 325 L 590 380 L 555 410 L 520 395 L 495 340 L 480 285 Z',
  // Middle East
  'M 585 215 L 640 210 L 660 245 L 630 270 L 595 255 Z',
  // Russia (long horizontal)
  'M 540 100 L 700 85 L 830 100 L 900 130 L 880 165 L 780 175 L 680 170 L 590 155 Z',
  // Asia mainland / China
  'M 670 180 L 780 180 L 830 210 L 820 255 L 760 270 L 700 260 L 660 225 Z',
  // India
  'M 680 245 L 720 245 L 730 290 L 705 310 L 685 285 Z',
  // Southeast Asia
  'M 735 265 L 775 270 L 790 300 L 765 325 L 740 305 Z',
  // Indonesia
  'M 760 320 L 820 315 L 840 340 L 805 355 L 775 345 Z',
  // Japan
  'M 830 195 L 855 205 L 860 235 L 840 250 L 825 225 Z',
  // Australia
  'M 790 370 L 860 365 L 895 395 L 870 430 L 815 425 L 785 405 Z',
]

const WorldMap = ({ points, onHover, selectedCountry }: WorldMapProps) => {
  return (
    <svg
      className="world-map"
      viewBox="0 0 1000 500"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="참빛교회 해외 선교 지도"
    >
      <defs>
        <radialGradient id="mapBgGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(56,189,248,0.25)" />
          <stop offset="100%" stopColor="rgba(56,189,248,0)" />
        </radialGradient>
        <linearGradient id="continentFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(186,230,253,0.12)" />
          <stop offset="100%" stopColor="rgba(99,102,241,0.08)" />
        </linearGradient>
      </defs>

      {/* background glow */}
      <rect x="0" y="0" width="1000" height="500" fill="url(#mapBgGlow)" />

      {/* faint grid */}
      <g stroke="rgba(255,255,255,0.04)" strokeWidth="0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="500" />
        ))}
      </g>

      {/* continents */}
      <g className="map-continents">
        {CONTINENTS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* mission points */}
      <g>
        {points.map(p => {
          const isSelected = selectedCountry === p.country
          return (
            <g
              key={p.country}
              className={`map-dot ${p.active ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
              style={{ color: p.color }}
              onMouseEnter={() => onHover?.(p.country)}
              onMouseLeave={() => onHover?.(null)}
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
                opacity={p.active || isSelected ? 1 : 0.55}
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
                    x={p.x - 28}
                    y={p.y - 32}
                    width="56"
                    height="18"
                    rx="9"
                    fill={p.color}
                    opacity="0.95"
                  />
                  <text
                    x={p.x}
                    y={p.y - 19}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {p.country}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export default memo(WorldMap)
