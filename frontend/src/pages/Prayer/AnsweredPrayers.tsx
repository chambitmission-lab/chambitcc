// 응답의 전당 — 응답된 기도만 보여주는 페이지
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrayersInfinite } from '../../hooks/usePrayersQuery'
import PrayerCard from '../../components/prayer/PrayerCard'
import AnswerModal from '../../components/prayer/AnswerModal'
import { useLanguage } from '../../contexts/LanguageContext'
import type { Prayer, SortType } from '../../types/prayer'
import './AnsweredPrayers.css'

const AnsweredPrayers = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [sort, setSort] = useState<SortType>('latest')
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null)

  // 백엔드에 is_answered=true 필터 전달 → 응답된 기도만 페이지네이션으로 받음
  const {
    prayers: answeredPrayers,
    total,
    loading,
    error,
    hasMore,
    loadMore,
    isFetchingMore,
    handlePrayerToggle,
    isToggling,
    updatePrayerAnswer,
    cancelPrayerAnswer,
    isAnswering,
  } = usePrayersInfinite(sort, null, 'all', true)

  const handleEditAnswer = (prayerId: number) => {
    const prayer = answeredPrayers.find(p => p.id === prayerId)
    if (prayer) setEditingPrayer(prayer)
  }

  // 댓글 클릭 → 홈의 기도 상세 모달을 댓글 열린 상태로 연다
  const handleReplyClick = (prayerId: number) => {
    navigate('/', { state: { openPrayerId: prayerId, openReplies: true } })
  }

  const handleCancelAnswer = async (prayerId: number) => {
    const ok = window.confirm(t('answeredCancelConfirm'))
    if (!ok) return
    try {
      await cancelPrayerAnswer(prayerId)
    } catch {
      // mutation onError에서 toast 처리
    }
  }

  const handleSubmitEdit = async (testimony: string) => {
    if (!editingPrayer) return
    try {
      await updatePrayerAnswer(editingPrayer.id, testimony)
      setEditingPrayer(null)
    } catch {
      // mutation onError에서 toast 처리
    }
  }

  return (
    <div className="answered-page">
      <div className="answered-shell">
        {/* 헤더 카드 — 성소 톤 (보라 베이스 + amber 액센트) */}
        <section className="answered-hall-section">
          <article className="answered-hall-card">
            <div className="answered-hall-emblem" aria-hidden>
              <span className="material-icons-round">auto_awesome</span>
            </div>

            <div className="answered-hall-body">
              <header className="answered-hall-header">
                <span className="answered-hall-label">{t('answeredHallLabel')}</span>
                <span className="answered-hall-reference">
                  {t('answeredHallVerseRef')}
                </span>
              </header>

              <h1 className="answered-hall-title">{t('answeredPageTitle')}</h1>
              <p className="answered-hall-subtitle">{t('answeredPageSubtitle')}</p>

              <blockquote className="answered-hall-verse">
                <span className="answered-hall-verse-mark" aria-hidden>"</span>
                {t('answeredHallVerse')}
              </blockquote>

              {answeredPrayers.length > 0 && (
                <div className="answered-hall-count">
                  <span className="material-icons-round" style={{ fontSize: 13 }}>
                    auto_awesome
                  </span>
                  {total > 0 ? total : answeredPrayers.length}
                  {t('answeredCountStacked')}
                </div>
              )}
            </div>
          </article>
        </section>

        {/* 정렬 탭 — SortTabs 패턴 (하단 보더 강조) */}
        <div className="answered-sort-tabs">
          <div className="answered-sort-tab-group">
            <button
              type="button"
              className={`answered-sort-tab ${sort === 'popular' ? 'is-active' : ''}`}
              onClick={() => setSort('popular')}
            >
              {t('sortPopular')}
            </button>
            <button
              type="button"
              className={`answered-sort-tab ${sort === 'latest' ? 'is-active' : ''}`}
              onClick={() => setSort('latest')}
            >
              {t('sortLatest')}
            </button>
          </div>

          {answeredPrayers.length > 0 && (
            <span className="answered-sort-count">
              ✨ {total > 0 ? total : answeredPrayers.length}
              {t('answeredCountSuffix')}
            </span>
          )}
        </div>

        {/* 본문 */}
        {loading && answeredPrayers.length === 0 ? (
          <div className="answered-state-card">
            <div className="answered-state-spinner" />
            <p className="answered-state-desc">{t('answeredLoading')}</p>
          </div>
        ) : error ? (
          <div className="answered-state-card">
            <div className="answered-state-emblem" aria-hidden>
              <span className="material-icons-round">error_outline</span>
            </div>
            <p className="answered-state-error">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="answered-state-retry"
            >
              {t('retry')}
            </button>
          </div>
        ) : answeredPrayers.length === 0 ? (
          <div className="answered-state-card">
            <div className="answered-state-emblem" aria-hidden>
              <span className="material-icons-round">auto_awesome</span>
            </div>
            <h3 className="answered-state-title">{t('answeredEmptyTitle')}</h3>
            <p className="answered-state-desc">{t('answeredEmptyDesc')}</p>
          </div>
        ) : (
          <>
            <div className="answered-list">
              {answeredPrayers.map(prayer => (
                <PrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  onPrayerToggle={handlePrayerToggle}
                  onReplyClick={handleReplyClick}
                  onEditAnswer={handleEditAnswer}
                  onCancelAnswer={handleCancelAnswer}
                  isToggling={isToggling}
                  /* 응답의 전당은 모두 응답된 기도이므로 응답 등록 버튼은 안 뜨고
                     수정/취소 버튼만 작성자 본인에게 노출됨 */
                  showAnswerButton={true}
                />
              ))}
            </div>

            {hasMore && (
              <div className="answered-load-more">
                <button
                  type="button"
                  onClick={() => loadMore()}
                  disabled={isFetchingMore}
                  className="answered-load-more-btn"
                >
                  {isFetchingMore ? t('loading') : t('loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 간증 수정 모달 */}
      <AnswerModal
        isOpen={!!editingPrayer}
        onClose={() => setEditingPrayer(null)}
        onSubmit={handleSubmitEdit}
        prayerTitle={editingPrayer?.title ?? ''}
        initialTestimony={editingPrayer?.testimony}
        isSubmitting={isAnswering}
      />
    </div>
  )
}

export default AnsweredPrayers
