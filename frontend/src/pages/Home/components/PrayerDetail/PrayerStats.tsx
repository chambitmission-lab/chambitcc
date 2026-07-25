// 통계 정보 컴포넌트 — "몇 명이 함께하는지" 한 줄만 조용히 보여준다.
// 댓글 수는 바로 아래 댓글 섹션 헤더와 중복이라 제거 (화면 복잡도 다이어트).
interface PrayerStatsProps {
  prayerCount: number
}

const PrayerStats = ({ prayerCount }: PrayerStatsProps) => {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3 px-1">
      <span className="inline-flex items-center gap-1">
        <span className="material-icons-outlined text-[14px] leading-none text-[var(--brand)]">
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
    </div>
  )
}

export default PrayerStats
