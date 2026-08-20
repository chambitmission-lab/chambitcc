// 성경 칭호 컬렉션 — 통계 요약 + "곧 획득" 훅 + 카테고리별 메달 도감 그리드.
// 카드 리스트 → 메달 그리드로 개편: 설명/장착은 상세 시트(TitleDetailSheet)로 이동.
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { TitleStatus, TitlesPayload } from '../../api/titles'
import { useTitles, useEquipTitle, titleKeys } from '../../hooks/useTitles'
import { emitTitleUnlocks } from '../../utils/titleUnlockBus'
import { useLanguage } from '../../contexts/LanguageContext'
import { TitleMedal, TitleMedalTile } from './TitleMedal'
import { TitleDetailSheet } from './TitleDetailSheet'
import { localizeTitle } from './titleI18n'
import { CATEGORY_ORDER, CATEGORY_META } from './titleVisuals'
import './TitleCollection.css'

const progressPct = (title: TitleStatus): number =>
  title.progress && title.progress.target > 0
    ? Math.min(100, Math.round((title.progress.current / title.progress.target) * 100))
    : 0

export const TitleCollection: React.FC = () => {
  const { data, isLoading, error } = useTitles()
  const equipMut = useEquipTitle()
  const { t, language } = useLanguage()
  const qc = useQueryClient()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  // 진입 시 해금 축하 — GET /titles 가 동기화·평가까지 하고 newly_earned 를 돌려주므로
  // 예전처럼 /titles/evaluate 를 따로 부르지 않는다(같은 풀 스캔이 2번 돌던 문제 제거).
  // 팝업으로 한 번 소비한 해금은 캐시에서 비워 재마운트 시 중복 축하를 막는다.
  useEffect(() => {
    const newly = data?.newly_earned
    if (!newly?.length) return
    emitTitleUnlocks(newly)
    qc.setQueryData<TitlesPayload>(titleKeys.list(), (prev) =>
      prev ? { ...prev, newly_earned: [] } : prev,
    )
  }, [data, qc])

  const grouped = useMemo(() => {
    const map: Record<string, TitleStatus[]> = {}
    for (const cat of CATEGORY_ORDER) map[cat] = []
    for (const item of data?.titles ?? []) {
      ;(map[item.category] ??= []).push(item)
    }
    return map
  }, [data])

  // "곧 획득" — 진행률이 절반을 넘긴 미획득(히든 제외) 상위 2개
  const almostThere = useMemo(() => {
    return (data?.titles ?? [])
      .filter((item) => !item.earned && !item.hidden && item.progress && progressPct(item) >= 50)
      .sort((a, b) => progressPct(b) - progressPct(a))
      .slice(0, 2)
  }, [data])

  // 시트가 열린 동안 장착/평가로 데이터가 갱신돼도 최신 상태를 비추도록 key 로 조회
  const selected = selectedKey
    ? data?.titles.find((item) => item.key === selectedKey) ?? null
    : null

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
  const equippedTitle = summary.equipped_key
    ? data.titles.find((it) => it.key === summary.equipped_key) ?? null
    : null

  return (
    <div className="title-collection">
      {/* PC(lg+) 2단 — 좌: 카테고리별 도감 / 우: 내 현황(수집률·장착·곧 획득)이 sticky.
          래퍼 3개는 lg 미만에서 display:contents 라 모바일 흐름은 기존과 완전히 동일하다. */}
      <div className="title-columns">
        <div className="title-col-side">
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
            <button
              type="button"
              className="title-stat is-equipped-slot"
              onClick={equippedTitle ? () => setSelectedKey(equippedTitle.key) : undefined}
              disabled={!equippedTitle}
            >
              {equippedTitle ? (
                <TitleMedal title={equippedTitle} size="sm" />
              ) : (
                <span className="title-stat-value title-stat-emoji">—</span>
              )}
              <span className="title-stat-label">
                {equippedTitle ? localizeTitle(equippedTitle, language).name : t('titleStatNoneEquipped')}
              </span>
            </button>
          </div>

          {/* 곧 획득 — 거의 다 온 칭호로 동기부여 */}
          {almostThere.length > 0 && (
            <section className="title-soon">
              <div className="title-soon-head">
                <span className="material-icons-round">bolt</span>
                <h2 className="title-soon-title">{t('titleSoonHeader')}</h2>
              </div>
              {almostThere.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className="title-soon-row"
                  onClick={() => setSelectedKey(item.key)}
                >
                  <TitleMedal title={item} size="sm" />
                  <div className="title-soon-body">
                    <span className="title-soon-name">{localizeTitle(item, language).name}</span>
                    <div className="title-soon-bar">
                      <div className="title-soon-fill" style={{ width: `${progressPct(item)}%` }} />
                    </div>
                  </div>
                  <span className="title-soon-count">
                    {item.progress!.current}/{item.progress!.target}
                  </span>
                </button>
              ))}
            </section>
          )}
        </div>

        <div className="title-col-main">
          {/* 카테고리별 메달 그리드 */}
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
                <div className="title-medal-grid">
                  {items.map((item) => (
                    <TitleMedalTile key={item.key} title={item} onSelect={() => setSelectedKey(item.key)} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {/* 상세 시트 */}
      {selected && (
        <TitleDetailSheet
          title={selected}
          onToggleEquip={handleToggle}
          busy={equipMut.isPending}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </div>
  )
}
