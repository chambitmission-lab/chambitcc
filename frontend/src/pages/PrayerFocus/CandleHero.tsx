import type { CSSProperties } from 'react'

// 설정 화면의 정서적 앵커 — 유리컵 속 살아있는 촛불(votive).
// 유리컵·초 몸통은 SVG 그라데이션, 불꽃은 CSS 애니메이션으로 흔들린다.
// 불꽃·촛농 빛은 시간대와 무관하게 항상 따뜻한 색(촛불의 물리적 사실감), 외곽 할로만 무드 색으로 틴트된다.
// SVG 그라데이션 id는 화면에 한 번만 렌더되는 컴포넌트라 정적 접두사로 둔다.

interface CandleHeroProps {
  /** 외곽 할로 틴트 색 (mood.ringFrom hex) */
  haloTint: string
}

// 불꽃 주위로 떠오르는 빛 입자 — 위치/주기/드리프트를 서로 어긋나게
const MOTES = [
  { left: '34%', top: '30%', dur: '6.5s', delay: '0s', drift: '10px' },
  { left: '60%', top: '36%', dur: '8s', delay: '-2.4s', drift: '-12px' },
  { left: '46%', top: '22%', dur: '7.2s', delay: '-4.6s', drift: '5px' },
  { left: '64%', top: '24%', dur: '9s', delay: '-1.2s', drift: '-6px' },
  { left: '39%', top: '42%', dur: '7.8s', delay: '-5.8s', drift: '8px' },
]

// 촛농 윗면 빛 호흡 — SVG 요소는 자기 박스 기준으로 스케일해야 제자리에서 숨 쉰다
const SVG_BREATH: CSSProperties = { transformBox: 'fill-box', transformOrigin: 'center', animationDelay: '-1.5s' }

