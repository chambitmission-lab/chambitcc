import { useEffect, useState } from 'react'

/** 숫자 카운트업 — active 가 true 가 된 시점부터 duration 동안 0→target */
export const useCountUp = (target: number, active: boolean, duration = 1400) => {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])
  return value
}


/** 서울 기준 현재 시각 (예배 카운트다운용) */
export const seoulNow = (): Date =>
  new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))

export const fmtNum = (n: number, ko: boolean) =>
  ko ? n.toLocaleString('ko-KR') : n.toLocaleString('en-US')
