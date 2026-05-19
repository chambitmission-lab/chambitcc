import { useState } from 'react'
import type { Achievement } from '../../../types/achievement'

interface AchievementBadgesProps {
  achievements: Achievement[]
  onAchievementClick?: (achievement: Achievement) => void
}

const AchievementBadges = ({ achievements, onAchievementClick }: AchievementBadgesProps) => {
  const [showAll, setShowAll] = useState(false)

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const displayAchievements = showAll ? achievements : unlockedAchievements.slice(0, 6)

  if (unlockedAchievements.length === 0) {
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
          <div className="relative z-10">
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3 tracking-[-0.01em]">
              🏆 업적
            </h3>
            <div className="text-center py-6">
              <p className="text-[13px] text-gray-500 dark:text-white/60 mb-1">
                아직 해금된 업적이 없습니다
              </p>
              <p className="text-[12px] text-gray-400 dark:text-white/40">
                기도하고 성경을 읽으며 업적을 해금하세요!
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
            🏆 업적 ({unlockedAchievements.length}/{achievements.length})
          </h3>
          {unlockedAchievements.length > 6 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-[12px] font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              {showAll ? '접기' : '전체보기'}
            </button>
          )}
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-2.5">
          {displayAchievements.map((achievement) => (
            <button
              key={achievement.id}
              onClick={() => onAchievementClick?.(achievement)}
              className={`
                relative p-3 rounded-xl transition-all duration-300 text-left
                ${achievement.unlocked
                  ? 'bg-gradient-to-br from-purple-500/15 to-pink-500/15 dark:from-purple-500/20 dark:to-pink-500/15 border border-purple-500/40 dark:border-purple-400/30 hover:scale-105 hover:shadow-lg'
                  : 'bg-gray-100/60 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] opacity-55'
                }
              `}
              style={achievement.unlocked ? {
                boxShadow: `0 0 18px ${achievement.glowColor}`,
              } : undefined}
            >
              <div className="text-[28px] mb-1 filter drop-shadow-lg leading-none">
                {achievement.icon}
              </div>

              <div className="text-[11.5px] font-semibold text-gray-900 dark:text-white line-clamp-1">
                {achievement.title}
              </div>

              {!achievement.unlocked && (
                <div className="mt-1.5">
                  <div className="w-full bg-gray-200 dark:bg-white/[0.06] rounded-full h-1">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((achievement.progress / achievement.requirement) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-white/50 mt-0.5">
                    {achievement.progress}/{achievement.requirement}
                  </div>
                </div>
              )}

              {achievement.unlocked && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-[11px]">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AchievementBadges
