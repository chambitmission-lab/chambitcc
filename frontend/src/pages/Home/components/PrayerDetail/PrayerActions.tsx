// 기도하기, 댓글 버튼 컴포넌트
// 기도 버튼은 명확한 토글: 누르기 전 = 댓글 버튼과 같은 무난한 스타일(사용자 확정),
// 누른 후 = 그라데이션 채움 + 체크 "함께 기도했어요"(완료 피드백).
interface PrayerActionsProps {
  isPrayed: boolean
  isToggling: boolean
  showReplies: boolean
  replyCount: number
  onPrayerToggle: () => void
  onRepliesToggle: () => void
}

const PrayerActions = ({
  isPrayed,
  isToggling,
  showReplies,
  replyCount,
  onPrayerToggle,
  onRepliesToggle,
}: PrayerActionsProps) => {
  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        onClick={onPrayerToggle}
        disabled={isToggling}
        aria-pressed={isPrayed}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] ${
          isPrayed
            ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20'
            : 'bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-gray-900 dark:text-white hover:bg-purple-50 dark:hover:bg-white/[0.08]'
        }`}
      >
        <span className={`text-xl ${isPrayed ? 'material-icons-round' : 'material-icons-outlined'}`}>
          {isPrayed ? 'task_alt' : 'volunteer_activism'}
        </span>
        <span>{isPrayed ? '함께 기도했어요' : '함께 기도하기'}</span>
      </button>
      <button
        onClick={onRepliesToggle}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] ${
          showReplies
            ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20'
            : 'bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-gray-900 dark:text-white hover:bg-purple-50 dark:hover:bg-white/[0.08]'
        }`}
      >
        <span className="material-icons-outlined text-xl transform -scale-x-100">chat_bubble_outline</span>
        <span>댓글</span>
        {replyCount > 0 && (
          <span
            className={`inline-flex items-center justify-center min-w-[1.375rem] px-1.5 py-0.5 rounded-full text-xs font-bold leading-none ${
              showReplies
                ? 'bg-white/25 text-white'
                : 'bg-purple-100 dark:bg-white/[0.1] text-purple-600 dark:text-purple-300'
            }`}
          >
            {replyCount}
          </span>
        )}
      </button>
    </div>
  )
}

export default PrayerActions
