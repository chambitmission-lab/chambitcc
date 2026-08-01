import { parseKstDate } from '../../../../utils/kstTime'
import type { Translation } from '../../../../locales'

interface EventInfoProps {
  startDate: string
  endDate: string
  location?: string
  attendanceCount: number
  views: number
  t: Translation
}

const formatDateTime = (datetime: string) => {
  // 교회 현지(서울) 시각으로 고정 표시
  return parseKstDate(datetime).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
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