const CandleHero = ({ haloTint }: CandleHeroProps) => {
  return (
    <div className="relative w-56 h-56" aria-hidden="true">
      {/* 무드 틴트 외곽 할로 — 크게, 아주 옅게 */}
      <div
        className="absolute -inset-8 rounded-full pointer-events-none animate-candle-halo"
        style={{ background: `radial-gradient(circle at 50% 46%, ${haloTint}2e 0%, transparent 62%)` }}
      />
      {/* 불꽃 중심의 따뜻한 빛 번짐
          — candle-halo 키프레임이 transform을 덮어쓰므로 가운데 정렬은 translate 대신 inset-x-0 mx-auto로 */}
      <div
        className="absolute inset-x-0 mx-auto top-[14px] w-52 h-52 rounded-full pointer-events-none animate-candle-halo"
        style={{
          background:
            'radial-gradient(circle, rgba(255,196,120,0.34) 0%, rgba(251,146,60,0.14) 34%, rgba(251,146,60,0.04) 56%, transparent 70%)',
          animationDelay: '-2.5s',
        }}
      />
      {/* 바닥에 비친 불빛 — 유리컵 밑면(컨테이너 바닥에서 약 19px)에 중심을 맞춘다 */}
      <div
        className="absolute inset-x-0 mx-auto bottom-[7px] w-44 h-6 rounded-[50%] pointer-events-none animate-candle-halo"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,190,120,0.26) 0%, rgba(255,160,90,0.09) 45%, transparent 72%)',
          animationDelay: '-1s',
        }}
      />

      {/* 떠오르는 빛 입자 */}
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-amber-200/80 blur-[1px] animate-mote-rise"
          style={
            {
              left: m.left,
              top: m.top,
              animationDelay: m.delay,
              '--mote-dur': m.dur,
              '--mote-drift': m.drift,
            } as CSSProperties
          }
        />
      ))}

      {/* 유리컵 + 초 몸통 */}
      <svg
        className="absolute left-1/2 bottom-[10px] -translate-x-1/2 overflow-visible"
        width="104"
        height="112"
        viewBox="0 0 104 112"
      >
        <defs>
          {/* 초 몸통: 불빛 받은 윗부분은 밝은 크림, 아래로 갈수록 그늘 */}
          <linearGradient id="candle-wax-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff4e2" />
            <stop offset="35%" stopColor="#f6e2c8" />
            <stop offset="100%" stopColor="#b9936f" />
          </linearGradient>
          {/* 원통 음영: 좌우 가장자리가 어둡다 */}
          <linearGradient id="candle-wax-h" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4a2c14" stopOpacity="0.42" />
            <stop offset="28%" stopColor="#4a2c14" stopOpacity="0" />
            <stop offset="70%" stopColor="#4a2c14" stopOpacity="0" />
            <stop offset="100%" stopColor="#4a2c14" stopOpacity="0.48" />
          </linearGradient>
          <radialGradient id="candle-wax-top" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffaf0" />
            <stop offset="60%" stopColor="#fbe7c9" />
            <stop offset="100%" stopColor="#e9cba5" />
          </radialGradient>
          {/* 불꽃 아래 촛농이 속에서 빛나는 느낌 */}
          <radialGradient id="candle-wax-glow" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#ffc47a" stopOpacity="0.6" />
            <stop offset="55%" stopColor="#ffb060" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffb060" stopOpacity="0" />
          </radialGradient>
          {/* 유리: 두께가 겹치는 좌우 가장자리가 더 뿌옇다 */}
          <linearGradient id="candle-glass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.24" />
            <stop offset="10%" stopColor="#ffffff" stopOpacity="0.07" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.02" />
            <stop offset="90%" stopColor="#ffffff" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="candle-glass-streak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="candle-glass-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe2bd" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* 유리컵 뒤쪽 테두리 — 몸통보다 먼저 그려 뒤에 깔린다 */}
        <path d="M6 10 A46 7 0 0 0 98 10" fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1" />

        {/* 유리 두꺼운 바닥 — 초 밑면 곡선 아래를 채우도록 몸통보다 먼저 깔고, 초가 윗부분을 덮는다.
            불빛이 유리 바닥을 통과해 몸통보다 살짝 따뜻하게 밝다 */}
        <path d="M6 84 L6 96 A46 7 0 0 0 98 96 L98 84 Z" fill="url(#candle-glass-base)" />
        <ellipse cx="52" cy="96" rx="30" ry="3" fill="#ffd9a8" opacity="0.18" />

        {/* 초 몸통 */}
        <path d="M11 28 L11 86 A41 6 0 0 0 93 86 L93 28 A41 6 0 0 1 11 28 Z" fill="url(#candle-wax-v)" />
        <path d="M11 28 L11 86 A41 6 0 0 0 93 86 L93 28 A41 6 0 0 1 11 28 Z" fill="url(#candle-wax-h)" />
        {/* 촛농 윗면 + 속빛 */}
        <ellipse cx="52" cy="28" rx="41" ry="6" fill="url(#candle-wax-top)" />
        <ellipse cx="52" cy="36" rx="36" ry="20" fill="url(#candle-wax-glow)" className="animate-candle-halo" style={SVG_BREATH} />

        {/* 심지 */}
        <path d="M52 29 Q51.6 25 52.6 20.5" fill="none" stroke="#3a2a1e" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="52.6" cy="20.8" r="1.1" fill="#ff9a4a" />

        {/* 초가 유리 바닥에 닿는 면 — 초 밑면과 같은 타원이라 틈 없이 붙는다 */}
        <path d="M11 86.5 A41 6 0 0 0 93 86.5" fill="none" stroke="#fff1dc" strokeOpacity="0.38" strokeWidth="1" />

        {/* 유리컵 몸통 */}
        <path d="M6 10 L6 96 A46 7 0 0 0 98 96 L98 10 A46 7 0 0 1 6 10 Z" fill="url(#candle-glass)" />
        <line x1="6" y1="10" x2="6" y2="96" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1" />
        <line x1="98" y1="10" x2="98" y2="96" stroke="#ffffff" strokeOpacity="0.26" strokeWidth="1" />
        <path d="M6 96 A46 7 0 0 0 98 96" fill="none" stroke="#ffffff" strokeOpacity="0.34" strokeWidth="1" />

        {/* 세로 반사광 */}
        <rect x="11" y="15" width="3.5" height="70" rx="1.75" fill="url(#candle-glass-streak)" />
        <rect x="17.5" y="18" width="1" height="50" rx="0.5" fill="url(#candle-glass-streak)" opacity="0.6" />
        <rect x="89" y="17" width="2" height="60" rx="1" fill="url(#candle-glass-streak)" opacity="0.45" />

        {/* 앞쪽 테두리 — 유리 두께만큼 두 줄, 불빛이 비친 하이라이트 */}
        <path d="M6 10 A46 7 0 0 1 98 10" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.2" />
        <path d="M9 11 A43 6 0 0 0 95 11" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />
        <ellipse cx="52" cy="17" rx="12" ry="1.6" fill="#ffd9a8" opacity="0.35" />
      </svg>

      {/* 불꽃 — 겉불꽃 + 속불꽃이 서로 다른 리듬으로 흔들린다. 밑동은 심지 끝(유리컵 속)에 붙는다 */}
      <div className="absolute left-1/2 bottom-[99px] -translate-x-1/2 w-[22px] h-[58px]">
        <svg className="absolute bottom-0 left-1/2 candle-flame-outer" width="22" height="58" viewBox="0 0 22 58">
          <defs>
            <radialGradient id="candle-flame-fill" cx="50%" cy="74%" r="62%">
              <stop offset="0%" stopColor="#fffdf4" />
              <stop offset="32%" stopColor="#fff0bf" />
              <stop offset="62%" stopColor="#ffc15a" />
              <stop offset="88%" stopColor="#ff8a3d" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ff7a2e" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="candle-flame-blue" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6b8dff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#6b8dff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M11 0 C12.6 13 22 28 22 41 C22 51 17 58 11 58 C5 58 0 51 0 41 C0 28 9.4 13 11 0 Z" fill="url(#candle-flame-fill)" />
          {/* 밑동의 푸른 불꽃 */}
          <ellipse cx="11" cy="52" rx="6" ry="5" fill="url(#candle-flame-blue)" />
        </svg>
        <svg className="absolute bottom-[5px] left-1/2 candle-flame-core" width="10" height="28" viewBox="0 0 10 28">
          <path d="M5 0 C6 7 10 14 10 20 C10 24.5 7.8 28 5 28 C2.2 28 0 24.5 0 20 C0 14 4 7 5 0 Z" fill="#fffef8" />
        </svg>
      </div>
    </div>
  )
}

export default CandleHero
