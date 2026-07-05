import { LambCharacter } from '../../../components/garden/LambCharacter'
import { TitleEquippedChip } from '../../../components/titles/TitleEquippedChip'
import { calculateLambStage } from '../../../utils/gardenCalculator'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { GlowLevel } from '../../../types/achievement'

interface ProfileHeaderProps {
  username: string
  fullName: string
  glowLevel: GlowLevel
  activityPoints: number
  specialAchievementColor?: string
}

const ProfileHeader = ({ username, fullName, glowLevel, activityPoints, specialAchievementColor }: ProfileHeaderProps) => {
  const { t } = useLanguage()
  const lambStage = calculateLambStage(activityPoints)
  const auraColor = specialAchievementColor || glowLevel.glowColor

  return (
    <div className="flex flex-col items-center py-8 px-4">
      {/* 어린 양 캐릭터 — 뒤에서 레벨 보상 오라가 은은하게 숨쉰다 */}
      <div className="relative mb-3">
        <div
          className="animate-breathe pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${auraColor} 0%, transparent 70%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <LambCharacter stage={lambStage} points={activityPoints} size={140} showInfo={false} />
        </div>
      </div>

      {/* 꾸미기 칭호 — 닉네임 위 작은 칩 */}
      <TitleEquippedChip />

      {/* 메인: 이름 — 가장 크고 명확하게 */}
      <h2 className="mt-2 text-[24px] font-bold tracking-[-0.02em] leading-[1.25] text-gray-900 dark:text-white">
        {fullName}
      </h2>

      {/* 레벨 — 톤다운된 보라로 이름 아래 매끄럽게 연결 */}
      <p className="mt-1 text-[13px] font-semibold text-purple-500/90 dark:text-purple-300/75">
        Lv.{glowLevel.level} {t(glowLevel.nameKey)}
      </p>

      <p className="mt-0.5 text-[12px] text-gray-400 dark:text-white/40">@{username}</p>
    </div>
  )
}

export default ProfileHeader
