import type { GameSession } from '../../../types/bluemarble'

interface Props {
  session: GameSession
  username?: string
}

export default function GameStatus({ session, username }: Props) {
  const accuracy =
    session.correct_count + session.wrong_count > 0
      ? Math.round((session.correct_count / (session.correct_count + session.wrong_count)) * 100)
      : 0

  return (
    <div className="bm-status">
      <div className="bm-status-header">
        <div className="bm-status-username">{username ?? '플레이어'}</div>
        <div className="bm-status-laps">🏁 {session.lap_count}바퀴</div>
      </div>

      <div className="bm-status-score">
        <div className="bm-score-num">{session.total_score.toLocaleString()}</div>
        <div className="bm-score-label">총 점수</div>
      </div>

      <div className="bm-status-grid">
        <div className="bm-stat-cell">
          <div className="bm-stat-num bm-stat-correct">{session.correct_count}</div>
          <div className="bm-stat-label">정답</div>
        </div>
        <div className="bm-stat-cell">
          <div className="bm-stat-num bm-stat-wrong">{session.wrong_count}</div>
          <div className="bm-stat-label">오답</div>
        </div>
        <div className="bm-stat-cell">
          <div className="bm-stat-num">{accuracy}%</div>
          <div className="bm-stat-label">정확도</div>
        </div>
        <div className="bm-stat-cell">
          <div className="bm-stat-num">{session.dice_count}</div>
          <div className="bm-stat-label">턴</div>
        </div>
      </div>
    </div>
  )
}
