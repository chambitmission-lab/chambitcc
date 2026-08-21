import { useCallback, useEffect, useRef } from 'react'

// 데스크톱 사이드 컬럼용 bottom-sticky (인스타·구글 검색 우측 패널 문법).
// 컬럼이 뷰포트보다 길 때 max-h로 잘라 내부 스크롤을 주면 하단 카드가
// "뚝 잘린" 것처럼 보인다. 대신 자연 높이 그대로 페이지와 함께 흐르다가
// 컬럼의 바닥이 화면 하단에 닿는 순간 고정되도록 sticky top을 음수로 계산한다.
//   높이 ≤ 뷰포트-오프셋 → top = topOffset (기존 상단 고정과 동일)
//   높이 > 뷰포트-오프셋 → top = 뷰포트 - 컬럼 높이  (바닥 기준 고정)
// 카드가 비동기로 로드돼 높이가 변하고 컬럼 자체도 조건부 마운트라서,
// 콜백 ref + ResizeObserver로 붙을 때마다 관측을 다시 건다.
export const useBottomStickyRail = (topOffsetPx: number) => {
  const cleanupRef = useRef<(() => void) | null>(null)

  const ref = useCallback(
    (el: HTMLElement | null) => {
      cleanupRef.current?.()
      cleanupRef.current = null
      if (!el) return

      const apply = () => {
        const fitsBelowHeader = el.offsetHeight + topOffsetPx <= window.innerHeight
        el.style.top = fitsBelowHeader
          ? `${topOffsetPx}px`
          : `${window.innerHeight - el.offsetHeight}px`
      }

      apply()
      const ro = new ResizeObserver(apply)
      ro.observe(el)
      window.addEventListener('resize', apply)
      cleanupRef.current = () => {
        ro.disconnect()
        window.removeEventListener('resize', apply)
      }
    },
    [topOffsetPx],
  )

  // 페이지 이탈 시 잔여 리스너 정리
  useEffect(() => () => cleanupRef.current?.(), [])

  return ref
}
