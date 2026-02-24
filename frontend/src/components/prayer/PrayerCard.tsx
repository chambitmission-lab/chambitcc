// 기도 카드 컴포넌트 (그룹 배지 포함)
import type { Prayer } from '../../types/prayer'
import './PrayerCard.css'

interface PrayerCardProps {
  prayer: Prayer
  onPrayerToggle?: (prayerId: number) => void
  onReplyClick?: (prayerId: number) => void
  isToggling?: boolean
}

const PrayerCard = ({ 
  prayer, 
  onPrayerToggle,
  onReplyClick,
  isToggling = false 
}: PrayerCardProps) => {
  return (
    <div className="prayer-card">
      {/* 그룹 배지 */}
      {prayer.group && (
        <div className="prayer-group-badge">
          <span className="badge-icon">{prayer.group.icon}</span>
          <span className="badge-name">{prayer.group.name}</span>
        </div>
      )}
      
      {/* 헤더 */}
      <div className="prayer-card-header">
        <div className="prayer-author">
          <span className="author-name">{prayer.display_name}</span>
          <span className="prayer-time">{prayer.time_ago}</span>
        </div>
        {prayer.is_owner && (
          <span className="owner-badge">내 기도</span>
        )}
      </div>
      
      {/* 제목 */}
      <h3 className="prayer-title">{prayer.title}</h3>
      
      {/* 내용 */}
      <p className="prayer-content">{prayer.content}</p>
      
      {/* 액션 버튼 */}
      <div className="prayer-actions">
        <button
          className={`action-button ${prayer.is_prayed ? 'active' : ''}`}
          onClick={() => onPrayerToggle?.(prayer.id)}
          disabled={isToggling}
        >
          <span className="action-icon">🙏</span>
          <span className="action-text">
            {prayer.is_prayed ? '기도했어요' : '기도하기'}
          </span>
          <span className="action-count">{prayer.prayer_count}</span>
        </button>
        
        <button
          className="action-button"
          onClick={() => onReplyClick?.(prayer.id)}
        >
          <span className="action-icon">💬</span>
          <span className="action-text">댓글</span>
          <span className="action-count">{prayer.reply_count}</span>
        </button>
      </div>
    </div>
  )
}

export default PrayerCard
