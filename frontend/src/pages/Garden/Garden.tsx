// 정원 → "성경 칭호" 페이지로 전면 개편. 다크모드 토큰(#0b0b12 / #1c1c26 / purple→pink).
// 신앙 나무(GrowingTree)는 삭제하지 않고 SHOW_FAITH_TREE 플래그로 휴면 처리(언제든 복구 가능).

import { useState } from 'react'
import { GrowingTree } from '../../components/garden/GrowingTree'
import { TitleCollection } from '../../components/titles/TitleCollection'
import { useReadingProgress } from '../../hooks/useBibleReading'
import { GardenCustomizeModal } from '../../components/garden/GardenCustomizeModal'
import { useLanguage } from '../../contexts/LanguageContext'
import './Garden.css'

// 신앙 나무 휴면 플래그 — true 로 바꾸면 기존 성장 나무가 다시 보인다.
const SHOW_FAITH_TREE = false

export const Garden: React.FC = () => {
  const { data: progress, isLoading, error } = useReadingProgress(SHOW_FAITH_TREE)
  const { t } = useLanguage()
  const versesRead = progress?.overall.read_verses ?? 0
  const totalVerses = progress?.overall.total_verses
  const [showCustomizeModal, setShowCustomizeModal] = useState(false)
  const [themeKey, setThemeKey] = useState(0)

  const handleThemeSave = () => {
    setThemeKey(prev => prev + 1)
  }

  if (SHOW_FAITH_TREE && isLoading) {
    return (
      <div className="garden-page">
        <div className="garden-loading">
          <div className="garden-loading-spinner">🌱</div>
          <p>{t('gardenLoading')}</p>
        </div>
      </div>
    )
  }

  if (SHOW_FAITH_TREE && error) {
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
          <span className="material-icons-round">{SHOW_FAITH_TREE ? 'park' : 'military_tech'}</span>
        </div>
        <div className="garden-hero-body">
          <span className="garden-hero-label">나의 신앙 여정</span>
          <h1 className="garden-hero-title">성경 칭호</h1>
          <p className="garden-hero-subtitle">말씀을 읽으며 모으는 나만의 성경 칭호</p>
        </div>
        {SHOW_FAITH_TREE && (
          <button
            className="garden-customize-button"
            onClick={() => setShowCustomizeModal(true)}
            aria-label={t('gardenCustomize')}
          >
            <span className="material-icons-round">palette</span>
            <span className="garden-customize-label">{t('gardenCustomize')}</span>
          </button>
        )}
      </section>

      {SHOW_FAITH_TREE ? (
        /* 휴면: 신앙 나무 (플래그로 복구 가능) */
        <div className="garden-section">
          <GrowingTree key={themeKey} versesRead={versesRead} totalVerses={totalVerses} showInfo />
        </div>
      ) : (
        /* 성경 칭호 컬렉션 */
        <div className="garden-section">
          <TitleCollection />
        </div>
      )}

      {/* 정원 꾸미기 모달 */}
      {SHOW_FAITH_TREE && showCustomizeModal && (
        <GardenCustomizeModal
          onClose={() => setShowCustomizeModal(false)}
          onSave={handleThemeSave}
        />
      )}
    </div>
  )
}
