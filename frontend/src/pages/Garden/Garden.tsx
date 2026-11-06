// 정원 → "성경 칭호" 페이지로 전면 개편. 토스 블루 플랫 테마(theme.css 토큰).
// 신앙 나무(GrowingTree)는 삭제하지 않고 SHOW_FAITH_TREE 플래그로 휴면 처리(언제든 복구 가능).

import { lazy, Suspense, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GrowingTree } from '../../components/garden/GrowingTree'
import { TitleCollection } from '../../components/titles/TitleCollection'
import { useReadingProgress } from '../../hooks/useBibleReading'
import { GardenCustomizeModal } from '../../components/garden/GardenCustomizeModal'
import { useLanguage } from '../../contexts/LanguageContext'
import { useThemeArt } from '../../hooks/useThemeArt'
import { GARDEN_HERO } from '../../utils/themeAssets'
import { useTitles } from '../../hooks/useTitles'
import { GardenHeroQuests } from './GardenHeroQuests'
import './Garden.css'

// 말씀 퍼즐 탭 — 탭을 열 때만 불러온다
const PuzzleTab = lazy(() => import('../../components/puzzle/PuzzleTab').then((m) => ({ default: m.PuzzleTab })))

type GardenTab = 'titles' | 'puzzle'

// 신앙 나무 휴면 플래그 — true 로 바꾸면 기존 성장 나무가 다시 보인다.
const SHOW_FAITH_TREE = false

export const Garden: React.FC = () => {
  const { data: progress, isLoading, error } = useReadingProgress(SHOW_FAITH_TREE)
  const { t } = useLanguage()
  const versesRead = progress?.overall.read_verses ?? 0
  const totalVerses = progress?.overall.total_verses
  const { data: titlesData } = useTitles(!SHOW_FAITH_TREE)
  const titleSummary = titlesData?.summary
  const [showCustomizeModal, setShowCustomizeModal] = useState(false)
  const [themeKey, setThemeKey] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: GardenTab = searchParams.get('tab') === 'puzzle' ? 'puzzle' : 'titles'
  const selectTab = (next: GardenTab) => {
    const p = new URLSearchParams(searchParams)
    if (next === 'titles') p.delete('tab')
    else p.set('tab', next)
    setSearchParams(p, { replace: true })
  }

  // 히어로 배너는 CSS 배경(테마 토큰)이라 렌더된 뒤에야 요청이 나가고, 브라우저는 현재
  // 테마 한 장만 받는다 — 진입 시 두 테마를 모두 데워 토글 순간 배너가 늦게 뜨지 않게 한다.
  useThemeArt(GARDEN_HERO)

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
      {/* Hero — 오른쪽 배너 그림 + 왼쪽 칭호 퀘스트 카드(듀오링고 퀘스트 벤치마킹, 2026-11-06).
          예전엔 왼쪽에 작은 제목 한 줄만 있어 흰/검은 여백이 비어 보였다. */}
      <section className={`garden-hero${SHOW_FAITH_TREE ? '' : ' has-quests'}`}>
        {SHOW_FAITH_TREE ? (
          <>
            <div className="garden-hero-emblem" aria-hidden>
              <span className="material-icons-round">park</span>
            </div>
            <div className="garden-hero-body">
              <span className="garden-hero-label">{t('gardenHeroLabel')}</span>
              <h1 className="garden-hero-title">{t('gardenHeroTitle')}</h1>
              <p className="garden-hero-subtitle">{t('gardenHeroSubtitle')}</p>
            </div>
          </>
        ) : (
          <div className="garden-hero-body">
            <div className="garden-hero-top">
              <h1 className="garden-hero-title">{t('gardenHeroTitle')}</h1>
              {titleSummary && (
                <span className="garden-hero-count">
                  {titleSummary.earned} / {titleSummary.total}
                </span>
              )}
            </div>
            <p className="garden-hero-subtitle">{t('gardenQuestSubtitle')}</p>
            <GardenHeroQuests />
          </div>
        )}
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
        <>
          {/* 성경 칭호 | 말씀 퍼즐 탭 */}
          <div className="garden-tabs" role="tablist" aria-label={t('gardenHeroTitle')}>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'titles'}
              className={`garden-tab ${tab === 'titles' ? 'is-active' : ''}`}
              onClick={() => selectTab('titles')}
            >
              {t('gardenTabTitles')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'puzzle'}
              className={`garden-tab ${tab === 'puzzle' ? 'is-active' : ''}`}
              onClick={() => selectTab('puzzle')}
            >
              {t('gardenTabPuzzle')}
            </button>
          </div>
          <div className="garden-section">
            {tab === 'titles' ? (
              <TitleCollection />
            ) : (
              <Suspense fallback={null}>
                <PuzzleTab />
              </Suspense>
            )}
          </div>
        </>
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
