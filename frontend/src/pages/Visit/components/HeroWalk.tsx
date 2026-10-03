import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { StoreIcon, SubwayIcon } from '../icons'

/**
 * 히어로 걷는 길(PC 만) — 길찾기 버튼 옆 역에서 내려와 바닥을 따라 골목을 지나 1층 입구로 옆에서 들어간다.
 * 점선 대신 발자국: 왼발·오른발이 길 양옆으로 번갈아 찍히고, 진입 때 역부터 한 걸음씩 나타난 뒤 멈춘다.
 *
 * 좌표는 무대 %(글씨 크기로 무대 비율이 달라져도 칩의 % 와 어긋나지 않게). 발자국 간격·방향은 실제 px 로 계산해야
 * 늘어나지 않으므로 무대 크기를 재서 곡선을 px 로 펼친 뒤 일정 보폭으로 찍는다.
 * 역(19,64) · 골목(42,88) · 시간(58.8,90.6) · 입구(71.5,94) — desktop.css 의 % 와 짝.
 */
type Pt = readonly [number, number]
const WALK_SEGMENTS: readonly (readonly [Pt, Pt, Pt, Pt])[] = [
  [[19, 64], [27, 64], [31, 88], [42, 88]],
  [[42, 88], [55, 88], [64, 93], [71.5, 94]],
]

const STRIDE = 34        // 한 걸음(px)
const SIDE = 6           // 길 중심에서 발까지(px)
const SKIP_START = 26    // 역 배지 아래는 비운다
const SKIP_END = 20      // 도착 점 바로 앞에서 멈춘다
const DRAW_DELAY = 0.3   // s — 칩 등장 순서(desktop.css)와 맞춘 시작·길이
const DRAW_DURATION = 1.6

const bezier = ([p0, p1, p2, p3]: readonly [Pt, Pt, Pt, Pt], t: number, w: number, h: number) => {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return [
    ((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0]) * w) / 100,
    ((a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]) * h) / 100,
  ] as const
}

type Step = { x: number; y: number; angle: number; left: boolean; delay: number }

const layoutSteps = (w: number, h: number): Step[] => {
  if (!w || !h) return []
  // 곡선을 잘게 펼쳐 누적 길이를 잰다
  const pts: (readonly [number, number])[] = []
  for (const seg of WALK_SEGMENTS) {
    for (let i = pts.length ? 1 : 0; i <= 120; i++) pts.push(bezier(seg, i / 120, w, h))
  }
  const acc = [0]
  for (let i = 1; i < pts.length; i++) {
    acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  }
  const total = acc[acc.length - 1]

  const steps: Step[] = []
  let j = 1
  for (let s = SKIP_START, n = 0; s <= total - SKIP_END; s += STRIDE, n++) {
    while (j < acc.length - 1 && acc[j] < s) j++
    const [x0, y0] = pts[j - 1]
    const [x1, y1] = pts[j]
    const k = (s - acc[j - 1]) / (acc[j] - acc[j - 1] || 1)
    const dx = x1 - x0
    const dy = y1 - y0
    const len = Math.hypot(dx, dy) || 1
    const left = n % 2 === 0
    // 진행 방향의 왼쪽 법선 = (dy, -dx)
    const off = left ? SIDE : -SIDE
    steps.push({
      x: ((x0 + dx * k + (dy / len) * off) / w) * 100,
      y: ((y0 + dy * k - (dx / len) * off) / h) * 100,
      angle: (Math.atan2(dy, dx) * 180) / Math.PI + 90, // 발자국 그림은 위쪽(발끝)을 향한다
      left,
      delay: DRAW_DELAY + (s / total) * DRAW_DURATION,
    })
  }
  return steps
}

/** 성경 시대 가죽 샌들 자국 — 발 모양 납작 밑창(옅게 채움+테두리) + 큰 발가락 고리 + 발등을 X 자로 엮은 끈 2단 + 뒤꿈치 끈.
 *  오른발 기준(큰 발가락 고리가 왼쪽), 왼발은 좌우 반전.
 *  타원 두 개("콩 같다") → 맨발 → 운동화 → "예수님 시절 샌들" 요청으로 이 모양. 조리(엄지 끈 V자)는 현대 슬리퍼로 읽혀 뺐다 */
const SOLE =
  'M9.5 1.2C13.8 1.2 16.8 4 17.2 8.5 17.6 12.5 16.4 16 15.8 19.5 15.2 23 16 27 15.8 31 15.6 35.5 13.2 38.6 10 38.6 6.8 38.6 4.6 35.8 4.6 31.5 4.6 27.5 5.6 24.5 5.2 21 4.8 17.5 2.6 14 2.8 9.2 3 4.4 5.6 1.2 9.5 1.2Z'
const STRAPS = 'M3.4 12.6L16.3 20.4M16.8 12.6L5.5 20.4M5.5 21.6L15.6 28.4M15.6 21.6L5 28.4M5 32L15.6 32'

const Footprint = () => (
  <svg viewBox="2 0 17 39.6" width="12" height="28">
    <path d={SOLE} fill="currentColor" fillOpacity="0.3" />
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <path d={SOLE} strokeWidth="1.1" />
      <ellipse cx="6.6" cy="5.6" rx="1.9" ry="2.3" strokeWidth="1.1" />
      <path d={STRAPS} strokeWidth="1.25" />
    </g>
  </svg>
)

type HeroWalkProps = {
  station?: string
  line?: string
  alley?: string
  time?: string
}

const HeroWalk = ({ station, line, alley, time }: HeroWalkProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  // 모바일에선 display:none 이라 0 → 발자국을 만들지 않는다
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((prev) =>
        Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1 ? prev : { w: width, h: height },
      )
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const steps = useMemo(() => layoutSteps(size.w, size.h), [size.w, size.h])

  return (
    <div ref={ref} className="visit-hero-walk" aria-hidden="true">
      {steps.map((s, i) => (
        <span
          key={i}
          className={`visit-hero-walk-step${s.left ? ' is-left' : ''}`}
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              '--step-angle': `${s.angle}deg`,
              animationDelay: `${s.delay}s`,
            } as CSSProperties
          }
        >
          <Footprint />
        </span>
      ))}
      {station && (
        <span className="visit-hero-walk-station">
          <span className="visit-hero-walk-line">{line ?? <SubwayIcon size={12} strokeWidth={2.4} />}</span>
          <span className="visit-hero-walk-label">{station}</span>
        </span>
      )}
      {alley && (
        <span className="visit-hero-walk-stop">
          <span className="visit-hero-walk-label">{alley}</span>
          <span className="visit-hero-walk-stop-dot">
            <StoreIcon size={13} strokeWidth={2.2} />
          </span>
        </span>
      )}
      {time && (
        <span className="visit-hero-walk-time">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13" cy="4" r="2" />
            <path d="M9 21l2.5-6.5L14 17v4" />
            <path d="M7 12l3-4.5 4 1.5 2.5 3.5" />
            <path d="M11.5 14.5L10 8" />
          </svg>
          {time}
        </span>
      )}
      <span className="visit-hero-walk-goal" />
    </div>
  )
}

export default HeroWalk
