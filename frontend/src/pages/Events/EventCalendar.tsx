import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useEvents } from '../../hooks/useEvents'
import { translations } from '../../locales'
import type { EventCategory } from '../../types/event'
import CategoryPills from './components/CategoryPills'
import EventHeroCard from './components/EventHeroCard'
import MiniMonthStrip from './components/MiniMonthStrip'
import AgendaSection from './components/AgendaSection'
import EmptyState from './components/EmptyState'
import { preloadCategoryBackgrounds } from './utils/categoryConfig'
import { CategoryIcon } from './components/CategoryIcons'
import { buildEventDateMap, formatEventTime, getNextEvent, groupEventsByDate } from './utils/dateGrouping'
import { CATEGORY_VISUAL } from './utils/categoryConfig'
import { kstNow, toKstCalendarDate } from '../../utils/kstTime'
import './styles/index.css'
import { can } from '../../utils/access'

const formatYMD = (d: Date): string =>
  `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`

const EventCalendar = () => {
  const { language } = useLanguage()
  const t = translations[language]
  const navigate = useNavigate()
  const admin = can('content:manage')

  // 달력의 '오늘'과 보이는 달은 기기 타임존이 아니라 서울 기준
  const [viewDate, setViewDate] = useState(() => kstNow())
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | undefined>()
  // PC 레일 달력에서 고른 날(YYYY-MM-DD) — 그날 일정을 레일에 크게 펼친다. 달을 넘기면 비운다
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  // 일정 API를 기다리는 동안 Hero 배경을 병렬로 받아둔다 (팝인 방지)
  useEffect(() => {
    preloadCategoryBackgrounds()
  }, [])

  // 현재 보이는 달의 1일 ~ (과거 달이면 해당 달 말일 / 현재·미래 달이면 다음 달 말일) 까지 fetch
  const { startDate, endDate } = useMemo(() => {
    const now = kstNow()
    const isPastMonth =
      viewDate.getFullYear() < now.getFullYear() ||
      (viewDate.getFullYear() === now.getFullYear() && viewDate.getMonth() < now.getMonth())

    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    const end = isPastMonth
      ? new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
      : new Date(viewDate.getFullYear(), viewDate.getMonth() + 2, 0)
    return { startDate: formatYMD(start), endDate: formatYMD(end) }
  }, [viewDate])

  // keepPrevious: 달을 넘기면 조회 기간이 바뀌어 새 캐시 키가 되는데, 이때 스켈레톤이
  // 번쩍이지 않도록 직전 달 화면을 유지한 채 뒤에서 교체한다. 인접 달은 조회 범위가
  // 겹쳐서(이번 달 뷰가 다음 달까지 fetch) 잔상 데이터로도 점 표시가 대부분 정확하다.
  const { events, loading, hasMore, loadingMore, isPlaceholder, loadMore } = useEvents(
    startDate,
    endDate,
    selectedCategory,
    undefined,
    true,
  )

  // 달력은 조회 범위의 "전체" 일정이 있어야 날짜 점 표시와 어젠다가 온전하다.
  // 목록 API 는 20건 페이지라, 남은 페이지가 있으면 자동으로 이어받는다
  // (안 그러면 일정이 20건을 넘는 달의 뒷 일정이 조용히 누락된다).
  // placeholder(이전 키의 잔상)를 보는 동안에는 드레인하지 않는다 — 새 키의
  // 첫 페이지가 도착한 뒤에 이어받아야 올바른 페이지가 쌓인다.
  useEffect(() => {
    if (hasMore && !loading && !loadingMore && !isPlaceholder) loadMore()
    // loadMore 는 렌더마다 새로 만들어지지만 react-query 가 진행 중 fetch 를 dedupe 한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, loadingMore, isPlaceholder])

  const heroEvent = useMemo(() => getNextEvent(events), [events])
  const groups = useMemo(() => {
    // Hero에 표시된 이벤트는 어젠다에서 제외 (단, 오늘 여러 건 있으면 모두 보여줌)
    if (!heroEvent) return groupEventsByDate(events)
    const filtered = events.filter(e => e.id !== heroEvent.id)
    return groupEventsByDate(filtered)
  }, [events, heroEvent])

  const totalCount = events.length

  // 우측 레일 '다가오는 일정' — 오늘 이후 가까운 순 5건 (이미 받아둔 목록에서).
  // 날짜 비교는 어젠다와 같은 서울(KST) 벽시계 기준을 쓴다
  const upcomingList = useMemo(() => {
    const todayKey = formatYMD(kstNow())
    return events
      .map(e => ({ event: e, key: formatYMD(toKstCalendarDate(e.start_datetime)) }))
      .filter(x => x.key >= todayKey)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(0, 5)
  }, [events])

  const eventMap = useMemo(() => buildEventDateMap(events), [events])
  const selectedEvents = selectedKey ? (eventMap.get(selectedKey) ?? []) : []
  const selectedLabel = selectedKey
    ? (() => {
        const [, m, d] = selectedKey.split('-').map(Number)
        const dow = ['일', '월', '화', '수', '목', '금', '토'][new Date(Number(selectedKey.slice(0, 4)), m - 1, d).getDay()]
        return `${m}월 ${d}일 (${dow})`
      })()
    : ''

  const handlePrevMonth = () => {
    setSelectedKey(null)
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  const handleNextMonth = () => {
    setSelectedKey(null)
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }
  const handleToday = () => {
    const now = kstNow()
    setViewDate(now)
    setSelectedKey(formatYMD(now))
  }
  const handleSelectDate = (d: Date) => {
    const key = formatYMD(d)
    setSelectedKey(prev => (prev === key ? null : key))
  }

  return (
    // lg: 이 페이지를 스스로 스크롤하는 상자로 만든다 — #root overflow 탓에 sticky 가 전역에서 죽어 있어,
    // 이 상자가 있어야 우측 달력 레일이 화면에 붙어 있는다 (높이는 PC 글씨 크기 zoom 배율로 나눈다)
    <div className="bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100 transition-colors duration-200 min-h-screen page-stage lg:h-[calc((100vh-56px)/var(--az,1))] lg:min-h-0 lg:overflow-y-auto">
      {/* lg+: 좁은 셸을 풀고 본문(일정 목록) + 우측 레일(달력·고른 날·다가오는 일정) 2단 */}
      <div className="lg:max-w-[1320px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-[var(--app-canvas)] relative min-h-screen pb-24 lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden lg:min-h-0">
        {/* 헤더 */}
        <header className="px-4 pt-5 pb-2 lg:px-6 lg:pt-7 lg:pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-brand text-[11.5px] lg:text-[14px] font-bold tracking-[0.12em] uppercase mb-1.5">
                CALENDAR
              </p>
              <h1 className="text-ink-strong text-[26px] lg:text-[34px] font-bold leading-none tracking-[-0.02em]">
                {t.title}
              </h1>
              <p className="text-gray-500 dark:text-white/55 text-[13px] lg:text-[17px] lg:text-gray-600 lg:dark:text-white/70 mt-2 lg:mt-3">
                {loading || isPlaceholder ? '불러오는 중...' : `${totalCount}건의 일정이 예정되어 있어요`}
              </p>
            </div>
            {admin && (
              <button
                type="button"
                onClick={() => navigate('/admin/events')}
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand text-[12px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                관리
              </button>
            )}
          </div>
        </header>

        {/* 카테고리 칩 */}
        <CategoryPills value={selectedCategory} onChange={setSelectedCategory} />

        {/* Hero */}
        {loading && events.length === 0 ? (
          <div className="mx-4 mb-4 h-40 rounded-3xl bg-gray-100 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] animate-pulse" />
        ) : heroEvent ? (
          <EventHeroCard event={heroEvent} />
        ) : null}

        {/* 미니 월 캘린더 — lg에선 우측 레일의 같은 달력이 대신한다 */}
        <MiniMonthStrip
          date={viewDate}
          events={events}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
          onToday={handleToday}
          className="mx-4 mb-4 lg:hidden"
        />

        {/* 어젠다 */}
        {loading && events.length === 0 ? (
          <div className="px-4 flex flex-col gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 && !heroEvent ? (
          <EmptyState category={selectedCategory} />
        ) : (
          // lg+: 넓어진 본문을 세로로만 쓰지 않도록 날짜 그룹을 2열로 — 칸 수는 폭으로 정해
          // 글씨를 키우면(PC 글씨 크기 zoom) 한 열로 풀린다
          <div className="lg:grid lg:grid-cols-[repeat(auto-fill,minmax(360px,1fr))] lg:items-start lg:px-2">
            {groups.map(group => <AgendaSection key={group.key} group={group} />)}
          </div>
        )}
      </div>

      {/* 우측 위젯 레일 (lg+) — 큰 달력 + 고른 날 일정 + 다가오는 일정. 페이지 상자 안 sticky 라 화면에 붙어 있다 */}
      <aside className="hidden lg:flex lg:w-[400px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-3">
        <MiniMonthStrip
          date={viewDate}
          events={events}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
          onToday={handleToday}
          onSelectDate={handleSelectDate}
          selectedKey={selectedKey}
          large
          className=""
        />

        {/* 고른 날 — 날짜를 누르면 그날 일정이 여기에 크게 펼쳐진다 */}
        <section className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-none p-5">
          {selectedKey ? (
            <>
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <p className="text-ink-strong text-[20px] font-bold tracking-[-0.01em]">{selectedLabel}</p>
                <button
                  type="button"
                  onClick={() => setSelectedKey(null)}
                  className="shrink-0 h-9 px-3 rounded-full text-[14px] font-semibold text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                >
                  닫기
                </button>
              </div>
              {selectedEvents.length === 0 ? (
                <p className="text-[16px] text-gray-500 dark:text-white/60 py-2">이날은 일정이 없어요</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {selectedEvents.map(ev => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className="relative text-left rounded-xl border border-gray-200/70 dark:border-white/[0.08] pl-5 pr-4 py-3.5 overflow-hidden hover:border-brand hover:bg-[var(--brand-soft)] transition-colors"
                    >
                      <span className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${CATEGORY_VISUAL[ev.category].gradient}`} />
                      <p className="text-brand text-[18px] font-bold tabular-nums">{formatEventTime(ev.start_datetime)}</p>
                      <p className="mt-1 text-ink-strong text-[20px] font-bold leading-[1.35] tracking-[-0.01em] line-clamp-2">
                        <CategoryIcon category={ev.category} width={17} height={17} className="inline-block align-[-2px] mr-1.5 text-brand" />
                        {ev.title}
                      </p>
                      {ev.location && (
                        <p className="mt-1 text-[16px] text-gray-600 dark:text-white/70 truncate">📍 {ev.location}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-[16px] leading-relaxed text-gray-600 dark:text-white/65 break-keep">
              달력에서 날짜를 누르면 그날 일정이 여기에 크게 나와요.
            </p>
          )}
        </section>

        {upcomingList.length > 0 && (
          <section className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-none p-5">
            <p className="mb-2 text-[15px] font-bold text-gray-600 dark:text-white/65">
              다가오는 일정
            </p>
            <div className="flex flex-col -mx-1">
              {upcomingList.map(({ event: ev, key }) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => navigate(`/events/${ev.id}`)}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-left hover:bg-[var(--brand-soft)] transition-colors"
                >
                  <span className="shrink-0 w-14 text-[15px] font-bold tabular-nums text-brand">
                    {Number(key.slice(5, 7))}/{Number(key.slice(8, 10))}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-[16.5px] font-semibold text-ink-strong">
                    {ev.title}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </aside>
      </div>
    </div>
  )
}

export default EventCalendar
