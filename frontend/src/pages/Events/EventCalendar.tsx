import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useEvents } from '../../hooks/useEvents'
import { useHolidayMap, yearsForMonthView } from '../../hooks/useHolidays'
import { translations } from '../../locales'
import type { EventCategory } from '../../types/event'
import CategoryPills from './components/CategoryPills'
import EventHeroCard from './components/EventHeroCard'
import WallCalendar from './components/WallCalendar'
import WeekPostcard, { PastPostcards } from './components/WeekPostcard'
import EmptyState from './components/EmptyState'
import { getNextEvent } from './utils/dateGrouping'
import { buildWeekCards } from './utils/weekPostcards'
import { kstNow, toKstCalendarDate } from '../../utils/kstTime'
import './styles/index.css'
import { can } from '../../utils/access'
import { ensureFontFamily } from '../../utils/deferredFonts'

// 우편엽서 손글씨(받는 사람·사진 설명·남은 쪽지) — 이 화면 청크가 로드될 때 붙인다
void ensureFontFamily('nanumPen')

/** PC 2단(lg) 여부 — 엽서 격자의 빈칸을 지난 일정으로 채울지 정할 때만 쓴다 */
const isWideScreen = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches

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
  // 달력에서 고른 날(YYYY-MM-DD) — 달력 아래 일력 칸에 그날 일정을 펼친다(없으면 오늘). 달을 넘기면 비운다
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

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

  // 법정 공휴일(임시·대체공휴일 포함) — 달력 칸을 붉게, 이름은 큰 달력 칸·작은 달력 아래 줄에
  const holidayYears = useMemo(() => yearsForMonthView(viewDate), [viewDate])
  const holidays = useHolidayMap(holidayYears)

  const heroEvent = useMemo(() => getNextEvent(events), [events])
  // 한 주 = 우편엽서 한 장. 히어로 일정도 그 주 엽서에 그대로 둔다 — 빠지면 한 주 흐름이 끊겨 보인다.
  // 이번 주 엽서는 지금 달을 볼 때만(일정이 없어도 '오늘' 띠로 지금 위치를 알려준다)
  const isCurrentMonth = useMemo(() => {
    const now = kstNow()
    return viewDate.getFullYear() === now.getFullYear() && viewDate.getMonth() === now.getMonth()
  }, [viewDate])
  const { weeks, past } = useMemo(
    () => buildWeekCards(events, { includeThisWeek: isCurrentMonth && events.length > 0 }),
    [events, isCurrentMonth],
  )

  // 머리 한 줄 — 조회 범위(이번 달 1일~다음 달 말일)엔 이미 지난 일정도 섞여 있어서
  // 전체 개수를 '예정'이라 부르면 틀린다. 오늘(KST) 이후 시작하는 일정만 센다 — '다가오는 일정'·히어로와 같은 기준
  const headline = useMemo(() => {
    const todayKey = formatYMD(kstNow())
    const lastDayKey = formatYMD(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0))
    if (lastDayKey < todayKey) {
      return events.length > 0 ? `이 달엔 ${events.length}건의 일정이 있었어요` : '이 달엔 일정이 없었어요'
    }
    const upcoming = events.filter(e => formatYMD(toKstCalendarDate(e.start_datetime)) >= todayKey).length
    return upcoming > 0 ? `앞으로 ${upcoming}건의 일정이 예정되어 있어요` : '앞으로 예정된 일정이 없어요'
  }, [events, viewDate])

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
  // 일력 넘기기(전날·다음 날) — 달 경계를 넘으면 달력도 그 달로
  const handleStepDay = (d: Date) => {
    setSelectedKey(formatYMD(d))
    if (d.getFullYear() !== viewDate.getFullYear() || d.getMonth() !== viewDate.getMonth()) {
      setViewDate(new Date(d.getFullYear(), d.getMonth(), 1))
    }
  }

  return (
    // lg: 이 페이지를 스스로 스크롤하는 상자로 만든다 — #root overflow 탓에 sticky 가 전역에서 죽어 있어,
    // 이 상자가 있어야 우측 달력 레일이 화면에 붙어 있는다 (높이는 PC 글씨 크기 zoom 배율로 나눈다)
    <div className="evt-page bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100 transition-colors duration-200 min-h-screen page-stage lg:h-[calc((100dvh-56px)/var(--az,1))] lg:min-h-0 lg:overflow-y-auto">
      {/* lg+: 좁은 셸을 풀고 본문(일정 목록) + 우측 레일(달력·고른 날·다가오는 일정) 2단 */}
      <div className="lg:max-w-[1320px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="evt-panel max-w-md mx-auto bg-[var(--app-canvas)] relative min-h-screen pb-24 lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:shadow-2xl lg:overflow-hidden lg:min-h-0">
        {/* 헤더 */}
        <header className="px-4 pt-5 pb-2 lg:px-6 lg:pt-7 lg:pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="evt-eyebrow text-brand text-[11.5px] lg:text-[14px] font-bold tracking-[0.12em] uppercase mb-1.5">
                CALENDAR
              </p>
              <h1 className="evt-title text-ink-strong text-[26px] lg:text-[34px] font-bold leading-none tracking-[-0.02em]">
                {t.title}
              </h1>
              <p className="evt-sub text-gray-500 dark:text-white/55 text-[13px] lg:text-[17px] lg:text-gray-600 lg:dark:text-white/70 mt-2 lg:mt-3">
                {loading || isPlaceholder ? '불러오는 중...' : headline}
              </p>
            </div>
            {admin && (
              <button
                type="button"
                onClick={() => navigate('/admin/events')}
                className="evt-admin inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand text-[12px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
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

        {/* 벽달력 + 일력 — lg에선 우측 레일의 같은 달력이 대신한다 */}
        <WallCalendar
          date={viewDate}
          events={events}
          holidays={holidays}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
          onToday={handleToday}
          onSelectDate={handleSelectDate}
          onStepDay={handleStepDay}
          selectedKey={selectedKey}
          className="mx-4 mb-6 lg:hidden"
        />

        {/* 어젠다 */}
        {loading && events.length === 0 ? (
          <div className="px-4 flex flex-col gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState category={selectedCategory} />
        ) : (
          // 한 주 = 엽서 한 장. lg+: 넓어진 본문에 2장씩 — 칸 수는 폭으로 정해 글씨를 키우면(PC zoom) 한 열로 풀린다
          // 지난 일정도 같은 격자의 한 칸 — PC 에서 엽서가 홀수 장이면 남는 오른쪽 칸에 펼쳐 둔다
          <div className="px-4 lg:px-6 grid grid-cols-1 gap-6 lg:grid-cols-[repeat(auto-fill,minmax(380px,1fr))] lg:items-start">
            {weeks.map((w) => <WeekPostcard key={w.mondayKey} week={w} />)}
            <PastPostcards
              key={`${startDate}-${selectedCategory ?? 'all'}`}
              events={past}
              defaultOpen={weeks.length === 0 || (weeks.length % 2 === 1 && isWideScreen())}
            />
          </div>
        )}
      </div>

      {/* 우측 레일 (lg+) — 벽달력 한 장에 일력(고른 날)·다가오는 일정까지. 페이지 상자 안 sticky 라 화면에 붙어 있다 */}
      <aside className="hidden lg:block lg:w-[400px] lg:shrink-0 lg:sticky lg:top-3">
        <WallCalendar
          date={viewDate}
          events={events}
          holidays={holidays}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
          onToday={handleToday}
          onSelectDate={handleSelectDate}
          onStepDay={handleStepDay}
          selectedKey={selectedKey}
          upcoming={upcomingList}
        />
      </aside>
      </div>
    </div>
  )
}

export default EventCalendar
