// 통계 정보 컴포넌트 — 기도 버튼 바로 위에 붙어 "몇 명이 함께하는지"를 보여준다.
// 기도 참여/취소는 아래 [함께 기도하기] 버튼만 담당 (통계 문구는 표시 전용).
interface PrayerStatsProps {
  prayerCount: number
  replyCount: number
  onReplyCountClick: () => void
}

const PrayerStats = ({
  prayerCount,
  replyCount,
  onReplyCountClick,
}: PrayerStatsProps) => {
  return (
    <div className="flex items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3 px-1">
      <span className="inline-flex items-center gap-1">
        <span className="material-icons-outlined text-[14px] leading-none text-purple-500 dark:text-purple-300">
          groups
        </span>
        {prayerCount > 0 ? (
          <span>
            <span className="font-semibold text-gray-900 dark:text-white">{prayerCount}명</span>
            의 성도가 함께 기도하고 있어요
          </span>
        ) : (
          <span>가장 먼저 함께 기도해 보세요</span>
        )}
      </span>
      {replyCount > 0 && (
        <button
          onClick={onReplyCountClick}
          className="shrink-0 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          댓글 <span className="font-semibold text-gray-900 dark:text-white">{replyCount}개</span> 보기
        </button>
      )}
    </div>
  )
}

export default PrayerStats
