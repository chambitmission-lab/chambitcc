// 홈 모바일 "요약 스트립" — 기도 피드로 내려가 상단 카드들이 화면 밖으로 나간 뒤,
// 위로 살짝 스크롤하면 헤더 밑에 칩 한 줄이 내려온다.
//   오늘의 묵상 · 오늘의 읽기 · 함께 읽는 말씀 · 올해의 말씀 · 함께 나누는 은혜 · 타임캡슐 D-N
// 칩을 누르면 해당 카드로 바로 스크롤한다. 피드를 한참 내려간 뒤 "맨 위로 → 다시 찾기"
// 두 단계였던 동선을 한 탭으로 줄이는 장치.
//
// 노출 규칙
//   - lg+ 에선 사이드바가 sticky 로 붙어 있으므로 아예 렌더하지 않는다(리스너도 안 건다).
//   - 피드 상단(feedAnchor)이 헤더 밑으로 들어간 "피드 구간"에서만 살아난다.
//   - 아래로 읽어 내려갈 땐 숨고, 위로 올릴 때 나타난다(크롬 툴바 문법). 읽는 동안
//     세로 공간을 계속 잡아먹지 않기 위함.
//   - 칩은 실제로 렌더된(높이 > 0) 카드만 보여 준다 — 플랜·실시간 카드는 조건부라 비어 있을 수 있다.
//
// 이 앱은 실제 스크롤 컨테이너가 body 인 환경이 있어 sticky·IntersectionObserver 를 못 쓴다.
// 캡처 단계 scroll 리스너 + getBoundingClientRect 판정, 이동은 smoothScrollToElement 로.
import { useEffect, useRef, useState, type RefObject } from 'react'
import { useMyCapsules } from '../../../hooks/useTimeCapsule'
import { useTodayReadings } from '../../../hooks/useBiblePlan'
import { isAuthenticated } from '../../../utils/auth'
import { smoothScrollToElement } from '../../../utils/scrollTo'
import { daysUntil } from '../../Capsule/capsuleDates'
import {
  BookOpen,
  Broadcast,
  EnvelopeSimple,
  HandHeart,
  Sparkle,
  SunHorizon,
  type Icon,
} from '../../../components/icons/phosphor'

const HEADER_H = 56
const LG_QUERY = '(min-width: 1024px)'
// 방향 판정 최소 이동량 — 손가락 떨림·관성 끝자락에서 보였다 숨었다 하지 않게
const DIR_THRESHOLD = 6

/** NewHome 이 각 카드 래퍼에 붙이는 id — 칩 순서는 카드 순서와 같다 */
export const HOME_CARD_IDS = {
  meditation: 'home-card-meditation',
  plan: 'home-card-plan',
  live: 'home-card-live',
  verse: 'home-card-verse',
  grace: 'home-card-grace',
  capsule: 'home-card-capsule',
} as const

type CardKey = keyof typeof HOME_CARD_IDS

interface ChipDef {
  key: CardKey
  label: string
  Icon: Icon
}

const CHIPS: ChipDef[] = [
  { key: 'meditation', label: '오늘의 묵상', Icon: SunHorizon },
  { key: 'plan', label: '오늘의 읽기', Icon: BookOpen },
  { key: 'live', label: '함께 읽는 말씀', Icon: Broadcast },
  { key: 'verse', label: '올해의 말씀', Icon: Sparkle },
  { key: 'grace', label: '함께 나누는 은혜', Icon: HandHeart },
  { key: 'capsule', label: '타임캡슐', Icon: EnvelopeSimple },
]

interface Props {
  /** 피드 시작점(소그룹 필터 래퍼) — 이 요소가 헤더 밑으로 들어가면 "피드 구간" */
  feedAnchorRef: RefObject<HTMLElement | null>
}

