// 두 사람의 발자국이 한 길에 번갈아 찍히고, 목표에 닿으면 길 끝 등불이 켜진다.
// 사람별 숫자는 보이지 않게 — 색만 섞여 차오른다(누가 더 했는지 비교하지 않도록).
import type { CompanionWeek } from '../../types/companion'
import './companion.css'

const W = 340
const X0 = 18
const X1 = 290
const MID = 50
const AMP = 15

const pathY = (x: number) => MID + AMP * Math.sin(((x - X0) / (X1 - X0)) * Math.PI * 2)
const pathSlope = (x: number) =>
  AMP * Math.cos(((x - X0) / (X1 - X0)) * Math.PI * 2) * ((Math.PI * 2) / (X1 - X0))

/** 발자국 칸 수 — 목표가 작으면 목표만큼, 크면 14칸으로 줄여 그린다 */
const stepCount = (goal: number) => Math.max(4, Math.min(14, goal))

/** 채워진 칸마다 누구 발자국인지 — 내 몫을 고르게 흩어 번갈아 걷는 것처럼 */
const stepOwners = (week: Pick<CompanionWeek, 'goal_amount' | 'total' | 'mine'>): ('me' | 'you')[] => {
  const steps = stepCount(week.goal_amount)
  const filled = week.total <= 0 ? 0 : Math.max(1, Math.floor((Math.min(week.total, week.goal_amount) / week.goal_amount) * steps))
  const mineSteps = week.total > 0 ? Math.round((filled * week.mine) / week.total) : 0
  return Array.from({ length: filled }, (_, i) =>
    Math.floor(((i + 1) * mineSteps) / filled) > Math.floor((i * mineSteps) / filled) ? 'me' : 'you',
  )
}

const FootprintPath = ({ week, className }: { week: CompanionWeek; className?: string }) => {
  const steps = stepCount(week.goal_amount)
  const owners = stepOwners(week)
  const guide = Array.from({ length: 41 }, (_, i) => {
    const x = X0 + ((X1 - X0) * i) / 40
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${pathY(x).toFixed(1)}`
  }).join(' ')

  return (
    <svg
      viewBox={`0 0 ${W} 100`}
      className={`cp-path${week.achieved ? ' is-lit' : ''} ${className ?? ''}`}
      role="img"
      aria-label={`이번 주 ${steps}걸음 중 ${owners.length}걸음${week.achieved ? ', 등불이 켜졌어요' : ''}`}
    >
      <path d={guide} className="cp-guide" />
      {Array.from({ length: steps }, (_, i) => {
        const x = X0 + ((X1 - X0) * (i + 0.5)) / steps
        const angle = Math.atan2(pathSlope(x), 1)
        // 왼발·오른발을 길 양옆으로 번갈아
        const side = i % 2 === 0 ? -6 : 6
        const fx = x - Math.sin(angle) * side
        const fy = pathY(x) + Math.cos(angle) * side
        const deg = (angle * 180) / Math.PI + 90
        const owner = owners[i]
        return (
          <g
            key={i}
            transform={`translate(${fx.toFixed(1)} ${fy.toFixed(1)}) rotate(${deg.toFixed(1)})`}
            className={owner ? `cp-foot is-${owner}` : 'cp-foot is-empty'}
            style={owner ? { animationDelay: `${i * 45}ms` } : undefined}
          >
            <ellipse cx="0" cy="-1.6" rx="3.3" ry="4.6" />
            <ellipse cx="0" cy="5.4" rx="2.4" ry="2.2" />
          </g>
        )
      })}
      {/* 길 끝 등불 */}
      <g className="cp-lantern" transform={`translate(316 ${MID - 4})`}>
        <circle className="cp-glow" cx="0" cy="4" r="17" />
        <path className="cp-lantern-line" d="M0 -16v4M-5 -12h10" />
        <rect className="cp-lantern-body" x="-7" y="-12" width="14" height="19" rx="4" />
        <path className="cp-flame" d="M0 -6c2 2.4 3 3.8 3 5.6a3 3 0 0 1-6 0c0-1.8 1-3.2 3-5.6Z" />
        <path className="cp-lantern-line" d="M-5 7h10" />
      </g>
    </svg>
  )
}

export default FootprintPath
