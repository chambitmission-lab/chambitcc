import { useLanguage } from '../../../contexts/LanguageContext'
import type { MyPrayer } from '../../../types/profile'
import { getRelativeTime } from '../../../utils/dateUtils'

interface MyPrayersListProps {
  prayers: MyPrayer[]
  onPrayerClick?: (prayerId: number) => void
}

const MyPrayersList = ({ prayers, onPrayerClick }: MyPrayersListProps) => {
  const { t, language } = useLanguage()
  
  if (prayers.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📝</span>
        <p className="empty-text">{t('profileEmptyPrayers')}</p>
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
            <span className="meta-item">🙏 {prayer.prayer_count}{language === 'ko' ? '명 ' : ' '}{t('peopleArePraying')}</span>
            <span className="meta-item">💬 {t('reply')} {prayer.reply_count}{t('replyCount')}</span>
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
