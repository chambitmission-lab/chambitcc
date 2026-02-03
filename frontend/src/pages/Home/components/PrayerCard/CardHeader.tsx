interface CardHeaderProps {
  displayName: string
  timeAgo: string
  hasTranslation: boolean
  showEnglish: boolean
  onToggleLanguage: () => void
}

const CardHeader = ({
  displayName,
  timeAgo,
  hasTranslation,
  showEnglish,
  onToggleLanguage,
}: CardHeaderProps) => {
  return (
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
          className="language-toggle"
          onClick={onToggleLanguage}
          title={showEnglish ? '한글로 보기' : 'View in English'}
        >
          {showEnglish ? '🇰🇷 한글' : '🇺🇸 English'}
        </button>
      )}
    </div>
  )
}

export default CardHeader
