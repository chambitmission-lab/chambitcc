import type { GlowLevel } from '../../../types/achievement'
import { getReadableTextStyle, toOpaqueColor } from '../../../utils/contrastText'

interface ProfileGlowProps {
  glowLevel: GlowLevel
  fullName: string
  specialAchievementColor?: string
}

const ProfileGlow = ({ glowLevel, specialAchievementColor }: ProfileGlowProps) => {
  const glowColor = specialAchievementColor || glowLevel.glowColor
  const badgeText = getReadableTextStyle(glowColor)

  return (
    <div className="flex justify-center mb-2">
      {/* 레벨 뱃지 — 이니셜 원 제거, 레벨 표식만 깔끔하게 */}
      <div
        className="px-4 py-1.5 rounded-full text-sm font-bold shadow-lg whitespace-nowrap"
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
