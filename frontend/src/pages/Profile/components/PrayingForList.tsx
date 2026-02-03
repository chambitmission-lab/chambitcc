import type { PrayingFor } from '../../../types/profile'
import { getRelativeTime } from '../../../utils/dateUtils'

interface PrayingForListProps {
  prayers: PrayingFor[]
  onPrayerClick?: (prayerId: number) => void
}

const PrayingForList = ({ prayers, onPrayerClick }: PrayingForListProps) => {
  if (prayers.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🙏</span>
        <p className="empty-text">아직 기도중인 항목이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="content-list">
      {prayers.map((prayer) => (
        <div
          key={prayer.id}
          className="content-item"
          onClick={() => onPrayerClick?.(prayer.id)}
        >
          <div className="item-header">
            <span className="item-author">{prayer.display_name}</span>
            <span className="item-badge">기도중</span>
          </div>
          <h4 className="item-title">{prayer.title}</h4>
          <p className="item-content">{prayer.content}</p>
          <div className="item-meta">
            <span className="meta-item">🙏 {prayer.prayer_count}명 기도중</span>
            <span className="meta-item meta-time">
              {getRelativeTime(prayer.prayed_at)} 기도함
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PrayingForList
