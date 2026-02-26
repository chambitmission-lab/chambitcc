import { getLanguageFlag } from '../../../../utils/languageFlags'

interface PrayerHeaderProps {
  displayName: string
  timeAgo: string
  hasTranslation: boolean
  showTranslation: boolean
  translationButtonText: string
  currentLanguage: string
  nextLanguage: string
  originalLanguage: string
  onTranslationToggle: (e: React.MouseEvent) => void
}

const PrayerHeader = ({
  displayName,
  timeAgo,
  hasTranslation,
  currentLanguage,
  nextLanguage,
  onTranslationToggle
}: PrayerHeaderProps) => {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
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
      
      {/* 언어 전환 버튼 */}
      {hasTranslation && (
        <button
          onClick={onTranslationToggle}
          className="group relative flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-purple-100/80 dark:hover:bg-purple-900/30 transition-all duration-300 overflow-hidden border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-300/50 dark:hover:border-purple-700/50"
          title="번역 보기"
        >
          {/* 호버 시 배경 애니메이션 */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          
          {/* 현재 언어 국기 */}
          <span className="relative text-xs">
            {getLanguageFlag(currentLanguage)}
          </span>
          
          {/* 화살표 */}
          <span className="relative text-[9px] text-gray-400 dark:text-gray-500">
            →
          </span>
          
          {/* 다음 언어 국기 */}
          <span className="relative text-xs opacity-60 group-hover:opacity-100 transition-opacity">
            {getLanguageFlag(nextLanguage)}
          </span>
        </button>
      )}
    </div>
  )
}

export default PrayerHeader
