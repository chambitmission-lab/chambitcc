import { useCallback, useEffect, useRef } from 'react'

/** 절을 화면 어디에 맞출지 — 이어읽기(start/center)와 낭독 따라가기(follow) */
export type VerseScrollBlock = 'start' | 'center' | 'follow'

/**
 * 절 단위 부드러운 스크롤 엔진.
 *
 * 절 스크롤은 브라우저 smooth scrollIntoView를 쓰지 않고 rAF로 직접 애니메이션한다.
 * smooth scrollIntoView는 모바일 브라우저에서 소리 없이 실패하는 일이 잦아
 * "어떤 절은 안 움직이다가 다음 절에서 훅 점프"하는 증상을 만들었다.
 * 매 프레임 남은 거리의 일정 비율만큼 움직이는 방식(지수 감속)이라 항상 부드럽고,
 * 목표 지점을 프레임마다 다시 재기 때문에 도중 레이아웃 변화에도 안전하다.
 */
export const useVerseScroll = () => {
  const scrollAnimRef = useRef<number | null>(null)

  const cancelVerseScroll = useCallback(() => {
    if (scrollAnimRef.current != null) {
      cancelAnimationFrame(scrollAnimRef.current)
      scrollAnimRef.current = null
    }
  }, [])

  useEffect(() => () => cancelVerseScroll(), [cancelVerseScroll])

  const scrollVerseIntoView = useCallback(
    (el: HTMLElement, block: VerseScrollBlock = 'center') => {
      cancelVerseScroll()
      // 실제 스크롤 컨테이너가 기기/브라우저에 따라 갈린다(이 앱은 html/body
      // overflow-x:hidden + height:100% 구조라 body가 스크롤러인 환경이 있음).
      // 1px 나눠보기로 실제 스크롤되는 쪽을 먼저 확정한다.
      const candidates = Array.from(
        new Set(
          [
            document.scrollingElement as HTMLElement | null,
            document.body,
            document.documentElement,
          ].filter((c): c is HTMLElement => c != null)
        )
      )
      let scroller: HTMLElement | null = null
      for (const c of candidates) {
        const before = c.scrollTop
        c.scrollTop = before + 1
        if (c.scrollTop !== before) {
          c.scrollTop = before
          scroller = c
          break
        }
        c.scrollTop = before - 1
        if (c.scrollTop !== before) {
          c.scrollTop = before
          scroller = c
          break
        }
      }
      if (!scroller) return // 스크롤 자체가 불가능한 상태

      // 목표 위치:
      // - 'start'  : 고정 헤더+미니 플레이어 아래(112px)
      // - 'center' : 뷰포트 중앙(단, 헤더 아래로는 안 올라가게)
      // - 'follow' : 낭독 따라가기용 하단 앵커. 절의 '아래쪽'을 화면 82%에 맞춘다.
      //   → 절이 하단에 닿았을 때만, 딱 한 절만큼만 밀어 올려 계속 하단에 머물게 한다
      //     (맨 위로 확 끌어올리는 점프가 없어 멀미가 안 난다).
      const viewportTarget =
        block === 'start'
          ? 112
          : block === 'follow'
            ? Math.max(112, window.innerHeight * 0.82 - el.clientHeight)
            : Math.max(112, (window.innerHeight - el.clientHeight) / 2)
      // 시작 시 한 번만 측정해 목표 scrollTop을 확정하고, 이후엔 경과 시간만으로
      // 절대 위치를 계산한다(easeOutCubic 고정 곡선). 매 프레임 요소 위치를
      // 재측정하는 피드백 방식은 강제 레이아웃 + dt 널뜀으로 이동량이 프레임마다
      // 들쭉날쭉해져 모바일에서 드득거리는 스크롤이 됐다. 절대 곡선은 프레임이
      // 떨어져도 곡선 위 제 위치로 건너뛰므로 항상 고르게 보인다.
      const startTop = scroller.scrollTop
      const dist = el.getBoundingClientRect().top - viewportTarget
      if (Math.abs(dist) < 2) return // 이미 제자리
      const maxTop = scroller.scrollHeight - scroller.clientHeight
      const endTop = Math.max(0, Math.min(startTop + dist, maxTop))
      // 거리에 비례하되 420~900ms로 클램프. easeInOut(천천히 출발-천천히 정지)이라
      // easeOut처럼 시작 순간 확 움직이는 '뚝' 느낌이 없다 — 낭독 따라가기처럼
      // 주기적으로 반복되는 스크롤은 가감속이 완만해야 멀미가 안 난다.
      const duration = Math.max(420, Math.min(260 + Math.abs(endTop - startTop) * 0.5, 900))
      const t0 = performance.now()
      const target = scroller
      const step = (now: number) => {
        scrollAnimRef.current = null
        const p = Math.min(1, (now - t0) / duration)
        const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
        target.scrollTop = startTop + (endTop - startTop) * eased
        if (p < 1) scrollAnimRef.current = requestAnimationFrame(step)
      }
      scrollAnimRef.current = requestAnimationFrame(step)
    },
    [cancelVerseScroll]
  )

  return { scrollVerseIntoView, cancelVerseScroll }
}
