import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSurveys } from '../../../hooks/useSurvey'
import { isAuthenticated } from '../../../utils/auth'
import { ensureFontFamily } from '../../../utils/deferredFonts'
import { smoothScrollToElement } from '../../../utils/scrollTo'
import { HISTORY_EVENTS } from '../historyData'
import { INDEXED_EVENTS, MILESTONES, YEAR_BARS } from '../historyThemes'
import type { IndexedEvent } from '../historyThemes'
import './HistoryLab.css'

/*
 * 새 발자취(시범) — /history/new · "1994" 거대 타이포 포스터 시안(2026-11-07, 시안 I).
 * 기존 /history 는 그대로 두고 상단 '시범' 배너로만 들어온다. 이전 시범 4탭(이야기책·신문·나와 참빛·퀴즈)은 제거.
 *
 * 의견은 기존 설문 기능으로 받는다. 제목에 FEEDBACK_KEYWORD 가 들어간 진행 중 설문이 있으면
 * 그 설문으로 바로 가고, 없으면 설문 목록으로 보낸다 — 설문 id 를 코드에 박지 않기 위함.
 */
const FEEDBACK_KEYWORD = '발자취'

// 모듈 로드(라우트 청크 평가) 시점에 붙인다 — 첫 그림 전에 받기 시작하게
void ensureFontFamily('gasoekOne')

const FOUNDED = 1994
const HEADER_OFFSET = 64 // 고정 헤더 56 + 여백

// 기록에서 세지 않고 정리해 둔 숫자 — 바뀌면 여기만 고친다
//   예배 자리: 은하마을 거실 → 심곡동 22평 → 심곡2동 60평 → 중동 아주상가 → 상동 새 성전
//   담임목사: 김윤하(1994–2019) · 박원택(2019–2021) · 안동철(2022–)
const PLACES = 5
const PASTORS = 3

interface YearBlock {
  year: number
  count: number
  headline: string
  hasMilestone: boolean
  events: IndexedEvent[]
}

const firstLine = (text: string) => text.split('\n')[0].trim()

const shortDate = (e: IndexedEvent) => {
  const [, m, d] = e.event.d.split('-')
  return `${Number(m)}.${Number(d)}`
}

