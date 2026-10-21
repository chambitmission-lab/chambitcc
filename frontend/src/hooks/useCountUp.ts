import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '../utils/prefersReducedMotion'

export interface CountUpOptions {
  /** 애니메이션 길이(ms). 기본 900 */
  durationMs?: number
  /** false 면 0 에 머문다 — 화면에 들어온 뒤에 시작하고 싶을 때(랜딩 지표) */
  active?: boolean
}

/**
 * 0 → target 으로 올라가는 숫자(ease-out cubic). 점수·아멘 수·달성률 같은 '결과 숫자'에 쓴다.
 *
 * - target 이 undefined 면(아직 로딩 중) 0 을 돌려준다
 * - 시스템 '동작 줄이기'가 켜져 있으면 처음부터 target 을 그대로 보여 준다
 * - 네 화면(만나·업적·기도 위젯·랜딩)에 각각 있던 복사본을 합친 것 — 시그니처는 옵션 객체 하나
 */
export const useCountUp = (target: number | undefined, { durationMs = 900, active = true }: CountUpOptions = {}): number => {
  const instant = prefersReducedMotion()
  const [value, setValue] = useState(() => (instant && active ? (target ?? 0) : 0))

  useEffect(() => {
    if (target === undefined || !active) return
    if (instant) {
      setValue(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs, active, instant])

  return value
}
