// 두 사람의 발자국이 한 길에 번갈아 찍히고, 목표에 닿으면 길 끝 등불이 켜진다.
// 사람별 숫자는 보이지 않게 — 색만 섞여 차오른다(누가 더 했는지 비교하지 않도록).
import type { CompanionWeek } from '../../types/companion'
import { CandleSvg } from '../../components/icons/MiniCandle'
import './companion.css'

const W = 340
const X0 = 18
const X1 = 290
const MID = 50
const AMP = 15
// 길 끝 촛불 크기(viewBox 단위) — 예전 등불(높이 약 23)보다 살짝 크게
const CANDLE_H = 32
const CANDLE_W = (CANDLE_H * 14) / 26

const pathY = (x: number) => MID + AMP * Math.sin(((x - X0) / (X1 - X0)) * Math.PI * 2)
const pathSlope = (x: number) =>
  AMP * Math.cos(((x - X0) / (X1 - X0)) * Math.PI * 2) * ((Math.PI * 2) / (X1 - X0))

/** 발자국 칸 수 — 목표가 작으면 목표만큼, 크면 14칸으로 줄여 그린다 */
const stepCount = (goal: number) => Math.max(4, Math.min(14, goal))

/** 채워진 칸마다 누구 발자국인지 — 내 몫을 고르게 흩어 번갈아 걷는 것처럼.
 *  칸은 올림으로 채운다(20절 목표에 2절이면 14칸 중 1.4칸 → 2칸). 둘 다 걸었으면
 *  각자 발자국이 최소 하나는 보이게 — 적게 한 쪽이 길에서 사라지지 않도록. */
const stepOwners = (week: Pick<CompanionWeek, 'goal_amount' | 'total' | 'mine' | 'partner'>): ('me' | 'you')[] => {
  const steps = stepCount(week.goal_amount)
  if (week.total <= 0) return []
  const filled = Math.min(steps, Math.ceil((Math.min(week.total, week.goal_amount) / week.goal_amount) * steps))
  let mineSteps = Math.round((filled * week.mine) / week.total)
  if (week.mine > 0 && week.partner > 0 && filled >= 2) {
    mineSteps = Math.min(filled - 1, Math.max(1, mineSteps))
  }
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

  // display 는 바깥 div 가 맡는다 — .cp-path{display:block} 이 Tailwind hidden/lg:hidden 을 덮어쓰지 않게
  return (
    <div className={className}>
    <svg
      viewBox={`0 0 ${W} 100`}
      className={`cp-path${week.achieved ? ' is-lit' : ''}`}
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
      {/* 길 끝 촛불 — 목표를 채우기 전엔 심지만 있는 초, 채운 주엔 화면을 열 때 불꽃이 피어난다.
          기도 버튼과 같은 촛불(MiniCandle) — 길 높이에 맞춰 등불 자리(x 316)에 세운다 */}
      <CandleSvg size={CANDLE_H} lit={week.achieved} ignite={week.achieved} x={316 - CANDLE_W / 2} y={MID + 9 - CANDLE_H} />
    </svg>
    </div>
  )
}

export default FootprintPath
