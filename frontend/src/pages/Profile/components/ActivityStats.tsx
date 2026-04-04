import { useLanguage } from '../../../contexts/LanguageContext'

interface ActivityStatsProps {
  thisWeekCount: number
  totalCount: number
  streakDays: number
}

const ActivityStats = ({ thisWeekCount, totalCount, streakDays }: ActivityStatsProps) => {
  const { t } = useLanguage()
  
  return (
    <div className="px-4 pb-3">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <span className="material-icons-outlined text-xl bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
          insights
        </span>
        {t('profileMyActivity')}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <div className="relative">
          <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-800/80 rounded-xl p-2.5 border border-white/60 dark:border-gray-700/60 relative overflow-hidden shadow-lg text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-purple-500/20 dark:to-transparent rounded-full blur-xl"></div>
            <div className="text-xl font-extrabold text-gray-900 dark:text-white mb-0.5 relative z-10">
              {thisWeekCount}
            </div>
            <div className="text-[10px] font-medium text-gray-700 dark:text-gray-300 relative z-10 whitespace-nowrap">{t('profileThisWeek')}</div>
          </div>
        </div>
        
        <div className="relative">
          <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-800/80 rounded-xl p-2.5 border border-white/60 dark:border-gray-700/60 relative overflow-hidden shadow-lg text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-purple-500/20 dark:to-transparent rounded-full blur-xl"></div>
            <div className="text-xl font-extrabold text-gray-900 dark:text-white mb-0.5 relative z-10">
              {totalCount}
            </div>
            <div className="text-[10px] font-medium text-gray-700 dark:text-gray-300 relative z-10 whitespace-nowrap">{t('totalPrayers')}</div>
          </div>
        </div>
        
        <div className="relative">
          <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-800/80 rounded-xl p-2.5 border border-white/60 dark:border-gray-700/60 relative overflow-hidden shadow-lg text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-purple-500/20 dark:to-transparent rounded-full blur-xl"></div>
            <div className="text-xl font-extrabold text-gray-900 dark:text-white mb-0.5 relative z-10">
              {streakDays}{streakDays >= 7 && '🔥'}
            </div>
            <div className="text-[10px] font-medium text-gray-700 dark:text-gray-300 relative z-10 whitespace-nowrap">{t('consecutivePrayers')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityStats
