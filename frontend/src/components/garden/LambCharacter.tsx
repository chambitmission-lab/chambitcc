// 어린 양 캐릭터 컴포넌트

import { useMemo } from 'react'
import type { LambStage } from '../../types/garden'
import './LambCharacter.css'

interface LambCharacterProps {
  stage: LambStage
  points: number
  size?: number
  showInfo?: boolean
}

export const LambCharacter: React.FC<LambCharacterProps> = ({
  stage,
  points,
  size = 120,
  showInfo = true,
}) => {
  // 양의 상태 메시지
  const statusMessage = useMemo(() => {
    const messages = [
      '기도가 필요해요 🙏',
      '말씀을 읽어주세요 📖',
      '건강하게 자라고 있어요! 💚',
      '오늘도 함께해요! ✨',
      '당신의 신앙이 아름다워요 🌟',
    ]
    
    // 포인트에 따라 다른 메시지
    if (points < 50) return messages[0]
    if (points < 150) return messages[1]
    if (points < 500) return messages[2]
    if (points < 1000) return messages[3]
    return messages[4]
  }, [points])

  // 양의 애니메이션 상태
  const animationClass = useMemo(() => {
    if (stage.level >= 5) return 'lamb-heavenly'
    if (stage.level >= 3) return 'lamb-happy'
    if (stage.level >= 1) return 'lamb-active'
    return 'lamb-sleeping'
  }, [stage.level])

  // 레벨별 글로우 — Lv.4부터 은은한 황금빛, Lv.6에서 천상의 흰빛
  const glowFilter = useMemo(() => {
    if (stage.level >= 6) return 'drop-shadow(0 0 24px rgba(255, 255, 255, 0.9))'
    if (stage.level >= 4) return 'drop-shadow(0 0 16px rgba(251, 191, 36, 0.7))'
    return 'none'
  }, [stage.level])

  return (
    <div className="lamb-character-container">
      <div
        className={`lamb-character ${animationClass}`}
        style={{
          fontSize: `${size}px`,
          filter: glowFilter,
        }}
      >
        <div className="lamb-emoji">{stage.emoji}</div>

        {/* Lv.2부터 스파클 — 개수도 레벨에 따라 증가 */}
        {stage.level >= 2 && (
          <div className="lamb-sparkles">
            <span className="sparkle">✨</span>
            {stage.level >= 3 && <span className="sparkle">✨</span>}
            {stage.level >= 4 && <span className="sparkle">✨</span>}
          </div>
        )}

        {/* Lv.5부터 왕관 */}
        {stage.level >= 5 && (
          <div className="lamb-halo">👑</div>
        )}
      </div>

      {showInfo && (
        <div className="lamb-info">
          <div className="lamb-stage-name">{stage.name}</div>
          <div className="lamb-status-message">{statusMessage}</div>
          <div className="lamb-description">{stage.description}</div>
        </div>
      )}
    </div>
  )
}
