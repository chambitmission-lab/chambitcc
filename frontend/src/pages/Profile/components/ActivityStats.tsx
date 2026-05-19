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
      <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 tracking-[-0.01em]">
        <span className="material-icons-outlined text-xl bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
          insights
        </span>
        {t('profileMyActivity')}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <StatCard value={thisWeekCount} label={t('profileThisWeek')} />
        <StatCard value={totalCount} label={t('totalPrayers')} />
        <StatCard
          value={`${streakDays}${streakDays >= 7 ? '🔥' : ''}`}
          label={t('consecutivePrayers')}
        />
      </div>
    </div>
  )
}

interface StatCardProps {
  value: number | string
  label: string
}

const StatCard = ({ value, label }: StatCardProps) => (
  <div
    className="
      relative overflow-hidden rounded-xl text-center p-3
      bg-white/80 dark:bg-card-dark
      border border-gray-200/70 dark:border-white/[0.06]
      shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]
    "
  >
    {/* 다크모드 카드 표면 미세 그라데이션 — NewHome 카드 시스템과 동일 */}
    <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
    {/* 상단 purple glow */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full blur-xl pointer-events-none bg-gradient-to-b from-purple-300/30 to-transparent dark:from-purple-500/25" />

    <div className="relative z-10 text-[20px] font-bold tracking-[-0.015em] text-gray-900 dark:text-white mb-0.5">
      {value}
    </div>
    <div className="relative z-10 text-[10px] font-medium text-gray-700 dark:text-white/70 whitespace-nowrap">
      {label}
    </div>
  </div>
)

export default ActivityStats
