// PC 전용 "맨 위로" 알약 — 피드 컬럼 하단 가운데에 뜬다.
//
// 데스크톱에는 지금까지 맨 위로 돌아가는 장치가 없었다(모바일은 하단 네비의 홈 탭).
// 무한 스크롤로 한참 내려간 뒤 상단으로 돌아오려면 휠을 계속 굴려야 했다.
//
// "새 기도 N" 배지는 최신순일 때만 붙는다 — 인기순에서는 새 글이 맨 위에 오지 않아
// 숫자가 거짓말이 되기 때문이다. 기준(baseline)은 알약이 처음 뜨는 순간의 맨 위 기도로,
// 그 뒤 목록 앞쪽에 끼어든 개수를 센다.
//
// 이 앱은 실제 스크롤 컨테이너가 body 인 환경이 있어 sticky·IntersectionObserver 를 못 쓴다.
// HomeQuickStrip 과 같은 문법으로 캡처 단계 scroll 리스너 + getBoundingClientRect 로 판정한다.
import { useEffect, useRef, useState, type RefObject } from 'react'

/** 이만큼 내려가면 알약이 뜬다 */
const SHOW_AFTER = 700
const LG_QUERY = '(min-width: 1024px)'

interface Props {
  /** 알약을 가로 가운데 정렬할 기준 — 피드 컬럼 */
  feedColumnRef: RefObject<HTMLElement | null>
  /** 현재 피드에 보이는 기도 id 목록 (정렬 순서 그대로) */
  prayerIds: number[]
  /** 최신순일 때만 "새 기도 N" 배지를 붙인다 */
  countNew: boolean
  onScrollToTop: () => void
}

const FeedBackToTop = ({ feedColumnRef, prayerIds, countNew, onScrollToTop }: Props) => {
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

  // 알약이 뜬 순간의 맨 위 기도 — 이후 그 앞에 쌓인 개수가 "새 기도".
  // 알약이 사라지면(맨 위로 돌아오면) 기준도 지워 다음 하강에서 다시 잡는다.
  const [baseline, setBaseline] = useState<number | null>(null)

  // 스크롤 콜백이 목록을 매번 최신으로 읽되, 목록이 바뀔 때마다 리스너를 다시 걸지는 않도록
  const prayerIdsRef = useRef(prayerIds)
  useEffect(() => {
    prayerIdsRef.current = prayerIds
  }, [prayerIds])

  useEffect(() => {
    if (!isLg) return
    let frame = 0
    const measure = () => {
      frame = 0
      // 스크롤 컨테이너가 window / body / #root 중 무엇이든 잡히도록 최댓값을 쓴다
      const y = Math.max(
        window.scrollY,
        document.documentElement.scrollTop,
        document.body.scrollTop,
      )
      const shown = y > SHOW_AFTER
      setVisible(shown)
      setBaseline((prev) => (shown ? (prev ?? prayerIdsRef.current[0] ?? null) : null))
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

  const idx = baseline === null ? -1 : prayerIds.indexOf(baseline)
  const newCount = countNew && idx > 0 ? idx : 0

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
        className="feed-card h-[42px] rounded-full pl-4 pr-2 flex items-center gap-2.5 text-[13px] font-bold text-ink-strong shadow-[0_10px_30px_-8px_rgba(24,26,40,0.28)] hover:border-[var(--brand-glow)] active:scale-[0.97] transition-[border-color,transform] duration-150"
        aria-label={newCount > 0 ? `맨 위로 · 새 기도 ${newCount}개` : '맨 위로'}
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
        {newCount > 0 && (
          <span className="h-7 px-3 rounded-full bg-[var(--brand)] text-white text-[12.5px] font-bold inline-flex items-center tabular-nums">
            새 기도 {newCount}
          </span>
        )}
        {newCount === 0 && <span className="pr-2" aria-hidden />}
      </button>
    </div>
  )
}

export default FeedBackToTop
