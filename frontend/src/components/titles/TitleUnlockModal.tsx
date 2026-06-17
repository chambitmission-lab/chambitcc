// 칭호 해금 팝업 — framer-motion 으로 보라/핑크 그라데이션이 번지며 카드가 떠오른다.
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { TitleStatus } from '../../api/titles'
import { TIER_VISUALS } from './titleVisuals'
import './TitleUnlockModal.css'

interface TitleUnlockModalProps {
  title: TitleStatus
  remaining: number      // 뒤에 더 대기 중인 해금 수
  onEquip: (title: TitleStatus) => void
  onClose: () => void
}

const fireConfetti = (legendary = false) => {
  // 브랜드 컬러 폭죽 — 가운데 위에서 양옆으로. 전설 등급은 금색을 더해 더 화려하게.
  const colors = legendary
    ? ['#fbbf24', '#fde68a', '#ec4899', '#a855f7', '#22d3ee']
    : ['#a855f7', '#ec4899', '#f9a8d4', '#d8b4fe']
  const base = legendary ? 130 : 70
  confetti({ particleCount: base, spread: legendary ? 100 : 70, startVelocity: 46, origin: { x: 0.5, y: 0.35 }, colors })
  setTimeout(() => {
    confetti({ particleCount: legendary ? 70 : 40, angle: 60, spread: 70, origin: { x: 0, y: 0.5 }, colors })
    confetti({ particleCount: legendary ? 70 : 40, angle: 120, spread: 70, origin: { x: 1, y: 0.5 }, colors })
  }, 150)
  if (legendary) {
    // 전설: 한 번 더 쏟아지는 황금비
    setTimeout(() => {
      confetti({ particleCount: 90, spread: 120, startVelocity: 38, origin: { x: 0.5, y: 0.2 }, colors })
    }, 450)
  }
}

export const TitleUnlockModal: React.FC<TitleUnlockModalProps> = ({
  title, remaining, onEquip, onClose,
}) => {
  const tier = TIER_VISUALS[title.tier]
  const isLegendary = title.tier === 'legendary'

  useEffect(() => {
    fireConfetti(isLegendary)
  }, [title.key, isLegendary])

  return (
    <motion.div
      className="title-unlock-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`title-unlock-card${isLegendary ? ' is-legendary' : ''}`}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.78, y: 28, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      >
        {/* 번지는 그라데이션 광채 */}
        <div className="title-unlock-burst" aria-hidden />

        <motion.span
          className="title-unlock-eyebrow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {isLegendary ? '🏆 전설 칭호 획득!' : '✨ 새로운 칭호 획득'}
        </motion.span>

        <motion.div
          className="title-unlock-emblem"
          style={{ ['--tier-ring' as string]: tier.ring }}
          initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 260, damping: 16 }}
        >
          <span className="title-unlock-icon">{title.icon}</span>
        </motion.div>

        <motion.h2
          className="title-unlock-name"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          [{title.name}]
        </motion.h2>
        <motion.p
          className="title-unlock-congrats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.24 }}
        >
          축하합니다! 칭호를 획득하셨습니다
        </motion.p>
        <motion.p
          className="title-unlock-desc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {title.description}
        </motion.p>

        <motion.div
          className="title-unlock-actions"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
        >
          <button type="button" className="title-unlock-equip" onClick={() => onEquip(title)}>
            바로 장착하기
          </button>
          <button type="button" className="title-unlock-later" onClick={onClose}>
            {remaining > 0 ? `다음 (${remaining})` : '나중에'}
          </button>
        </motion.div>

        <span className="title-unlock-tier-chip" style={{ background: tier.chipBg, color: tier.chipText }}>
          {tier.label}
        </span>
      </motion.div>
    </motion.div>
  )
}
