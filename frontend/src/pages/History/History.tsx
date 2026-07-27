import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { DECADES, HISTORY_EVENTS, decadeOf } from './historyData'
import { INDEXED_EVENTS, MILESTONES } from './historyThemes'
import type { ThemeKey } from './historyThemes'
import HistoryMinimap from './components/HistoryMinimap'
import MilestoneReel from './components/MilestoneReel'
import EraTimeline from './components/EraTimeline'
import ThemeLens from './components/ThemeLens'
import './History.css'

type Lens = 'era' | 'theme'

const History = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const ko = language === 'ko'

  const [lens, setLens] = useState<Lens>('era')
  const [activeDecade, setActiveDecade] = useState(DECADES[0].key)
  const [activeTheme, setActiveTheme] = useState<ThemeKey | null>(null)
  const [openYears, setOpenYears] = useState<Set<number>>(() => new Set())
  const [openItems, setOpenItems] = useState<Set<number>>(() => new Set())
  const [flashedIndex, setFlashedIndex] = useState<number | null>(null)

  const heroRef = useRef<HTMLElement | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  /** 렌즈 전환 후 한 프레임 뒤에 실행할 스크롤 작업 */
  const pendingScroll = useRef<(() => void) | null>(null)

  // #root에 overflow-y:auto가 걸려 있어 position:sticky가 동작하지 않는다(앱 전역 설정).
  // 전역 CSS를 건드리는 대신 이 페이지 안에서만 fixed로 전환한다.
  const navRef = useRef<HTMLDivElement | null>(null)
  const navSentinelRef = useRef<HTMLDivElement | null>(null)
  const [pinned, setPinned] = useState(false)
  const [navHeight, setNavHeight] = useState(0)

  const journeyYears = new Date().getFullYear() - 1994

  const registerSection = useCallback((key: string, el: HTMLElement | null) => {
    sectionRefs.current[key] = el
  }, [])

  const toggleYear = useCallback((year: number) => {
    setOpenYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }, [])

  const toggleItem = useCallback((index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  // 연대순 렌즈에서만 스크롤 위치로 활성 연대를 추적한다.
  useEffect(() => {
    if (lens !== 'era') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveDecade(entry.target.getAttribute('data-decade') ?? DECADES[0].key)
          }
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [lens])

  // 네비가 헤더 밑으로 올라가면 고정한다.
  // 실제 스크롤 컨테이너가 body라 IntersectionObserver의 암묵적 root로는 잡히지 않는다.
  // 캡처 단계 scroll 리스너로 어떤 컨테이너가 스크롤되든 받아서 직접 잰다.
  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const sentinel = navSentinelRef.current
      if (!sentinel) return
      setPinned(sentinel.getBoundingClientRect().top < 56)
    }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }
    measure()
    document.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // 렌즈에 따라 네비 높이가 달라지므로 자리 확보용 높이를 계속 맞춰준다.
  useEffect(() => {
    const nav = navRef.current
    if (!nav || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setNavHeight(nav.offsetHeight))
    observer.observe(nav)
    setNavHeight(nav.offsetHeight)
    return () => observer.disconnect()
  }, [])

  // 테마를 고르거나 목록으로 돌아오면 새 내용이 그려진 뒤 네비 위치까지 올려준다.
  // (렌더 커밋 후여야 해서 이벤트 핸들러가 아니라 effect에서 처리한다.)
  const themeMounted = useRef(false)
  useEffect(() => {
    if (lens !== 'theme') {
      themeMounted.current = false
      return
    }
    if (!themeMounted.current) {
      themeMounted.current = true
      return
    }
    // 내용이 통째로 바뀌는 전환이라 부드러운 스크롤 대신 즉시 이동한다
    // (연속된 smooth 스크롤은 서로를 취소시켜 아예 안 움직인다).
    navSentinelRef.current?.scrollIntoView({ block: 'start' })
  }, [activeTheme, lens])

  // 렌즈가 연대순으로 바뀐 뒤 DOM이 붙으면 예약해 둔 스크롤을 실행한다.
  useEffect(() => {
    if (lens !== 'era' || !pendingScroll.current) return
    const run = pendingScroll.current
    pendingScroll.current = null
    const id = window.requestAnimationFrame(() => run())
    return () => window.cancelAnimationFrame(id)
  }, [lens])

  const scrollToEl = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /** 미니맵에서 연도를 고르면 연대순 렌즈로 돌아가 그 해로 이동한다. */
  const handlePickYear = (year: number) => {
    setActiveDecade(decadeOf(year))
    const go = () => scrollToEl(`hyear-${year}`)
    if (lens === 'era') go()
    else {
      pendingScroll.current = go
      setActiveTheme(null)
      setLens('era')
    }
  }

  /** 이정표 릴에서 카드를 고르면 본문의 해당 기록으로 이동 + 잠깐 강조한다. */
  const handlePickMilestone = (index: number) => {
    const target = INDEXED_EVENTS[index]
    setActiveDecade(target.decade)
    const go = () => {
      scrollToEl(`hrec-${index}`)
      setFlashedIndex(index)
      window.setTimeout(() => setFlashedIndex((cur) => (cur === index ? null : cur)), 2400)
    }
    if (lens === 'era') go()
    else {
      pendingScroll.current = go
      setActiveTheme(null)
      setLens('era')
    }
  }

  const handleDecadeChip = (key: string) => {
    setActiveDecade(key)
    const go = () => sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (lens === 'era') go()
    else {
      pendingScroll.current = go
      setActiveTheme(null)
      setLens('era')
    }
  }

  const switchLens = (next: Lens) => {
    if (next === lens) return
    setLens(next)
    if (next === 'theme') setActiveTheme(null)
    // 실제 스크롤 컨테이너가 window가 아니라서 scrollTo가 먹지 않는다. scrollIntoView로 올린다.
    heroRef.current?.scrollIntoView({ block: 'start' })
  }

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        <div className="history-page">
          {/* Hero */}
          <header ref={heroRef} className="history-hero">
            <div className="history-hero-badge">SINCE 1994</div>
            <h1 className="history-hero-title">
              참으로, 빛으로
              <br />
              걸어온 길
            </h1>
            <p className="history-hero-copy">
              1994년 여름, 부천 은하마을 한 가정집 거실에서
              <br />
              네 명의 장로가 드린 기도로 시작된 이야기.
              <br />그 발자취를 여기에 담았습니다.
            </p>
            <div className="history-hero-stats">
              <div className="history-stat">
                <span className="history-stat-value">{journeyYears}년</span>
                <span className="history-stat-label">{ko ? '함께한 걸음' : 'Years'}</span>
              </div>
              <div className="history-stat-divider" />
              <div className="history-stat">
                <span className="history-stat-value">{HISTORY_EVENTS.length}</span>
                <span className="history-stat-label">{ko ? '기록된 순간' : 'Records'}</span>
              </div>
              <div className="history-stat-divider" />
              <div className="history-stat">
                <span className="history-stat-value">{MILESTONES.length}</span>
                <span className="history-stat-label">{ko ? '주요 이정표' : 'Milestones'}</span>
              </div>
            </div>
          </header>

          {/* 32년 미니맵 — 한눈에 리듬 보기 */}
          <HistoryMinimap activeDecade={activeDecade} onPickYear={handlePickYear} ko={ko} />

          {/* 이정표 가로 릴 */}
          <MilestoneReel onPick={handlePickMilestone} ko={ko} />

          {/* 렌즈 전환 + 연대 칩 (헤더 아래 고정) */}
          <div ref={navSentinelRef} className="history-nav-sentinel" aria-hidden="true" />
          <div
            className="history-nav-slot"
            style={pinned ? { height: navHeight } : undefined}
          >
          <div ref={navRef} className={`history-nav glass-card ${pinned ? 'is-pinned' : ''}`}>
            <div className="history-lens-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={lens === 'era'}
                className={lens === 'era' ? 'active' : ''}
                onClick={() => switchLens('era')}
              >
                {ko ? '연대순' : 'By era'}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={lens === 'theme'}
                className={lens === 'theme' ? 'active' : ''}
                onClick={() => switchLens('theme')}
              >
                {ko ? '테마별' : 'By theme'}
              </button>
            </div>
            {lens === 'era' && (
              <div className="history-decade-chips">
                {DECADES.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    className={activeDecade === d.key ? 'active' : ''}
                    onClick={() => handleDecadeChip(d.key)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
            </div>
          </div>

          {/* 본문 */}
          <div className="history-body">
            {lens === 'era' ? (
              <EraTimeline
                openYears={openYears}
                onToggleYear={toggleYear}
                openItems={openItems}
                onToggleItem={toggleItem}
                flashedIndex={flashedIndex}
                sectionRef={registerSection}
                ko={ko}
              />
            ) : (
              <ThemeLens
                active={activeTheme}
                onSelect={setActiveTheme}
                openItems={openItems}
                onToggleItem={toggleItem}
                ko={ko}
              />
            )}
          </div>

          {/* 마무리 */}
          <footer className="history-epilogue">
            <p className="history-epilogue-copy">
              그리고, 이야기는
              <br />
              오늘도 계속됩니다.
            </p>
            <p className="history-epilogue-sub">
              {ko
                ? '이 발자취의 다음 페이지를 함께 써 내려가요.'
                : 'Come and write the next page with us.'}
            </p>
            <div className="history-epilogue-actions">
              <button type="button" className="primary" onClick={() => navigate('/about')}>
                {ko ? '참빛교회 소개 보기' : 'About Our Church'}
              </button>
              <button type="button" onClick={() => navigate('/worship')}>
                {ko ? '예배 시간 안내' : 'Worship Times'}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default History
