// 성장하는 나무 컴포넌트

import { useMemo } from 'react'
import './GrowingTree.css'

interface GrowingTreeProps {
  versesRead: number // 읽은 구절 수
  showInfo?: boolean
}

// 나무 성장 단계 정의
interface TreeStage {
  level: number
  name: string
  minVerses: number
  emoji: string
  flowers?: string[]
  fruits?: string[]
  sparkles?: boolean
  description: string
}

const TREE_STAGES: TreeStage[] = [
  { level: 0, name: '씨앗', minVerses: 0, emoji: '🌰', description: '씨앗이 땅에 심어졌어요' },
  { level: 1, name: '새싹', minVerses: 10, emoji: '🌱', description: '작은 새싹이 돋아났어요' },
  { level: 2, name: '어린 묘목', minVerses: 30, emoji: '🌿', description: '푸른 잎이 자라나고 있어요' },
  { level: 3, name: '자라는 나무', minVerses: 60, emoji: '🌳', description: '튼튼한 나무로 자라고 있어요' },
  { level: 4, name: '꽃 피는 나무', minVerses: 100, emoji: '🌳', flowers: ['🌸', '🌸', '🌸'], description: '아름다운 꽃이 피었어요' },
  { level: 5, name: '열매 맺는 나무', minVerses: 150, emoji: '🌳', flowers: ['🌸', '🌸'], fruits: ['🍎', '🍎', '🍎'], description: '풍성한 열매를 맺었어요' },
  { level: 6, name: '생명의 나무', minVerses: 300, emoji: '🌳', flowers: ['🌸', '🌸', '🌸'], fruits: ['🍎', '🍎', '🍎', '🍎'], sparkles: true, description: '완전히 성장한 생명의 나무예요' },
]

export const GrowingTree: React.FC<GrowingTreeProps> = ({ versesRead, showInfo = true }) => {
  // 현재 나무 단계 계산
  const currentStage = useMemo(() => {
    for (let i = TREE_STAGES.length - 1; i >= 0; i--) {
      if (versesRead >= TREE_STAGES[i].minVerses) {
        return TREE_STAGES[i]
      }
    }
    return TREE_STAGES[0]
  }, [versesRead])

  // 다음 단계 정보
  const nextStage = useMemo(() => {
    const currentIndex = TREE_STAGES.findIndex(s => s.level === currentStage.level)
    if (currentIndex === TREE_STAGES.length - 1) return null
    return TREE_STAGES[currentIndex + 1]
  }, [currentStage])

  // 진행률 계산
  const progress = useMemo(() => {
    if (!nextStage) return 100
    const current = versesRead - currentStage.minVerses
    const total = nextStage.minVerses - currentStage.minVerses
    return Math.min(100, (current / total) * 100)
  }, [versesRead, currentStage, nextStage])

  return (
    <div className="growing-tree-container">
      {/* 나무 표시 영역 */}
      <div className="tree-display">
        <div className="tree-background">
          {/* 하늘 */}
          <div className="tree-sky">
            <div className="sun"></div>
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
          </div>
          
          {/* 땅 */}
          <div className="tree-ground">
            <div className="grass"></div>
          </div>
        </div>

        {/* 나무 */}
        <div className={`tree-main stage-${currentStage.level}`}>
          <div className="tree-emoji">{currentStage.emoji}</div>
          
          {/* 꽃들 - 나무 주변에 배치 */}
          {currentStage.flowers && currentStage.flowers.length > 0 && (
            <div className="tree-flowers">
              {currentStage.flowers.map((flower, index) => (
                <span key={`flower-${index}`} className={`tree-flower flower-${index + 1}`}>
                  {flower}
                </span>
              ))}
            </div>
          )}
          
          {/* 열매들 - 나무 주변에 배치 */}
          {currentStage.fruits && currentStage.fruits.length > 0 && (
            <div className="tree-fruits">
              {currentStage.fruits.map((fruit, index) => (
                <span key={`fruit-${index}`} className={`tree-fruit fruit-${index + 1}`}>
                  {fruit}
                </span>
              ))}
            </div>
          )}
          
          {/* 성장 효과 */}
          {versesRead > 0 && currentStage.sparkles && (
            <div className="tree-sparkles">
              <span className="sparkle">✨</span>
              <span className="sparkle">✨</span>
              <span className="sparkle">✨</span>
            </div>
          )}
        </div>
      </div>

      {/* 정보 표시 */}
      {showInfo && (
        <div className="tree-info">
          <div className="tree-stage-badge">
            <span className="tree-stage-emoji">{currentStage.emoji}</span>
            <span className="tree-stage-name">{currentStage.name}</span>
          </div>
          
          <p className="tree-description">{currentStage.description}</p>
          
          <div className="tree-stats">
            <div className="tree-stat">
              <span className="tree-stat-label">읽은 구절</span>
              <span className="tree-stat-value">{versesRead}절</span>
            </div>
            
            {nextStage && (
              <div className="tree-stat">
                <span className="tree-stat-label">다음 단계까지</span>
                <span className="tree-stat-value">{nextStage.minVerses - versesRead}절</span>
              </div>
            )}
          </div>

          {/* 진행도 바 */}
          {nextStage && (
            <div className="tree-progress">
              <div className="tree-progress-info">
                <span className="tree-progress-label">
                  {nextStage.emoji} {nextStage.name}
                </span>
                <span className="tree-progress-percent">{Math.floor(progress)}%</span>
              </div>
              <div className="tree-progress-bar">
                <div 
                  className="tree-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!nextStage && (
            <div className="tree-complete">
              <span className="tree-complete-icon">🎉</span>
              <span className="tree-complete-text">완전히 성장했어요!</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
