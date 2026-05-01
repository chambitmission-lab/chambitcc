import { motion, AnimatePresence } from 'framer-motion'
import RabbitAvatar from './RabbitAvatar'
import './rabbit.css'

interface Props {
  fromStage: number
  toStage: number
  equipped?: Record<string, string>
  onClose: () => void
}

const STAGE_NAMES: Record<number, string> = {
  1: '꼬맨자국 작은 토끼',
  2: '깨끗한 토끼',
  3: '평안의 발걸음 토끼',
  4: '진리의 띠를 두른 토끼',
  5: '의를 입은 토끼',
  6: '믿음의 방패 토끼',
  7: '빛나는 챔피언 토끼',
}

export default function EvolutionModal({ fromStage, toStage, equipped, onClose }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        className="evo-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="evo-modal"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="evo-rays" />
          <h2 className="evo-title">✨ 토끼가 진화했어요!</h2>

          <div className="evo-compare">
            <div className="evo-side">
              <RabbitAvatar stage={fromStage} equipped={equipped} size={110} staticPose />
              <div className="evo-stage-label">Lv {fromStage}</div>
              <div className="evo-stage-name">{STAGE_NAMES[fromStage]}</div>
            </div>

            <motion.div
              className="evo-arrow"
              animate={{ x: [0, 8, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ➜
            </motion.div>

            <div className="evo-side evo-side-new">
              <RabbitAvatar stage={toStage} equipped={equipped} size={130} mood="excited" />
              <div className="evo-stage-label evo-new">Lv {toStage}</div>
              <div className="evo-stage-name">{STAGE_NAMES[toStage]}</div>
            </div>
          </div>

          <button type="button" className="evo-btn" onClick={onClose}>
            계속하기
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
