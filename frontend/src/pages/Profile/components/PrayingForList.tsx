import { useLanguage } from '../../../contexts/LanguageContext'
import type { PrayingFor } from '../../../types/profile'
import { getRelativeTime } from '../../../utils/dateUtils'

interface PrayingForListProps {
  prayers: PrayingFor[]
  onPrayerClick?: (prayerId: number) => void
}

const PrayingForList = ({ prayers, onPrayerClick }: PrayingForListProps) => {
  const { t, language } = useLanguage()

  if (prayers.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl block mb-3">🙏</span>
        <p className="text-[13px] text-gray-500 dark:text-white/55">
          {t('profileEmptyPraying')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {prayers.map((prayer) => (
        <div
          key={prayer.id}
          role="button"
          tabIndex={0}
          onClick={() => onPrayerClick?.(prayer.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onPrayerClick?.(prayer.id)
            }
          }}
          className="
            relative overflow-hidden rounded-2xl p-4 cursor-pointer
            bg-white/80 dark:bg-card-dark
            border border-gray-200/70 dark:border-white/[0.08]
            shadow-sm
            dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(168,85,247,0.08)]
            transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
          "
        >
          <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold text-gray-600 dark:text-white/60">
                {prayer.display_name}
              </span>
              <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                {t('profilePrayingBadge')}
              </span>
            </div>

            <h4 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-[-0.015em] leading-[1.3] mb-2">
              {prayer.title}
            </h4>
            <p className="text-[14px] text-gray-700 dark:text-white/75 leading-[1.7] line-clamp-2 mb-3">
              {prayer.content}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-gray-500 dark:text-white/50">
              <span>🙏 {prayer.prayer_count}{language === 'ko' ? '명 ' : ' '}{t('peopleArePraying')}</span>
              <span className="ml-auto">
                {getRelativeTime(prayer.prayed_at)} {t('profilePrayedAt')}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PrayingForList
