import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGrowthSummary, useGrowthTimeline } from '../../hooks/useGrowth'
import type { TimelineEvent } from '../../types/growth'
import GrowthHero from './components/GrowthHero'
import JourneyInsightCard from './components/JourneyInsightCard'
import GrowthStats from './components/GrowthStats'
import ActivityTimeline from './components/ActivityTimeline'
import { tokenStore } from '../../utils/tokenStore'
import { useMediaQuery } from '../../hooks/useMediaQuery'

// 요약 도착 전 자리표시자 — 실제 섹션(히어로 카드 → 인사이트 → 통계)과 같은 여백·반경·높이.
// 전체 화면 스피너와 달리 셸(상단 바)이 즉시 뜨고, 데이터가 오면 제자리에서 채워진다
const GrowthSkeleton = ({ withCards }: { withCards: boolean }) => {
  const bone = 'bg-gray-200/80 dark:bg-white/[0.08]'
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="px-4 pt-4">
        <div className={`h-[208px] rounded-2xl ${bone}`} />
      </div>
      {withCards && <GrowthCardsSkeleton />}
    </div>
  )
}

const GrowthCardsSkeleton = () => (
  <div className="animate-pulse" aria-hidden="true">
    <div className="px-4 pt-5">
      <div className="h-40 rounded-2xl bg-gray-100 dark:bg-white/[0.04]" />
    </div>
    <div className="px-4 pt-5">
      <div className="h-44 rounded-2xl bg-gray-100 dark:bg-white/[0.04]" />
    </div>
  </div>
)

const Growth = () => {
  const navigate = useNavigate()
  const hasToken = !!tokenStore.getAccess()
  // 인사이트·통계는 모바일 본문과 PC 우측 레일 두 곳에 자리가 있다 — CSS 로 한쪽만 숨기면
  // 둘 다 마운트되므로 보이는 쪽만 렌더한다
  const isDesktop = useMediaQuery('(min-width: 1024px)')

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

  // 캐시가 있으면 재조회 실패여도 그대로 보여준다. 요약이 아직 없으면(로딩·persist 복원 중)
  // 전체 스피너 대신 아래에서 셸+스켈레톤을 그린다
  if (error && !summary) {
    return (
      <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark flex items-center justify-center p-4 page-stage">
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
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 좁은 셸을 풀고 본문(요약·활동 기록) + 우측 레일(인사이트·통계) 2단 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden lg:min-h-0">
        {/* 헤더 */}
        <div className="sticky top-14 lg:static z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between">
          <button
            className="flex items-center gap-2 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
            onClick={() => navigate('/profile')}
          >
            <span className="material-icons-outlined">arrow_back</span>
            <span className="text-sm font-semibold">프로필</span>
          </button>
          <h1 className="text-base font-bold text-ink-strong tracking-[-0.015em]">
            신앙 여정
          </h1>
          <span className="w-16" />
        </div>

        {!summary || summaryLoading ? <GrowthSkeleton withCards={!isDesktop} /> : (<>
        <GrowthHero summary={summary} />

        {/* 말씀 여정 인사이트 · 통계 — lg에선 우측 레일이 대신한다 */}
        {!isDesktop && (
          <div>
            <JourneyInsightCard />
            {summary.has_activity && <GrowthStats summary={summary} />}
          </div>
        )}

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
          pageCount={timelineData?.pages.length ?? 0}
          hasMore={!!hasNextPage}
          isLoadingMore={isFetchingNextPage || timelineLoading}
          onLoadMore={() => fetchNextPage()}
        />
        </>)}
      </div>

      {/* 우측 위젯 레일 (lg+) — 요약 지표는 옆에 고정하고, 본문은 발자취(타임라인)에 집중.
          카드가 길어질 수 있어 자체 스크롤을 준다 */}
      {isDesktop && (
      <aside className="lg:w-[312px] lg:shrink-0 lg:sticky lg:top-[4.5rem] lg:self-start lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto scrollbar-hide">
        {!summary || summaryLoading ? <GrowthCardsSkeleton /> : (<>
        <JourneyInsightCard />
        {summary.has_activity && <GrowthStats summary={summary} />}
        </>)}
      </aside>
      )}
      </div>
    </div>
  )
}

export default Growth
