/**
 * 지금 쓰는 절을 화면 위쪽으로 붙드는 스크롤 — 모바일 전용 (TypingSession.tsx 에서 분리)
 *
 * - 모바일 키보드가 아래 절반을 덮는다. body 가 스크롤러라 sticky 대신 scrollIntoView 로 붙든다.
 *   PC 책상은 무대가 제자리라 필요 없다.
 * - 주소로 정해진 절(?v=, 알림·릴레이에서 들어옴)에 처음 내려앉을 때는 smooth 한 번으로 끝내지 않는다.
 *   모바일은 본문 뒤로 릴레이 칸 판·소식 띠가 늦게 도착해 레이아웃이 밀리고, 그 사이 smooth 스크롤이
 *   취소돼 맨 위에 머물렀다. 즉시 이동 후 잠깐 동안 자리를 다시 맞추고, 사용자가 만지면 바로 멈춘다.
 * - 키보드가 올라와 화면이 크게 줄었을 때만 다시 맞춘다.
 */
import { useCallback, useEffect, useRef } from 'react'
import { LAND_HOLD_MS } from './sessionModel'

export const useActiveScroll = (current: number | null, isDesk: boolean) => {
  const activeRef = useRef<HTMLDivElement>(null)
  const scrollToActive = useCallback(() => {
    activeRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [])

  const landedRef = useRef(false)
  useEffect(() => {
    if (current === null || isDesk) return
    if (landedRef.current) {
      const t = setTimeout(scrollToActive, 60)
      return () => clearTimeout(t)
    }
    landedRef.current = true
    const until = performance.now() + LAND_HOLD_MS
    let stopped = false
    let raf = 0
    const stop = () => {
      stopped = true
      cancelAnimationFrame(raf)
      window.removeEventListener('touchstart', stop, true)
      window.removeEventListener('wheel', stop, true)
    }
    window.addEventListener('touchstart', stop, { passive: true, capture: true })
    window.addEventListener('wheel', stop, { passive: true, capture: true })
    const pin = () => {
      if (stopped) return
      const el = activeRef.current
      if (el) {
        const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
        if (Math.abs(el.getBoundingClientRect().top - margin) > 4)
          el.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior })
      }
      if (performance.now() < until) raf = requestAnimationFrame(pin)
      else stop()
    }
    raf = requestAnimationFrame(pin)
    return stop
  }, [current, scrollToActive, isDesk])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || isDesk) return
    let last = vv.height
    const onResize = () => {
      if (last - vv.height > 120) scrollToActive()
      last = vv.height
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [scrollToActive, isDesk])

  return activeRef
}
