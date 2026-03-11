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
      <div className="px-4 py-6 border-b border-border-light dark:border-border-dark">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          🏆 업적
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            아직 해금된 업적이 없습니다
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            기도하고 성경을 읽으며 업적을 해금하세요!
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="px-4 py-6 border-b border-border-light dark:border-border-dark">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          🏆 업적 ({unlockedAchievements.length}/{achievements.length})
        </h3>
        {unlockedAchievements.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 font-semibold"
          >
            {showAll ? '접기' : '전체보기'}
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {displayAchievements.map((achievement) => (
          <button
            key={achievement.id}
            onClick={() => onAchievementClick?.(achievement)}
            className={`
              relative p-3 rounded-xl transition-all duration-300
              ${achievement.unlocked 
                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 hover:scale-105 hover:shadow-lg' 
                : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 opacity-50'
              }
            `}
            style={achievement.unlocked ? {
              boxShadow: `0 0 20px ${achievement.glowColor}`,
            } : undefined}
          >
            {/* 아이콘 */}
            <div className="text-3xl mb-1 filter drop-shadow-lg">
              {achievement.icon}
            </div>
            
            {/* 제목 */}
            <div className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">
              {achievement.title}
            </div>
            
            {/* 진행도 (미해금 업적만) */}
            {!achievement.unlocked && (
              <div className="mt-1">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div 
                    className="bg-purple-500 h-1 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((achievement.progress / achievement.requirement) * 100, 100)}%` 
                    }}
                  />
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {achievement.progress}/{achievement.requirement}
                </div>
              </div>
            )}
            
            {/* 해금 표시 */}
            {achievement.unlocked && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default AchievementBadges
