// 정원 메인 페이지

import { useState, useEffect } from 'react'
import { LambCharacter } from '../../components/garden/LambCharacter'
import { VirtualGarden } from '../../components/garden/VirtualGarden'
import { GrowthChart } from '../../components/garden/GrowthChart'
import { useGarden } from '../../hooks/useGarden'
import { useProfileDetail } from '../../hooks/useProfile'
import { calculateActivityPoints } from '../../utils/achievementCalculator'
import { calculateLambStage, getPointsToNextStage } from '../../utils/gardenCalculator'
import { celebrateLevelUp, celebrateGardenMilestone } from '../../utils/confettiEffects'
import type { UserActivityData } from '../../types/achievement'
import './Garden.css'

type ChartType = 'area' | 'line' | 'bar'

export const Garden: React.FC = () => {
  const [chartType, setChartType] = useState<ChartType>('area')
  const [previousLevel, setPreviousLevel] = useState<number>(0)

  const { flowers, monthlyGardens, currentMonthGarden, isLoading, error } = useGarden()
  const { data: profileData } = useProfileDetail()

  // 활동 데이터 계산
  const activityData: UserActivityData = {
    totalPrayerTime: profileData?.stats?.activity?.total_prayer_time || 0,
    totalPrayerCount: profileData?.stats?.activity?.total_count || 0,
    streakDays: profileData?.stats?.activity?.streak_days || 0,
    bibleVersesRead: flowers.length,
    bibleChaptersRead: profileData?.stats?.bible_reading?.chapters_read || 0,
    bibleBooksCompleted: profileData?.stats?.bible_reading?.books_completed || [],
    repliesCount: profileData?.stats?.content?.my_replies || 0,
    prayingForCount: profileData?.stats?.content?.praying_for || 0,
  }

  const points = calculateActivityPoints(activityData)
  const lambStage = calculateLambStage(points)
  const nextStageInfo = getPointsToNextStage(points)

  // 레벨업 감지 및 축하 효과
  useEffect(() => {
    if (previousLevel > 0 && lambStage.level > previousLevel) {
      celebrateLevelUp()
    }
    setPreviousLevel(lambStage.level)
  }, [lambStage.level])

  // 정원 마일스톤 축하
  useEffect(() => {
    const milestones = [10, 50, 100, 300, 500]
    if (milestones.includes(flowers.length)) {
      celebrateGardenMilestone()
    }
  }, [flowers.length])

  if (isLoading) {
    return (
      <div className="garden-page">
        <div className="garden-loading">
          <div className="garden-loading-spinner">🌱</div>
          <p>정원을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="garden-page">
        <div className="garden-error">
          <div className="garden-error-icon">😢</div>
          <p className="garden-error-text">정원을 불러올 수 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="garden-page">
      {/* 헤더 */}
      <div className="garden-header">
        <h1 className="garden-title">나의 신앙 정원 🌸</h1>
        <p className="garden-subtitle">
          기도와 말씀으로 가꾸는 아름다운 정원
        </p>
      </div>

      {/* 어린 양 섹션 */}
      <div className="garden-section">
        <div className="lamb-section">
          <LambCharacter stage={lambStage} points={points} size={150} />

          {/* 다음 단계 진행도 */}
          {nextStageInfo && (
            <div className="progress-section" style={{ marginTop: '2rem' }}>
              <div className="progress-info">
                <span className="progress-label">다음 단계까지</span>
                <span className="progress-value">
                  {nextStageInfo.needed}P 남음
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${((nextStageInfo.total - nextStageInfo.needed) / nextStageInfo.total) * 100}%`,
                  }}
                />
              </div>
              <p className="progress-hint">
                {nextStageInfo.nextStage.emoji} {nextStageInfo.nextStage.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 현재 월 정원 */}
      <div className="garden-section">
        <h2 className="garden-section-title">
          <span className="garden-section-icon">🌷</span>
          이번 달 정원
        </h2>
        {currentMonthGarden ? (
          <VirtualGarden
            flowers={currentMonthGarden.flowers}
            title={`${currentMonthGarden.year}년 ${currentMonthGarden.month}월`}
            showStats
          />
        ) : (
          <VirtualGarden flowers={[]} showStats={false} />
        )}
      </div>

      {/* 성장 차트 */}
      {flowers.length > 0 && (
        <div className="garden-section">
          <h2 className="garden-section-title">
            <span className="garden-section-icon">📊</span>
            성장 기록
          </h2>
          <div className="chart-section">
            <div className="chart-tabs">
              <button
                className={`chart-tab ${chartType === 'area' ? 'active' : ''}`}
                onClick={() => setChartType('area')}
              >
                영역 차트
              </button>
              <button
                className={`chart-tab ${chartType === 'line' ? 'active' : ''}`}
                onClick={() => setChartType('line')}
              >
                선 차트
              </button>
              <button
                className={`chart-tab ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
              >
                막대 차트
              </button>
            </div>
            <GrowthChart flowers={flowers} type={chartType} />
          </div>
        </div>
      )}

      {/* 월별 정원 히스토리 */}
      {monthlyGardens.length > 1 && (
        <div className="garden-section">
          <h2 className="garden-section-title">
            <span className="garden-section-icon">📅</span>
            정원 히스토리
          </h2>
          <div className="monthly-gardens-grid">
            {monthlyGardens.slice(1).map((garden) => (
              <VirtualGarden
                key={`${garden.year}-${garden.month}`}
                flowers={garden.flowers}
                title={`${garden.year}년 ${garden.month}월`}
                showStats={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
