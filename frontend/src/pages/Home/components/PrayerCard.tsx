// 개별 기도 요청 카드
import { useState } from 'react'
import type { Prayer } from '../../../types/prayer'

interface PrayerCardProps {
  prayer: Prayer
  onPrayerToggle: (prayerId: number) => void
}

const PrayerCard = ({ prayer, onPrayerToggle }: PrayerCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPraying, setIsPraying] = useState(false)

  const handlePrayClick = async () => {
    if (isPraying) return
    
    setIsPraying(true)
    await onPrayerToggle(prayer.id)
    setIsPraying(false)
  }

  const truncateContent = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <article className="prayer-card">
      <div className="card-header">
        <div className="card-avatar">
          {prayer.display_name.charAt(0).toUpperCase()}
        </div>
        <div className="card-meta">
          <span className="card-author">{prayer.display_name}</span>
          <span className="card-time">{prayer.time_ago}</span>
        </div>
      </div>

      <h3 className="card-title">{prayer.title}</h3>

      <div className="card-content">
        <p className={`card-text ${isExpanded ? 'expanded' : ''}`}>
          {isExpanded ? prayer.content : truncateContent(prayer.content)}
        </p>
        {prayer.content.length > 120 && (
          <button
            className="card-expand"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '접기' : '더보기'}
          </button>
        )}
      </div>

      <div className="card-footer">
        <button
          className={`prayer-button ${prayer.is_prayed ? 'prayed' : ''}`}
          onClick={handlePrayClick}
          disabled={isPraying}
        >
          <span className="prayer-icon">🙏</span>
          <span className="prayer-count">{prayer.prayer_count}</span>
        </button>

        <div className="card-stats">
          <span className="stat-item">
            💬 {prayer.reply_count}
          </span>
        </div>
      </div>
    </article>
  )
}

export default PrayerCard
