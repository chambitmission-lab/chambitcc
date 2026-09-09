import { useCallback, useEffect, useRef } from 'react'

// 데스크톱 사이드 컬럼용 양방향 sticky (인스타·핀터레스트·구글 검색 우측 패널 문법).
//
// 컬럼이 뷰포트보다 길 때 max-h로 잘라 내부 스크롤을 주면 하단 카드가 "뚝 잘린"
// 것처럼 보인다. 대신 자연 높이 그대로 두고 스크롤 방향에 따라 붙는 변을 바꾼다.
//   높이 ≤ 뷰포트-오프셋 → 항상 top = topOffset (상단 고정)
//   아래로 스크롤        → 페이지와 함께 흐르다 컬럼 바닥이 화면 하단에 닿으면 바닥 고정
//   위로 스크롤          → 즉시 페이지와 함께 따라 올라오다 컬럼 머리가 헤더 밑에 닿으면 상단 고정
// 이렇게 해야 피드를 한참 내려간 뒤에도 "조금만 올리면" 위쪽 카드가 바로 보인다.
// 예전 바닥 고정만 있던 버전은 맨 위까지 올라가야 상단 카드가 나타났다.
//
// 상태 전환은 세 모드로 돈다.
//   top    : sticky, top = topOffset
//   bottom : sticky, top = 뷰포트 - 컬럼 높이
//   free   : position: relative + top = 현재 위치 오프셋 → 페이지와 같이 흐른다
// 방향이 바뀌는 순간 sticky 기준변을 바로 바꾸면 컬럼이 점프하므로, 먼저 free 로
// 풀어 제자리에 둔 채 흐르게 하고, 새 기준변에 닿는 순간 다시 sticky 로 붙인다.
//
// 카드가 비동기로 로드돼 높이가 변하고 컬럼 자체도 조건부 마운트라서,
// 콜백 ref + ResizeObserver 로 붙을 때마다 관측을 다시 건다.
// 실제 스크롤 컨테이너가 body 인 환경도 있어 스크롤은 캡처 단계 document 리스너로 받는다.
// lg 미만(모바일)에서는 인라인 스타일을 모두 지운다 — sticky 클래스도 lg 에만 걸려 있다.
const LG_QUERY = '(min-width: 1024px)'

type Mode = 'top' | 'bottom' | 'free'

export const useBottomStickyRail = (topOffsetPx: number) => {
  const cleanupRef = useRef<(() => void) | null>(null)

  const ref = useCallback(
    (el: HTMLElement | null) => {
      cleanupRef.current?.()
      cleanupRef.current = null
      if (!el) return

      const mq = window.matchMedia(LG_QUERY)
      let mode: Mode = 'top'
      let lastY = Number.NaN
      let frame = 0

      // 컬럼의 "정상 흐름" 상단 — 부모(flex 래퍼)의 콘텐츠 상단. sticky/relative 로
      // 밀려 있어도 이 값은 변하지 않으므로 스크롤 진행량과 free 오프셋의 기준이 된다.
      const staticTop = () => {
        const parent = el.parentElement
        if (!parent) return 0
        const rect = parent.getBoundingClientRect()
        return rect.top + (parseFloat(getComputedStyle(parent).paddingTop) || 0)
      }

      const setSticky = (next: Exclude<Mode, 'free'>, top: number) => {
        mode = next
        el.style.position = '' // 클래스의 (lg:)sticky 로 복귀
        el.style.top = `${top}px`
      }
      const setFree = () => {
        // 지금 보이는 자리를 그대로 유지한 채 흐름에 되돌린다
        const rel = el.getBoundingClientRect().top - staticTop()
        mode = 'free'
        el.style.position = 'relative'
        el.style.top = `${Math.max(0, Math.round(rel))}px`
      }
      const clear = () => {
        mode = 'top'
        lastY = Number.NaN
        el.style.position = ''
        el.style.top = ''
      }

      const measure = () => {
        frame = 0
        if (!mq.matches) {
          if (el.style.top !== '') clear()
          return
        }
        const height = el.offsetHeight
        const viewport = window.innerHeight

        // 화면 안에 다 들어오면 예전처럼 상단 고정으로 끝
        if (height + topOffsetPx <= viewport) {
          if (mode !== 'top' || el.style.top !== `${topOffsetPx}px`) setSticky('top', topOffsetPx)
          lastY = -staticTop()
          return
        }

        const y = -staticTop() // 아래로 내릴수록 커진다
        const dir = Number.isNaN(lastY) || y === lastY ? null : y > lastY ? 'down' : 'up'
        lastY = y
        const rect = el.getBoundingClientRect()

        if (dir === 'down') {
          if (mode === 'top') setFree()
          else if (mode === 'free' && rect.bottom <= viewport) setSticky('bottom', viewport - height)
          else if (mode === 'bottom') el.style.top = `${viewport - height}px`
        } else if (dir === 'up') {
          if (mode === 'bottom') setFree()
          else if (mode === 'free' && rect.top >= topOffsetPx) setSticky('top', topOffsetPx)
        } else if (mode === 'bottom') {
          // 스크롤 없이 높이·뷰포트만 바뀐 경우(카드 로드, 창 크기) 바닥 기준을 다시 맞춘다
          el.style.top = `${viewport - height}px`
        } else if (mode === 'top' && el.style.top === '') {
          setSticky('top', topOffsetPx)
        }
      }

      const schedule = () => {
        if (frame) return
        frame = window.requestAnimationFrame(measure)
      }

      measure()
      const ro = new ResizeObserver(schedule)
      ro.observe(el)
      document.addEventListener('scroll', schedule, true)
      window.addEventListener('resize', schedule)
      mq.addEventListener('change', schedule)
      cleanupRef.current = () => {
        if (frame) window.cancelAnimationFrame(frame)
        ro.disconnect()
        document.removeEventListener('scroll', schedule, true)
        window.removeEventListener('resize', schedule)
        mq.removeEventListener('change', schedule)
      }
    },
    [topOffsetPx],
  )

  // 페이지 이탈 시 잔여 리스너 정리
  useEffect(() => () => cleanupRef.current?.(), [])

  return ref
}
