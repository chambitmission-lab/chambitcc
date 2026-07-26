import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { DECADES, HISTORY_EVENTS, decadeOf } from './historyData'
import type { HistoryEvent } from './historyData'
import './History.css'

type ViewMode = 'story' | 'all'

interface YearGroup {
  year: number
  events: Array<{ event: HistoryEvent; index: number }>
}

interface DecadeGroup {
  key: string
  years: YearGroup[]
}

const yearOf = (event: HistoryEvent) => Number(event.d.slice(0, 4))

// '1995-07-31' (+ 종료일) → '7월 31일' / '7월 31일 – 8월 2일'
const formatDate = (event: HistoryEvent): string => {
  const fmt = (iso: string) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`
  if (!event.d2) return fmt(event.d)
  const sameYear = event.d.slice(0, 4) === event.d2.slice(0, 4)
  const end = sameYear ? fmt(event.d2) : `${event.d2.slice(0, 4)}년 ${fmt(event.d2)}`
  return `${fmt(event.d)} – ${end}`
}

// 접기 기준 — 이보다 길거나 명단(줄바꿈)이 있으면 탭해서 펼친다
const COLLAPSE_THRESHOLD = 90

const History = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const ko = language === 'ko'

  const [mode, setMode] = useState<ViewMode>('story')
  const [activeDecade, setActiveDecade] = useState(DECADES[0].key)
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set())
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const groups = useMemo<DecadeGroup[]>(() => {
    const byDecade = new Map<string, Map<number, YearGroup>>()
    HISTORY_EVENTS.forEach((event, index) => {
      if (mode === 'story' && !event.icon) return
      const year = yearOf(event)
      const dKey = decadeOf(year)
      if (!byDecade.has(dKey)) byDecade.set(dKey, new Map())
      const years = byDecade.get(dKey)!
      if (!years.has(year)) years.set(year, { year, events: [] })
      years.get(year)!.events.push({ event, index })
    })
    return DECADES.filter((d) => byDecade.has(d.key)).map((d) => ({
      key: d.key,
      years: [...byDecade.get(d.key)!.values()].sort((a, b) => a.year - b.year),
    }))
  }, [mode])

  const milestoneCount = useMemo(
    () => HISTORY_EVENTS.filter((e) => e.icon).length,
    [],
  )
  const journeyYears = new Date().getFullYear() - 1994

  // 스크롤 위치에 따라 활성 연대 추적
  useEffect(() => {
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
  }, [groups])

  const scrollToDecade = (key: string) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggleExpand = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        <div className="history-page">
          {/* Hero */}
          <header className="history-hero">
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
                <span className="history-stat-value">{milestoneCount}</span>
                <span className="history-stat-label">{ko ? '주요 이정표' : 'Milestones'}</span>
              </div>
            </div>
          </header>

          {/* 모드 토글 + 연대 네비 (스티키) */}
          <div className="history-nav glass-card">
            <div className="history-mode-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'story'}
                className={mode === 'story' ? 'active' : ''}
                onClick={() => setMode('story')}
              >
                {ko ? '주요 순간' : 'Highlights'}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'all'}
                className={mode === 'all' ? 'active' : ''}
                onClick={() => setMode('all')}
              >
                {ko ? '전체 기록' : 'Full Record'}
              </button>
            </div>
            <div className="history-decade-chips">
              {DECADES.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  className={activeDecade === d.key ? 'active' : ''}
                  onClick={() => scrollToDecade(d.key)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* 타임라인 */}
          <div className="history-body">
            {groups.map((group) => {
              const meta = DECADES.find((d) => d.key === group.key)!
              return (
                <section
                  key={`${mode}-${group.key}`}
                  data-decade={group.key}
                  ref={(el) => {
                    sectionRefs.current[group.key] = el
                  }}
                  className="history-decade"
                >
                  {/* 연대 챕터 헤더 */}
                  <div className="history-chapter">
                    <div className="history-chapter-era">
                      <span>{meta.label}</span>
                      <span className="history-chapter-period">{meta.period}</span>
                    </div>
                    <h2 className="history-chapter-title">{meta.title}</h2>
                    <p className="history-chapter-copy">{meta.copy}</p>
                  </div>

                  {/* 연도별 이벤트 */}
                  <div className="history-timeline">
                    {group.years.map((yg) => (
                      <div key={yg.year} className="history-year">
                        <div className="history-year-label">
                          <span>{yg.year}</span>
                        </div>
                        {yg.events.map(({ event, index }) => {
                          const isMilestone = Boolean(event.icon)
                          const collapsible =
                            event.text.length > COLLAPSE_THRESHOLD || event.text.includes('\n')
                          const isOpen = expanded.has(index)
                          return (
                            <div
                              key={index}
                              className={`history-item ${isMilestone ? 'milestone' : ''}`}
                            >
                              <div className="history-item-marker">
                                {isMilestone ? (
                                  <span className="history-item-icon">{event.icon}</span>
                                ) : (
                                  <span className="history-item-dot" />
                                )}
                              </div>
                              <button
                                type="button"
                                className={`history-item-card ${isOpen ? 'open' : ''} ${
                                  collapsible ? 'collapsible' : ''
                                }`}
                                onClick={() => collapsible && toggleExpand(index)}
                              >
                                <span className="history-item-date">{formatDate(event)}</span>
                                {isMilestone && (
                                  <span className="history-item-title">{event.title}</span>
                                )}
                                <span
                                  className={`history-item-text ${
                                    collapsible && !isOpen ? 'clamped' : ''
                                  }`}
                                >
                                  {event.text}
                                </span>
                                {collapsible && (
                                  <span className="history-item-more">
                                    {isOpen ? (ko ? '접기' : 'Less') : ko ? '더보기' : 'More'}
                                  </span>
                                )}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
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
