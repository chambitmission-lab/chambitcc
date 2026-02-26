import { useState } from 'react'
import type { Prayer } from '../../../../types/prayer'
import PrayerHeader from './PrayerHeader'
import PrayerContent from './PrayerContent'
import PrayerActions from './PrayerActions'
import PrayerStats from './PrayerStats'
import PrayerVersePreview from './PrayerVersePreview'
import BibleVersesModal from '../BibleVersesModal'

interface PrayerArticleProps {
  prayer: Prayer
  onPrayerToggle: (prayerId: number) => void
  onClick: () => void
  onReplyClick: () => void
}

const PrayerArticle = ({ prayer, onPrayerToggle, onClick, onReplyClick }: PrayerArticleProps) => {
  const [isPraying, setIsPraying] = useState(false)
  const [showVersesModal, setShowVersesModal] = useState(false)

  const handlePray = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPraying) return
    setIsPraying(true)
    try {
      onPrayerToggle(prayer.id)
    } finally {
      setIsPraying(false)
    }
  }

  const handleVersesClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowVersesModal(true)
  }

  return (
    <article 
      className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark pb-4 mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
      onClick={onClick}
    >
      <PrayerHeader
        displayName={prayer.display_name}
        timeAgo={prayer.time_ago}
      />

      <PrayerContent
        title={prayer.title}
        content={prayer.content}
        transitionStyles={{}}
      />

      <PrayerActions
        isPrayed={prayer.is_prayed}
        isPraying={isPraying}
        onPray={handlePray}
        prayerText={`${prayer.title}. ${prayer.content}`}
      />

      <PrayerStats
        prayerCount={prayer.prayer_count}
        replyCount={prayer.reply_count}
        onReplyClick={onReplyClick}
      />

      {prayer.recommended_verses && prayer.recommended_verses.verses.length > 0 && (
        <PrayerVersePreview
          verses={prayer.recommended_verses}
          onVersesClick={handleVersesClick}
        />
      )}

      {showVersesModal && prayer.recommended_verses && (
        <BibleVersesModal
          verses={prayer.recommended_verses}
          onClose={() => setShowVersesModal(false)}
        />
      )}
    </article>
  )
}

export default PrayerArticle
