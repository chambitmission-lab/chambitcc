interface PrayerActionsProps {
  isPrayed: boolean
  isPraying: boolean
  hasVerses: boolean
  onPray: (e: React.MouseEvent) => void
  onVersesClick: (e: React.MouseEvent) => void
}

const PrayerActions = ({
  isPrayed,
  isPraying,
  hasVerses,
  onPray,
  onVersesClick
}: PrayerActionsProps) => {
  return (
    <div className="px-4 flex items-center gap-3 mb-2">
      <button
        onClick={onPray}
        disabled={isPraying}
        className={`group flex items-center gap-1 transition-colors ${
          isPrayed ? 'text-ig-red' : 'text-gray-800 dark:text-white hover:opacity-70'
        }`}
      >
        <span className={`text-[24px] ${isPrayed ? 'material-icons-round' : 'material-icons-outlined'}`}>
          volunteer_activism
        </span>
      </button>

      {hasVerses && (
        <button
          onClick={onVersesClick}
          className="group flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:opacity-70 transition-colors"
          title="성경 말씀 보기"
        >
          <span className="material-icons-outlined text-[24px]">
            auto_stories
          </span>
        </button>
      )}
    </div>
  )
}

export default PrayerActions
