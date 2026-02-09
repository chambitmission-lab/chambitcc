interface PrayerActionsProps {
  isPrayed: boolean
  isPraying: boolean
  onPray: (e: React.MouseEvent) => void
}

const PrayerActions = ({
  isPrayed,
  isPraying,
  onPray
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
    </div>
  )
}

export default PrayerActions
