import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useEvents } from '../../hooks/useEvents'
import { isAdmin } from '../../utils/auth'
import { translations } from '../../locales'
import type { EventCategory } from '../../types/event'
import CategoryPills from './components/CategoryPills'
import EventHeroCard from './components/EventHeroCard'
import MiniMonthStrip from './components/MiniMonthStrip'
import AgendaSection from './components/AgendaSection'
import EmptyState from './components/EmptyState'
import { getNextEvent, groupEventsByDate } from './utils/dateGrouping'
import './styles/index.css'

const formatYMD = (d: Date): string =>
  `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`

const EventCalendar = () => {
  const { language } = useLanguage()
  const t = translations[language]
  const navigate = useNavigate()
  const admin = isAdmin()

  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | undefined>()

  // 현재 보이는 달의 1일 ~ (과거 달이면 해당 달 말일 / 현재·미래 달이면 다음 달 말일) 까지 fetch
  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    const isPastMonth =
      viewDate.getFullYear() < now.getFullYear() ||
      (viewDate.getFullYear() === now.getFullYear() && viewDate.getMonth() < now.getMonth())

    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    const end = isPastMonth
      ? new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
      : new Date(viewDate.getFullYear(), viewDate.getMonth() + 2, 0)
    return { startDate: formatYMD(start), endDate: formatYMD(end) }
  }, [viewDate])

  const { events, loading } = useEvents(startDate, endDate, selectedCategory)

  const heroEvent = useMemo(() => getNextEvent(events), [events])
  const groups = useMemo(() => {
    // Hero에 표시된 이벤트는 어젠다에서 제외 (단, 오늘 여러 건 있으면 모두 보여줌)
    if (!heroEvent) return groupEventsByDate(events)
    const filtered = events.filter(e => e.id !== heroEvent.id)
    return groupEventsByDate(filtered)
  }, [events, heroEvent])

  const totalCount = events.length
  const isFiltered = selectedCategory !== undefined

  const handlePrevMonth = () => {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  const handleNextMonth = () => {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }
  const handleToday = () => setViewDate(new Date())

  return (
    <div className="bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100 transition-colors duration-200 min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl relative border-x border-border-light dark:border-border-dark min-h-screen pb-24">
        {/* 헤더 */}
        <header className="px-4 pt-5 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-600 dark:text-purple-300/80 text-[11.5px] font-bold tracking-[0.12em] uppercase mb-1.5">
                CALENDAR
              </p>
              <h1 className="text-gray-900 dark:text-white text-[26px] font-bold leading-none tracking-[-0.02em]">
                {t.title}
              </h1>
              <p className="text-gray-500 dark:text-white/55 text-[13px] mt-2">
                {loading ? '불러오는 중...' : `${totalCount}건의 일정이 예정되어 있어요`}
              </p>
            </div>
            {admin && (
              <button
                type="button"
                onClick={() => navigate('/admin/events')}
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-purple-500/10 dark:bg-purple-500/15 border border-purple-400/40 dark:border-purple-500/30 text-purple-600 dark:text-purple-300 text-[12px] font-bold hover:bg-purple-500/20 dark:hover:bg-purple-500/25 transition-colors"
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
          <div className="mx-4 mb-4 h-40 rounded-3xl bg-gray-100 dark:bg-[#1c1c26] border border-gray-200/70 dark:border-white/[0.06] animate-pulse" />
        ) : heroEvent ? (
          <EventHeroCard event={heroEvent} />
        ) : null}

        {/* 미니 월 캘린더 */}
        <MiniMonthStrip
          date={viewDate}
          events={events}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
          onToday={handleToday}
        />

        {/* 어젠다 */}
        {loading && events.length === 0 ? (
          <div className="px-4 flex flex-col gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-[#1c1c26] border border-gray-200/70 dark:border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 && !heroEvent ? (
          <EmptyState filtered={isFiltered} />
        ) : (
          groups.map(group => <AgendaSection key={group.key} group={group} />)
        )}
      </div>
    </div>
  )
}

export default EventCalendar
