// 공동 기도제목 — "다 읽고 길게 눌러 아멘" 버튼과 그 흐름.
// 라이트(올려드리는 카드)·다크(등불 길) 두 화면이 같은 흐름을 쓴다. 진행 위치(idx)는 페이지가 갖고 있어
// 테마를 바꿔도 몇 번째 기도인지 이어진다.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { HandHeartIcon } from '../../../components/icons/ActionIcons'
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

/** 둘레 링이 HOLD_MS 동안 차오르는 아멘 버튼. 키보드는 Space/Enter 를 누르고 있으면 된다 */
export const HoldAmenButton = ({
  step,
  tone,
  hint,
  onUnamen,
}: {
  step: AmenStep
  tone: 'brand' | 'ember'
  hint: ReactNode
  onUnamen: () => void
}) => {
  const on = step.item?.is_amened ?? false
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onPointerDown={step.start}
        onPointerUp={step.cancel}
        onPointerLeave={step.cancel}
        onPointerCancel={step.cancel}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault()
            step.start()
          }
        }}
        onKeyUp={step.cancel}
        onContextMenu={(e) => e.preventDefault()}
        className={`wpt-hold wpt-hold--${tone} ${step.holding ? 'is-holding' : ''} ${on ? 'is-on' : ''}`}
        style={{ ['--hold' as string]: `${HOLD_MS}ms` } as CSSProperties}
        aria-label={on ? '함께 기도했어요' : '길게 눌러 아멘'}
        aria-pressed={on}
      >
        <svg className="wpt-hold-ring" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="46" />
          <circle cx="50" cy="50" r="46" className="wpt-hold-fill" />
        </svg>
        {on ? <CheckIcon size={28} /> : <HandHeartIcon size={30} strokeWidth={1.7} />}
      </button>
      <p className="wpt-hold-hint">
        {on ? (
          <>
            아멘 ·{' '}
            <button type="button" onClick={onUnamen} className="underline underline-offset-2 opacity-70 hover:opacity-100">
              취소
            </button>
          </>
        ) : step.holding ? (
          '마음을 모아…'
        ) : (
          hint
        )}
      </p>
    </div>
  )
}

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

/** 이전 / 다음(마지막엔 마치기) */
export const StepNav = ({ idx, count, setIdx, onDark }: { idx: number; count: number; setIdx: (n: number) => void; onDark?: boolean }) => (
  <div className="flex justify-between">
    <button type="button" disabled={idx === 0} onClick={() => setIdx(idx - 1)} className={`wpt-nav ${onDark ? 'wpt-nav--dark' : ''}`}>
      ← 이전
    </button>
    <button type="button" onClick={() => setIdx(idx + 1)} className={`wpt-nav ${onDark ? 'wpt-nav--dark' : ''}`}>
      {idx === count - 1 ? '마치기' : '다음'} →
    </button>
  </div>
)

export const ORDINAL = ['첫 번째', '두 번째', '세 번째', '네 번째', '다섯 번째', '여섯 번째', '일곱 번째', '여덟 번째', '아홉 번째', '열 번째']
