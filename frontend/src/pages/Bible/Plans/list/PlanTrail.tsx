// 말씀 오솔길 — 플랜이 지나는 성경 구간을 굽은 길로 그리고 내 위치에 깃발을 세운다.
// 넓은 칸(PC)은 가로 물결(이름표는 번갈아 위·아래, 내 위치는 말풍선),
// 좁은 칸(모바일)은 왼쪽에서 살짝 굽이치며 내려가는 길 + 오른쪽에 이름표가 늘어서는 타임라인.
// 길 모양은 수식으로 샘플링한 꺾은선이라 DOM 측정(getPointAtLength) 없이 위치를 계산한다.
// 폭만 ResizeObserver 로 재서 viewBox 를 실제 px 와 1:1 로 맞춘다 — 글씨가 늘어나지 않는다.

import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { StopState, TrailStop } from './planJourney'

const WIDE_MIN = 520
const SAMPLES = 160
// 좁은 길 — 정거장 한 칸의 세로 간격과 굽이 폭
const ROW = 46
const NARROW_X = 40
const NARROW_AMP = 18

type Pt = { x: number; y: number }

const buildPath = (w: number, wide: boolean, n: number) => {
  // 좁은 길은 정거장 수(+완주 깃발)만큼 세로로 늘어난다
  const h = wide ? 196 : 28 + n * ROW + 26
  const pts: Pt[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES
    if (wide) {
      // 왼쪽 아래에서 출발해 물결 1.5번 — 끝은 오른쪽 위(완주 깃발)
      const pad = 36
      pts.push({ x: pad + t * (w - pad * 2), y: h / 2 + 8 + 48 * Math.cos(t * Math.PI * 3) })
    } else {
      pts.push({ x: NARROW_X + NARROW_AMP * Math.sin(t * Math.PI * n * 0.5), y: 22 + t * (h - 22 - 26) })
    }
  }
  const lens = [0]
  for (let i = 1; i < pts.length; i++) {
    lens.push(lens[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
  }
  const total = lens[lens.length - 1]
  const at = (f: number): Pt => {
    const target = Math.min(1, Math.max(0, f)) * total
    let i = 1
    while (i < lens.length - 1 && lens[i] < target) i++
    const seg = lens[i] - lens[i - 1] || 1
    const k = (target - lens[i - 1]) / seg
    return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k }
  }
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('')
  return { d, h, total, at }
}

// 한글 굵은 글씨 대략 폭 — 말풍선·이름표 자리 계산용
const textWidth = (s: string, px: number) => s.length * px * 0.98

const FlagGlyph = ({ x, y, className }: { x: number; y: number; className: string }) => (
  <path d={`M${x} ${y + 6}V${y - 6}h7.5l-1.6 2.6 1.6 2.6H${x}`} className={className} />
)

const PlanTrail = ({
  stops,
  states,
  position,
  meLabel,
}: {
  stops: TrailStop[]
  states: StopState[]
  position: number
  meLabel: string
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  const gid = `pt-g${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const n = stops.length

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => setW(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const wide = w >= WIDE_MIN
  const geo = useMemo(() => (w > 0 ? buildPath(w, wide, n) : null), [w, wide, n])

  // 폭을 재기 전에도 자리를 잡아 둔다 — 늦게 그려지며 아래 카드가 밀리지 않게
  if (!geo) return <div ref={ref} className="pt-box" style={{ height: 196 }} aria-hidden />

  const me = geo.at(position)
  const end = geo.at(1)
  const stopPts = stops.map((_, i) => geo.at(i / n))
  const labelPx = wide ? 12.5 : 13

  // 내 위치 표시 — 넓은 길: 점 위 말풍선(자리가 없으면 아래). 좁은 길: 점 오른쪽 알약,
  // 바로 옆 정거장 이름표와 같은 줄이면 그 이름표 뒤로 민다
  const meW = textWidth(meLabel, 11.5) + 32
  let meX: number
  let meY: number
  let tip: string | null = null
  if (wide) {
    meX = Math.min(w - meW - 2, Math.max(2, me.x - meW / 2))
    const above = me.y - 46 >= 2
    meY = above ? me.y - 46 : me.y + 20
    const tx = Math.min(Math.max(me.x, meX + 12), meX + meW - 12)
    tip = above ? `M${tx - 5} ${meY + 25}l5 6 5-6z` : `M${tx - 5} ${meY + 1}l5-6 5 6z`
  } else {
    meX = me.x + 20
    meY = me.y - 13
    stops.forEach((stop, i) => {
      if (Math.abs(stopPts[i].y - me.y) < 27) {
        meX = Math.max(meX, stopPts[i].x + 22 + textWidth(stop.label, labelPx) + 10)
      }
    })
    meX = Math.min(meX, w - meW - 2)
  }

  return (
    <div ref={ref} className="pt-box">
      <svg
        viewBox={`0 0 ${w} ${geo.h}`}
        width={w}
        height={geo.h}
        className={`pt-svg${wide ? ' is-wide' : ''}`}
        role="img"
        aria-label={`말씀 오솔길 — 지금 ${meLabel}`}
      >
        <defs>
          <linearGradient id={gid} x1="0" x2={wide ? 1 : 0} y1="0" y2={wide ? 1 : 1}>
            <stop offset="0" className="pt-grad-a" />
            <stop offset="1" className="pt-grad-b" />
          </linearGradient>
        </defs>
        <path d={geo.d} className="pt-road" />
        <path d={geo.d} className="pt-dash" />
        <path
          d={geo.d}
          className="pt-done"
          stroke={`url(#${gid})`}
          strokeDasharray={`${geo.total * position} ${geo.total}`}
        />

        {stops.map((stop, i) => {
          const p = stopPts[i]
          const state = states[i]
          // 넓은 길 — 번갈아 위·아래(마지막 정거장은 아래: 위쪽은 완주 깃발·말풍선 자리). 좁은 길 — 늘 오른쪽
          const below = (n - 1 - i) % 2 === 0
          const lx = wide ? p.x : p.x + 22
          const ly = wide ? (below ? p.y + 29 : p.y - 20) : p.y + 4.5
          const lw = textWidth(stop.label, labelPx)
          return (
            <g key={`${stop.label}-${stop.startDay}`} className={`pt-stop is-${state}`}>
              <circle cx={p.x} cy={p.y} r={state === 'current' ? 12 : 11} className="pt-stop-dot" />
              {state === 'passed' && <path d={`M${p.x - 4.5} ${p.y + 0.5}l3 3 6-6.5`} className="pt-stop-check" />}
              {state === 'current' && <circle cx={p.x} cy={p.y} r={4.5} className="pt-stop-core" />}
              {wide && (
                <rect x={lx - lw / 2 - 4} y={ly - 13.5} width={lw + 8} height={19} rx={6} className="pt-label-bg" />
              )}
              <text x={lx} y={ly} textAnchor={wide ? 'middle' : 'start'} className="pt-label">
                {stop.label}
              </text>
            </g>
          )
        })}

        {/* 끝 — 완주 깃발 */}
        <g className={`pt-finish${position >= 1 ? ' is-done' : ''}`}>
          <circle cx={end.x} cy={end.y} r={13} className="pt-finish-dot" />
          <FlagGlyph x={end.x - 3.5} y={end.y} className="pt-finish-flag" />
          <text
            x={wide ? end.x : end.x + 22}
            y={wide ? end.y - 21 : end.y + 4.5}
            textAnchor={wide ? 'middle' : 'start'}
            className="pt-label pt-finish-label"
          >
            완주
          </text>
        </g>

        {/* 내 위치 — 길 위 점 + 통통 튀는 이름표 */}
        <circle cx={me.x} cy={me.y} r={8} className="pt-me-dot" />
        <g className="pt-me">
          <rect x={meX} y={meY} width={meW} height={26} rx={wide ? 9 : 13} className="pt-me-bubble" />
          {tip && <path d={tip} className="pt-me-bubble" />}
          <FlagGlyph x={meX + 11} y={meY + 13} className="pt-me-flag" />
          <text x={meX + 23} y={meY + 17} className="pt-me-text">
            {meLabel}
          </text>
        </g>
      </svg>
    </div>
  )
}

export default PlanTrail
