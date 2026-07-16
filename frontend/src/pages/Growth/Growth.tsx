import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGrowthSummary, useGrowthTimeline } from '../../hooks/useGrowth'
import type { TimelineEvent } from '../../types/growth'
import GrowthHero from './components/GrowthHero'
import GrowthStats from './components/GrowthStats'
import ActivityTimeline from './components/ActivityTimeline'

const Growth = () => {
  const navigate = useNavigate()
  const hasToken = !!localStorage.getItem('access_token')

  useEffect(() => {
    if (!hasToken) navigate('/login', { replace: true })
  }, [hasToken, navigate])

  const { data: summaryRes, isLoading: summaryLoading, error } =
    useGrowthSummary(hasToken)
  const {
    data: timelineData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: timelineLoading,
  } = useGrowthTimeline(hasToken)

  const summary = summaryRes?.data ?? null

  const events = useMemo<TimelineEvent[]>(
    () => timelineData?.pages.flatMap((p) => p.data.events) ?? [],
    [timelineData],
  )

  // 첫 화면이 비어있고 더 이전 기록이 있으면 자동으로 다음 구간을 당겨온다
  useEffect(() => {
    if (
      !timelineLoading &&
      events.length === 0 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [timelineLoading, events.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (summaryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background-dark flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <p className="text-red-500 mb-4">
            {error instanceof Error ? error.message : '여정을 불러오지 못했어요'}
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2 brand-gradient font-bold rounded-full shadow-[0_2px_10px_var(--brand-glow)]"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl min-h-screen border-x border-border-light dark:border-border-dark">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between">
          <button
            className="flex items-center gap-2 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
            onClick={() => navigate('/profile')}
          >
            <span className="material-icons-outlined">arrow_back</span>
            <span className="text-sm font-semibold">프로필</span>
          </button>
          <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-[-0.015em]">
            신앙 여정
          </h1>
          <span className="w-16" />
        </div>

        <GrowthHero summary={summary} />

        {summary.has_activity && <GrowthStats summary={summary} />}

        {/* 발자취 → 활동 기록 트랜지션: 은은한 페이드 + 스크롤 유도 */}
        {summary.has_activity && (
          <div className="relative mt-3 pt-6 pb-1 flex flex-col items-center gap-0.5">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent to-[var(--brand-soft)]"
              aria-hidden="true"
            />
            <span className="relative text-[11px] font-medium text-gray-400 dark:text-white/40">
              아래로 내려 지난 발자취를 이어보세요
            </span>
            <span
              className="relative material-icons-outlined text-xl text-[var(--brand-muted)] animate-bounce"
              aria-hidden="true"
            >
              keyboard_double_arrow_down
            </span>
          </div>
        )}

        <ActivityTimeline
          events={events}
          hasMore={!!hasNextPage}
          isLoadingMore={isFetchingNextPage || timelineLoading}
          onLoadMore={() => fetchNextPage()}
        />
      </div>
    </div>
  )
}

export default Growth
