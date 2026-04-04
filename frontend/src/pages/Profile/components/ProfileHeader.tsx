import ProfileGlow from './ProfileGlow'
import { LambCharacter } from '../../../components/garden/LambCharacter'
import { calculateLambStage } from '../../../utils/gardenCalculator'
import type { GlowLevel } from '../../../types/achievement'

interface ProfileHeaderProps {
  username: string
  fullName: string
  glowLevel: GlowLevel
  activityPoints: number
  specialAchievementColor?: string
}

const ProfileHeader = ({ username, fullName, glowLevel, activityPoints, specialAchievementColor }: ProfileHeaderProps) => {
  const lambStage = calculateLambStage(activityPoints)
  
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
      
      {/* 어린 양 캐릭터 */}
      <div style={{ marginTop: '1rem' }}>
        <LambCharacter stage={lambStage} points={activityPoints} size={80} showInfo={false} />
      </div>
    </div>
  )
}

export default ProfileHeader
