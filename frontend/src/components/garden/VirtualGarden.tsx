// 가상 정원 컴포넌트

import { useState, useMemo } from 'react'
import type { GardenFlower } from '../../types/garden'
import { FLOWER_EMOJIS } from '../../types/garden'
import { calculateGardenStats, calculateGardenLevel } from '../../utils/gardenCalculator'
import './VirtualGarden.css'

interface VirtualGardenProps {
  flowers: GardenFlower[]
  title?: string
  showStats?: boolean
}

export const VirtualGarden: React.FC<VirtualGardenProps> = ({
  flowers,
  title,
  showStats = true,
}) => {
  const [selectedFlower, setSelectedFlower] = useState<GardenFlower | null>(null)

  const stats = useMemo(() => calculateGardenStats(flowers), [flowers])
  const gardenLevel = useMemo(() => calculateGardenLevel(flowers.length), [flowers.length])

  if (flowers.length === 0) {
    return (
      <div className="virtual-garden">
        <div className="garden-ground" />
        <div className="garden-empty">
          <div className="garden-empty-icon">🌱</div>
          <div className="garden-empty-text">
            아직 정원이 비어있어요
          </div>
          <div className="garden-empty-hint">
            성경을 읽으면 아름다운 꽃이 피어납니다
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {title && (
        <div className="monthly-garden-header">
          <h3 className="monthly-garden-title">{title}</h3>
          <span className="monthly-garden-count">
            {flowers.length}송이의 꽃
          </span>
        </div>
      )}

      <div className="garden-level-badge">
        <span>🏆</span>
        <span>{gardenLevel.name}</span>
      </div>

      <div className="virtual-garden">
        <div className="garden-ground" />
        <div className="garden-flowers-container">
          {flowers.map((flower, index) => (
            <div
              key={flower.id}
              className="garden-flower"
              style={{
                left: `${flower.position.x}%`,
                top: `${flower.position.y}%`,
                fontSize: `${flower.size}px`,
                animationDelay: `${index * 0.05}s`,
              }}
              onClick={() => setSelectedFlower(flower)}
            >
              <div className="flower-emoji">
                {FLOWER_EMOJIS[flower.flowerType]}
              </div>
              <div className="flower-tooltip">
                {flower.bookName} {flower.chapter}:{flower.verse}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showStats && (
        <div className="garden-stats">
          <div className="garden-stat-card">
            <div className="garden-stat-value">{stats.totalFlowers}</div>
            <div className="garden-stat-label">총 꽃</div>
          </div>
          <div className="garden-stat-card">
            <div className="garden-stat-value">{stats.gardenAge}일</div>
            <div className="garden-stat-label">정원 나이</div>
          </div>
          <div className="garden-stat-card">
            <div className="garden-stat-value">
              {FLOWER_EMOJIS.rose} {stats.flowersByType.rose}
            </div>
            <div className="garden-stat-label">장미</div>
          </div>
          <div className="garden-stat-card">
            <div className="garden-stat-value">
              {FLOWER_EMOJIS.lily} {stats.flowersByType.lily}
            </div>
            <div className="garden-stat-label">백합</div>
          </div>
          <div className="garden-stat-card">
            <div className="garden-stat-value">
              {FLOWER_EMOJIS.daisy} {stats.flowersByType.daisy}
            </div>
            <div className="garden-stat-label">데이지</div>
          </div>
          <div className="garden-stat-card">
            <div className="garden-stat-value">
              {FLOWER_EMOJIS.sunflower} {stats.flowersByType.sunflower}
            </div>
            <div className="garden-stat-label">해바라기</div>
          </div>
        </div>
      )}

      {/* 꽃 상세 모달 (향후 구현) */}
      {selectedFlower && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedFlower(null)}
        >
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}>
              {FLOWER_EMOJIS[selectedFlower.flowerType]}
            </div>
            <h3 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
              {selectedFlower.bookName} {selectedFlower.chapter}:{selectedFlower.verse}
            </h3>
            <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '1rem' }}>
              {selectedFlower.text}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#999', textAlign: 'center' }}>
              {new Date(selectedFlower.bloomDate).toLocaleDateString('ko-KR')}에 피어남
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
