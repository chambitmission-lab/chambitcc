import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import {
  getParable,
  INTRO_COURSE,
  PARABLES,
  TOPIC_HINT,
  TOPIC_LABEL,
  TOPIC_ORDER,
  type Parable,
  type ParableTopic,
} from '../data/parables'
import ParableVisual from './ParableVisual'
import { hasParableImage } from './parableImages'
import { useParableRead } from './parableProgress'
import { scheduleAfterFirstScreen } from '../../../utils/idlePreload'
import { cancelHoverWarm, hoverWarmParable, warmParable, warmParableSheet } from './parableWarm'
import './parables-tone.css'
import './ParablesPage.css'

const ParableSheet = lazy(() => import('./ParableSheet'))

type Filter = 'all' | ParableTopic

/** 날짜마다 바뀌는 오늘의 비유 — 안 읽은 것 중에서, 다 읽었으면 전체에서 */
const pickToday = (read: ReadonlySet<string>): Parable => {
  const d = new Date()
  const day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)
  const pool = PARABLES.filter((p) => !read.has(p.id))
  const list = pool.length ? pool : PARABLES
  return list[day % list.length]
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12l5 5 9-10" />
  </svg>
)

/**
 * 예수님의 비유(/bible/parables) — 초보자용 비유 도감.
 * 위: 처음 만나는 비유 5편(쉬운 순서, 지금 읽을 차례에 '읽기') → 다 읽으면 '오늘의 비유' 카드로 바뀐다.
 * 아래: 주제별 도감 격자(읽은 비유엔 점선 도장). 카드를 누르면 비유 시트가 열린다. ?p=<id> 로 바로 열 수 있다.
 */
