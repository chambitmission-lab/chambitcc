import { motion, AnimatePresence } from 'framer-motion'
import RabbitAvatar from './RabbitAvatar'
import type { LapEvent } from '../../types/bluemarble'
import './lapCompletion.css'

interface Props {
  lap: LapEvent
  totalScore: number
  correctCount: number
  rabbitStage: number
  rabbitEquipped: Record<string, string>
  onContinue: () => void
  onFinish: () => void
}

export default function LapCompletionModal({
  lap,
  totalScore,
  correctCount,
  rabbitStage,
  rabbitEquipped,
  onContinue,
  onFinish,
}: Props) {
  return (
    <AnimatePresence>
      <motion.div
        className="lap-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* 빛줄기 */}
        <div className="lap-beams">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="lap-beam"
              style={{ transform: `rotate(${(i * 360) / 12}deg)` }}
            />
          ))}
        </div>

        <motion.div
          className="lap-modal"
          initial={{ scale: 0.5, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 18 }}
        >
          <motion.div
            className="lap-crown-emoji"
            animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            👑
          </motion.div>

          <div className="lap-counter">
            {lap.lap_count}
            <span className="lap-counter-suffix">바퀴</span>
          </div>
          <h2 className="lap-title">{lap.title}</h2>

          <motion.div
            className="lap-rabbit"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            <RabbitAvatar
              stage={rabbitStage}
              equipped={rabbitEquipped}
              mood="excited"
              size={140}
              staticPose
            />
          </motion.div>

          <blockquote className="lap-scripture">
            <div className="lap-scripture-text">"{lap.scripture_text}"</div>
            <div className="lap-scripture-ref">— {lap.scripture_ref}</div>
          </blockquote>

          <div className="lap-bonus-row">
            <div className="lap-bonus-pill">
              <span className="lap-bonus-label">완주 보너스</span>
              <span className="lap-bonus-value">+{lap.lap_bonus.toLocaleString()}pt</span>
            </div>
          </div>

          <div className="lap-stats">
            <div className="lap-stat">
              <div className="lap-stat-label">누적 점수</div>
              <div className="lap-stat-value">{totalScore.toLocaleString()}</div>
            </div>
            <div className="lap-stat">
              <div className="lap-stat-label">총 정답</div>
              <div className="lap-stat-value">{correctCount}</div>
            </div>
            <div className="lap-stat">
              <div className="lap-stat-label">완주 횟수</div>
              <div className="lap-stat-value">{lap.lap_count}</div>
            </div>
          </div>

          {/* 이번 바퀴 요약 (백엔드 lap_report) */}
          {(lap.lap_correct_count != null || lap.lap_score != null) && (
            <div className="lap-roundup">
              <div className="lap-roundup-title">📜 이번 바퀴 요약</div>
              <div className="lap-roundup-grid">
                {lap.lap_score != null && (
                  <div className="lap-roundup-cell">
                    <span className="lap-roundup-label">획득 점수</span>
                    <span className="lap-roundup-value">+{lap.lap_score.toLocaleString()}</span>
                  </div>
                )}
                {lap.lap_correct_count != null && lap.lap_wrong_count != null && (
                  <div className="lap-roundup-cell">
                    <span className="lap-roundup-label">정답/오답</span>
                    <span className="lap-roundup-value">
                      {lap.lap_correct_count} / {lap.lap_wrong_count}
                    </span>
                  </div>
                )}
                {lap.lap_accuracy != null && (
                  <div className="lap-roundup-cell">
                    <span className="lap-roundup-label">정답률</span>
                    <span className="lap-roundup-value">
                      {Math.round(lap.lap_accuracy * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 이번 바퀴 만난 구절 3선 */}
          {lap.verses && lap.verses.length > 0 && (
            <div className="lap-verses">
              <div className="lap-verses-title">✨ 이번 바퀴에서 만난 말씀</div>
              <ul className="lap-verses-list">
                {lap.verses.map((v, i) => (
                  <li key={i} className="lap-verse-item">
                    <div className="lap-verse-text">"{v.text}"</div>
                    <div className="lap-verse-ref">— {v.book}권 {v.chapter}장 {v.verse}절</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 다음 바퀴 학습 렌즈 안내 */}
          {lap.next_focus && lap.next_focus_title && (
            <div className="lap-next-focus">
              <div className="lap-next-focus-badge">다음 바퀴의 렌즈</div>
              <div className="lap-next-focus-title">{lap.next_focus_title}</div>
              {lap.next_focus_subtitle && (
                <div className="lap-next-focus-sub">{lap.next_focus_subtitle}</div>
              )}
            </div>
          )}

          <div className="lap-actions">
            <button type="button" className="lap-btn lap-btn-primary" onClick={onContinue}>
              🚀 계속 모험하기
            </button>
            <button type="button" className="lap-btn lap-btn-ghost" onClick={onFinish}>
              여기서 마치기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
