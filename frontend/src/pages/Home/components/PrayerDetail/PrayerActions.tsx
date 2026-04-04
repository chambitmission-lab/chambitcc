// 기도하기, 댓글 버튼 컴포넌트
interface PrayerActionsProps {
  isPrayed: boolean
  isToggling: boolean
  showReplies: boolean
  onPrayerToggle: () => void
  onRepliesToggle: () => void
}

const PrayerActions = ({
  isPrayed,
  isToggling,
  showReplies,
  onPrayerToggle,
  onRepliesToggle,
}: PrayerActionsProps) => {
  return (
    <div className="flex items-center gap-3 mb-3">
      <button
        onClick={onPrayerToggle}
        disabled={isToggling}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
          isPrayed
            ? 'bg-ig-red text-white shadow-md shadow-red-200 dark:shadow-red-900/30'
            : 'bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <span className={`text-xl ${isPrayed ? 'material-icons-round' : 'material-icons-outlined'}`}>
          volunteer_activism
        </span>
        <span>{isPrayed ? '기도중' : '기도하기'}</span>
      </button>
      <button
        onClick={onRepliesToggle}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
          showReplies
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30'
            : 'bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <span className="material-icons-outlined text-xl transform -scale-x-100">chat_bubble_outline</span>
        <span>댓글</span>
      </button>
    </div>
  )
}

export default PrayerActions
