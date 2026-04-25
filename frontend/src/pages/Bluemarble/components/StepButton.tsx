import { motion } from 'framer-motion'

interface Props {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  label?: string
  hint?: string
}

export default function StepButton({ onClick, disabled, loading, label, hint }: Props) {
  return (
    <div className="step-btn-wrap">
      <motion.button
        type="button"
        className="step-btn"
        onClick={onClick}
        disabled={disabled || loading}
        whileHover={!disabled && !loading ? { scale: 1.04 } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.96 } : undefined}
      >
        <motion.span
          className="step-btn-icon"
          animate={loading ? { x: [0, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.6, repeat: loading ? Infinity : 0 }}
        >
          👣
        </motion.span>
        <span>{loading ? '발자국이 닿는 중…' : label ?? '다음 발자취로'}</span>
      </motion.button>
      {hint && <div className="step-btn-hint">{hint}</div>}
    </div>
  )
}
