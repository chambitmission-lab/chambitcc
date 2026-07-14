import { memo, useState } from 'react'
import type { Prayer } from '../../../../types/prayer'
import PrayerHeader from './PrayerHeader'
import PrayerContent from './PrayerContent'
import PrayerActions from './PrayerActions'
import BibleVersesModal from '../BibleVersesModal'
import { getGroupColorTheme, getGroupColorCSSVars } from '../../../../utils/groupColors'
import { useLanguage } from '../../../../contexts/LanguageContext'

interface PrayerArticleProps {
  prayer: Prayer
  onPrayerToggle: (prayerId: number) => void | Promise<void>
  onAnswerToggle?: (prayerId: number) => void
  onEditAnswer?: (prayerId: number) => void
  onCancelAnswer?: (prayerId: number) => void
  onPrayerClick: (prayerId: number, shouldOpenReplies?: boolean) => void
}

const PrayerArticle = ({
  prayer,
  onPrayerToggle,
  onAnswerToggle,
  onEditAnswer,
  onCancelAnswer,
  onPrayerClick,
}: PrayerArticleProps) => {
  const { language } = useLanguage()
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
      await onPrayerToggle(prayer.id)
    } finally {
      setIsPraying(false)
    }
  }

  const handleAnswer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAnswerToggle?.(prayer.id)
  }

  const handleEditAnswer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEditAnswer?.(prayer.id)
  }

  const handleCancelAnswer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCancelAnswer?.(prayer.id)
  }

  const handleVersesClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowVersesModal(true)
  }

  const handleArticleClick = () => onPrayerClick(prayer.id)
  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPrayerClick(prayer.id, true)
  }

  const hasVerses = !!prayer.recommended_verses && prayer.recommended_verses.verses.length > 0

  const liveStatusText = prayer.is_owner
    ? language === 'ko'
      ? `지금 ${prayer.prayer_count}명이 당신을 위해 기도하고 있어요`
      : `${prayer.prayer_count} praying for you now`
    : language === 'ko'
      ? `지금 ${prayer.prayer_count}명이 함께 기도하고 있어요`
      : `${prayer.prayer_count} praying together now`

  return (
    <article
      className={`prayer-card !bg-transparent !border-0 mb-5 cursor-pointer ${prayer.is_answered ? 'answered-article' : ''}`}
      onClick={handleArticleClick}
      style={cssVars as React.CSSProperties}
    >
      {/* 하나의 카드 = 하나의 서사. 헤더·본문·푸터를 한 표면 안에 묶는다. */}
      <div className="feed-card relative overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-glow)] hover:shadow-[0_8px_24px_-8px_var(--brand-glow)]">
        {/* 다크모드 표면 그라데이션 — 평평한 회색 박스 느낌을 깨기 위함 */}
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none rounded-2xl"></div>

        {/* 응답된 기도 전용 은은한 앰버 빛 (기능적 색상 — 브랜드 블루와 구분) */}
        {prayer.is_answered && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-b from-amber-300/25 to-transparent dark:from-amber-400/15 dark:to-transparent rounded-full blur-2xl pointer-events-none"></div>
        )}

        <div className="relative z-10">
          <PrayerHeader
            prayerId={prayer.id}
            displayName={prayer.display_name}
            avatarUrl={prayer.avatar_url ?? null}
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

          {/* 통합 액션바 — 흩어졌던 통계·말씀을 아이콘+숫자로 흡수 (스레드형) */}
          <div className="px-5 pt-3 pb-4">
            <PrayerActions
              isPrayed={prayer.is_prayed}
              isPraying={isPraying}
              onPray={handlePray}
              colorTheme={colorTheme}
              prayerCount={prayer.prayer_count}
              replyCount={prayer.reply_count}
              onReplyClick={handleReplyClick}
              versesCount={hasVerses ? prayer.recommended_verses!.verses.length : 0}
              onVersesClick={handleVersesClick}
              isOwner={prayer.is_owner}
              isAnswered={prayer.is_answered}
              onAnswerClick={handleAnswer}
              onEditAnswerClick={handleEditAnswer}
              onCancelAnswerClick={handleCancelAnswer}
            />

            {/* 살아있는 기도 — 지금 함께 기도하는 사람 수 (따뜻한 문구) */}
            {prayer.prayer_count > 0 && (
              <div className="mt-2.5 text-[12px] text-gray-500 dark:text-gray-400">
                {liveStatusText}
              </div>
            )}
          </div>
        </div>
      </div>

      {showVersesModal && prayer.recommended_verses && (
        <BibleVersesModal
          verses={prayer.recommended_verses}
          onClose={() => setShowVersesModal(false)}
        />
      )}
    </article>
  )
}

export default memo(PrayerArticle)
