import type { Achievement } from '../../../types/achievement'
import { useLanguage } from '../../../contexts/LanguageContext'

interface AchievementModalProps {
  achievement: Achievement | null
  onClose: () => void
}

const AchievementModal = ({ achievement, onClose }: AchievementModalProps) => {
  const { t } = useLanguage()
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
              ✓ {t('achievementUnlocked')}
            </div>
          )}
        </div>
        
        {/* 제목 */}
        <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          {t(achievement.titleKey)}
        </h3>

        {/* 설명 */}
        <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
          {t(achievement.descKey)}
        </p>

        {/* 진행도 */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">{t('achievementProgress')}</span>
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
          <div className="p-4 bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] rounded-xl mb-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              🎁 {t('achievementReward')}
            </p>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              • {t('achievementRewardGlow')}
              <br />
              • {t('achievementRewardBadge')}
            </div>
          </div>
        )}
        
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="w-full py-3 brand-gradient font-bold rounded-xl shadow-[0_2px_10px_var(--brand-glow)] hover:shadow-[0_4px_16px_var(--brand-glow)] transition-all"
        >
          {t('achievementConfirm')}
        </button>
      </div>
    </div>
  )
}

export default AchievementModal