export default function HistoryLab() {
  const navigate = useNavigate()
  const thisYear = new Date().getFullYear()
  const [open, setOpen] = useState<Set<number>>(() => new Set())

  const loggedIn = isAuthenticated()
  const { data: surveys } = useSurveys(loggedIn)
  const feedbackSurvey = surveys?.find((s) => s.status === 'open' && s.title.includes(FEEDBACK_KEYWORD))
  const feedbackPath = feedbackSurvey ? `/survey/${feedbackSurvey.id}` : '/survey'

  const years = useMemo<YearBlock[]>(() => {
    const byYear = new Map<number, IndexedEvent[]>()
    INDEXED_EVENTS.forEach((e) => {
      const list = byYear.get(e.year)
      if (list) list.push(e)
      else byYear.set(e.year, [e])
    })
    return YEAR_BARS.map((bar) => {
      const events = byYear.get(bar.year) ?? []
      const milestone = events.find((e) => e.event.title)
      return {
        year: bar.year,
        count: bar.count,
        hasMilestone: Boolean(milestone),
        headline: milestone?.event.title ?? (events[0] ? firstLine(events[0].event.text) : '기록을 정리하고 있어요'),
        events,
      }
    })
  }, [])

  // 사선 띠 두 줄 — 이정표 제목을 앞뒤 반으로 나눠 흘린다
  const [bandA, bandB] = useMemo(() => {
    const titles = MILESTONES.map((m) => m.event.title as string)
    const half = Math.ceil(titles.length / 2)
    return [titles.slice(0, half), titles.slice(half)]
  }, [])

  const toggle = useCallback((year: number) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }, [])

  const jumpTo = (year: number) => {
    setOpen((prev) => new Set(prev).add(year))
    smoothScrollToElement(document.getElementById(`hp-year-${year}`), { offset: HEADER_OFFSET })
  }

  return (
    // 셸은 기존 /history 와 같은 문법 — 캔버스 위 1240 칼럼(lg)·모바일 max-w-md, 그 안에 둥근 포스터 판
    <div className="bg-[var(--app-canvas)] dark:bg-background-dark min-h-screen page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:px-5 lg:pt-3 lg:pb-12">
      <div className="hp max-w-md mx-auto min-h-screen lg:max-w-none lg:mx-0 lg:rounded-3xl lg:min-h-0">
      <div className="hp-wrap">
        <div className="hp-notice">
          <span className="hp-notice-badge">시범</span>
          <span className="hp-notice-text">새 발자취 화면을 미리 보고 계세요</span>
          <button type="button" className="hp-notice-back" onClick={() => navigate('/history')}>
            예전 화면 ←
          </button>
        </div>

        {/* 거대 숫자 히어로 */}
        <header className="hp-hero">
          <p className="hp-kicker">
            <span>CHAMBIT / ARCHIVE</span>
            <span>{years.length} YEARS</span>
          </p>
          <h1 className="hp-mega" aria-label={`${FOUNDED}년부터 ${thisYear}년까지`}>
            <span className="hp-mega-fill" aria-hidden="true">{FOUNDED}</span>
            <span className="hp-mega-line" aria-hidden="true">{thisYear}</span>
          </h1>
          <div className="hp-hero-foot">
            <p className="hp-hero-title">
              거실에서
              <br />
              시작된 빛
            </p>
            <p className="hp-hero-hint">
              SCROLL
              <br />한 해씩 내려가 보세요 ↓
            </p>
          </div>
        </header>

        {/* 사선 마키 띠 */}
        <div className="hp-bands" aria-hidden="true">
          <div className="hp-band hp-band--blue">
            <div className="hp-band-track">
              {[0, 1].map((k) => (
                <span key={k}>
                  {bandA.map((t) => (
                    <span key={t} className="hp-band-item">
                      {t}
                      <i>✦</i>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
          <div className="hp-band hp-band--paper">
            <div className="hp-band-track hp-band-track--reverse">
              {[0, 1].map((k) => (
                <span key={k}>
                  {bandB.map((t) => (
                    <span key={t} className="hp-band-item">
                      {t}
                      <i>✦</i>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 숫자 네 칸 */}
        <section className="hp-stats" aria-label="참빛의 숫자">
          <div className="hp-stat">
            <b>{thisYear - FOUNDED}</b>
            <span>해를 걸었고</span>
          </div>
          <div className="hp-stat">
            <b className="is-accent">{HISTORY_EVENTS.length}</b>
            <span>번 기록했고</span>
          </div>
          <div className="hp-stat">
            <b>{PLACES}</b>
            <span>곳의 자리를 거쳐</span>
          </div>
          <div className="hp-stat">
            <b>{PASTORS}</b>
            <span>분의 담임목사와 함께</span>
          </div>
        </section>

        {/* 32칸 바로 가기 */}
        <section className="hp-grid-sec">
          <h2 className="hp-sec-title">
            <span>INDEX</span>
            <span>해를 눌러 바로 가기</span>
          </h2>
          <div className="hp-grid">
            {years.map((y) => (
              <button
                key={y.year}
                type="button"
                className={`hp-cell${y.hasMilestone ? ' is-mark' : ''}`}
                onClick={() => jumpTo(y.year)}
                aria-label={`${y.year}년, 기록 ${y.count}개`}
              >
                {String(y.year).slice(2)}
              </button>
            ))}
          </div>
          <p className="hp-grid-legend">
            <span className="hp-legend-dot" /> 파란 칸은 큰 이정표가 있는 해
          </p>
        </section>

        {/* 한 해 한 줄 */}
        <section className="hp-years">
          {years.map((y) => {
            const isOpen = open.has(y.year)
            return (
              <article key={y.year} id={`hp-year-${y.year}`} className={`hp-year${isOpen ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="hp-year-head"
                  aria-expanded={isOpen}
                  onClick={() => toggle(y.year)}
                >
                  <span className={`hp-year-num${y.hasMilestone ? ' is-accent' : ''}`}>{y.year}</span>
                  <span className="hp-year-headline">{y.headline}</span>
                  <span className="hp-year-count">
                    {y.count}
                    <small>건</small>
                  </span>
                </button>
                {isOpen && (
                  <ol className="hp-records">
                    {y.events.map((e) => (
                      <li key={e.index} className={e.event.title ? 'is-mark' : ''}>
                        <span className="hp-rec-date">{shortDate(e)}</span>
                        <span className="hp-rec-body">
                          {e.event.title && <b>{e.event.title}</b>}
                          <span>{e.event.text}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            )
          })}
        </section>

        <footer className="hp-end">
          <p className="hp-end-mega" aria-hidden="true">
            {thisYear}
          </p>
          <p className="hp-end-copy">그리고, 이야기는 오늘도 계속됩니다.</p>
          <div className="hp-end-actions">
            <button type="button" className="hp-btn hp-btn--solid" onClick={() => navigate(feedbackPath)}>
              이 화면 의견 남기기 <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="hp-btn" onClick={() => navigate('/history')}>
              예전 발자취 화면 보기 <span aria-hidden="true">→</span>
            </button>
          </div>
        </footer>
      </div>
      </div>
      </div>
    </div>
  )
}
