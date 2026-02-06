// 작성자 정보 컴포넌트
interface PrayerAuthorInfoProps {
  displayName: string
  timeAgo: string
  hasTranslation: boolean
  translationButtonText: string
  onTranslationToggle: () => void
}

const PrayerAuthorInfo = ({
  displayName,
  timeAgo,
  hasTranslation,
  translationButtonText,
  onTranslationToggle,
}: PrayerAuthorInfoProps) => {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="relative">
          {/* 하늘에서 내려오는 빛 효과 - 테마별 색상 */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[3px] h-10 bg-gradient-to-b from-transparent via-purple-400/60 to-purple-500/80 dark:via-white/60 dark:to-white/80 blur-[2px]"></div>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[1px] h-10 bg-gradient-to-b from-transparent via-purple-500/80 to-purple-600 dark:via-white/80 dark:to-white"></div>
          {/* 주변 빛 확산 효과 */}
          <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-white/20 blur-md animate-pulse"></div>
          <div className="w-11 h-11 rounded-full backdrop-blur-md bg-gradient-to-b from-purple-400/60 via-purple-500/40 to-purple-600/25 dark:from-white/50 dark:via-white/30 dark:to-white/15 border-2 border-purple-500/70 dark:border-white/60 flex items-center justify-center text-white text-base font-bold shadow-[0_0_25px_rgba(168,85,247,0.6),0_-8px_20px_rgba(168,85,247,0.5),inset_0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[0_0_25px_rgba(255,255,255,0.4),0_-8px_20px_rgba(255,255,255,0.3),inset_0_1px_3px_rgba(255,255,255,0.6)] relative z-10">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{displayName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</p>
        </div>
      </div>
      {hasTranslation && (
        <button
          onClick={onTranslationToggle}
          className="group px-3 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
          style={{
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            className="group-hover:scale-110 group-hover:rotate-12"
          >
            {translationButtonText.includes('English') || translationButtonText.includes('🇺🇸') ? '🇺🇸' : '🇰🇷'}
          </span>
          {' '}
          <span
            style={{
              transition: 'letter-spacing 0.2s ease-in-out',
            }}
            className="group-hover:tracking-wider"
          >
            {translationButtonText.replace('🇺🇸 ', '').replace('🇰🇷 ', '')}
          </span>
        </button>
      )}
    </div>
  )
}

export default PrayerAuthorInfo
