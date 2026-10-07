import { useEffect, useRef } from 'react'

/**
 * 하단 시트 "끌어내려 닫기".
 * 본문 스크롤이 맨 위일 때 아래로 당기면 시트가 손가락을 따라 내려가고,
 * 일정 거리(또는 빠른 플릭) 넘게 당기면 onClose. 그 외엔 제자리로 복귀.
 *
 * sheetRef: 끌려 내려갈 시트 본체(transform 을 직접 건다 — framer 가 transform 을 쥔 요소와는 분리할 것)
 * scrollRef: 시트 안 스크롤 영역(맨 위일 때만 당김 시작)
 */
export function useSheetPullToClose<S extends HTMLElement = HTMLDivElement, C extends HTMLElement = HTMLDivElement>(
  onClose: () => void,
  threshold = 110,
) {
  const sheetRef = useRef<S>(null)
  const scrollRef = useRef<C>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const atTop = () => (scrollRef.current?.scrollTop ?? 0) <= 0

    let startY = 0
    let startT = 0
    let dy = 0
    let tracking = false
    let pulling = false

    const reset = () => {
      sheet.style.transition = 'transform .25s ease'
      sheet.style.transform = ''
    }
    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      startT = e.timeStamp
      dy = 0
      pulling = false
      tracking = atTop()
    }
    const onMove = (e: TouchEvent) => {
      if (!tracking) return
      const d = e.touches[0].clientY - startY
      if (!pulling) {
        if (d < 0) {
          tracking = false // 위로 미는 건 평범한 스크롤
          return
        }
        if (d < 8 || !atTop()) return
        pulling = true
      }
      if (e.cancelable) e.preventDefault()
      dy = Math.max(0, d - 8)
      sheet.style.transition = 'none'
      sheet.style.transform = `translateY(${dy}px)`
    }
    const onEnd = (e: TouchEvent) => {
      if (!pulling) {
        tracking = false
        return
      }
      tracking = pulling = false
      const velocity = dy / Math.max(1, e.timeStamp - startT) // px/ms
      if (dy > threshold || (dy > 40 && velocity > 0.6)) onCloseRef.current()
      else reset()
    }

    sheet.addEventListener('touchstart', onStart, { passive: true })
    sheet.addEventListener('touchmove', onMove, { passive: false })
    sheet.addEventListener('touchend', onEnd)
    sheet.addEventListener('touchcancel', onEnd)
    return () => {
      sheet.removeEventListener('touchstart', onStart)
      sheet.removeEventListener('touchmove', onMove)
      sheet.removeEventListener('touchend', onEnd)
      sheet.removeEventListener('touchcancel', onEnd)
    }
  }, [threshold])

  return { sheetRef, scrollRef }
}
