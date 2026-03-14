// 정원 메인 페이지

import { useState } from 'react'
import { GrowingTree } from '../../components/garden/GrowingTree'
import { useGarden } from '../../hooks/useGarden'
import { GardenCustomizeModal } from '../../components/garden/GardenCustomizeModal'
import './Garden.css'

export const Garden: React.FC = () => {
  const { flowers, isLoading, error } = useGarden()
  const [showCustomizeModal, setShowCustomizeModal] = useState(false)

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
        <div className="garden-header-content">
          <div>
            <h1 className="garden-title">나의 신앙 나무 🌳</h1>
            <p className="garden-subtitle">
              말씀을 읽을 때마다 조금씩 자라나는 생명의 나무
            </p>
          </div>
          <button 
            className="garden-customize-button"
            onClick={() => setShowCustomizeModal(true)}
          >
            <span className="material-icons-round">palette</span>
            정원 꾸미기
          </button>
        </div>
      </div>

      {/* 성장하는 나무 */}
      <div className="garden-section">
        <GrowingTree versesRead={flowers.length} showInfo />
      </div>

      {/* 정원 꾸미기 모달 */}
      {showCustomizeModal && (
        <GardenCustomizeModal onClose={() => setShowCustomizeModal(false)} />
      )}
    </div>
  )
}
