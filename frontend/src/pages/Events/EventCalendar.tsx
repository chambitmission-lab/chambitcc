import { useState, useMemo, useCallback } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useEvents } from '../../hooks/useEvents'
import { translations } from '../../locales'
import type { Event, EventCategory } from '../../types/event'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './EventCalendar.css'

const locales = {
  'ko': ko,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

type CalendarView = 'month' | 'week' | 'day' | 'agenda'

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: Event
}

const EventCalendar = () => {
  const { language } = useLanguage()
  const t = translations[language]
  const navigate = useNavigate()
  const [view, setView] = useState<CalendarView>('month')
  const [date, setDate] = useState(new Date())
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | undefined>()

  // 현재 보이는 달의 시작/끝 날짜 계산
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    }
  }, [date])

  const { events, loading } = useEvents(startDate, endDate, selectedCategory)

  // 이벤트를 달력 형식으로 변환
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_datetime),
      end: new Date(event.end_datetime),
      resource: event,
    }))
  }, [events])

  // 이벤트 클릭 핸들러
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    navigate(`/events/${event.id}`)
  }, [navigate])

  // 이벤트 스타일
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const categoryColors: Record<EventCategory, string> = {
      worship: '#3b82f6',
      meeting: '#f59e0b',
      service: '#10b981',
      special: '#ec4899',
      education: '#8b5cf6',
      other: '#6b7280',
    }

    return {
      style: {
        backgroundColor: categoryColors[event.resource.category],
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
      }
    }
  }, [])

  // 달력 메시지 한글화
  const messages = {
    allDay: '종일',
    previous: '이전',
    next: '다음',
    today: '오늘',
    month: '월',
    week: '주',
    day: '일',
    agenda: '일정',
    date: '날짜',
    time: '시간',
    event: '일정',
    noEventsInRange: '해당 기간에 일정이 없습니다.',
    showMore: (total: number) => `+${total} 더보기`,
  }

  return (
    <div className="event-calendar-page">
      <div className="calendar-header">
        <h1>{t.title}</h1>
        
        <div className="calendar-filters">
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value as EventCategory || undefined)}
            className="category-filter"
          >
            <option value="">{t.categories.all}</option>
            <option value="worship">{t.categories.worship}</option>
            <option value="meeting">{t.categories.meeting}</option>
            <option value="service">{t.categories.service}</option>
            <option value="special">{t.categories.special}</option>
            <option value="education">{t.categories.education}</option>
            <option value="other">{t.categories.other}</option>
          </select>
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#3b82f6' }}></span>
          <span>{t.categories.worship}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#f59e0b' }}></span>
          <span>{t.categories.meeting}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#10b981' }}></span>
          <span>{t.categories.service}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#ec4899' }}></span>
          <span>{t.categories.special}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#8b5cf6' }}></span>
          <span>{t.categories.education}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#6b7280' }}></span>
          <span>{t.categories.other}</span>
        </div>
      </div>

      {loading && events.length === 0 ? (
        <div className="loading-spinner">
          <p>{t.loading}</p>
        </div>
      ) : (
        <div className="calendar-container">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            messages={messages}
            culture="ko"
            popup
          />
        </div>
      )}
    </div>
  )
}

export default EventCalendar
