import { useId, useMemo } from 'react'
import type { LambStage } from '../../types/garden'
import './LambCharacter.css'

interface LambCharacterProps {
  stage: LambStage
  points: number
  size?: number
  showInfo?: boolean
  /** avatar: 원형 프레임용 — 여백 없이, 큰 점프 대신 잔잔한 숨쉬기만 */
  variant?: 'full' | 'avatar'
}

export const LambCharacter: React.FC<LambCharacterProps> = ({
  stage,
  points,
  size = 120,
  showInfo = true,
  variant = 'full',
}) => {
  const gradientId = useId()
  const highlightId = `${gradientId}-hl`

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
    if (variant === 'avatar') return 'lamb-avatar'
    if (stage.level >= 5) return 'lamb-heavenly'
    if (stage.level >= 3) return 'lamb-happy'
    if (stage.level >= 1) return 'lamb-active'
    return 'lamb-sleeping'
  }, [stage.level, variant])

  const glowFilter = useMemo(() => {
    const radius = variant === 'avatar' ? 12 : 24
    if (stage.level >= 6) return `drop-shadow(0 0 ${radius}px rgba(253, 230, 138, 0.8))`
    if (stage.level >= 4) return `drop-shadow(0 0 ${radius * 0.7}px rgba(251, 191, 36, 0.7))`
    return 'none'
  }, [stage.level, variant])

  const woolFill = stage.level >= 6 ? `url(#${gradientId})` : 'var(--lamb-wool)'

  return (
    <div
      className={`lamb-character-container${
        variant === 'avatar' ? ' lamb-avatar-frame' : ''
      }`}
    >
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
            {/* 최고 단계 털 — 원색 무지개 대신 진주빛 오팔 파스텔 */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fdf4ff" />
              <stop offset="28%" stopColor="#ede9fe" />
              <stop offset="52%" stopColor="#dbeafe" />
              <stop offset="76%" stopColor="#fce7f3" />
              <stop offset="100%" stopColor="#fef3c7" />
            </linearGradient>
            <radialGradient id={highlightId} cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>

          {/* 꼬리 (뒤) */}
          <circle cx="170" cy="118" r="14" fill={woolFill} />
          <circle cx="164" cy="110" r="10" fill={woolFill} />

          {/* 뿔 (Lv.2+) — 두꺼운 곡선 stroke로 컬링 표현 */}
          {stage.level >= 2 && (
            <g
              className="lamb-horns"
              fill="none"
              stroke="var(--lamb-horn)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M 78 58 C 62 50, 48 40, 48 25 C 48 14, 62 10, 70 20 C 76 28, 72 38, 64 36" />
              <path d="M 122 58 C 138 50, 152 40, 152 25 C 152 14, 138 10, 130 20 C 124 28, 128 38, 136 36" />
            </g>
          )}

          {/* 귀 (뒤) */}
          <g className="lamb-ears">
            <ellipse
              cx="62"
              cy="78"
              rx="12"
              ry="18"
              fill="var(--lamb-face)"
              transform="rotate(-30 62 78)"
            />
            <ellipse
              cx="59"
              cy="80"
              rx="6"
              ry="11"
              fill="var(--lamb-ear-inner)"
              transform="rotate(-30 59 80)"
            />
            <ellipse
              cx="138"
              cy="78"
              rx="12"
              ry="18"
              fill="var(--lamb-face)"
              transform="rotate(30 138 78)"
            />
            <ellipse
              cx="141"
              cy="80"
              rx="6"
              ry="11"
              fill="var(--lamb-ear-inner)"
              transform="rotate(30 141 80)"
            />
          </g>

          {/* 몸통 (폭신한 구름볼) */}
          <g className="lamb-body">
            <ellipse cx="100" cy="118" rx="72" ry="58" fill={woolFill} />
            <circle cx="48" cy="88" r="22" fill={woolFill} />
            <circle cx="72" cy="68" r="24" fill={woolFill} />
            <circle cx="100" cy="60" r="26" fill={woolFill} />
            <circle cx="128" cy="68" r="24" fill={woolFill} />
            <circle cx="152" cy="88" r="22" fill={woolFill} />
            <circle cx="38" cy="118" r="20" fill={woolFill} />
            <circle cx="162" cy="118" r="20" fill={woolFill} />
            <circle cx="50" cy="150" r="22" fill={woolFill} />
            <circle cx="80" cy="168" r="22" fill={woolFill} />
            <circle cx="120" cy="168" r="22" fill={woolFill} />
            <circle cx="150" cy="150" r="22" fill={woolFill} />
          </g>

          {/* 몸통 하이라이트 (입체감) */}
          <ellipse
            cx="75"
            cy="95"
            rx="40"
            ry="28"
            fill={`url(#${highlightId})`}
            pointerEvents="none"
          />

          {/* 얼굴 (몸통 앞면에 자리잡은 피부 패치) */}
          <ellipse cx="100" cy="108" rx="32" ry="28" fill="var(--lamb-face)" />

          {/* 이마 털뭉치 (3개 볼) */}
          <circle cx="100" cy="78" r="13" fill={woolFill} />
          <circle cx="84" cy="82" r="9" fill={woolFill} />
          <circle cx="116" cy="82" r="9" fill={woolFill} />

          {/* 볼터치 */}
          <ellipse
            cx="78"
            cy="118"
            rx="7"
            ry="4"
            fill="var(--lamb-cheek)"
            style={{ opacity: 'var(--lamb-cheek-opacity)' }}
          />
          <ellipse
            cx="122"
            cy="118"
            rx="7"
            ry="4"
            fill="var(--lamb-cheek)"
            style={{ opacity: 'var(--lamb-cheek-opacity)' }}
          />

          {/* 눈 — 큰 치비 스타일 + 하이라이트 2개 */}
          <ellipse cx="87" cy="108" rx="5.5" ry="8" fill="#1f2937" />
          <ellipse cx="113" cy="108" rx="5.5" ry="8" fill="#1f2937" />
          <circle cx="89" cy="104" r="2.4" fill="#ffffff" />
          <circle cx="115" cy="104" r="2.4" fill="#ffffff" />
          <circle cx="85.5" cy="112" r="1.2" fill="#ffffff" />
          <circle cx="111.5" cy="112" r="1.2" fill="#ffffff" />

          {/* 코 — 작은 역삼각형 */}
          <path d="M 96 120 L 104 120 L 100 125 Z" fill="#1f2937" />

          {/* 입 — 살짝 웃는 w */}
          <path
            d="M 93 128 Q 97 132 100 129 Q 103 132 107 128"
            stroke="#1f2937"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 발굽 (아래 살짝 빼꼼) */}
          <ellipse cx="82" cy="185" rx="9" ry="5" fill="var(--lamb-leg)" />
          <ellipse cx="118" cy="185" rx="9" ry="5" fill="var(--lamb-leg)" />
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
