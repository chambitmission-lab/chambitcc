import { useLeaderboard } from '../../../hooks/useBluemarble'

interface Props {
  open: boolean
  onClose: () => void
}

export default function Leaderboard({ open, onClose }: Props) {
  const { data, isLoading } = useLeaderboard(10, open)
  if (!open) return null

  return (
    <div className="bm-modal-backdrop" onClick={onClose}>
      <div className="bm-leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bm-leaderboard-header">
          <h3>🏆 리더보드 TOP 10</h3>
          <button type="button" onClick={onClose} className="bm-x-btn" aria-label="닫기">
            ×
          </button>
        </div>

        {isLoading && <div className="bm-leaderboard-loading">불러오는 중...</div>}

        {data && data.items.length === 0 && (
          <div className="bm-leaderboard-empty">아직 기록이 없어요. 첫 기록의 주인공이 되어보세요!</div>
        )}

        {data && data.items.length > 0 && (
          <ul className="bm-leaderboard-list">
            {data.items.map((entry) => (
              <li key={entry.user_id} className="bm-leaderboard-item">
                <span className={`bm-rank bm-rank-${entry.rank}`}>{entry.rank}</span>
                <span className="bm-lb-name">{entry.full_name || entry.username}</span>
                <span className="bm-lb-score">{entry.total_score.toLocaleString()}pt</span>
                <span className="bm-lb-meta">
                  ✓{entry.correct_count} · 🏁{entry.laps}
                </span>
              </li>
            ))}
          </ul>
        )}

        {data && data.my_rank && (
          <div className="bm-leaderboard-myrank">
            내 순위: <strong>{data.my_rank}위</strong> · 베스트{' '}
            <strong>{data.my_best_score.toLocaleString()}pt</strong>
          </div>
        )}
      </div>
    </div>
  )
}
