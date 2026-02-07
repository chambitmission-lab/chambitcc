import { useLanguage } from '../../../contexts/LanguageContext'

interface PrayerComposerInputProps {
  onComposerOpen: () => void
}

const PrayerComposerInput = ({ onComposerOpen }: PrayerComposerInputProps) => {
  const { t } = useLanguage()
  
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark">
      <div className="relative">
        {/* 하늘에서 내려오는 빛 효과 - 테마별 색상 */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[3px] h-10 bg-gradient-to-b from-transparent via-purple-400/60 to-purple-500/80 dark:via-white/60 dark:to-white/80 blur-[2px]"></div>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[1px] h-10 bg-gradient-to-b from-transparent via-purple-500/80 to-purple-600 dark:via-white/80 dark:to-white"></div>
        {/* 주변 빛 확산 효과 */}
        <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-white/20 blur-md animate-pulse"></div>
        <div className="w-8 h-8 rounded-full backdrop-blur-md bg-gradient-to-b from-purple-400/60 via-purple-500/40 to-purple-600/25 dark:from-white/50 dark:via-white/30 dark:to-white/15 border-2 border-purple-500/70 dark:border-white/60 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_25px_rgba(168,85,247,0.6),0_-8px_20px_rgba(168,85,247,0.5),inset_0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[0_0_25px_rgba(255,255,255,0.4),0_-8px_20px_rgba(255,255,255,0.3),inset_0_1px_3px_rgba(255,255,255,0.6)] relative z-10">
          A
        </div>
      </div>
      <div className="flex-1">
        <input
          className="w-full bg-surface-light dark:bg-surface-dark border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-primary dark:text-white placeholder-gray-500"
          placeholder={t('prayerPlaceholder')}
          type="text"
          onClick={onComposerOpen}
          readOnly
        />
      </div>
      <button
        onClick={onComposerOpen}
        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white font-bold text-sm rounded-full shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-500/40 dark:hover:shadow-purple-900/40 transition-all hover:scale-105 active:scale-95"
      >
        {t('edit')}
      </button>
    </div>
  )
}

export default PrayerComposerInput
