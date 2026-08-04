import type { CSSProperties } from 'react'

// 설정 화면의 정서적 앵커 — 살아있는 촛불.
// 불꽃/심지/몸통은 순수 CSS, 할로만 시간대 무드 색으로 틴트된다.
// 불꽃 자체는 시간대와 무관하게 항상 따뜻한 색을 유지한다(촛불의 물리적 사실감).

interface CandleHeroProps {
  /** 외곽 할로 틴트 색 (mood.ringFrom hex) */
  haloTint: string
}

// 불꽃 주위로 떠오르는 빛 입자 — 위치/주기/드리프트를 서로 어긋나게
const MOTES = [
  { left: '30%', top: '26%', dur: '6.5s', delay: '0s', drift: '10px' },
  { left: '62%', top: '34%', dur: '8s', delay: '-2.4s', drift: '-12px' },
  { left: '44%', top: '18%', dur: '7.2s', delay: '-4.6s', drift: '5px' },
  { left: '68%', top: '20%', dur: '9s', delay: '-1.2s', drift: '-6px' },
  { left: '36%', top: '40%', dur: '7.8s', delay: '-5.8s', drift: '8px' },
]

const CandleHero = ({ haloTint }: CandleHeroProps) => {
  return (
    <div className="relative flex flex-col items-center w-44 h-44 justify-end pb-2" aria-hidden="true">
      {/* 무드 틴트 외곽 할로 — 크게, 아주 옅게 */}
      <div
        className="absolute -inset-8 rounded-full pointer-events-none animate-candle-halo"
        style={{ background: `radial-gradient(circle, ${haloTint}2e 0%, transparent 62%)` }}
      />
      {/* 불꽃 주변 따뜻한 속 빛 */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full pointer-events-none animate-candle-halo"
        style={{
          background:
            'radial-gradient(circle, rgba(251,191,36,0.30) 0%, rgba(251,146,60,0.12) 45%, transparent 70%)',
          animationDelay: '-2.5s',
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

      {/* 불꽃 — 겉불꽃 + 속불꽃이 서로 다른 리듬으로 흔들린다 */}
      <div className="relative w-6 h-12 -mb-0.5">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-11 candle-flame-outer" />
        <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-2.5 h-6 candle-flame-core" />
      </div>

      {/* 심지 */}
      <div className="w-[2.5px] h-2 rounded-full bg-[#4a3524]" />

      {/* 초 몸통 — 반투명 유리 질감, 위쪽엔 불빛이 비친다 */}
      <div className="relative w-10 h-12 rounded-t-[7px] rounded-b-[10px] bg-gradient-to-b from-white/[0.20] via-white/[0.08] to-white/[0.03] border border-white/10 overflow-hidden">
        <div className="absolute -top-1 inset-x-0 h-4 bg-amber-300/25 blur-[6px]" />
        <div className="absolute top-1.5 left-1.5 w-[3px] h-6 rounded-full bg-white/20" />
      </div>
    </div>
  )
}

export default CandleHero