const ParablesPage = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const read = useParableRead()
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<Parable | null>(() => getParable(params.get('p')) ?? null)

  const course = useMemo(() => INTRO_COURSE.map((id) => getParable(id)).filter((p): p is Parable => !!p), [])
  const courseNow = course.find((p) => !read.has(p.id))
  const courseDone = course.filter((p) => read.has(p.id)).length
  const today = useMemo(() => (courseNow ? null : pickToday(read)), [courseNow, read])

  // 시트 청크(JS·CSS 10여 개)를 첫 클릭 때에야 받으면 그동안 화면에 아무것도 안 뜬다 — 화면이 자리 잡으면 미리 받고,
  // 맨 위에서 권하는 비유(지금 읽을 차례 · 오늘의 비유)는 그림과 본문까지 받아 둔다.
  const firstPick = courseNow ?? today
  useEffect(
    () =>
      scheduleAfterFirstScreen(() => (firstPick ? warmParable(firstPick) : warmParableSheet()), {
        settleMs: 300,
        idleTimeoutMs: 2000,
      }),
    [firstPick],
  )
  useEffect(() => cancelHoverWarm, [])

  const groups = useMemo(
    () =>
      TOPIC_ORDER.filter((t) => filter === 'all' || filter === t)
        .map((topic) => ({ topic, items: PARABLES.filter((p) => p.topic === topic) }))
        .filter((g) => g.items.length),
    [filter],
  )

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="read" />
        <div className="max-w-md mx-auto min-h-screen pb-bottomnav-safe lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:min-h-0 lg:pb-8">
          {/* 모바일 헤더 */}
          <div className="lg:hidden sticky top-14 z-20 bg-[var(--app-canvas)] dark:bg-background-dark/95 backdrop-blur-sm px-4 py-3 flex items-center gap-2">
            <button
              onClick={() => navigate('/bible')}
              className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
              aria-label="성경으로"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span className="text-sm font-semibold">성경</span>
            </button>
            <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong mx-auto pr-10">예수님의 비유</h1>
          </div>

          <div className="pb-page">
            <h1 className="pb-page__title">예수님의 비유</h1>

            {/* 처음 만나는 비유 5편 → 다 읽으면 오늘의 비유 */}
            {courseNow ? (
              <section className="pb-course" aria-label="처음 만나는 비유">
                <p className="pb-course__k">처음 만나는 비유 · {course.length}편</p>
                <h2 className="pb-course__title">
                  쉬운 이야기부터 하나씩,
                  <br />
                  하루 3분이면 돼요
                </h2>
                <ol className="pb-steps">
                  {course.map((p, i) => {
                    const state = read.has(p.id) ? 'done' : p.id === courseNow.id ? 'now' : 'next'
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={`pb-step is-${state}`}
                          onPointerEnter={(e) => hoverWarmParable(e.pointerType, p)}
                          onPointerLeave={cancelHoverWarm}
                          onPointerDown={() => warmParable(p)}
                          onClick={() => setOpen(p)}
                        >
                          <span className="pb-step__num">{state === 'done' ? <CheckIcon /> : i + 1}</span>
                          <span className="pb-step__body">
                            <span className="pb-step__title">{p.title}</span>
                            <span className="pb-step__gist">{p.gist}</span>
                          </span>
                          {state === 'now' && <span className="pb-step__go">읽기</span>}
                        </button>
                      </li>
                    )
                  })}
                </ol>
                {courseDone > 0 && <p className="pb-course__foot">{courseDone}편 읽었어요 · 다 읽으면 매일 ‘오늘의 비유’를 골라 드려요</p>}
              </section>
            ) : (
              today && (
                <button
                  type="button"
                  className={`pb-today pb-tone--${today.topic}`}
                  onPointerEnter={(e) => hoverWarmParable(e.pointerType, today)}
                  onPointerLeave={cancelHoverWarm}
                  onPointerDown={() => warmParable(today)}
                  onClick={() => setOpen(today)}
                >
                  <span className={`pb-today__art${hasParableImage(today.id) ? ' has-img' : ''}`}>
                    <ParableVisual p={today} />
                  </span>
                  <span className="pb-today__body">
                    <span className="pb-today__k">오늘의 비유 · {TOPIC_LABEL[today.topic]}</span>
                    <span className="pb-today__title">{today.title}</span>
                    <span className="pb-today__gist">{today.summary}</span>
                  </span>
                  <span className="material-icons-round pb-today__go" aria-hidden>chevron_right</span>
                </button>
              )
            )}

            {/* 도감 */}
            <div className="pb-dex-head">
              <h2>전체 비유 도감</h2>
              <span>
                {read.size} / {PARABLES.length}
              </span>
            </div>
            <div className="pb-chips" role="tablist" aria-label="주제">
              {(['all', ...TOPIC_ORDER] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  className={`pb-chip${filter === f ? ' is-on seal-marker' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? '전체' : TOPIC_LABEL[f]}
                </button>
              ))}
            </div>

            {groups.map((g) => (
              <section key={g.topic} className="pb-group">
                <div className="pb-group__head">
                  <h3>{TOPIC_LABEL[g.topic]}</h3>
                  <span>{TOPIC_HINT[g.topic]}</span>
                </div>
                <ul className="pb-grid">
                  {g.items.map((p) => {
                    const done = read.has(p.id)
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={`pb-card pb-tone--${p.topic}${done ? ' is-read' : ''}`}
                          onPointerEnter={(e) => hoverWarmParable(e.pointerType, p)}
                          onPointerLeave={cancelHoverWarm}
                          onPointerDown={() => warmParable(p)}
                          onClick={() => setOpen(p)}
                        >
                          <span className={`pb-card__art${hasParableImage(p.id) ? ' has-img' : ''}`}>
                            <ParableVisual p={p} />
                          </span>
                          {done && (
                            <span className="pb-card__stamp" aria-label="읽음">
                              <CheckIcon />
                            </span>
                          )}
                          <span className="pb-card__title">{p.title}</span>
                          <span className="pb-card__gist">{p.gist}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}

            <p className="pb-foot">
              비유는 예수님이 일상의 이야기에 하나님 나라를 담아 하신 말씀이에요. 풀이는 처음 읽는 분을 위한 길잡이예요 —
              ‘성경에서 읽기’로 본문을 꼭 함께 읽어 보세요.
            </p>
          </div>
        </div>
      </div>

      {open && (
        <Suspense fallback={null}>
          <ParableSheet parable={open} onClose={() => setOpen(null)} onOpen={setOpen} />
        </Suspense>
      )}

      <BibleBottomNav active="read" />
    </div>
  )
}

export default ParablesPage
