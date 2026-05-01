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
