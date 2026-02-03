import type { MyPrayer } from '../../../types/profile'
import { getRelativeTime } from '../../../utils/dateUtils'

interface MyPrayersListProps {
  prayers: MyPrayer[]
  onPrayerClick?: (prayerId: number) => void
}

const MyPrayersList = ({ prayers, onPrayerClick }: MyPrayersListProps) => {
  if (prayers.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📝</span>
        <p className="empty-text">아직 작성한 기도가 없습니다</p>
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
          <h4 className="item-title">{prayer.title}</h4>
          <p className="item-content">{prayer.content}</p>
          <div className="item-meta">
            <span className="meta-item">🙏 {prayer.prayer_count}명 기도중</span>
            <span className="meta-item">💬 {prayer.reply_count}개 댓글</span>
            <span className="meta-item meta-time">
              {getRelativeTime(prayer.created_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MyPrayersList
