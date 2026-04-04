import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useEvents } from '../../hooks/useEvents'
import { translations } from '../../locales'
import type { EventCategory } from '../../types/event'
import './Events.css'

const Events = () => {
  const { language } = useLanguage()
  const t = translations[language]
  const navigate = useNavigate()
  const [category, setCategory] = useState<EventCategory | undefined>()
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const { events, loading, error, hasMore, loadMore } = useEvents(
    startDate || undefined,
    endDate || undefined,
    category
  )

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryClass = (cat: EventCategory) => {
    return `category-${cat}`
  }

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>{t.title}</h1>
      </div>

      <div className="events-filters">
        <div className="filter-group">
          <label>{t.category}</label>
          <select
            value={category || ''}
            onChange={(e) => setCategory(e.target.value as EventCategory || undefined)}
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

        <div className="filter-group">
          <label>{t.startDate}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>{t.endDate}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && events.length === 0 ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t.loading}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="no-events">
          <p>{t.noEvents}</p>
        </div>
      ) : (
        <>
          <div className="events-grid">
            {events.map((event) => (
              <div
                key={event.id}
                className="event-card"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <span className={`event-category ${getCategoryClass(event.category)}`}>
                  {t.categories[event.category]}
                </span>
                <h3 className="event-title">{event.title}</h3>
                <div className="event-datetime">
                  📅 {formatDateTime(event.start_datetime)}
                </div>
                {event.location && (
                  <div className="event-location">
                    📍 {event.location}
                  </div>
                )}
                <div className="event-footer">
                  <div className="event-stats">
                    <span>👥 {event.attendance_count}</span>
                    <span>👁️ {event.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              className="load-more-btn"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? t.loading : t.loadMore}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default Events
