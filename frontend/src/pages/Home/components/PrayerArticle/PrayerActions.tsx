import React, { useState } from 'react'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { GroupColorTheme } from '../../../../utils/groupColors'
import { HandHeartIcon, CommentIcon, BookOpenIcon } from '../../../../components/icons/ActionIcons'

interface PrayerActionsProps {
  isPrayed: boolean
  isPraying: boolean
  onPray: (e: React.MouseEvent) => void
  colorTheme: GroupColorTheme
  prayerCount: number
  replyCount: number
  onReplyClick: (e: React.MouseEvent) => void
  versesCount?: number
  onVersesClick?: (e: React.MouseEvent) => void
  isOwner?: boolean
  isAnswered?: boolean
  onAnswerClick?: (e: React.MouseEvent) => void
  onEditAnswerClick?: (e: React.MouseEvent) => void
  onCancelAnswerClick?: (e: React.MouseEvent) => void
}

interface LightParticle {
  id: number
  x: number
  y: number
}

const PrayerActions = ({
  isPrayed,
  isPraying,
  onPray,
  colorTheme,
  prayerCount,
  replyCount,
  onReplyClick,
  versesCount = 0,
  onVersesClick,
  isOwner,
  isAnswered,
  onAnswerClick,
  onEditAnswerClick,
  onCancelAnswerClick,
}: PrayerActionsProps) => {
  const { language } = useLanguage()
  const [particles, setParticles] = useState<LightParticle[]>([])
  const [isPopping, setIsPopping] = useState(false)

  const handlePrayClick = (e: React.MouseEvent) => {
    onPray(e)

    // 탭 순간에만 팝 애니메이션 (이미 기도된 카드가 로드될 때는 안 튀도록)
    setIsPopping(true)
    setTimeout(() => setIsPopping(false), 450)

    // 빛 알갱이 생성
    const rect = e.currentTarget.getBoundingClientRect()
    const newParticles: LightParticle[] = []

    const particleCount = Math.floor(Math.random() * 3) + 3
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 30,
        y: rect.top + rect.height / 2
      })
    }

    setParticles(prev => [...prev, ...newParticles])

    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
    }, 2000)
  }

  // 그룹 색상 사용 여부 (기본 테마가 아닐 때만)
  const useGroupColor = colorTheme.name !== '참빛'

  const prayLabel = isOwner
    ? language === 'ko' ? `${prayerCount}명이 당신을 위해 기도했어요` : `${prayerCount} prayed for you`
    : language === 'ko' ? `${prayerCount}명이 함께 기도했어요` : `${prayerCount} prayed together`

  return (
    <>
      <div className="flex items-center justify-between">
        {/* 트렌디한 아이콘+숫자 액션 클러스터 */}
        <div className="flex items-center gap-4">
          {/* 기도 — 손하트, 눌렀을 때만 브랜드 컬러+글로우 */}
          <button
            onClick={handlePrayClick}
            disabled={isPraying}
            title={prayLabel}
            className={`relative flex items-center gap-1.5 transition-all duration-300 ${
              !useGroupColor && isPrayed ? 'text-brand' :
              !useGroupColor ? 'text-gray-500 dark:text-gray-400 hover:text-brand' : ''
            }`}
            style={useGroupColor && isPrayed ? {
              color: colorTheme.accent,
              filter: `drop-shadow(0 0 6px ${colorTheme.glow})`,
              animation: 'holy-glow-icon 2s ease-in-out infinite'
            } : {}}
          >
            <HandHeartIcon
              size={18}
              filled={isPrayed}
              style={isPopping ? { animation: 'pray-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)' } : undefined}
            />
            {/* 숫자 자리는 항상 확보 — 0→1이 될 때 옆 버튼들이 밀리지 않도록 */}
            <span className="text-[12px] font-semibold tabular-nums min-w-[10px]">
              {prayerCount > 0 ? prayerCount : ''}
            </span>
          </button>

          {/* 댓글 */}
          <button
            onClick={onReplyClick}
            className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-brand transition-colors"
          >
            <CommentIcon size={18} />
            {replyCount > 0 && (
              <span className="text-[12px] font-semibold tabular-nums">{replyCount}</span>
            )}
          </button>

          {/* 함께 묵상할 말씀 */}
          {versesCount > 0 && onVersesClick && (
            <button
              onClick={onVersesClick}
              title={language === 'ko' ? '함께 묵상해볼 수 있는 말씀' : 'Verses to meditate on'}
              className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-brand transition-colors"
            >
              <BookOpenIcon size={18} />
              <span className="text-[12px] font-semibold tabular-nums">{versesCount}</span>
            </button>
          )}
        </div>

        {/* 응답 등록 버튼 (내 기도이고 아직 응답 안됨) —
            이모지 대신 응답의 색 언어(앰버 SVG 별)로 힌트만 주고 텍스트는 중립색 */}
        {isOwner && !isAnswered && onAnswerClick && (
          <button
            onClick={onAnswerClick}
            className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-[var(--amber)] transition-colors text-[12px] font-medium"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-[var(--amber-icon)] shrink-0" aria-hidden>
              <path d="M5 0 L6.1 3.9 L10 5 L6.1 6.1 L5 10 L3.9 6.1 L0 5 L3.9 3.9 Z" fill="currentColor" />
            </svg>
            <span>{language === 'ko' ? '응답 등록' : 'Answer'}</span>
          </button>
        )}

        {/* 응답 수정 / 취소 (내 기도이고 이미 응답된 경우) —
            보조 액션은 아이콘 없이 조용한 텍스트로, 가운뎃점으로만 구분 */}
        {isOwner && isAnswered && (onEditAnswerClick || onCancelAnswerClick) && (
          <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
            {onEditAnswerClick && (
              <button
                onClick={onEditAnswerClick}
                className="font-medium hover:text-[var(--amber)] transition-colors"
              >
                {language === 'ko' ? '간증 수정' : 'Edit'}
              </button>
            )}
            {onEditAnswerClick && onCancelAnswerClick && (
              <span className="text-gray-300 dark:text-gray-600" aria-hidden>·</span>
            )}
            {onCancelAnswerClick && (
              <button
                onClick={onCancelAnswerClick}
                className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                title={language === 'ko' ? '응답 등록 취소' : 'Cancel answer'}
              >
                {language === 'ko' ? '응답 취소' : 'Cancel'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 빛 알갱이 파티클 */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="prayer-light-particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            filter: useGroupColor ? `drop-shadow(0 0 4px ${colorTheme.glow})` : 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.7))'
          }}
        >
          {useGroupColor ? colorTheme.particle : '✨'}
        </div>
      ))}

      <style>{`
        @keyframes pray-pop {
          0% { transform: scale(1); }
          35% { transform: scale(1.35) rotate(-8deg); }
          65% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }

        @keyframes holy-glow-icon {
          0%, 100% {
            filter: drop-shadow(0 0 6px ${colorTheme.glow});
          }
          50% {
            filter: drop-shadow(0 0 10px ${colorTheme.glow});
          }
        }

        .prayer-light-particle {
          position: fixed;
          pointer-events: none;
          font-size: 16px;
          z-index: 9999;
          animation: float-up 2s ease-out forwards;
        }

        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(-20px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-150px) scale(0.3) rotate(180deg);
          }
        }
      `}</style>
    </>
  )
}

export default PrayerActions
