import ProfileGlow from './ProfileGlow'
import type { GlowLevel } from '../../../types/achievement'

interface ProfileHeaderProps {
  username: string
  fullName: string
  glowLevel: GlowLevel
  specialAchievementColor?: string
}

const ProfileHeader = ({ username, fullName, glowLevel, specialAchievementColor }: ProfileHeaderProps) => {
  return (
    <div className="flex flex-col items-center py-8 px-4">
      <ProfileGlow 
        glowLevel={glowLevel}
        fullName={fullName}
        specialAchievementColor={specialAchievementColor}
      />
      <h2 
        className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1"
        style={{
          filter: `drop-shadow(0 0 12px ${glowLevel.glowColor})`,
        }}
      >
        {fullName}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">@{username}</p>
    </div>
  )
}

export default ProfileHeader
