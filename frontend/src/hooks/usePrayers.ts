// Prayer 데이터 관리 커스텀 훅
import { useState, useEffect, useCallback } from 'react'
import { fetchPrayers, addPrayer as addPrayerAPI, removePrayer } from '../api/prayer'
import type { Prayer, SortType } from '../types/prayer'

export const usePrayers = (initialSort: SortType = 'popular') => {
  const [prayers, setPrayers] = useState<Prayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sort, setSort] = useState<SortType>(initialSort)

  // 기도 목록 로드
  const loadPrayers = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      const currentPage = reset ? 1 : page
      const response = await fetchPrayers(currentPage, 20, sort)

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
  }, [page, sort])

  // 초기 로드 및 정렬 변경 시 리로드
  useEffect(() => {
    loadPrayers(true)
  }, [sort])

  // 더 보기
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
      loadPrayers(false)
    }
  }, [loading, hasMore, loadPrayers])

  // 기도했어요 토글 (로그인 필수)
  const handlePrayerToggle = useCallback(async (prayerId: number) => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setError('로그인이 필요합니다')
      return
    }

    try {
      // 현재 상태 확인
      const prayer = prayers.find(p => p.id === prayerId)
      if (!prayer) return

      // 기도 추가 또는 취소
      if (prayer.is_prayed) {
        await removePrayer(prayerId)
      } else {
        await addPrayerAPI(prayerId)
      }
      
      // 목록 새로고침
      loadPrayers(true)
    } catch (err) {
      console.error('기도 토글 실패:', err)
      setError(err instanceof Error ? err.message : '기도 처리에 실패했습니다')
    }
  }, [prayers, loadPrayers])

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
    loadMore,
    handlePrayerToggle,
    changeSort,
    addPrayer,
    refresh: () => loadPrayers(true),
  }
}
