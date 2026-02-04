import { useState } from 'react'
import type { Prayer } from '../../../../types/prayer'
import CardHeader from './CardHeader'
import CardContent from './CardContent'
import CardFooter from './CardFooter'

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
  
  // 번역이 있는지 확인 (한글→영어 또는 영어→한글)
  const hasEnTranslation = !!(prayer.title_en && prayer.content_en)
  const hasKoTranslation = !!(prayer.title_ko && prayer.content_ko)
  const hasTranslation = hasEnTranslation || hasKoTranslation

  // 현재 표시할 제목과 내용 결정
  const displayTitle = showEnglish 
    ? (prayer.title_en || prayer.title_ko || prayer.title)
    : prayer.title
  const displayContent = showEnglish 
    ? (prayer.content_en || prayer.content_ko || prayer.content)
    : prayer.content

  const handlePrayClick = async () => {
    if (isPraying) return
    
    setIsPraying(true)
    await onPrayerToggle(prayer.id)
    setIsPraying(false)
  }

  return (
    <article className="prayer-card">
      <CardHeader
        displayName={displayName}
        timeAgo={prayer.time_ago}
        hasTranslation={hasTranslation}
        showEnglish={showEnglish}
        onToggleLanguage={() => setShowEnglish(!showEnglish)}
      />

      <CardContent
        title={displayTitle}
        content={displayContent}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
      />

      <CardFooter
        prayerCount={prayer.prayer_count}
        replyCount={prayer.reply_count}
        isPrayed={prayer.is_prayed}
        isPraying={isPraying}
        onPrayClick={handlePrayClick}
      />
    </article>
  )
}

export default PrayerCard
