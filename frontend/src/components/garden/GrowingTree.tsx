// 성장하는 나무 컴포넌트

import { useMemo, useState, useEffect } from 'react'
import { getGardenTheme, type GardenTheme } from '../../api/garden'
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

// 시간대 타입
type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

// 한국 시간 기준으로 시간대 계산
const getTimeOfDay = (): TimeOfDay => {
  const now = new Date()
  // 한국 시간으로 변환 (UTC+9)
  const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  const hour = koreaTime.getHours()
  
  if (hour >= 5 && hour < 7) return 'dawn'      // 새벽 5-7시
  if (hour >= 7 && hour < 17) return 'day'      // 낮 7-17시
  if (hour >= 17 && hour < 19) return 'dusk'    // 저녁 17-19시
  return 'night'                                 // 밤 19-5시
}

export const GrowingTree: React.FC<GrowingTreeProps> = ({ versesRead, showInfo = true }) => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay())
  const [gardenTheme, setGardenTheme] = useState<GardenTheme | null>(null)
  
  // 정원 테마 불러오기
  useEffect(() => {
    const loadTheme = async () => {
      try {
        console.log('Loading garden theme...')
        const theme = await getGardenTheme()
        console.log('Loaded theme:', theme)
        setGardenTheme(theme)
      } catch (err) {
        console.error('테마 불러오기 실패:', err)
        // 에러 시 기본 테마 사용
        setGardenTheme({
          theme_type: 'preset',
          preset_name: 'classic',
          moon_image_url: null,
          sun_image_url: null,
        })
      }
    }
    
    loadTheme()
  }, [])
  
  // 1분마다 시간대 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay())
    }, 60000) // 1분
    
    return () => clearInterval(interval)
  }, [])
  
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
      <div className={`tree-display time-${timeOfDay}`}>
        <div className="tree-background">
          {/* 하늘 */}
          <div className="tree-sky">
            {/* 낮: 태양 */}
            {(timeOfDay === 'day' || timeOfDay === 'dawn') && (
              <div 
                className="sun"
                style={
                  gardenTheme?.theme_type === 'custom' && gardenTheme.sun_image_url
                    ? { 
                        backgroundImage: `url(${gardenTheme.sun_image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }
                    : undefined
                }
              ></div>
            )}
            
            {/* 밤: 달과 별 */}
            {(timeOfDay === 'night' || timeOfDay === 'dusk') && (
              <>
                <div 
                  className="moon"
                  style={
                    gardenTheme?.theme_type === 'custom' && gardenTheme.moon_image_url
                      ? { 
                          backgroundImage: `url(${gardenTheme.moon_image_url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }
                      : undefined
                  }
                ></div>
                <div className="stars">
                  <span className="star star-1">⭐</span>
                  <span className="star star-2">⭐</span>
                  <span className="star star-3">⭐</span>
                  <span className="star star-4">✨</span>
                  <span className="star star-5">✨</span>
                </div>
                {/* 별똥별 */}
                <div className="shooting-stars">
                  <span className="shooting-star"></span>
                  <span className="shooting-star shooting-star-2"></span>
                  <span className="shooting-star shooting-star-3"></span>
                </div>
              </>
            )}
            
            {/* 낮: 구름 */}
            {(timeOfDay === 'day' || timeOfDay === 'dawn') && (
              <>
                <div className="cloud cloud-1"></div>
                <div className="cloud cloud-2"></div>
              </>
            )}
          </div>
          
          {/* 땅 */}
          <div className="tree-ground">
            <div className="grass"></div>
            
            {/* 땅 위 장식 요소들 */}
            <div className="ground-decorations">
              {/* 버섯들 */}
              <span className="mushroom mushroom-1">🍄</span>
              <span className="mushroom mushroom-2">🍄</span>
              
              {/* 돌멩이들 */}
              <span className="rock rock-1">🪨</span>
              <span className="rock rock-2">🪨</span>
              <span className="rock rock-3">🪨</span>
              
              {/* 풀 더미들 */}
              <span className="grass-tuft tuft-1">🌾</span>
              <span className="grass-tuft tuft-2">🌾</span>
              <span className="grass-tuft tuft-3">🌾</span>
              <span className="grass-tuft tuft-4">🌿</span>
            </div>
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
          
          {/* 벌과 나비 - 꽃이 있을 때만 표시 */}
          {currentStage.flowers && currentStage.flowers.length > 0 && (
            <div className="tree-insects">
              <span className="insect bee">🐝</span>
              <span className="insect butterfly">🦋</span>
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
