// Prayer 데이터 관리 커스텀 훅
import { useState, useEffect, useCallback } from 'react'
import { fetchPrayers, togglePrayer } from '../api/prayer'
import { getOrCreateFingerprint } from '../utils/fingerprint'
import type { Prayer, SortType } from '../types/prayer'

export const usePrayers = (initialSort: SortType = 'popular') => {
  const [prayers, setPrayers] = useState<Prayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sort, setSort] = useState<SortType>(initialSort)
  const [fingerprint, setFingerprint] = useState<string>('')

  // Fingerprint 초기화
  useEffect(() => {
    getOrCreateFingerprint().then(setFingerprint)
  }, [])

  // 기도 목록 로드
  const loadPrayers = useCallback(async (reset: boolean = false) => {
    if (!fingerprint) return

    try {
      setLoading(true)
      setError(null)

      const currentPage = reset ? 1 : page
      const response = await fetchPrayers(currentPage, 20, sort, fingerprint)

      if (response.success) {
        setPrayers(prev => 
          reset ? response.data.items : [...prev, ...response.data.items]
        )
        setHasMore(response.data.items.length === 20)
        if (reset) setPage(1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [fingerprint, page, sort])

  // 초기 로드 및 정렬 변경 시 리로드
  useEffect(() => {
    if (fingerprint) {
      loadPrayers(true)
    }
  }, [fingerprint, sort])

  // 더 보기
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
      loadPrayers(false)
    }
  }, [loading, hasMore, loadPrayers])

  // 기도했어요 토글
  const handlePrayerToggle = useCallback(async (prayerId: number) => {
    if (!fingerprint) return

    try {
      const result = await togglePrayer(prayerId, fingerprint)
      
      if (result.success) {
        setPrayers(prev => prev.map(prayer => 
          prayer.id === prayerId
            ? { 
                ...prayer, 
                is_prayed: result.is_prayed,
                prayer_count: result.prayer_count 
              }
            : prayer
        ))
      }
    } catch (err) {
      console.error('기도 토글 실패:', err)
    }
  }, [fingerprint])

  // 정렬 변경
  const changeSort = useCallback((newSort: SortType) => {
    setSort(newSort)
    setPage(1)
  }, [])

  // 새 기도 추가 (생성 후 목록 갱신)
  const addPrayer = useCallback((newPrayer: Prayer) => {
    setPrayers(prev => [newPrayer, ...prev])
  }, [])

  return {
    prayers,
    loading,
    error,
    hasMore,
    sort,
    fingerprint,
    loadMore,
    handlePrayerToggle,
    changeSort,
    addPrayer,
    refresh: () => loadPrayers(true),
  }
}
