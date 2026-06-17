import LangFlag from '../../../../components/common/LangFlag'
import { getLanguageName } from '../../../../utils/languageFlags'

// 작성자 정보 컴포넌트
interface PrayerAuthorInfoProps {
  displayName: string
  timeAgo: string
  hasTranslation: boolean
  translationButtonText: string
  nextLanguage: string
  onTranslationToggle: () => void
}

const PrayerAuthorInfo = ({
  displayName,
  timeAgo,
  hasTranslation,
  nextLanguage,
  onTranslationToggle,
}: PrayerAuthorInfoProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {/* 피드 PrayerHeader와 동일한 보랏빛 글로우 아바타 — 화면 간 일관성 */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-purple-500/40 blur-md animate-pulse"></div>
          <div className="w-10 h-10 rounded-full backdrop-blur-md bg-gradient-to-b from-purple-400/60 via-purple-500/40 to-purple-600/25 dark:from-purple-400/50 dark:via-purple-500/30 dark:to-purple-600/20 border-2 border-purple-500/70 dark:border-purple-400/50 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_25px_rgba(168,85,247,0.6),inset_0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[0_0_25px_rgba(168,85,247,0.4),inset_0_1px_3px_rgba(255,255,255,0.3)] relative z-10">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">{displayName}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{timeAgo}</p>
        </div>
      </div>
      {hasTranslation && (
        <button
          onClick={onTranslationToggle}
          className="group px-3 py-1.5 bg-surface-light dark:bg-white/[0.05] border border-border-light dark:border-white/[0.08] rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-500/15 transition-all duration-300"
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
            <LangFlag code={nextLanguage} className="rounded-[2px]" />
          </span>
          {' '}
          <span
            style={{
              transition: 'letter-spacing 0.2s ease-in-out',
            }}
            className="group-hover:tracking-wider"
          >
            {getLanguageName(nextLanguage)}
          </span>
        </button>
      )}
    </div>
  )
}

export default PrayerAuthorInfo
