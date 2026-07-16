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
        <span className="material-icons-outlined text-xl text-brand">
          insights
        </span>
        {t('profileMyActivity')}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon="event_available"
          value={thisWeekCount}
          label={t('profileThisWeek')}
        />
        <StatCard
          icon="volunteer_activism"
          value={totalCount}
          label={t('totalPrayers')}
        />
        <StatCard
          icon="local_fire_department"
          value={streakDays}
          suffix={streakDays >= 7 ? '🔥' : undefined}
          label={t('consecutivePrayers')}
        />
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: string
  value: number
  suffix?: string
  label: string
}

const StatCard = ({ icon, value, suffix, label }: StatCardProps) => (
  <div
    className="
      relative overflow-hidden rounded-2xl text-center px-2 pt-3.5 pb-3
      bg-white/80 dark:bg-card-dark
      border border-gray-200/70 dark:border-white/[0.06]
      shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]
    "
  >
    {/* 다크모드 카드 표면 미세 그라데이션 — NewHome 카드 시스템과 동일 */}
    <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
    {/* 상단 브랜드 블루 glow */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full blur-xl pointer-events-none bg-gradient-to-b from-[var(--brand-soft-strong)] to-transparent" />

    <span
      className="material-icons-round relative z-10 text-[17px] text-[var(--brand-muted)]"
      aria-hidden="true"
    >
      {icon}
    </span>

    <div className="relative z-10 mt-1 text-[32px] font-bold leading-none tracking-[-0.02em] text-gray-900 dark:text-white">
      {value.toLocaleString()}
      {suffix && (
        <span className="ml-0.5 align-baseline text-[17px] leading-none">
          {suffix}
        </span>
      )}
    </div>

    <div className="relative z-10 mt-1.5 text-[11px] font-medium text-gray-500 dark:text-white/55 whitespace-nowrap">
      {label}
    </div>
  </div>
)

export default ActivityStats
