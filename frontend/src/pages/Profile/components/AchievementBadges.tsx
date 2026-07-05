import { useState } from 'react'
import type { Achievement } from '../../../types/achievement'
import { useLanguage } from '../../../contexts/LanguageContext'
import './AchievementBadges.css'

interface AchievementBadgesProps {
  achievements: Achievement[]
  onAchievementClick?: (achievement: Achievement) => void
}

// 접힌 상태에서 보여줄 배지 수 (4열 × 2줄)
const INITIAL_COUNT = 8

interface BadgeMedallionProps {
  achievement: Achievement
  shineDelay: number
}

const BadgeMedallion = ({ achievement, shineDelay }: BadgeMedallionProps) => {
  const progressPct = Math.min(
    (achievement.progress / achievement.requirement) * 100,
    100,
  )

  if (achievement.unlocked) {
    return (
      <div
        className="ach-ring-unlocked relative h-16 w-16 rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
        style={{
          background:
            'conic-gradient(from 210deg, #a855f7, #ec4899, #f59e0b, #ec4899, #a855f7)',
          boxShadow: `0 0 16px ${achievement.glowColor}`,
        }}
      >
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white dark:bg-[#241f33]">
          {/* 배지 색상 은은한 내부 틴트 */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 35%, ${achievement.glowColor}, transparent 72%)`,
            }}
          />
          <span className="relative text-[26px] leading-none drop-shadow-md">
            {achievement.icon}
          </span>
          <span
            className="ach-badge-shine"
            style={{ animationDelay: `${shineDelay}s` }}
            aria-hidden="true"
          />
        </div>
        <div className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg ring-2 ring-white dark:ring-card-dark">
          <span className="text-[10px] font-bold text-white">✓</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative h-16 w-16 rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
      style={{
        // 링 자체가 진행률 게이지 — 채워질수록 해금이 가까워 보이게
        background: `conic-gradient(rgba(168, 85, 247, 0.75) ${progressPct}%, rgba(148, 163, 184, 0.28) 0)`,
      }}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 dark:bg-[#211d2e]">
        <span
          className="text-[26px] leading-none opacity-40"
          style={{ filter: 'grayscale(1)' }}
        >
          {achievement.icon}
        </span>
      </div>
      <div className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 dark:bg-[#3a3547] ring-2 ring-white dark:ring-card-dark">
        <span className="material-icons-round text-[11px] text-gray-500 dark:text-white/45">
          lock
        </span>
      </div>
    </div>
  )
}

const AchievementBadges = ({ achievements, onAchievementClick }: AchievementBadgesProps) => {
  const { t } = useLanguage()
  const [showAll, setShowAll] = useState(false)

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  // 해금된 배지를 앞으로 — 접힌 상태에서 컬러 배지가 먼저 보이게
  const sorted = [...achievements].sort(
    (a, b) => Number(b.unlocked) - Number(a.unlocked),
  )
  const displayAchievements = showAll ? sorted : sorted.slice(0, INITIAL_COUNT)

  return (
    <div className="px-4 py-3">
      <div
        className="
          relative overflow-hidden rounded-2xl p-5
          bg-white/80 dark:bg-card-dark
          border border-gray-200/70 dark:border-white/[0.08]
          shadow-sm
          dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(168,85,247,0.10)]
        "
      >
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-bold text-gray-900 dark:text-white tracking-[-0.01em]">
            🏆 {t('achievementTitle')}{' '}
            <span className="font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent tabular-nums">
              {unlockedCount}/{achievements.length}
            </span>
          </h3>
          {achievements.length > INITIAL_COUNT && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-[12px] font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              {showAll ? t('achievementCollapse') : t('achievementShowAll')}
            </button>
          )}
        </div>

        <div className="relative z-10 grid grid-cols-4 gap-x-2 gap-y-4">
          {displayAchievements.map((achievement, index) => (
            <button
              key={achievement.id}
              type="button"
              onClick={() => onAchievementClick?.(achievement)}
              className="group flex flex-col items-center gap-1.5"
              aria-label={`${t(achievement.titleKey)}${
                achievement.unlocked ? '' : ` (${t('achievementProgress')} ${achievement.progress}/${achievement.requirement})`
              }`}
            >
              <BadgeMedallion
                achievement={achievement}
                shineDelay={(index % 4) * 0.4}
              />

              <span
                className={`w-full text-center text-[10.5px] font-semibold leading-tight line-clamp-1 ${
                  achievement.unlocked
                    ? 'text-gray-800 dark:text-white/85'
                    : 'text-gray-400 dark:text-white/35'
                }`}
              >
                {t(achievement.titleKey)}
              </span>

              {!achievement.unlocked && (
                <span className="-mt-1 text-[9.5px] tabular-nums text-gray-400 dark:text-white/30">
                  {achievement.progress}/{achievement.requirement}
                </span>
              )}
            </button>
          ))}
        </div>

        {unlockedCount === 0 && (
          <p className="relative z-10 mt-4 mb-0 text-center text-[12px] text-gray-400 dark:text-white/40">
            {t('achievementStartPraying')}
          </p>
        )}
      </div>
    </div>
  )
}

export default AchievementBadges
