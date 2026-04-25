import { motion } from 'framer-motion'
import type { GameSession } from '../../../types/bluemarble'
import { JOURNEY_LENGTH } from '../journeyLayout'

interface Props {
  session: GameSession
  username?: string
  phase?: string | null
  streak?: number
}

export default function GameStatus({ session, username, phase, streak }: Props) {
  const accuracy =
    session.correct_count + session.wrong_count > 0
      ? Math.round((session.correct_count / (session.correct_count + session.wrong_count)) * 100)
      : 0

  const progressPct = Math.min(100, Math.round((session.current_position / (JOURNEY_LENGTH - 1)) * 100))

  return (
    <div className="bm-status">
      <div className="bm-status-header">
        <div className="bm-status-username">{username ?? '플레이어'}</div>
        {phase && <div className="bm-status-phase">📜 {phase}</div>}
      </div>

      <div className="bm-status-score">
        <div className="bm-score-num">{session.total_score.toLocaleString()}</div>
        <div className="bm-score-label">총 점수</div>
      </div>

      <div className="bm-progress-wrap">
        <div className="bm-progress-track">
          <motion.div
            className="bm-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <div className="bm-progress-label">
          {session.current_position} / {JOURNEY_LENGTH - 1} 발자취
        </div>
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
          <div className="bm-stat-num bm-stat-streak">{streak ?? 0}</div>
          <div className="bm-stat-label">연속</div>
        </div>
      </div>
    </div>
  )
}
