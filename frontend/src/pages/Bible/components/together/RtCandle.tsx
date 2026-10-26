import { useId } from 'react'

/**
 * 아직 아무도 나누지 않은 말씀의 촛불 — 시 119:105 "주의 말씀은 내 발에 등이요".
 * 꺼진 채 가는 연기만 오르다가, 성도가 묵상을 쓰기 시작하면(lit) 심지에 불이 붙고
 * 뒤로 빛살이 천천히 돈다. (필사의 등잔과 겹치지 않게 촛대 모양·흰 불심으로 구분)
 */
const RtCandle = ({ lit }: { lit: boolean }) => {
  const uid = useId().replace(/:/g, '')
  return (
    <span className={`rt-candle${lit ? ' is-lit' : ''}`} aria-hidden>
      <span className="rt-candle__rays" />
      <span className="rt-candle__halo" />
      <svg viewBox="0 0 80 120">
        <defs>
          <linearGradient id={`rtf-${uid}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ff8a3d" />
            <stop offset="0.5" stopColor="#ffc15a" />
            <stop offset="1" stopColor="#fff1c2" />
          </linearGradient>
          <linearGradient id={`rtw-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" className="rt-candle__wax-a" />
            <stop offset="0.55" className="rt-candle__wax-b" />
            <stop offset="1" className="rt-candle__wax-a" />
          </linearGradient>
        </defs>
        {/* 꺼져 있을 때 오르는 연기 */}
        <path className="rt-candle__smoke" d="M40 50 C35 43 45 37 40 29 C35 21 45 15 40 6" />
        {/* 촛대 몸통 + 흘러내린 촛농 */}
        <path
          className="rt-candle__body"
          d="M29 66 Q29 61 34 61 L46 61 Q51 61 51 66 L51 106 Q51 110 47 110 L33 110 Q29 110 29 106 Z"
          fill={`url(#rtw-${uid})`}
        />
        <path className="rt-candle__drip" d="M44 61 Q46 61 46 64 L46 72 Q46 75 44 75 Q42 75 42 72 L42 63 Z" />
        <ellipse className="rt-candle__top" cx="40" cy="62" rx="11" ry="2.4" />
        <path className="rt-candle__wick" d="M40 62 L40.6 54" />
        {/* 받침 */}
        <path className="rt-candle__dish" d="M18 110 H62 Q62 116 55 116 H25 Q18 116 18 110 Z" />
        {/* 불꽃 */}
        <g className="rt-candle__flame">
          <path d="M40.5 20 C48 31 51 41 40.5 55 C30 41 33 31 40.5 20 Z" fill={`url(#rtf-${uid})`} />
          <path d="M40.5 34 C44 39 45 44 40.5 52 C36 44 37 39 40.5 34 Z" fill="#fffaf0" opacity="0.9" />
          <ellipse cx="40.5" cy="53" rx="2.6" ry="2" fill="#5b8cff" opacity="0.55" />
        </g>
      </svg>
    </span>
  )
}

export default RtCandle
