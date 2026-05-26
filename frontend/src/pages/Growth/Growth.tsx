import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGrowthSummary, useGrowthTimeline } from '../../hooks/useGrowth'
import type { TimelineEvent } from '../../types/growth'
import GrowthHero from './components/GrowthHero'
import GrowthStats from './components/GrowthStats'
import ActivityTimeline from './components/ActivityTimeline'
import AmbiencePicker from '../../components/common/AmbiencePicker'
import { GROWTH_AMBIENCE_TRACKS } from '../../data/ambienceTracks'
import { useAmbience } from '../../hooks/useAmbience'

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

  const [ambienceId, setAmbienceId] = useState<string>('silent')
  useAmbience(ambienceId, { autoplay: true })

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
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
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
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg"
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
            className="flex items-center gap-2 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-purple-300 transition-colors"
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

        <AmbiencePicker
          tracks={GROWTH_AMBIENCE_TRACKS}
          ambienceId={ambienceId}
          onChange={setAmbienceId}
          title="여정과 함께 들어요"
        />

        {summary.has_activity && <GrowthStats summary={summary} />}

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
