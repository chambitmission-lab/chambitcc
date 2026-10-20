// 작은 촛불 — 집중 기도 화면 CandleHero(유리컵 촛불)를 버튼 글자 옆 크기로 줄인 것.
// 유리컵은 빼고 초 몸통·심지·불꽃(겉불꽃+속불꽃)·따뜻한 빛무리만 남겼다.
// 색은 CandleHero 와 같은 촛불빛 그대로(라이트·다크 공통), 흔들림 리듬도 같다(3.2s / 2.6s reverse).
import { useId, type CSSProperties } from 'react'
import './miniCandle.css'

interface MiniCandleProps {
  /** 높이(px). 너비는 비율대로 */
  size?: number
  className?: string
  /** 불꽃 위로 떠오르는 빛 알갱이(집중 기도 CandleHero 의 mote) */
  motes?: boolean
  /** 처음 나타날 때 불꽃이 피어나며 켜진다(A4) — 마운트 한 번만, 이후엔 평소 흔들림 */
  ignite?: boolean
}

// 위치·주기·드리프트를 서로 어긋나게 — 셋이 한꺼번에 오르지 않도록
const MOTES = [
  { left: '38%', dur: '3.4s', delay: '0s', drift: '3px' },
  { left: '62%', dur: '4.2s', delay: '-1.6s', drift: '-4px' },
  { left: '50%', dur: '3.8s', delay: '-2.8s', drift: '2px' },
]

interface CandleSvgProps {
  /** 높이(px 또는 바깥 svg 단위). 너비는 비율대로 */
  size?: number
  /** false 면 불꽃 없이 심지만 — 아직 켜지지 않은 초 */
  lit?: boolean
  /** 처음 나타날 때 불꽃이 피어나며 켜진다 — 마운트 한 번만 */
  ignite?: boolean
  /** 다른 <svg> 안에 넣을 때 자리 */
  x?: number
  y?: number
}

/** 촛불 그림만 — 다른 SVG(발자국 길 끝 등) 안에 그대로 넣을 수 있다 */
export const CandleSvg = ({ size = 22, lit = true, ignite = false, x, y }: CandleSvgProps) => {
  // 한 화면에 여러 개가 떠도 그라데이션 id 가 겹치지 않게
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `mc-${name}-${uid}`

  return (
    <svg
      viewBox="5 1 14 26"
      x={x}
      y={y}
      width={(size * 14) / 26}
      height={size}
      className={`mini-candle${lit ? '' : ' is-unlit'}${ignite ? ' is-igniting' : ''}`}
      aria-hidden="true"
    >
      <defs>
        {/* 초 몸통: 불빛 받은 윗부분은 밝은 크림, 아래로 갈수록 그늘 */}
        <linearGradient id={id('wv')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4e2" />
          <stop offset=".35" stopColor="#f6e2c8" />
          <stop offset="1" stopColor="#c9a37e" />
        </linearGradient>
        {/* 원통 음영: 좌우 가장자리가 어둡다 */}
        <linearGradient id={id('wh')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a2c14" stopOpacity=".35" />
          <stop offset=".3" stopColor="#4a2c14" stopOpacity="0" />
          <stop offset=".7" stopColor="#4a2c14" stopOpacity="0" />
          <stop offset="1" stopColor="#4a2c14" stopOpacity=".4" />
        </linearGradient>
        <radialGradient id={id('ff')} cx="50%" cy="74%" r="62%">
          <stop offset="0" stopColor="#fffdf4" />
          <stop offset=".32" stopColor="#fff0bf" />
          <stop offset=".62" stopColor="#ffc15a" />
          <stop offset=".88" stopColor="#ff8a3d" stopOpacity=".9" />
          <stop offset="1" stopColor="#ff7a2e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('gl')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffc47a" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffb060" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle className="mini-candle-glow" cx="12" cy="10" r="9" fill={`url(#${id('gl')})`} />
      <path d="M7 15 V24.5 A5 1.2 0 0 0 17 24.5 V15 A5 1.2 0 0 1 7 15Z" fill={`url(#${id('wv')})`} />
      <path d="M7 15 V24.5 A5 1.2 0 0 0 17 24.5 V15 A5 1.2 0 0 1 7 15Z" fill={`url(#${id('wh')})`} />
      <ellipse cx="12" cy="15" rx="5" ry="1.2" fill="#fdecd2" />
      {/* 심지 */}
      <path d="M12 15 Q11.8 13.8 12.2 12.6" fill="none" stroke="#3a2a1e" strokeWidth=".9" strokeLinecap="round" />
      {/* 불꽃 — 겉불꽃 + 속불꽃이 서로 다른 리듬으로 흔들린다 */}
      <path
        className="mini-candle-flame"
        d="M12.2 3 C12.8 6 15.2 8.6 15.2 10.8 C15.2 12.6 13.8 13.6 12.2 13.6 C10.6 13.6 9.2 12.6 9.2 10.8 C9.2 8.6 11.6 6 12.2 3Z"
        fill={`url(#${id('ff')})`}
      />
      <path
        className="mini-candle-core"
        d="M12.2 8 C12.5 9.4 13.4 10.6 13.4 11.6 C13.4 12.5 12.9 13 12.2 13 C11.5 13 11 12.5 11 11.6 C11 10.6 11.9 9.4 12.2 8Z"
        fill="#fffef8"
      />
    </svg>
  )
}

const MiniCandle = ({ size = 22, className, motes = false, ignite = false }: MiniCandleProps) => {
  const svg = <CandleSvg size={size} />
  // 알갱이를 껐다 켜도 svg 는 같은 자리에 남아 있어야 켜지는 효과가 다시 돌지 않는다 — 늘 감싼다
  return (
    <span className={`mini-candle-wrap${ignite ? ' is-igniting' : ''} ${className ?? ''}`} aria-hidden="true">
      {svg}
      {motes &&
        MOTES.map((m, i) => (
          <span
            key={i}
            className="mini-candle-mote"
            style={
              {
                left: m.left,
                '--mote-delay': m.delay,
                '--mote-dur': m.dur,
                '--mote-drift': m.drift,
              } as CSSProperties
            }
          />
        ))}
    </span>
  )
}

export default MiniCandle
