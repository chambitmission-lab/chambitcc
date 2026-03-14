// 정원 메인 페이지

import { useState } from 'react'
import { GrowingTree } from '../../components/garden/GrowingTree'
import { GrowthChart } from '../../components/garden/GrowthChart'
import { useGarden } from '../../hooks/useGarden'
import './Garden.css'

type ChartType = 'area' | 'line' | 'bar'

export const Garden: React.FC = () => {
  const [chartType, setChartType] = useState<ChartType>('area')
  const { flowers, isLoading, error } = useGarden()

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
        <h1 className="garden-title">나의 신앙 나무 🌳</h1>
        <p className="garden-subtitle">
          말씀을 읽을 때마다 조금씩 자라나는 생명의 나무
        </p>
      </div>

      {/* 성장하는 나무 */}
      <div className="garden-section">
        <GrowingTree versesRead={flowers.length} showInfo />
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
    </div>
  )
}
