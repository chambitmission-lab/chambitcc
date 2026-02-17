// Event 데이터 관리 커스텀 훅
import { useState, useEffect, useCallback } from 'react'
import { fetchEvents, fetchEventDetail } from '../api/event'
import type { Event, EventCategory } from '../types/event'

export const useEvents = (
  startDate?: string,
  endDate?: string,
  category?: EventCategory
) => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // 이벤트 목록 로드
  const loadEvents = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      const currentSkip = reset ? 0 : skip
      const response = await fetchEvents(startDate, endDate, category, currentSkip, 20)

      if (response.success) {
        setEvents(prev =>
          reset ? response.data.items : [...prev, ...response.data.items]
        )
        setHasMore(response.data.items.length === 20)
        if (reset) setSkip(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [skip, startDate, endDate, category])

  // 초기 로드 및 필터 변경 시 리로드
  useEffect(() => {
    loadEvents(true)
  }, [startDate, endDate, category])

  // 더 보기
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setSkip(prev => prev + 20)
      loadEvents(false)
    }
  }, [loading, hasMore, loadEvents])

  return {
    events,
    loading,
    error,
    hasMore,
    loadMore,
    refresh: () => loadEvents(true),
  }
}

// 이벤트 상세 조회 훅
export const useEventDetail = (eventId: number) => {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEvent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetchEventDetail(eventId)
      if (response.success) {
        setEvent(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadEvent()
  }, [loadEvent])

  return {
    event,
    loading,
    error,
    refresh: loadEvent,
  }
}