const HomeQuickStrip = ({ feedAnchorRef }: Props) => {
  const [isLg, setIsLg] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(LG_QUERY).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(LG_QUERY)
    const onChange = (e: MediaQueryListEvent) => setIsLg(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (isLg) return null
  return <MobileStrip feedAnchorRef={feedAnchorRef} />
}

const MobileStrip = ({ feedAnchorRef }: Props) => {
  const [visible, setVisible] = useState(false)
  // 실제로 렌더된 카드만 — 보이는 순간에 한 번 잰다(카드 유무는 그 사이 거의 안 바뀐다)
  const [available, setAvailable] = useState<CardKey[]>([])

  useEffect(() => {
    let frame = 0
    let lastTop = Number.NaN
    let inFeed = false
    let shown = false

    const measure = () => {
      frame = 0
      const anchor = feedAnchorRef.current
      if (!anchor) return
      const top = anchor.getBoundingClientRect().top
      // 피드 구간 판정에 히스테리시스 — 경계에서 떨리지 않게
      inFeed = inFeed ? top < HEADER_H + 24 : top < HEADER_H

      let next = shown
      if (!inFeed) {
        next = false
      } else if (!Number.isNaN(lastTop)) {
        const delta = top - lastTop // 위로 스크롤하면 앵커가 내려오므로 delta > 0
        if (delta > DIR_THRESHOLD) next = true
        else if (delta < -DIR_THRESHOLD) next = false
      }
      // 임계값 미만의 잔떨림은 기준점을 갱신하지 않는다 — 누적돼야 방향으로 친다
      if (Number.isNaN(lastTop) || Math.abs(top - lastTop) > DIR_THRESHOLD || !inFeed) lastTop = top

      if (next !== shown) {
        shown = next
        if (next) {
          setAvailable(
            CHIPS.filter(({ key }) => {
              const el = document.getElementById(HOME_CARD_IDS[key])
              return !!el && el.offsetHeight > 0
            }).map((c) => c.key),
          )
        }
        setVisible(next)
      }
    }
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }
    measure()
    document.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      document.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
    }
  }, [feedAnchorRef])

  const authed = isAuthenticated()
  const { data: capsules } = useMyCapsules(authed)
  const { data: readings } = useTodayReadings(authed)

  // 칩 보조 문구 — 카드와 같은 데이터(같은 쿼리 캐시)라 추가 요청은 없다
  const capsuleHint = (() => {
    const unopened = capsules?.unreadTotal ?? 0
    if (unopened > 0) return `${unopened}개 도착`
    const next = capsules?.sealed[0]
    return next ? `D-${daysUntil(next.open_at)}` : null
  })()
  const planHint = (() => {
    const p = readings?.items?.[0]?.percent
    return typeof p === 'number' ? `${Math.round(p)}%` : null
  })()
  const hints: Partial<Record<CardKey, string | null>> = { capsule: capsuleHint, plan: planHint }

  const scrollRef = useRef<HTMLDivElement>(null)

  const goTo = (key: CardKey) => {
    const el = document.getElementById(HOME_CARD_IDS[key])
    if (!el) return
    smoothScrollToElement(el, { offset: HEADER_H + 8 })
  }

  const chips = CHIPS.filter((c) => available.includes(c.key))
  if (chips.length === 0) return null

  return (
    <div
      className={`fixed left-0 right-0 z-[90] pointer-events-none transition-[transform,opacity] duration-200 ease-out ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      style={{ top: HEADER_H }}
      aria-hidden={!visible}
    >
      <div
        ref={scrollRef}
        className={`max-w-md mx-auto flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide bg-white/85 dark:bg-background-dark/85 backdrop-blur-xl border-b border-[var(--card-border)] shadow-[0_8px_20px_-14px_rgba(0,0,0,0.35)] ${
          visible ? 'pointer-events-auto' : ''
        }`}
        role="navigation"
        aria-label="홈 카드로 바로가기"
      >
        {chips.map(({ key, label, Icon }) => {
          const hint = hints[key]
          return (
            <button
              key={key}
              type="button"
              tabIndex={visible ? 0 : -1}
              onClick={() => goTo(key)}
              className="shrink-0 h-8 pl-2.5 pr-3 rounded-full feed-card inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--text-body)] active:scale-95 transition-transform duration-150 whitespace-nowrap"
            >
              <Icon size={15} weight="bold" className="text-brand shrink-0" aria-hidden />
              <span>{label}</span>
              {hint && (
                <span className="text-brand font-bold tabular-nums">{hint}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default HomeQuickStrip
