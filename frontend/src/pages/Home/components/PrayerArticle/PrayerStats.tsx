import { useLanguage } from '../../../../contexts/LanguageContext'

interface PrayerStatsProps {
  prayerCount: number
  replyCount: number
  isOwner?: boolean
  onReplyClick: (e: React.MouseEvent) => void
}

const PrayerStats = ({ prayerCount, replyCount, isOwner, onReplyClick }: PrayerStatsProps) => {
  const { language } = useLanguage()

  // 내 기도글이면 "당신을 위해", 남의 기도글이면 "함께"
  const prayerCountText = isOwner
    ? language === 'ko'
      ? `지금 ${prayerCount}명이 당신을 위해 기도하고 있어요`
      : `${prayerCount} praying for you`
    : language === 'ko'
      ? `지금 ${prayerCount}명이 함께 기도하고 있어요`
      : `${prayerCount} praying together`

  return (
    <div className="flex items-center gap-2 text-xs min-w-0">
      {/* 함께 기도하는 사람들 */}
      {prayerCount > 0 && (
        <span className="text-gray-600 dark:text-gray-400 truncate">
          {prayerCountText}
        </span>
      )}

      {/* 댓글 */}
      {replyCount > 0 && (
        <>
          {prayerCount > 0 && <span className="text-gray-300 dark:text-gray-700 shrink-0">·</span>}
          <button
            onClick={onReplyClick}
            className="shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {language === 'ko' ? `댓글 ${replyCount}개` : `${replyCount} replies`}
          </button>
        </>
      )}
    </div>
  )
}

export default PrayerStats
