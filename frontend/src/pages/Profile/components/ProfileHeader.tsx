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
    <div className="px-4 pt-5 pb-3">
      {/* ===== 네온 ID 카드 — 캐릭터·칭호·이름을 한 덩어리로 ===== */}
      <div
        className="
          relative overflow-hidden rounded-3xl px-5 pt-4 pb-6
          bg-white/80 dark:bg-card-dark
          border border-purple-200/60 dark:border-purple-400/25
          shadow-[0_8px_28px_rgba(168,85,247,0.14)]
          dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_0_1px_rgba(168,85,247,0.08),0_12px_40px_rgba(168,85,247,0.18)]
        "
      >
        {/* 카드 상단 네온 액센트 라인 */}
        <div
          className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-70"
          aria-hidden="true"
        />
        {/* 다크 카드 표면 미세 그라데이션 */}
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
        {/* 등급 컬러 코너 글로우 */}
        <div
          className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full blur-3xl opacity-30 dark:opacity-40"
          style={{ background: auraColor }}
          aria-hidden="true"
        />
        {/* 등급 워터마크 — 우하단 등불 실루엣 */}
        <span
          className="pointer-events-none absolute -bottom-7 -right-4 select-none text-[110px] leading-none opacity-[0.06] dark:opacity-[0.08]"
          style={{ filter: 'grayscale(0.4)' }}
          aria-hidden="true"
        >
          🏮
        </span>

        {/* 카드 헤더 — ID 라벨 + 클래스 마크 */}
        <div className="relative z-10 flex items-start justify-between">
          <span className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-white/30">
            Chambit · ID
          </span>
          <div
            className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-bold"
            style={{
              borderColor: auraColor,
              color: 'inherit',
              boxShadow: `0 0 10px ${auraColor}`,
            }}
          >
            <span aria-hidden="true">🏮</span>
            <span className="text-gray-700 dark:text-white/85">
              Lv.{glowLevel.level} {t(glowLevel.nameKey)}
            </span>
          </div>
        </div>

        {/* 아바타 — 등급 컬러 링 안의 캐릭터 */}
        <div className="relative z-10 mt-3 flex justify-center">
          <div className="relative">
            {/* 등불 오라 — 링 뒤에서 은은하게 숨쉼 */}
            <div
              className="animate-breathe pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
              style={{
                background: `radial-gradient(circle, ${auraColor} 0%, transparent 70%)`,
              }}
              aria-hidden="true"
            />
            <div
              className="relative rounded-full p-[3px]"
              style={{
                background: `conic-gradient(from 210deg, ${auraColor}, rgba(168,85,247,0.9), rgba(236,72,153,0.9), ${auraColor})`,
                boxShadow: `0 0 22px ${auraColor}`,
              }}
            >
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-purple-50/90 dark:bg-[#211d2e]">
                <LambCharacter stage={lambStage} points={activityPoints} size={92} showInfo={false} variant="avatar" />
              </div>
            </div>
          </div>
        </div>

        {/* 칭호 → 이름 → 아이디 */}
        <div className="relative z-10 mt-3 flex flex-col items-center">
          <TitleEquippedChip />
          <h2 className="mt-2 text-[24px] font-bold tracking-[-0.02em] leading-[1.25] text-gray-900 dark:text-white">
            {fullName}
          </h2>
          <p className="mt-0.5 text-[12px] text-gray-400 dark:text-white/40">@{username}</p>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
