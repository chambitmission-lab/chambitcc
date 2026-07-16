import { useLanguage } from '../../../contexts/LanguageContext'
import type { MyPrayer } from '../../../types/profile'
import { getRelativeTime } from '../../../utils/dateUtils'
import ExpandableText from './ExpandableText'
import { HandHeartIcon, CommentIcon } from '../../../components/icons/ActionIcons'

interface MyPrayersListProps {
  prayers: MyPrayer[]
  onPrayerClick?: (prayerId: number) => void
}

const MyPrayersList = ({ prayers, onPrayerClick }: MyPrayersListProps) => {
  const { t, language } = useLanguage()

  if (prayers.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl block mb-3">📝</span>
        <p className="text-[13px] text-gray-500 dark:text-white/55">
          {t('profileEmptyPrayers')}
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
            {prayer.title && (
              <h4 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-[-0.015em] leading-[1.3] mb-2">
                {prayer.title}
              </h4>
            )}
            <ExpandableText
              text={prayer.content}
              lines={3}
              className="mb-3"
              textClassName="text-[14px] text-gray-700 dark:text-white/75 leading-[1.7]"
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-gray-500 dark:text-white/50">
              <span className="flex items-center gap-1">
                <HandHeartIcon size={14} filled className="text-brand" />
                {prayer.prayer_count}{language === 'ko' ? '' : ' '}{t('peopleArePraying')}
              </span>
              <span className="flex items-center gap-1">
                <CommentIcon size={14} />
                {prayer.reply_count}
              </span>
              <span className="ml-auto">{getRelativeTime(prayer.created_at)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MyPrayersList
