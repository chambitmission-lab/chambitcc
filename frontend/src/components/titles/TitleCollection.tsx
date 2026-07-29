// 성경 칭호 컬렉션 — 통계 요약 + 카테고리별 카드 그리드
import { useEffect, useMemo } from 'react'
import type { TitleStatus } from '../../api/titles'
import { useTitles, useEquipTitle } from '../../hooks/useTitles'
import { evaluateTitlesNow } from '../../utils/titleUnlockBus'
import { useLanguage } from '../../contexts/LanguageContext'
import { TitleCard } from './TitleCard'
import { localizeTitle } from './titleI18n'
import { CATEGORY_ORDER, CATEGORY_META } from './titleVisuals'
import './TitleCollection.css'

export const TitleCollection: React.FC = () => {
  const { data, isLoading, error } = useTitles()
  const equipMut = useEquipTitle()
  const { t, language } = useLanguage()

  // 칭호 페이지 진입 시 즉시 평가 — 그동안 쌓인 해금이 있으면 팝업으로 축하
  useEffect(() => {
    evaluateTitlesNow()
  }, [])

  const grouped = useMemo(() => {
    const map: Record<string, TitleStatus[]> = {}
    for (const cat of CATEGORY_ORDER) map[cat] = []
    for (const item of data?.titles ?? []) {
      ;(map[item.category] ??= []).push(item)
    }
    return map
  }, [data])

  const handleToggle = (title: TitleStatus) => {
    if (equipMut.isPending) return
    equipMut.mutate(title.equipped ? null : title.key)
  }

  if (isLoading) {
    return (
      <div className="title-collection-state">
        <div className="title-collection-spinner">🏷️</div>
        <p>{t('titleCollectionLoading')}</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="title-collection-state">
        <div className="title-collection-state-icon">😢</div>
        <p>{t('titleCollectionError')}</p>
      </div>
    )
  }

  const { summary } = data
  const pct = summary.total > 0 ? Math.round((summary.earned / summary.total) * 100) : 0

  return (
    <div className="title-collection">
      {/* 통계 요약 */}
      <div className="title-collection-stats">
        <div className="title-stat">
          <span className="title-stat-value gradient-num">{summary.earned}</span>
          <span className="title-stat-sub">/ {summary.total} {t('titleStatEarnedSuffix')}</span>
          <span className="title-stat-label">{t('titleStatCollected')}</span>
        </div>
        <div className="title-stat">
          <span className="title-stat-value gradient-num">{pct}<span className="title-stat-unit">%</span></span>
          <span className="title-stat-label">{t('titleStatRate')}</span>
        </div>
        <div className="title-stat">
          <span className="title-stat-value title-stat-emoji">
            {summary.equipped_key
              ? (data.titles.find((it) => it.key === summary.equipped_key)?.icon ?? '🏷️')
              : '—'}
          </span>
          <span className="title-stat-label">
            {summary.equipped_key
              ? (() => {
                  const eq = data.titles.find((it) => it.key === summary.equipped_key)
                  return eq ? localizeTitle(eq, language).name : t('titleStatEquipped')
                })()
              : t('titleStatNoneEquipped')}
          </span>
        </div>
      </div>

      {/* 카테고리별 섹션 */}
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat] ?? []
        if (items.length === 0) return null
        const meta = CATEGORY_META[cat]
        const earnedCount = items.filter((item) => item.earned).length
        return (
          <section key={cat} className="title-section">
            <div className="title-section-head">
              <span className="title-section-icon">{meta.icon}</span>
              <h2 className="title-section-title">{t(meta.labelKey)}</h2>
              <span className="title-section-count">{earnedCount}/{items.length}</span>
            </div>
            <div className="title-grid">
              {items.map((item) => (
                <TitleCard
                  key={item.key}
                  title={item}
                  onToggleEquip={handleToggle}
                  busy={equipMut.isPending}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
