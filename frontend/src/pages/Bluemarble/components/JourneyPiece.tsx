import { motion } from 'framer-motion'
import { positionToCoord, JOURNEY_COLS, JOURNEY_ROWS } from '../journeyLayout'

interface Props {
  position: number
}

export default function JourneyPiece({ position }: Props) {
  const { row, col } = positionToCoord(position)

  // grid는 1-based, framer-motion의 layout 애니메이션 활용
  // 백분율 좌표로 부드럽게 이동
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
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 100 100" width="42" height="42" aria-label="플레이어">
          <ellipse cx="50" cy="88" rx="20" ry="4" fill="rgba(0,0,0,0.25)" />
          <ellipse cx="50" cy="60" rx="32" ry="26" fill="#fafafa" />
          <circle cx="32" cy="48" r="14" fill="#fafafa" />
          <circle cx="50" cy="40" r="15" fill="#fafafa" />
          <circle cx="68" cy="48" r="14" fill="#fafafa" />
          <circle cx="28" cy="62" r="12" fill="#fafafa" />
          <circle cx="72" cy="62" r="12" fill="#fafafa" />
          <ellipse cx="50" cy="58" rx="16" ry="14" fill="#fde4cf" />
          <ellipse cx="44" cy="58" rx="2.6" ry="3.4" fill="#1f2937" />
          <ellipse cx="56" cy="58" rx="2.6" ry="3.4" fill="#1f2937" />
          <circle cx="44.6" cy="56.6" r="1" fill="#fff" />
          <circle cx="56.6" cy="56.6" r="1" fill="#fff" />
          <path d="M 47 64 L 53 64 L 50 67 Z" fill="#1f2937" />
          <path d="M 46 70 Q 50 73 54 70" stroke="#1f2937" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <ellipse cx="40" cy="66" rx="2.2" ry="1.4" fill="#fda4af" opacity="0.7" />
          <ellipse cx="60" cy="66" rx="2.2" ry="1.4" fill="#fda4af" opacity="0.7" />
          <ellipse cx="40" cy="86" rx="3.6" ry="2.2" fill="#1f2937" />
          <ellipse cx="60" cy="86" rx="3.6" ry="2.2" fill="#1f2937" />
        </svg>
      </motion.div>
    </motion.div>
  )
}
