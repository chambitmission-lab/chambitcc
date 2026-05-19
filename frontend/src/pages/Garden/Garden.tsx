// 정원 메인 페이지 — 다크모드 토큰(#0b0b12 / #1c1c26 / purple→pink) 적용, NewHome 디자인 언어와 정렬

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
  const [themeKey, setThemeKey] = useState(0)

  const handleThemeSave = () => {
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
      {/* Hero — NewHome 의 AnnualThemeVerse 톤과 정렬한 보라/핑크 그라데이션 카드 */}
      <section className="garden-hero">
        <div className="garden-hero-emblem" aria-hidden>
          <span className="material-icons-round">park</span>
        </div>
        <div className="garden-hero-body">
          <span className="garden-hero-label">나의 신앙 나무</span>
          <h1 className="garden-hero-title">{t('gardenPageTitle')}</h1>
          <p className="garden-hero-subtitle">{t('gardenPageSubtitle')}</p>
        </div>
        <button
          className="garden-customize-button"
          onClick={() => setShowCustomizeModal(true)}
          aria-label={t('gardenCustomize')}
        >
          <span className="material-icons-round">palette</span>
          <span className="garden-customize-label">{t('gardenCustomize')}</span>
        </button>
      </section>

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
