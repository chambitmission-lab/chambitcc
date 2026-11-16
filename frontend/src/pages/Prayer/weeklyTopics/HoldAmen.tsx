// 공동 기도제목 — "다 읽고 길게 눌러 아멘" 흐름(누르는 타이머·다음 기도로 넘김·빛 알갱이).
// 화면은 CinemaPoster 가 그린다. 진행 위치(idx)는 페이지가 갖고 있어 테마를 바꿔도 몇 번째 기도인지 이어진다.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { WeeklyPrayerItem } from '../../../types/weeklyPrayer'

export const HOLD_MS = 1300

export interface PrayerStageProps {
  /** 주차 id — 주차를 바꾸면 남은 넘김 예약을 버린다 */
  weekId: number
  items: WeeklyPrayerItem[]
  weekLabel: string
  idx: number
  setIdx: (next: number) => void
  /** 아멘 확정 — 로그인 안 했으면 false (다음으로 넘기지 않는다) */
  onAmen: (itemId: number | undefined) => boolean
  onUnamen: (itemId: number | undefined) => void
  totalAmen: number
}

/** 누르는 동안 타이머 · 아멘 뒤 다음 기도로 넘어가기 · 빛 알갱이 한 번 */
export const useAmenStep = ({ weekId, items, idx, setIdx, onAmen }: PrayerStageProps, advanceMs: number) => {
  const [holding, setHolding] = useState(false)
  const [burstAt, setBurstAt] = useState<number | null>(null)
  const holdTimer = useRef<number | undefined>(undefined)
  const advanceTimer = useRef<number | undefined>(undefined)
  const item = items[idx]

  useEffect(
    () => () => {
      window.clearTimeout(holdTimer.current)
      window.clearTimeout(advanceTimer.current)
    },
    [],
  )
  // 주차를 바꾸거나 이전/다음으로 옮기면 남은 넘김 예약은 버린다
  // (items 는 아멘 낙관적 갱신마다 새 배열이라 의존성에 넣으면 방금 건 예약까지 지워진다)
  useEffect(() => {
    window.clearTimeout(advanceTimer.current)
  }, [idx, weekId])

  const start = () => {
    if (!item || item.is_amened) return
    setHolding(true)
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = undefined
      setHolding(false)
      if (!onAmen(item.id)) return
      setBurstAt(idx)
      navigator.vibrate?.(30)
      advanceTimer.current = window.setTimeout(() => setIdx(idx + 1), advanceMs)
    }, HOLD_MS)
  }
  // 손을 떼면 누르는 중인 타이머만 취소 — 아멘 뒤 넘김 예약까지 지우면 손 떼는 순간 멈춘다
  const cancel = () => {
    window.clearTimeout(holdTimer.current)
    holdTimer.current = undefined
    setHolding(false)
  }
  return { item, holding, start, cancel, burst: burstAt === idx }
}
export type AmenStep = ReturnType<typeof useAmenStep>

export const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="5 12.5 10 17.5 19 7" />
  </svg>
)

// 시드 고정 난수 — 빛 알갱이 위치가 렌더마다 흔들리지 않게
const seeded = (seed: number) => () => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

/** 아멘 순간 한 번 터지는 빛 알갱이 */
export const AmenBurst = ({ seed, color }: { seed: number; color: string }) => {
  const motes = useMemo(() => {
    const r = seeded(seed * 31 + 7)
    return Array.from({ length: 14 }, () => ({ dx: (r() - 0.5) * 160, dy: -80 - r() * 160, s: 3 + r() * 4, d: r() * 0.25 }))
  }, [seed])
  return (
    <span className="wpt-burst" aria-hidden>
      {motes.map((m, i) => (
        <i
          key={i}
          style={{ ['--dx' as string]: `${m.dx}px`, ['--dy' as string]: `${m.dy}px`, width: m.s, height: m.s, animationDelay: `${m.d}s`, background: color } as CSSProperties}
        />
      ))}
    </span>
  )
}
