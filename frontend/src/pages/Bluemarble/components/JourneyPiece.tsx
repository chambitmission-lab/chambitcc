import { motion } from 'framer-motion'
import { positionToCoord, JOURNEY_COLS, JOURNEY_ROWS } from '../journeyLayout'
import RabbitAvatar, { type RabbitMood } from '../../../components/rabbit/RabbitAvatar'

interface Props {
  position: number
  stage?: number
  equipped?: Record<string, string>
  mood?: RabbitMood
}

export default function JourneyPiece({ position, stage = 1, equipped = {}, mood = 'idle' }: Props) {
  const { row, col } = positionToCoord(position)

  // grid는 1-based, framer-motion의 layout 애니메이션 활용
  const xPct = (col / (JOURNEY_COLS - 1)) * 100
  const yPct = (row / (JOURNEY_ROWS - 1)) * 100

  return (
    <motion.div
      className="jp-wrap"
      initial={false}
      animate={{
        left: `${xPct}%`,
        top: `${yPct}%`,
      }}
      transition={{
        type: 'spring',
        stiffness: 220,
        damping: 22,
        mass: 0.9,
      }}
    >
      <motion.div
        className="jp-piece"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <RabbitAvatar stage={stage} equipped={equipped} mood={mood} size={52} staticPose />
      </motion.div>
    </motion.div>
  )
}
