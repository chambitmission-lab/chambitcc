// 절차적 SVG 신앙 나무 — growth(0..1)에 비례해 줄기·가지·잎·꽃·열매가 연속 성장.
// growth 값은 GrowingTree가 "단계 진행도"에 맞춰 매핑해서 넘겨준다(단계 서사와 시각 일치).
// 잎=자연 초록, 꽃=브랜드 purple→pink, 열매=사과 빨강.

import { useMemo, useState } from 'react'
import './TreeSVG.css'

type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

interface TreeSVGProps {
  growth: number // 0..1 연속 성장값
  timeOfDay: TimeOfDay
  seed?: number
}

// 결정적 난수 — 같은 seed면 항상 같은 나무 모양
function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Branch {
  x1: number; y1: number; x2: number; y2: number
  w: number; appearAt: number; depth: number
}
interface Leaf {
  x: number; y: number; r: number; appearAt: number; tone: number
}
interface Decoration {
  x: number; y: number; appearAt: number; size: number
}

interface TreeShape {
  branches: Branch[]
  leaves: Leaf[]
  blossoms: Decoration[]
  fruits: Decoration[]
}

const MAX_DEPTH = 5
const APPEAR_STEP = 0.08 // 가지 깊이별 등장 간격
const TRUNK_BASE_Y = 12 // 줄기 밑동을 흙 속까지 내려 "심어진" 느낌

function buildTree(seed: number): TreeShape {
  const rnd = mulberry32(seed)
  const branches: Branch[] = []
  const leaves: Leaf[] = []
  const blossoms: Decoration[] = []
  const fruits: Decoration[] = []

  const grow = (
    x: number, y: number, angle: number,
    len: number, w: number, depth: number, appearAt: number,
  ) => {
    const x2 = x + Math.cos(angle) * len
    const y2 = y + Math.sin(angle) * len
    branches.push({ x1: x, y1: y, x2, y2, w, appearAt, depth })

    const isTip = depth >= MAX_DEPTH || len < 16
    if (isTip) {
      // 가지 끝 잎 뭉치
      const cluster = 5 + Math.floor(rnd() * 3)
      for (let i = 0; i < cluster; i++) {
        leaves.push({
          x: x2 + (rnd() - 0.5) * 34,
          y: y2 + (rnd() - 0.5) * 34,
          r: 11 + rnd() * 8,
          appearAt: Math.min(0.5, appearAt + 0.03 + rnd() * 0.08),
          tone: Math.floor(rnd() * 4),
        })
      }
      if (rnd() < 0.6) {
        blossoms.push({
          x: x2 + (rnd() - 0.5) * 24, y: y2 + (rnd() - 0.5) * 24,
          appearAt: 0.5 + rnd() * 0.16, size: 5 + rnd() * 3,
        })
      }
      if (rnd() < 0.42) {
        fruits.push({
          x: x2 + (rnd() - 0.5) * 20, y: y2 + (rnd() - 0.5) * 20,
          appearAt: 0.68 + rnd() * 0.16, size: 6 + rnd() * 2,
        })
      }
      return
    }

    // 중간 가지에도 잎을 달아 낮은 단계부터 초록이 보이게
    if (depth >= 2) {
      leaves.push({
        x: x2 + (rnd() - 0.5) * 18, y: y2 + (rnd() - 0.5) * 18,
        r: 9 + rnd() * 5, appearAt: Math.min(0.48, appearAt + 0.04),
        tone: Math.floor(rnd() * 4),
      })
    }

    const children = depth === 0 ? 1 : 2 + (rnd() < 0.25 ? 1 : 0)
    const childAppear = appearAt + APPEAR_STEP
    for (let i = 0; i < children; i++) {
      const spread = children === 1 ? 0 : -0.5 + i / (children - 1)
      const newAngle = angle + spread * 0.95 + (rnd() - 0.5) * 0.3
      const newLen = len * (0.72 + rnd() * 0.12)
      grow(x2, y2, newAngle, newLen, w * 0.68, depth + 1, childAppear)
    }
  }

  // 줄기: 흙 속(0, TRUNK_BASE_Y)에서 위로
  grow(0, TRUNK_BASE_Y, -Math.PI / 2, 92, 22, 0, 0)

  // 떡잎 — 새싹 단계에서 바로 초록이 보이도록 아주 일찍 등장
  leaves.push({ x: -12, y: -20, r: 10, appearAt: 0.03, tone: 0 })
  leaves.push({ x: 13, y: -28, r: 10, appearAt: 0.05, tone: 1 })

  return { branches, leaves, blossoms, fruits }
}

