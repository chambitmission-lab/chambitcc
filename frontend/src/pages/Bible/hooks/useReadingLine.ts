import { useEffect, useState } from 'react'

/**
 * 스크롤 위치 → "지금 읽는 절" 번호.
 *
 * 화면 위쪽 40% 지점을 읽는 줄로 본다(ChapterOutlineRail 의 단락 하이라이트와 같은 기준).
 * 이 앱은 스크롤러가 window/body 어느 쪽일지 환경마다 달라 IntersectionObserver 의
 * 암묵 root 를 믿기 어렵다 — 캡처 단계 scroll 리스너 + rAF 스로틀로 직접 잰다.
 *
 * 절 DOM([data-verse])은 문서 순서대로 놓이므로 이진 탐색 — 시편 119편(176절)도
 * 프레임마다 전부 재지 않는다. 장이 바뀌면 이전 장 DOM·스크롤이 잠시 남아 있어
 * 첫 0.8초는 측정을 건너뛰고 1절로 둔다.
 *
 * settleMs: 값이 이 시간 동안 유지될 때만 확정한다 — 스크롤 중 스쳐 지나가는 절은
 * 보고하지 않는다(함께 읽기 카운트가 7→8→7 로 튀는 것을 막는다).
 */
export const useReadingLine = (
  bookNumber: number,
  chapter: number,
  totalVerses: number | undefined,
  enabled: boolean,
  settleMs = 3000,
): number | null => {
  const [rawVerse, setRawVerse] = useState<number | null>(null)
  const [settled, setSettled] = useState<number | null>(null)

  // 장이 바뀌면 이전 장의 절 번호를 버린다 — effect 대신 렌더 중 키 비교로 리셋
  // (React 권장 패턴: 이전 장의 값이 한 프레임이라도 새 장으로 보고되지 않는다)
  const chapterKey = `${bookNumber}:${chapter}`
  const [seenKey, setSeenKey] = useState(chapterKey)
  if (seenKey !== chapterKey) {
    setSeenKey(chapterKey)
    setRawVerse(null)
    setSettled(null)
  }

  useEffect(() => {
    if (!enabled) return
    let raf = 0
    let nodes: HTMLElement[] = []
    const collectNodes = () => {
      nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-verse]'))
    }
    const settledAt = performance.now() + 800
    const measure = () => {
      raf = 0
      if (performance.now() < settledAt) return
      if (!nodes.length || nodes.length < (totalVerses ?? Infinity) || !nodes[0].isConnected) collectNodes()
      if (!nodes.length) return
      const line = window.innerHeight * 0.4
      let lo = 0
      let hi = nodes.length - 1
      let idx = -1
      while (lo <= hi) {
        const mid = (lo + hi) >> 1
        if (nodes[mid].getBoundingClientRect().top <= line) {
          idx = mid
          lo = mid + 1
        } else {
          hi = mid - 1
        }
      }
      const node = idx >= 0 ? nodes[idx] : nodes[0]
      const current = Number(node.dataset.verse) || 1
      setRawVerse((prev) => (prev === current ? prev : current))
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(measure)
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('resize', onScroll)
    // 장 진입 직후 첫 측정(스크롤 없이 머무는 경우)
    const kick = window.setTimeout(onScroll, 900)
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
      window.clearTimeout(kick)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [enabled, bookNumber, chapter, totalVerses])

  // 디바운스 확정
  useEffect(() => {
    if (rawVerse === null) return
    const id = window.setTimeout(() => setSettled(rawVerse), settleMs)
    return () => window.clearTimeout(id)
  }, [rawVerse, settleMs])

  return enabled ? settled : null
}
