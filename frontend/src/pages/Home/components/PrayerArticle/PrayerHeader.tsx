interface PrayerHeaderProps {
  displayName: string
  timeAgo: string
  hasTranslation: boolean
  showTranslation: boolean
  translationButtonText: string
  onTranslationToggle: (e: React.MouseEvent) => void
}

const PrayerHeader = ({
  displayName,
  timeAgo,
  hasTranslation,
  showTranslation,
  translationButtonText,
  onTranslationToggle
}: PrayerHeaderProps) => {
  return (
    <div className="px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          {/* 주변 빛 확산 효과 */}
          <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-white/20 blur-md animate-pulse"></div>
          <div className="w-8 h-8 rounded-full backdrop-blur-md bg-gradient-to-b from-purple-400/60 via-purple-500/40 to-purple-600/25 dark:from-white/50 dark:via-white/30 dark:to-white/15 border-2 border-purple-500/70 dark:border-white/60 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_25px_rgba(168,85,247,0.6),0_-8px_20px_rgba(168,85,247,0.5),inset_0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[0_0_25px_rgba(255,255,255,0.4),0_-8px_20px_rgba(255,255,255,0.3),inset_0_1px_3px_rgba(255,255,255,0.6)] relative z-10">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">
            {displayName}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            {timeAgo}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {hasTranslation && (
          <button
            onClick={onTranslationToggle}
            className="group px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 flex items-center gap-1"
            title={showTranslation ? '원문 보기' : '번역 보기'}
            style={{
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              className="group-hover:scale-110"
            >
              {translationButtonText.split(' ')[0]}
            </span>
            {' '}
            <span
              style={{
                transition: 'letter-spacing 0.2s ease-in-out',
              }}
              className="group-hover:tracking-wider"
            >
              {translationButtonText.split(' ')[1]}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

export default PrayerHeader
