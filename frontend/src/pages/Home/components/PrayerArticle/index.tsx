import { useState } from 'react'
import type { Prayer } from '../../../../types/prayer'
import PrayerHeader from './PrayerHeader'
import PrayerContent from './PrayerContent'
import PrayerActions from './PrayerActions'
import PrayerStats from './PrayerStats'
import PrayerVersePreview from './PrayerVersePreview'
import BibleVersesModal from '../BibleVersesModal'
import { getGroupColorTheme, getGroupColorCSSVars } from '../../../../utils/groupColors'

interface PrayerArticleProps {
  prayer: Prayer
  onPrayerToggle: (prayerId: number) => void
  onAnswerToggle?: (prayerId: number) => void
  onClick: () => void
  onReplyClick: () => void
}

const PrayerArticle = ({ prayer, onPrayerToggle, onAnswerToggle, onClick, onReplyClick }: PrayerArticleProps) => {
  const [isPraying, setIsPraying] = useState(false)
  const [showVersesModal, setShowVersesModal] = useState(false)
  
  // 그룹 색상 테마 가져오기
  const colorTheme = getGroupColorTheme(prayer.group?.name)
  const cssVars = getGroupColorCSSVars(colorTheme)

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

  const handleAnswer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAnswerToggle?.(prayer.id)
  }

  const handleVersesClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowVersesModal(true)
  }

  return (
    <article 
      className={`prayer-card bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark pb-4 mb-3 cursor-pointer transition-all ${prayer.is_answered ? 'answered-article' : ''}`}
      onClick={onClick}
      style={cssVars as React.CSSProperties}
    >
      <PrayerHeader
        displayName={prayer.display_name}
        timeAgo={prayer.time_ago}
        groupName={prayer.group?.name}
        colorTheme={colorTheme}
      />

      <PrayerContent
        title={prayer.title}
        content={prayer.content}
        testimony={prayer.testimony}
        isAnswered={prayer.is_answered}
        transitionStyles={{}}
      />

      <PrayerActions
        isPrayed={prayer.is_prayed}
        isPraying={isPraying}
        onPray={handlePray}
        prayerText={`${prayer.title}. ${prayer.content}`}
        colorTheme={colorTheme}
        isOwner={prayer.is_owner}
        isAnswered={prayer.is_answered}
        onAnswerClick={handleAnswer}
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
