import type { Achievement } from '../../../types/achievement'

interface AchievementModalProps {
  achievement: Achievement | null
  onClose: () => void
}

const AchievementModal = ({ achievement, onClose }: AchievementModalProps) => {
  if (!achievement) return null
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: achievement.unlocked 
            ? `0 0 60px ${achievement.glowColor}, 0 20px 40px rgba(0, 0, 0, 0.3)`
            : '0 20px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* 아이콘 */}
        <div className="text-center mb-4">
          <div 
            className="inline-block text-6xl mb-3 filter drop-shadow-2xl"
            style={achievement.unlocked ? {
              filter: `drop-shadow(0 0 20px ${achievement.glowColor})`,
            } : undefined}
          >
            {achievement.icon}
          </div>
          
          {achievement.unlocked && (
            <div className="inline-block px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
              ✓ 해금됨
            </div>
          )}
        </div>
        
        {/* 제목 */}
        <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          {achievement.title}
        </h3>
        
        {/* 설명 */}
        <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
          {achievement.description}
        </p>
        
        {/* 진행도 */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">진행도</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {achievement.progress} / {achievement.requirement}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min((achievement.progress / achievement.requirement) * 100, 100)}%`,
                backgroundColor: achievement.unlocked ? achievement.glowColor : '#9ca3af',
                boxShadow: achievement.unlocked ? `0 0 10px ${achievement.glowColor}` : 'none',
              }}
            />
          </div>
        </div>
        
        {/* 보상 정보 */}
        {achievement.unlocked && (
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl mb-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              🎁 해금 보상
            </p>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              • 특별 글로우 효과 해금
              <br />
              • 프로필에 업적 뱃지 표시
            </div>
          </div>
        )}
        
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
        >
          확인
        </button>
      </div>
    </div>
  )
}

export default AchievementModal
