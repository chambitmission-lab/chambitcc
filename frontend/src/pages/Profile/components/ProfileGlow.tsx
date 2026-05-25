import { useMemo } from 'react'
import type { GlowLevel } from '../../../types/achievement'
import { getReadableTextStyle, toOpaqueColor } from '../../../utils/contrastText'

interface ProfileGlowProps {
  glowLevel: GlowLevel
  fullName: string
  specialAchievementColor?: string
}

const ProfileGlow = ({ glowLevel, fullName, specialAchievementColor }: ProfileGlowProps) => {
  const glowColor = specialAchievementColor || glowLevel.glowColor
  const badgeText = getReadableTextStyle(glowColor)

  // 애니메이션 스타일 생성
  const pulseAnimation = useMemo(() => ({
    animation: `pulse ${glowLevel.pulseSpeed}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
  }), [glowLevel.pulseSpeed])
  
  return (
    <div className="relative mb-4">
      {/* 하늘에서 내려오는 빛 효과 */}
      <div 
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-[4px] h-12 bg-gradient-to-b from-transparent blur-[2px]"
        style={{
          backgroundImage: `linear-gradient(to bottom, transparent, ${glowColor})`,
        }}
      />
      <div 
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-[2px] h-12 bg-gradient-to-b from-transparent"
        style={{
          backgroundImage: `linear-gradient(to bottom, transparent, ${glowColor})`,
        }}
      />
      
      {/* 주변 빛 확산 효과 - 레벨에 따라 크기 변화 */}
      <div 
        className="absolute inset-0 rounded-full blur-xl"
        style={{
          backgroundColor: glowColor,
          opacity: glowLevel.glowIntensity * 0.4,
          transform: `scale(${1 + glowLevel.glowSize / 100})`,
          ...pulseAnimation,
        }}
      />
      
      {/* 중간 글로우 레이어 */}
      <div 
        className="absolute inset-0 rounded-full blur-lg"
        style={{
          backgroundColor: glowColor,
          opacity: glowLevel.glowIntensity * 0.6,
          transform: `scale(${1 + glowLevel.glowSize / 150})`,
        }}
      />
      
      {/* 프로필 아바타 — 본체는 브랜드 purple→pink 솔리드 베이스(이니셜 항상 가독),
          레벨 색(glowColor)은 링(border) + 글로우로 표현해 라이트/다크 모두에서 읽히게 한다.
          (레벨색을 채움으로 쓰면 gray·white 레벨이 흰 배경에서 사라짐) */}
      <div
        className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold relative z-10"
        style={{
          borderWidth: '4px',
          borderColor: glowColor,
          boxShadow: `
            0 0 ${glowLevel.glowSize}px ${glowColor},
            0 -12px 30px ${glowColor},
            inset 0 2px 4px rgba(255, 255, 255, 0.35)
          `,
        }}
      >
        {fullName.charAt(0).toUpperCase()}
      </div>
      
      {/* 레벨 뱃지 */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-lg z-20"
        style={{
          backgroundColor: toOpaqueColor(glowColor),
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: `0 0 20px ${glowColor}`,
          color: badgeText.color,
          textShadow: badgeText.textShadow,
        }}
      >
        {glowLevel.name}
      </div>
    </div>
  )
}

export default ProfileGlow
