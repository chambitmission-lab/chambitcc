import React, { useState } from 'react'
import TextToSpeechButton from '../../../../components/common/TextToSpeechButton'
import type { GroupColorTheme } from '../../../../utils/groupColors'

interface PrayerActionsProps {
  isPrayed: boolean
  isPraying: boolean
  onPray: (e: React.MouseEvent) => void
  prayerText: string
  colorTheme: GroupColorTheme
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
  prayerText,
  colorTheme
}: PrayerActionsProps) => {
  const [particles, setParticles] = useState<LightParticle[]>([])

  const handlePrayClick = (e: React.MouseEvent) => {
    onPray(e)
    
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

  return (
    <>
      <div className="px-4 flex items-center gap-3 mb-2">
        <button
          onClick={handlePrayClick}
          disabled={isPraying}
          className={`relative group flex items-center gap-1 transition-all duration-300 ${
            !useGroupColor && isPrayed ? 'text-ig-red' : 
            !useGroupColor ? 'text-gray-800 dark:text-white hover:opacity-70' : ''
          }`}
          style={useGroupColor && isPrayed ? {
            color: colorTheme.accent,
            filter: `drop-shadow(0 0 8px ${colorTheme.glow}) drop-shadow(0 0 16px ${colorTheme.glow})`,
            animation: 'holy-glow-icon 2s ease-in-out infinite'
          } : {}}
        >
          <span 
            className={`text-[24px] transition-transform duration-300 ${
              isPrayed ? 'material-icons-round scale-110' : 'material-icons-outlined'
            }`}
            style={useGroupColor && isPrayed ? {
              filter: `drop-shadow(0 0 4px ${colorTheme.glow})`
            } : {}}
          >
            volunteer_activism
          </span>
        </button>
        
        <TextToSpeechButton 
          text={prayerText}
          size="md"
        />
      </div>

      {/* 빛 알갱이 파티클 */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="prayer-light-particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            filter: useGroupColor ? `drop-shadow(0 0 4px ${colorTheme.glow})` : 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.8))'
          }}
        >
          {useGroupColor ? colorTheme.particle : '✨'}
        </div>
      ))}
      
      <style>{`
        @keyframes holy-glow-icon {
          0%, 100% {
            filter: drop-shadow(0 0 8px ${colorTheme.glow}) drop-shadow(0 0 16px ${colorTheme.glow});
          }
          50% {
            filter: drop-shadow(0 0 12px ${colorTheme.glow}) drop-shadow(0 0 24px ${colorTheme.glow});
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
