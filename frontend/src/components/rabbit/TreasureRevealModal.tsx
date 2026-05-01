import { motion, AnimatePresence } from 'framer-motion'
import type { TreasureDef } from '../../types/rabbit'
import './rabbit.css'

interface Props {
  treasures: TreasureDef[]
  onClose: () => void
}

const SLOT_LABEL: Record<string, string> = {
  feet: '발',
  belt: '허리',
  chest: '가슴',
  shield: '방패',
  helmet: '머리',
  weapon: '무기',
  accessory: '장식',
}

export default function TreasureRevealModal({ treasures, onClose }: Props) {
  if (!treasures || treasures.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        className="treasure-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="treasure-modal"
          initial={{ scale: 0.7, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="treasure-shine" />
          <div className="treasure-title">
            <span className="treasure-emoji">⚔️</span>
            <h2>보물 획득!</h2>
          </div>

          <div className="treasure-list">
            {treasures.map((t) => (
              <motion.div
                key={t.code}
                className="treasure-card"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <div className="treasure-icon">{getTreasureEmoji(t.code)}</div>
                <div className="treasure-info">
                  <div className="treasure-name">{t.name}</div>
                  <div className="treasure-slot">
                    {SLOT_LABEL[t.slot] || t.slot} 슬롯에 자동 장착
                  </div>
                  <div className="treasure-scripture">{t.scripture}</div>
                  {t.description && (
                    <div className="treasure-desc">{t.description}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <button type="button" className="treasure-btn" onClick={onClose}>
            확인
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function getTreasureEmoji(code: string): string {
  const map: Record<string, string> = {
    shoes_of_peace: '👟',
    belt_of_truth: '🪢',
    breastplate_of_righteousness: '🛡️',
    shield_of_faith: '🛡️',
    helmet_of_salvation: '⛑️',
    sword_of_spirit: '⚔️',
    crown_of_life: '👑',
  }
  return map[code] || '✨'
}
