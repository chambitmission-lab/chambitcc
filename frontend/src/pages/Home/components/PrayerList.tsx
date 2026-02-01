// 기도 요청 목록
import { useEffect, useRef } from 'react'
import PrayerCard from './PrayerCard'
import type { Prayer, SortType } from '../../../types/prayer'

interface PrayerListProps {
  prayers: Prayer[]
  loading: boolean
  error: string | null
  hasMore: boolean
  sort: SortType
  loadMore: () => void
  handlePrayerToggle: (prayerId: number) => void
  changeSort: (sort: SortType) => void
}

const PrayerList = ({
  prayers,
  loading,
  error,
  hasMore,
  sort,
  loadMore,
  handlePrayerToggle,
  changeSort,
}: PrayerListProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Infinite scroll
  useEffect(() => {
    if (loading || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, hasMore, loadMore])

  return (
    <section className="prayer-list-section">
      {/* Sort Controls */}
      <div className="list-controls">
        <div className="sort-tabs">
          <button
            className={`sort-tab ${sort === 'popular' ? 'active' : ''}`}
            onClick={() => changeSort('popular')}
          >
            인기순
          </button>
          <button
            className={`sort-tab ${sort === 'latest' ? 'active' : ''}`}
            onClick={() => changeSort('latest')}
          >
            최신순
          </button>
        </div>
      </div>

      {/* Prayer Cards */}
      <div className="prayer-grid">
        {prayers.map((prayer) => (
          <PrayerCard
            key={prayer.id}
            prayer={prayer}
            onPrayerToggle={handlePrayerToggle}
          />
        ))}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="list-loading">
          <div className="loading-spinner" />
          <p>기도 요청을 불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="list-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && prayers.length === 0 && (
        <div className="list-empty">
          <p>아직 기도 요청이 없습니다</p>
          <p className="empty-subtitle">첫 번째 기도 요청을 남겨주세요</p>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && <div ref={loadMoreRef} className="load-more-trigger" />}
    </section>
  )
}

export default PrayerList
