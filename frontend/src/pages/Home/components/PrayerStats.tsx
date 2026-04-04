// 통계 표시 컴포넌트 (선택적)
interface PrayerStatsProps {
  totalPrayers: number
  totalPrayerCount: number
}

const PrayerStats = ({ totalPrayers, totalPrayerCount }: PrayerStatsProps) => {
  return (
    <div className="prayer-stats">
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-value">{totalPrayers.toLocaleString()}</div>
          <div className="stat-label">기도 요청</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{totalPrayerCount.toLocaleString()}</div>
          <div className="stat-label">함께한 기도</div>
        </div>
      </div>
    </div>
  )
}

export default PrayerStats
