interface ActivityStatsProps {
  thisWeekCount: number
  totalCount: number
  streakDays: number
}

const ActivityStats = ({ thisWeekCount, totalCount, streakDays }: ActivityStatsProps) => {
  return (
    <div className="activity-stats">
      <h3 className="stats-title">📊 나의 기도 활동</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{thisWeekCount}번</div>
          <div className="stat-label">이번 주</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalCount}번</div>
          <div className="stat-label">총 기도</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {streakDays}일 {streakDays >= 7 && '🔥'}
          </div>
          <div className="stat-label">연속 기도</div>
        </div>
      </div>
    </div>
  )
}

export default ActivityStats
