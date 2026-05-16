import { getLanguageFlag } from '../../../../utils/languageFlags'

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
  translationButtonText,
  nextLanguage,
  onTranslationToggle,
}: PrayerAuthorInfoProps) => {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/80 to-purple-600/60 dark:from-purple-500/60 dark:to-purple-700/40 border border-purple-400/40 dark:border-purple-400/30 flex items-center justify-center text-white text-base font-semibold">
          {displayName.charAt(0).toUpperCase()}
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
            {getLanguageFlag(nextLanguage)}
          </span>
          {' '}
          <span
            style={{
              transition: 'letter-spacing 0.2s ease-in-out',
            }}
            className="group-hover:tracking-wider"
          >
            {translationButtonText.replace('🇺🇸 ', '').replace('🇰🇷 ', '').replace('🇻🇳 ', '').replace('🇯🇵 ', '').replace('🇫🇷 ', '').replace('🇨🇳 ', '')}
          </span>
        </button>
      )}
    </div>
  )
}

export default PrayerAuthorInfo
