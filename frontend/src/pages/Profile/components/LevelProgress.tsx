import type { GlowLevel } from '../../../types/achievement'

interface LevelProgressProps {
  currentLevel: GlowLevel
  currentPoints: number
  pointsToNext: { needed: number; total: number } | null
}

const LevelProgress = ({ currentLevel, currentPoints, pointsToNext }: LevelProgressProps) => {
  const progress = pointsToNext 
    ? ((pointsToNext.total - pointsToNext.needed) / pointsToNext.total) * 100
    : 100
  
  return (
    <div className="px-4 py-6 border-b border-border-light dark:border-border-dark">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            신앙의 온도
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {currentPoints.toLocaleString()} 포인트
          </p>
        </div>
        <div 
          className="px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg"
          style={{
            backgroundColor: currentLevel.glowColor,
            boxShadow: `0 0 20px ${currentLevel.glowColor}`,
          }}
        >
          Lv.{currentLevel.level}
        </div>
      </div>
      
      {/* 진행 바 */}
      <div className="relative">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="h-3 rounded-full transition-all duration-500 relative"
            style={{ 
              width: `${progress}%`,
              background: `linear-gradient(to right, ${currentLevel.glowColor}, rgba(255, 255, 255, 0.8))`,
              boxShadow: `0 0 10px ${currentLevel.glowColor}`,
            }}
          >
            {/* 반짝이는 효과 */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
              style={{
                animation: 'shimmer 2s infinite',
              }}
            />
          </div>
        </div>
        
        {/* 다음 레벨 정보 */}
        {pointsToNext ? (
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {currentLevel.name}
            </span>
            <span className="text-purple-500 dark:text-purple-400 font-semibold">
              다음 레벨까지 {pointsToNext.needed.toLocaleString()}P
            </span>
          </div>
        ) : (
          <div className="text-center mt-2">
            <span className="text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              🎉 최고 레벨 달성! 🎉
            </span>
          </div>
        )}
      </div>
      
      {/* 포인트 획득 방법 안내 */}
      <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
          💡 포인트 획득 방법
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div>• 기도 1회: 2P</div>
          <div>• 댓글 1개: 3P</div>
          <div>• 성경 1절: 1P</div>
          <div>• 기도중 1개: 2P</div>
          <div>• 1장 완독: 3P</div>
          <div>• 1권 완독: 50P</div>
        </div>
      </div>
    </div>
  )
}

export default LevelProgress
