import type { PrayerGroup } from '../../../../types/prayer'

interface CardHeaderProps {
  displayName: string
  timeAgo: string
  hasTranslation: boolean
  showEnglish: boolean
  onToggleLanguage: () => void
  group?: PrayerGroup
}

const CardHeader = ({
  displayName,
  timeAgo,
  hasTranslation,
  showEnglish,
  onToggleLanguage,
  group,
}: CardHeaderProps) => {
  return (
    <>
      {/* 그룹 배지 - 다크 그레이 톤 */}
      {group && (
        <div className="mb-2 px-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold border border-gray-200 dark:border-gray-700">
            <span>{group.icon}</span>
            <span>{group.name}</span>
          </span>
        </div>
      )}
      
      <div className="card-header">
        <div className="card-avatar">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="card-meta">
          <span className="card-author">{displayName}</span>
          <span className="card-time">{timeAgo}</span>
        </div>
        {hasTranslation && (
          <button
            className="language-toggle group"
            onClick={onToggleLanguage}
            title={showEnglish ? 'View in English' : '한글로 보기'}
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
              {showEnglish ? '🇺🇸' : '🇰🇷'}
            </span>
            {' '}
            <span
              style={{
                transition: 'all 0.2s ease-in-out',
              }}
              className="group-hover:tracking-wider"
            >
              {showEnglish ? 'English' : '한글'}
            </span>
          </button>
        )}
      </div>
    </>
  )
}

export default CardHeader
