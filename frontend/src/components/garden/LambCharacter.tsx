import { useId, useMemo } from 'react'
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
  const gradientId = useId()

  const statusMessage = useMemo(() => {
    const messages = [
      '기도가 필요해요 🙏',
      '말씀을 읽어주세요 📖',
      '건강하게 자라고 있어요! 💚',
      '오늘도 함께해요! ✨',
      '당신의 신앙이 아름다워요 🌟',
    ]
    if (points < 50) return messages[0]
    if (points < 150) return messages[1]
    if (points < 500) return messages[2]
    if (points < 1000) return messages[3]
    return messages[4]
  }, [points])

  const animationClass = useMemo(() => {
    if (stage.level >= 5) return 'lamb-heavenly'
    if (stage.level >= 3) return 'lamb-happy'
    if (stage.level >= 1) return 'lamb-active'
    return 'lamb-sleeping'
  }, [stage.level])

  const glowFilter = useMemo(() => {
    if (stage.level >= 6) return 'drop-shadow(0 0 24px rgba(255, 255, 255, 0.9))'
    if (stage.level >= 4) return 'drop-shadow(0 0 16px rgba(251, 191, 36, 0.7))'
    return 'none'
  }, [stage.level])

  // Lv.6에서는 무지개 그라디언트, 그 외에는 CSS 변수로 색 제어
  const woolFill = stage.level >= 6 ? `url(#${gradientId})` : 'var(--lamb-wool)'

  return (
    <div className="lamb-character-container">
      <div
        className={`lamb-character ${animationClass}`}
        style={{ filter: glowFilter }}
      >
        <svg
          className={`lamb-svg lamb-level-${stage.level}`}
          width={size}
          height={size}
          viewBox="0 0 200 200"
          role="img"
          aria-label={stage.name}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="20%" stopColor="#ffd93d" />
              <stop offset="40%" stopColor="#6bcb77" />
              <stop offset="60%" stopColor="#4d96ff" />
              <stop offset="80%" stopColor="#b47eff" />
              <stop offset="100%" stopColor="#ff6bcb" />
            </linearGradient>
          </defs>

          <g className="lamb-legs">
            <rect x="68" y="148" width="10" height="30" rx="4" fill="var(--lamb-leg)" />
            <rect x="86" y="150" width="10" height="30" rx="4" fill="var(--lamb-leg)" />
            <rect x="104" y="150" width="10" height="30" rx="4" fill="var(--lamb-leg)" />
            <rect x="122" y="148" width="10" height="30" rx="4" fill="var(--lamb-leg)" />
          </g>

          <g className="lamb-body">
            <circle cx="55" cy="135" r="22" fill={woolFill} />
            <circle cx="75" cy="115" r="22" fill={woolFill} />
            <circle cx="100" cy="108" r="24" fill={woolFill} />
            <circle cx="125" cy="115" r="22" fill={woolFill} />
            <circle cx="145" cy="135" r="22" fill={woolFill} />
            <ellipse cx="100" cy="140" rx="55" ry="26" fill={woolFill} />
          </g>

          {stage.level >= 2 && (
            <g className="lamb-horns">
              <path
                d="M 80 55 Q 58 50 55 30 Q 55 18 65 20 Q 73 30 78 48 Z"
                fill="var(--lamb-horn)"
              />
              <path
                d="M 120 55 Q 142 50 145 30 Q 145 18 135 20 Q 127 30 122 48 Z"
                fill="var(--lamb-horn)"
              />
            </g>
          )}

          <ellipse
            cx="72"
            cy="72"
            rx="9"
            ry="13"
            fill="var(--lamb-face)"
            transform="rotate(-25 72 72)"
          />
          <ellipse
            cx="128"
            cy="72"
            rx="9"
            ry="13"
            fill="var(--lamb-face)"
            transform="rotate(25 128 72)"
          />

          <ellipse cx="100" cy="82" rx="26" ry="24" fill="var(--lamb-face)" />

          <circle cx="100" cy="62" r="12" fill={woolFill} />
          <circle cx="88" cy="60" r="8" fill={woolFill} />
          <circle cx="112" cy="60" r="8" fill={woolFill} />

          <circle
            cx="82"
            cy="90"
            r="5"
            fill="var(--lamb-cheek)"
            style={{ opacity: 'var(--lamb-cheek-opacity)' }}
          />
          <circle
            cx="118"
            cy="90"
            r="5"
            fill="var(--lamb-cheek)"
            style={{ opacity: 'var(--lamb-cheek-opacity)' }}
          />

          <ellipse cx="89" cy="80" rx="3" ry="4" fill="#1f2937" />
          <ellipse cx="111" cy="80" rx="3" ry="4" fill="#1f2937" />
          <circle cx="90" cy="78" r="1" fill="#ffffff" />
          <circle cx="112" cy="78" r="1" fill="#ffffff" />

          <ellipse cx="100" cy="90" rx="3" ry="2" fill="#1f2937" />

          <path
            d="M 94 95 Q 100 99 106 95"
            stroke="#1f2937"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
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
