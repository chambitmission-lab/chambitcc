import { useLanguage } from '../../../../contexts/LanguageContext'

interface PrayerComposerHeaderProps {
  onClose: () => void
}

const PrayerComposerHeader = ({ onClose }: PrayerComposerHeaderProps) => {
  const { t } = useLanguage()

  return (
    <div className="sticky top-0 z-20 backdrop-blur-xl bg-background-light/85 dark:bg-[#1c1c26]/90 border-b border-black/[0.04] dark:border-white/[0.08] px-5 py-3.5 flex items-center justify-between">
      <h2 className="text-[18px] font-bold tracking-[-0.015em] text-gray-900 dark:text-white">
        {t('prayerComposerTitle')}
      </h2>
      <button
        onClick={onClose}
        aria-label="닫기"
        className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors"
      >
        <span className="material-icons-outlined text-[22px]">close</span>
      </button>
    </div>
  )
}

export default PrayerComposerHeader
