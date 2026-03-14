import { useLanguage } from '../../../../contexts/LanguageContext'

interface PrayerStatsProps {
  prayerCount: number
  replyCount: number
  onReplyClick: (e: React.MouseEvent) => void
}

const PrayerStats = ({ prayerCount, replyCount, onReplyClick }: PrayerStatsProps) => {
  const { language } = useLanguage()

  return (
    <div className="px-4 pb-2">
      <div className="flex items-center gap-3 text-xs">
        {/* 함께 기도하는 사람들 */}
        {prayerCount > 0 && (
          <span className="text-gray-600 dark:text-gray-400">
            {language === 'ko' 
              ? `지금 ${prayerCount}명이 함께 기도하고 있어요`
              : `${prayerCount} praying together`}
          </span>
        )}
        
        {/* 댓글 */}
        {replyCount > 0 && (
          <>
            {prayerCount > 0 && <span className="text-gray-300 dark:text-gray-700">·</span>}
            <button 
              onClick={onReplyClick}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {language === 'ko' ? `댓글 ${replyCount}개` : `${replyCount} replies`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default PrayerStats
