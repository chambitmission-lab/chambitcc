import { useLanguage } from '../../../../contexts/LanguageContext'

interface PrayerStatsProps {
  prayerCount: number
  replyCount: number
  onReplyClick: (e: React.MouseEvent) => void
}

const PrayerStats = ({ prayerCount, replyCount, onReplyClick }: PrayerStatsProps) => {
  const { t, language } = useLanguage()

  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-gray-900 dark:text-white">
          {prayerCount}{language === 'ko' ? '명이 ' : ' '}{t('peopleArePraying')}
        </span>
        {replyCount > 0 && (
          <>
            <span className="text-gray-400 dark:text-gray-600">·</span>
            <button 
              onClick={onReplyClick}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {t('reply')} {replyCount}{t('replyCount')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default PrayerStats
