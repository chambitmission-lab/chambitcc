import { useLanguage } from '../../../contexts/LanguageContext'

interface ActivityStatsProps {
  thisWeekCount: number
  totalCount: number
  streakDays: number
}

const ActivityStats = ({ thisWeekCount, totalCount, streakDays }: ActivityStatsProps) => {
  const { t } = useLanguage()
  
  return (
    <div className="px-4 pb-6">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="material-icons-outlined text-xl bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
          insights
        </span>
        {t('profileMyActivity')}
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="relative">
          <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-3 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-xl"></div>
            <div className="text-xl font-extrabold text-gray-900 dark:text-white mb-0.5 relative z-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              {thisWeekCount}
            </div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400 relative z-10 whitespace-nowrap">{t('profileThisWeek')}</div>
          </div>
        </div>
        
        <div className="relative">
          <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-3 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-xl"></div>
            <div className="text-xl font-extrabold text-gray-900 dark:text-white mb-0.5 relative z-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              {totalCount}
            </div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400 relative z-10 whitespace-nowrap">{t('totalPrayers')}</div>
          </div>
        </div>
        
        <div className="relative">
          <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-3 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-xl"></div>
            <div className="text-xl font-extrabold text-gray-900 dark:text-white mb-0.5 relative z-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              {streakDays}{streakDays >= 7 && '🔥'}
            </div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400 relative z-10 whitespace-nowrap">{t('consecutivePrayers')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityStats
