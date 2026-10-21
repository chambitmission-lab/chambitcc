// 두 사람의 이름 도장이 한 길에 번갈아 찍히고, 목표에 닿으면 길 끝 촛불이 켜진다.
// 사람별 숫자는 보이지 않게 — 색·글자만 섞여 차오른다(누가 더 했는지 비교하지 않도록).
// 도장은 우정 카드(friendshipCard)와 같은 음각 — 꽉 찬 인주에 이름 한 글자가 하얗게 빠진다.
import { useId } from 'react'
import type { CompanionWeek } from '../../types/companion'
import { CandleSvg } from '../../components/icons/MiniCandle'
import { stampChars } from './stampChars'
import './companion.css'

const W = 340
const X0 = 18
const X1 = 290
const MID = 50
const AMP = 15
// 길 끝 촛불 크기(viewBox 단위) — 예전 등불(높이 약 23)보다 살짝 크게
const CANDLE_H = 32
const CANDLE_W = (CANDLE_H * 14) / 26

// 도장 한 변(viewBox 단위)
const STAMP = 14
// 칸마다 살짝 다른 기울기(도) — 고정값이라 같은 칸은 늘 같은 각도로 찍힌다
const TILTS = [-6, 4, -2, 7, -5, 2, 6, -3, 5, -7, 1, -4, 3, -1]

const pathY = (x: number) => MID + AMP * Math.sin(((x - X0) / (X1 - X0)) * Math.PI * 2)
const pathSlope = (x: number) =>
  AMP * Math.cos(((x - X0) / (X1 - X0)) * Math.PI * 2) * ((Math.PI * 2) / (X1 - X0))

/** 도장 칸 수 — 목표가 작으면 목표만큼, 크면 14칸으로 줄여 그린다 */
const stepCount = (goal: number) => Math.max(4, Math.min(14, goal))

/** 채워진 칸마다 누구 도장인지 — 내 몫을 고르게 흩어 번갈아 걷는 것처럼.
 *  칸은 올림으로 채운다(20절 목표에 2절이면 14칸 중 1.4칸 → 2칸). 둘 다 걸었으면
 *  각자 도장이 최소 하나는 보이게 — 적게 한 쪽이 길에서 사라지지 않도록. */
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

interface FootprintPathProps {
  week: CompanionWeek
  myName: string
  partnerName: string
  className?: string
}

const FootprintPath = ({ week, myName, partnerName, className }: FootprintPathProps) => {
  const steps = stepCount(week.goal_amount)
  const owners = stepOwners(week)
  const [meChar, youChar] = stampChars(myName, partnerName)
  // 한 화면에 길이 여러 개(목록 카드·PC/모바일 이중 렌더)여도 mask·filter id 가 겹치지 않게
  const uid = useId().replace(/:/g, '')
  const maskId = (owner: 'me' | 'you') => `cp-stamp-${owner}-${uid}`
  const inkId = `cp-ink-${uid}`
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
      aria-label={`이번 주 ${steps}걸음 중 ${owners.length}걸음${week.achieved ? ', 촛불이 켜졌어요' : ''}`}
    >
      <defs>
        {/* 음각 — 도장 면에서 이름 글자를 빼낸다. 도장 g 의 좌표계(가운데 0,0) 그대로 쓴다 */}
        {(['me', 'you'] as const).map((o) => (
          <mask key={o} id={maskId(o)} maskUnits="userSpaceOnUse" x={-STAMP} y={-STAMP} width={STAMP * 2} height={STAMP * 2}>
            <rect x={-STAMP / 2} y={-STAMP / 2} width={STAMP} height={STAMP} rx="3" fill="#fff" />
            <text className="cp-stamp-char" x="0" y="0.5" fill="#000">
              {o === 'me' ? meChar : youChar}
            </text>
          </mask>
        ))}
        {/* 인주가 덜 묻은 자리 — 잔 노이즈가 짙은 곳만 알파를 덜어 낸다 */}
        <filter id={inkId} x="-10%" y="-30%" width="120%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -14 0 0 0 10.6" result="holes" />
          <feComposite in="SourceGraphic" in2="holes" operator="in" />
        </filter>
      </defs>
      <path d={guide} className="cp-guide" />
      <g filter={`url(#${inkId})`}>
        {Array.from({ length: steps }, (_, i) => {
          const x = X0 + ((X1 - X0) * (i + 0.5)) / steps
          const angle = Math.atan2(pathSlope(x), 1)
          // 나 한 번, 너 한 번 — 길 양옆으로 번갈아
          const side = i % 2 === 0 ? -7 : 7
          const fx = x - Math.sin(angle) * side
          const fy = pathY(x) + Math.cos(angle) * side
          const owner = owners[i]
          return (
            <g key={i} transform={`translate(${fx.toFixed(1)} ${fy.toFixed(1)}) rotate(${TILTS[i % TILTS.length]})`}>
              {owner ? (
                <rect
                  className={`cp-stamp is-${owner}`}
                  style={{ animationDelay: `${i * 45}ms` }}
                  x={-STAMP / 2}
                  y={-STAMP / 2}
                  width={STAMP}
                  height={STAMP}
                  rx="3"
                  mask={`url(#${maskId(owner)})`}
                />
              ) : (
                <rect className="cp-stamp is-empty" x={-STAMP / 2} y={-STAMP / 2} width={STAMP} height={STAMP} rx="3" />
              )}
            </g>
          )
        })}
      </g>
      {/* 길 끝 촛불 — 목표를 채우기 전엔 심지만 있는 초, 채운 주엔 화면을 열 때 불꽃이 피어난다.
          기도 버튼과 같은 촛불(MiniCandle) — 길 높이에 맞춰 등불 자리(x 316)에 세운다 */}
      <CandleSvg size={CANDLE_H} lit={week.achieved} ignite={week.achieved} x={316 - CANDLE_W / 2} y={MID + 9 - CANDLE_H} />
    </svg>
    </div>
  )
}

export default FootprintPath