const LEAF_TONES = ['#4ade80', '#34d399', '#22c55e', '#16a34a']

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export const TreeSVG: React.FC<TreeSVGProps> = ({ growth, timeOfDay, seed = 7 }) => {
  const shape = useMemo(() => buildTree(seed), [seed])
  const [rustle, setRustle] = useState(false)

  const reveal = (appearAt: number, window: number) =>
    clamp01((growth - appearAt) / window)

  const dim = timeOfDay === 'night' ? 0.62 : timeOfDay === 'dusk' ? 0.82 : 1
  const isSeed = growth <= 0

  const handleTap = () => {
    setRustle(true)
    window.setTimeout(() => setRustle(false), 700)
  }

  return (
    <svg
      className={`tree-svg${rustle ? ' rustle' : ''}`}
      viewBox="-180 -300 360 330"
      preserveAspectRatio="xMidYMax meet"
      onClick={handleTap}
      role="img"
      aria-label="나의 신앙 나무"
    >
      <defs>
        <linearGradient id="trunk-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a9744f" />
          <stop offset="45%" stopColor="#8b5e3c" />
          <stop offset="100%" stopColor="#5e3d24" />
        </linearGradient>
        <radialGradient id="blossom-grad" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#f9a8d4" />
          <stop offset="55%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#a855f7" />
        </radialGradient>
        <radialGradient id="fruit-grad" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </radialGradient>
        <radialGradient id="life-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(217,140,255,0.55)" />
          <stop offset="55%" stopColor="rgba(168,85,247,0.18)" />
          <stop offset="100%" stopColor="rgba(168,85,247,0)" />
        </radialGradient>
        <radialGradient id="mound-grad" cx="50%" cy="18%" r="85%">
          <stop offset="0%" stopColor="#65a30d" />
          <stop offset="100%" stopColor="#3f6212" />
        </radialGradient>
      </defs>

      {/* 생명의 나무 글로우 — 완성에 가까울수록 은은하게 (브랜드 보라) */}
      {growth > 0.9 && (
        <circle cx="0" cy="-150" r="190" fill="url(#life-glow)"
          opacity={(growth - 0.9) / 0.1} />
      )}

      {isSeed ? (
        // 씨앗 상태
        <g>
          <ellipse cx="0" cy="0" rx="14" ry="18" fill="#7c4a2d" />
          <ellipse cx="-4" cy="-6" rx="4" ry="6" fill="#9c6b45" opacity="0.7" />
        </g>
      ) : (
        <g
          className="tree-svg-canopy"
          style={{ filter: `brightness(${dim}) saturate(${dim < 1 ? 0.85 : 1})` }}
        >
          {/* 밑동 뿌리 플레어 — 땅에 심어진 느낌 */}
          <path d={`M -20 ${TRUNK_BASE_Y} Q -34 ${TRUNK_BASE_Y - 2} -40 ${TRUNK_BASE_Y + 6}
                    Q -24 ${TRUNK_BASE_Y + 2} 0 ${TRUNK_BASE_Y}
                    Q 24 ${TRUNK_BASE_Y + 2} 40 ${TRUNK_BASE_Y + 6}
                    Q 34 ${TRUNK_BASE_Y - 2} 20 ${TRUNK_BASE_Y} Z`}
            fill="#5e3d24" opacity={reveal(0, 0.1)} />

          {/* 가지 */}
          {shape.branches.map((b, i) => {
            const r = reveal(b.appearAt, APPEAR_STEP)
            if (r <= 0) return null
            const ex = b.x1 + (b.x2 - b.x1) * r
            const ey = b.y1 + (b.y2 - b.y1) * r
            return (
              <line key={`b${i}`}
                x1={b.x1} y1={b.y1} x2={ex} y2={ey}
                stroke={b.depth < 2 ? 'url(#trunk-grad)' : '#7a5536'}
                strokeWidth={b.w * (0.55 + 0.45 * r)}
                strokeLinecap="round" />
            )
          })}

          {/* 잎 */}
          {shape.leaves.map((l, i) => {
            const r = reveal(l.appearAt, 0.1)
            if (r <= 0) return null
            return (
              <circle key={`l${i}`}
                cx={l.x} cy={l.y} r={l.r * r}
                fill={LEAF_TONES[l.tone]} opacity="0.92" />
            )
          })}

          {/* 꽃 (브랜드 그라데이션) */}
          {shape.blossoms.map((p, i) => {
            const r = reveal(p.appearAt, 0.1)
            if (r <= 0) return null
            return (
              <g key={`p${i}`} transform={`translate(${p.x} ${p.y}) scale(${r})`}>
                <circle r={p.size} fill="url(#blossom-grad)" />
                <circle r={p.size * 0.32} fill="#fff7fb" opacity="0.9" />
              </g>
            )
          })}

          {/* 열매 */}
          {shape.fruits.map((f, i) => {
            const r = reveal(f.appearAt, 0.1)
            if (r <= 0) return null
            return (
              <g key={`f${i}`} transform={`translate(${f.x} ${f.y}) scale(${r})`}>
                <circle r={f.size} fill="url(#fruit-grad)" />
                <ellipse cx={-f.size * 0.3} cy={-f.size * 0.35}
                  rx={f.size * 0.28} ry={f.size * 0.2}
                  fill="#fff" opacity="0.55" />
              </g>
            )
          })}
        </g>
      )}

      {/* 흙 바닥 — 카드 폭 전체로 깔아 "떠 있는 접시" 대신 단단히 심어진 지면.
          rx가 viewBox 절반(180)을 넘어 양 끝까지 바닥이 닿게 한다(overflow visible). */}
      <ellipse cx="0" cy={TRUNK_BASE_Y + 18} rx="240" ry="30" fill="url(#mound-grad)" />
      <ellipse cx="0" cy={TRUNK_BASE_Y + 6} rx="150" ry="16" fill="#4d7c0f" opacity="0.85" />

      {/* 바닥 풀 */}
      <g opacity="0.9">
        {[-96, -68, -40, 40, 70, 98].map((gx, i) => (
          <path key={i}
            d={`M ${gx} ${TRUNK_BASE_Y + 4} q ${i % 2 ? 5 : -5} -15 ${i % 2 ? 1 : -1} -21`}
            stroke="#65a30d" strokeWidth="3" fill="none" strokeLinecap="round" />
        ))}
      </g>
    </svg>
  )
}
