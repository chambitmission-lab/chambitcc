import { useEffect, useState } from 'react'

/**
 * 일정 간격으로 흐르는 "지금"(ms). 카운트다운·"오늘 예배"·현지 시각처럼
 * 화면을 열어 둔 채 시간이 지나는 걸 반영해야 하는 곳에서 쓴다.
 *
 * - 탭이 숨겨진 동안은 setState 를 건너뛴다 — 보이지 않는 화면을 위해 렌더를 돌릴
 *   이유가 없고(배터리), 설치 PWA 가 백그라운드에서 돌아와도 옛 시각이 최대 interval
 *   만큼 남아 있던 문제를 visibilitychange 에서 즉시 맞춰 없앤다.
 * - `enabled=false` 면 멈춘다(마감이 없는 카드 등). 그때는 마운트 시각을 돌려준다.
 *
 * 마운트 시점 한 번만 고정하면 되는 판정은 useNowMs 를 쓴다.
 */
export const useTickingNow = (intervalMs: number, enabled = true): number => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return
    const tick = () => {
      if (document.visibilityState === 'hidden') return
      setNow(Date.now())
    }
    const timer = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [intervalMs, enabled])
  return now
}
