// 통계 정보 컴포넌트
interface PrayerStatsProps {
  prayerCount: number
  replyCount: number
  onPrayerCountClick: () => void
  onReplyCountClick: () => void
}

const PrayerStats = ({
  prayerCount,
  replyCount,
  onPrayerCountClick,
  onReplyCountClick,
}: PrayerStatsProps) => {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-5 px-1">
      <button 
        onClick={onPrayerCountClick}
        className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-white">{prayerCount}명</span>이 기도중
      </button>
      {replyCount > 0 && (
        <button 
          onClick={onReplyCountClick}
          className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          댓글 <span className="font-semibold text-gray-900 dark:text-white">{replyCount}개</span> 모두 보기
        </button>
      )}
    </div>
  )
}

export default PrayerStats
