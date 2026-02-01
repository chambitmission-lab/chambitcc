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
  const [showEnglish, setShowEnglish] = useState(false)

  // Anonymous를 익명으로 변환
  const displayName = prayer.display_name === 'Anonymous' ? '익명' : prayer.display_name
  
  // 영어 번역이 있는지 확인
  const hasTranslation = !!(prayer.title_en && prayer.content_en)

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
  
  // 현재 표시할 제목과 내용 결정
  const displayTitle = showEnglish && prayer.title_en ? prayer.title_en : prayer.title
  const displayContent = showEnglish && prayer.content_en ? prayer.content_en : prayer.content

  return (
    <article className="prayer-card">
      <div className="card-header">
        <div className="card-avatar">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="card-meta">
          <span className="card-author">{displayName}</span>
          <span className="card-time">{prayer.time_ago}</span>
        </div>
        {hasTranslation && (
          <button
            className="language-toggle"
            onClick={() => setShowEnglish(!showEnglish)}
            title={showEnglish ? '한글로 보기' : 'View in English'}
          >
            {showEnglish ? '🇰🇷 한글' : '🇺🇸 English'}
          </button>
        )}
      </div>

      <h3 className="card-title">{displayTitle}</h3>

      <div className="card-content">
        <p className={`card-text ${isExpanded ? 'expanded' : ''}`}>
          {isExpanded ? displayContent : truncateContent(displayContent)}
        </p>
        {displayContent.length > 120 && (
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
