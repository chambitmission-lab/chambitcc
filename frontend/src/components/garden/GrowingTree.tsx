// 성장하는 나무 컴포넌트

import { useMemo, useState, useEffect } from 'react'
import { getGardenTheme, type GardenTheme } from '../../api/garden'
import { TreeSVG } from './TreeSVG'
import './GrowingTree.css'

interface GrowingTreeProps {
  versesRead: number // 읽은 구절 수
  totalVerses?: number // 성경 전체 구절 수 (백엔드 값 우선, 없으면 기본값 사용)
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

// 성경 전체 구절 수 기본값 (개역개정 기준 약 31,102절). 백엔드가 값을 내려주면 그걸 우선 사용.
const DEFAULT_TOTAL_BIBLE_VERSES = 31102

const TREE_STAGES: TreeStage[] = [
  { level: 0, name: '씨앗', minVerses: 0, emoji: '🌰', description: '씨앗이 땅에 심어졌어요' },
  { level: 1, name: '새싹', minVerses: 1000, emoji: '🌱', description: '작은 새싹이 돋아났어요' },
  { level: 2, name: '어린 묘목', minVerses: 5000, emoji: '🌿', description: '푸른 잎이 자라나고 있어요' },
  { level: 3, name: '자라는 나무', minVerses: 10000, emoji: '🌳', description: '튼튼한 나무로 자라고 있어요' },
  { level: 4, name: '꽃 피는 나무', minVerses: 17000, emoji: '🌳', flowers: ['🌸', '🌸', '🌸'], description: '아름다운 꽃이 피었어요' },
  { level: 5, name: '열매 맺는 나무', minVerses: 24000, emoji: '🌳', flowers: ['🌸', '🌸'], fruits: ['🍎', '🍎', '🍎'], description: '풍성한 열매를 맺었어요' },
  { level: 6, name: '생명의 나무', minVerses: DEFAULT_TOTAL_BIBLE_VERSES, emoji: '🌳', flowers: ['🌸', '🌸', '🌸'], fruits: ['🍎', '🍎', '🍎', '🍎'], sparkles: true, description: '성경 전체를 완독하여 생명의 나무로 완성되었어요' },
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

export const GrowingTree: React.FC<GrowingTreeProps> = ({ versesRead, totalVerses, showInfo = true }) => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay())
  const [gardenTheme, setGardenTheme] = useState<GardenTheme | null>(null)

  // 백엔드에서 내려준 총 구절 수를 우선 사용, 없으면 기본값
  const totalBibleVerses = totalVerses && totalVerses > 0 ? totalVerses : DEFAULT_TOTAL_BIBLE_VERSES

  // 마지막 단계를 실제 총 구절 수에 맞춤 (역본에 따른 차이 흡수)
  const treeStages = useMemo<TreeStage[]>(() => {
    const stages = TREE_STAGES.map(s => ({ ...s }))
    stages[stages.length - 1].minVerses = totalBibleVerses
    return stages
  }, [totalBibleVerses])
  
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
    for (let i = treeStages.length - 1; i >= 0; i--) {
      if (versesRead >= treeStages[i].minVerses) {
        return treeStages[i]
      }
    }
    return treeStages[0]
  }, [versesRead, treeStages])

  // 다음 단계 정보
  const nextStage = useMemo(() => {
    const currentIndex = treeStages.findIndex(s => s.level === currentStage.level)
    if (currentIndex === treeStages.length - 1) return null
    return treeStages[currentIndex + 1]
  }, [currentStage, treeStages])

  // 진행률 계산 (다음 단계까지)
  const progress = useMemo(() => {
    if (!nextStage) return 100
    const current = versesRead - currentStage.minVerses
    const total = nextStage.minVerses - currentStage.minVerses
    return Math.min(100, (current / total) * 100)
  }, [versesRead, currentStage, nextStage])

  // 전체 성경 완독률
  const overallProgress = useMemo(() => {
    return Math.min(100, (versesRead / totalBibleVerses) * 100)
  }, [versesRead, totalBibleVerses])

  // SVG 나무 연속 성장값(0..1). 지수 0.45로 초반 성장을 빠르게 체감시키고
  // 후반은 완만하게 — "읽을 때마다 잎이 늘어나는" 재미를 위해.
  const treeGrowth = useMemo(() => {
    if (versesRead <= 0) return 0
    return Math.min(1, Math.pow(versesRead / totalBibleVerses, 0.45))
  }, [versesRead, totalBibleVerses])

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
          </div>
        </div>

        {/* 나무 — 절차적 SVG, 읽은 절 수에 비례해 연속 성장 */}
        <TreeSVG growth={treeGrowth} timeOfDay={timeOfDay} />
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
              <span className="tree-stat-value">{versesRead.toLocaleString()}</span>
              <span className="tree-stat-sub">/ {totalBibleVerses.toLocaleString()}절</span>
            </div>

            <div className="tree-stat">
              <span className="tree-stat-label">전체 완독률</span>
              <span className="tree-stat-value">{overallProgress.toFixed(1)}<span className="tree-stat-unit">%</span></span>
              <span className="tree-stat-sub">성경 전체 기준</span>
            </div>
          </div>

          {/* 다음 단계 진행도 */}
          {nextStage && (
            <div className="tree-progress">
              <div className="tree-progress-info">
                <span className="tree-progress-label">
                  {nextStage.emoji} {nextStage.name}까지
                </span>
                <span className="tree-progress-percent">{Math.floor(progress)}%</span>
              </div>
              <div className="tree-progress-bar">
                <div
                  className="tree-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="tree-progress-footer">
                남은 구절 {(nextStage.minVerses - versesRead).toLocaleString()}절
              </div>
            </div>
          )}

          {!nextStage && (
            <div className="tree-complete">
              <span className="tree-complete-icon">🎉</span>
              <span className="tree-complete-text">성경 전체를 완독했어요!</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
