import { useId } from 'react'

interface LampProps {
  /** 오늘 목표 대비 채운 비율 0~1 — 등잔의 기름 높이 */
  fill: number
  /** 연속 기록이 살아 있으면 불꽃이 탄다 */
  lit: boolean
  /** 오늘 목표를 채웠다 — 불꽃이 커지고 빛이 번진다 */
  full?: boolean
  className?: string
}

// 기름 높이의 위·아래(등잔 몸통 안쪽)
const OIL_TOP = 38
const OIL_BOTTOM = 71

/**
 * 마 25장 열 처녀의 등잔 — 필사 연속 기록의 상징.
 * 오늘 쓴 만큼 기름이 차오르고, 연속 기록이 이어지는 동안 불이 켜져 있다.
 */
const Lamp = ({ fill, lit, full = false, className = '' }: LampProps) => {
  const uid = useId().replace(/:/g, '')
  const level = Math.max(0, Math.min(1, fill))
  const oilY = OIL_BOTTOM - (OIL_BOTTOM - OIL_TOP) * level
  const body =
    'M16 52 C16 41 35 35 60 35 C78 35 90 38 99 44 L111 41 C116 40 118 46 114 48 L103 55 C97 65 82 72 58 72 C33 72 16 64 16 52 Z'

  return (
    <span className={`bt-lamp${lit ? ' is-lit' : ''}${full ? ' is-full' : ''} ${className}`} aria-hidden>
      <svg viewBox="0 0 124 84">
        <defs>
          <clipPath id={`oil-${uid}`}>
            <path d={body} />
          </clipPath>
          <linearGradient id={`flame-${uid}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ff7a2f" />
            <stop offset="0.55" stopColor="#ffb547" />
            <stop offset="1" stopColor="#ffe08a" />
          </linearGradient>
        </defs>
        {lit && <circle className="bt-lamp__glow" cx="112" cy="30" r={full ? 26 : 18} />}
        <path className="bt-lamp__handle" d="M19 50 C5 49 5 33 17 36" />
        <path className="bt-lamp__body" d={body} />
        <g clipPath={`url(#oil-${uid})`}>
          <rect className="bt-lamp__oil" x="0" y={oilY} width="124" height={84 - oilY} />
          {level > 0 && <path className="bt-lamp__oil-line" d={`M10 ${oilY} H120`} />}
        </g>
        <path className="bt-lamp__rim" d={body} />
        <ellipse className="bt-lamp__hole" cx="54" cy="39" rx="13" ry="2.6" />
        <path className="bt-lamp__wick" d="M110 42 L112 37" />
        {lit && (
          <g className="bt-lamp__flame">
            <path d="M112 12 C119 22 121 30 112 37 C103 30 105 22 112 12 Z" fill={`url(#flame-${uid})`} />
            <path d="M112 22 C115 27 116 31 112 35 C108 31 109 27 112 22 Z" fill="#fff6d8" opacity="0.85" />
          </g>
        )}
      </svg>
    </span>
  )
}

export default Lamp
