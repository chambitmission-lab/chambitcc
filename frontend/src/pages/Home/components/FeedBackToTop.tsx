// PC 전용 "맨 위로" 알약 — 피드 컬럼 하단 가운데에 뜬다.
//
// 데스크톱에는 맨 위로 돌아가는 장치가 없었다(모바일은 하단 네비의 홈 탭).
// 무한 스크롤로 한참 내려간 뒤 상단 카드들을 다시 보려면 휠을 계속 굴려야 했다.
//
// 이 앱은 실제 스크롤 컨테이너가 body 인 환경이 있어 sticky·IntersectionObserver 를 못 쓴다.
// HomeQuickStrip 과 같은 문법으로 캡처 단계 scroll 리스너 + getBoundingClientRect 로 판정한다.
import { useEffect, useState, type RefObject } from 'react'

/** 이만큼 내려가면 알약이 뜬다 */
const SHOW_AFTER = 700
const LG_QUERY = '(min-width: 1024px)'

interface Props {
  /** 알약을 가로 가운데 정렬할 기준 — 피드 컬럼 */
  feedColumnRef: RefObject<HTMLElement | null>
  onScrollToTop: () => void
}

const FeedBackToTop = ({ feedColumnRef, onScrollToTop }: Props) => {
  const [isLg, setIsLg] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(LG_QUERY).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(LG_QUERY)
    const onChange = (e: MediaQueryListEvent) => setIsLg(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const [visible, setVisible] = useState(false)
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!isLg) return
    let frame = 0
    const measure = () => {
      frame = 0
      // 스크롤 컨테이너가 window / documentElement / body 중 무엇이든 잡히도록 최댓값을 쓴다
      const y = Math.max(
        window.scrollY,
        document.documentElement.scrollTop,
        document.body.scrollTop,
      )
      setVisible(y > SHOW_AFTER)
      const col = feedColumnRef.current
      if (col) {
        const r = col.getBoundingClientRect()
        setLeft(r.left + r.width / 2)
      }
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }
    measure()
    document.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      document.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
    }
  }, [isLg, feedColumnRef])

  if (!isLg) return null

  return (
    <div
      className={`fixed bottom-7 z-[70] transition-[opacity,transform] duration-200 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
      style={{ left: left ?? '50%', transform: 'translateX(-50%)' }}
    >
      <button
        type="button"
        onClick={onScrollToTop}
        className="feed-card h-[42px] rounded-full px-5 flex items-center gap-2 text-[13px] font-bold text-ink-strong shadow-[0_10px_30px_-8px_rgba(24,26,40,0.28)] hover:border-[var(--brand-glow)] active:scale-[0.97] transition-[border-color,transform] duration-150"
        aria-label="맨 위로"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 19V6M6 11.5L12 5.5l6 6"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        맨 위로
      </button>
    </div>
  )
}

export default FeedBackToTop
