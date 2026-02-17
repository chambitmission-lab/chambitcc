interface EventInfoProps {
  startDate: string
  endDate: string
  location?: string
  attendanceCount: number
  views: number
  t: any
}

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

export const EventInfo = ({
  startDate,
  endDate,
  location,
  attendanceCount,
  views,
  t,
}: EventInfoProps) => {
  return (
    <div className="event-info-section">
      <div className="section-badge">📋 일정 정보</div>
      <div className="info-grid">
        <div className="info-card">
          <span className="info-icon">📅</span>
          <div>
            <div className="info-label">{t.startDate}</div>
            <div className="info-value">{formatDateTime(startDate)}</div>
          </div>
        </div>
        <div className="info-card">
          <span className="info-icon">🏁</span>
          <div>
            <div className="info-label">{t.endDate}</div>
            <div className="info-value">{formatDateTime(endDate)}</div>
          </div>
        </div>
        {location && (
          <div className="info-card">
            <span className="info-icon">📍</span>
            <div>
              <div className="info-label">{t.location}</div>
              <div className="info-value">{location}</div>
            </div>
          </div>
        )}
        <div className="info-card">
          <span className="info-icon">👥</span>
          <div>
            <div className="info-label">{t.attendanceCount}</div>
            <div className="info-value">{attendanceCount}명</div>
          </div>
        </div>
        <div className="info-card">
          <span className="info-icon">👁️</span>
          <div>
            <div className="info-label">{t.views}</div>
            <div className="info-value">{views}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
