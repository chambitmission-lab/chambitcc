// 정원 메인 페이지

import { useState } from 'react'
import { GrowingTree } from '../../components/garden/GrowingTree'
import { useReadingProgress } from '../../hooks/useBibleReading'
import { GardenCustomizeModal } from '../../components/garden/GardenCustomizeModal'
import { useLanguage } from '../../contexts/LanguageContext'
import './Garden.css'

export const Garden: React.FC = () => {
  const { data: progress, isLoading, error } = useReadingProgress()
  const { t } = useLanguage()
  const versesRead = progress?.overall.read_verses ?? 0
  const totalVerses = progress?.overall.total_verses
  const [showCustomizeModal, setShowCustomizeModal] = useState(false)
  const [themeKey, setThemeKey] = useState(0) // 테마 변경 시 컴포넌트 재렌더링용

  const handleThemeSave = () => {
    // 테마 저장 후 GrowingTree 컴포넌트 재렌더링
    setThemeKey(prev => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="garden-page">
        <div className="garden-loading">
          <div className="garden-loading-spinner">🌱</div>
          <p>{t('gardenLoading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="garden-page">
        <div className="garden-error">
          <div className="garden-error-icon">😢</div>
          <p className="garden-error-text">{t('gardenLoadError')}</p>
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
            <h1 className="garden-title">{t('gardenPageTitle')}</h1>
            <p className="garden-subtitle">
              {t('gardenPageSubtitle')}
            </p>
          </div>
          <button
            className="garden-customize-button"
            onClick={() => setShowCustomizeModal(true)}
          >
            <span className="material-icons-round">palette</span>
            {t('gardenCustomize')}
          </button>
        </div>
      </div>

      {/* 성장하는 나무 */}
      <div className="garden-section">
        <GrowingTree key={themeKey} versesRead={versesRead} totalVerses={totalVerses} showInfo />
      </div>

      {/* 정원 꾸미기 모달 */}
      {showCustomizeModal && (
        <GardenCustomizeModal 
          onClose={() => setShowCustomizeModal(false)} 
          onSave={handleThemeSave}
        />
      )}
    </div>
  )
}
