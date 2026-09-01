// 페이지 내 앵커 스크롤 — scrollIntoView({behavior:'smooth'}) 대체.
//
// 이 앱은 html/body 가 overflow-x:hidden + height:100% 라 실제 페이지 스크롤러가
// window 가 아니라 body 인 환경이 있다(ScrollRestoration 참고). 그 구조에서
// scrollIntoView(smooth) 는 모바일 브라우저에서 아무 일도 일어나지 않고 조용히
// 실패한다 — 성경 절 스크롤(useVerseScroll)·통독 지도(BookJourneyPath)에도
// 같은 이유의 우회가 있다. 여기서는 스크롤러를 직접 찾아 scrollTop 을 rAF 로 민다.

/** 실제로 스크롤되는 컨테이너 — 1px 나눠보기로 확정한다 */
export const getPageScroller = (): HTMLElement | null => {
  const candidates = Array.from(
    new Set(
      [
        document.scrollingElement as HTMLElement | null,
        document.body,
        document.documentElement,
      ].filter((c): c is HTMLElement => c != null)
    )
  )
  for (const c of candidates) {
    const before = c.scrollTop
    c.scrollTop = before + 1
    if (c.scrollTop !== before) {
      c.scrollTop = before
      return c
    }
    c.scrollTop = before - 1
    if (c.scrollTop !== before) {
      c.scrollTop = before
      return c
    }
  }
  return null
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * 요소가 화면 위쪽(offset 아래)에 오도록 부드럽게 스크롤한다.
 * @param offset 고정 헤더 등에 가리지 않게 남길 위쪽 여백(px)
 */
export const smoothScrollToElement = (
  el: Element | null,
  { offset = 0, duration = 520 }: { offset?: number; duration?: number } = {}
) => {
  if (!el) return
  const scroller = getPageScroller()
  if (!scroller) return

  const start = scroller.scrollTop
  const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
  const target = Math.min(maxTop, Math.max(0, start + el.getBoundingClientRect().top - offset))
  const dist = target - start
  if (Math.abs(dist) < 2) return

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced || duration <= 0) {
    scroller.scrollTop = target
    return
  }

  // 사용자가 직접 스크롤을 시작하면 애니메이션은 즉시 손을 뗀다
  let cancelled = false
  const stop = () => {
    cancelled = true
  }
  window.addEventListener('wheel', stop, { passive: true, once: true })
  window.addEventListener('touchstart', stop, { passive: true, once: true })

  const t0 = performance.now()
  const step = (now: number) => {
    if (cancelled) return
    const p = Math.min(1, (now - t0) / duration)
    scroller.scrollTop = start + dist * easeOutCubic(p)
    if (p < 1) {
      requestAnimationFrame(step)
    } else {
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
    }
  }
  requestAnimationFrame(step)
}
