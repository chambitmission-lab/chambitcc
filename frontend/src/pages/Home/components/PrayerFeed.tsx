import { useRef, useEffect } from 'react'
import PrayerArticle from './PrayerArticle'
import type { Prayer } from '../../../types/prayer'

interface PrayerFeedProps {
  prayers: Prayer[]
  loading: boolean
  hasMore: boolean
  isFetchingMore: boolean
  onLoadMore: () => void
  onPrayerToggle: (prayerId: number) => void
  onPrayerClick: (prayerId: number, shouldOpenReplies?: boolean) => void
}

const PrayerFeed = ({
  prayers,
  loading,
  hasMore,
  isFetchingMore,
  onLoadMore,
  onPrayerToggle,
  onPrayerClick
}: PrayerFeedProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || loading || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingMore) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [loading, hasMore, isFetchingMore, onLoadMore])

  return (
    <div className="flex flex-col">
      {prayers.map((prayer) => (
        <PrayerArticle
          key={prayer.id}
          prayer={prayer}
          onPrayerToggle={onPrayerToggle}
          onClick={() => onPrayerClick(prayer.id)}
          onReplyClick={() => onPrayerClick(prayer.id, true)}
        />
      ))}

      {/* Loading State */}
      {loading && (
        <div className="py-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-sm text-gray-500">기도 요청을 불러오는 중...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && prayers.length === 0 && (
        <div className="py-12 text-center">
          <span className="text-6xl mb-4 block">🙏</span>
          <p className="text-gray-500 dark:text-gray-400">아직 기도 요청이 없습니다</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">첫 번째로 나눠주세요</p>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && <div ref={loadMoreRef} className="h-10" />}

      {/* Loading More State */}
      {isFetchingMore && (
        <div className="py-4 text-center">
          <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}

export default PrayerFeed
