// 정원 메인 페이지

import { GrowingTree } from '../../components/garden/GrowingTree'
import { useGarden } from '../../hooks/useGarden'
import './Garden.css'

export const Garden: React.FC = () => {
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
    </div>
  )
}
