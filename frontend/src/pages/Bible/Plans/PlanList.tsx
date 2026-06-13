// 성경 읽기 플랜 라이브러리 (/bible/plans)
// 인스타 감성 리디자인: 스토리형 Hero + 피드형 카드 그리드 + 해시태그 칩.
// 플랜 데이터에 커버 이미지가 없어 실사 대신 accent 그라데이션 + 이모지를
// '감성 그래픽'으로 사용한다. (추후 plan.cover_image 추가 시 PlanVisual 교체만 하면 됨)
import { useNavigate } from 'react-router-dom'
import { useBiblePlans } from '../../../hooks/useBiblePlan'
import type { PlanSummary } from '../../../types/biblePlan'
import { accentGradient, gradientTextStyle, planHashtags } from './planVisuals'

const PlanList = () => {
  const navigate = useNavigate()
  const { data, isLoading, error } = useBiblePlans()

  const plans = data?.items ?? []
  const myPlans = plans.filter((p) => p.progress?.subscribed)
  const otherPlans = plans.filter((p) => !p.progress?.subscribed)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-24">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button
            onClick={() => navigate('/bible')}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
            aria-label="성경 공부로"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">성경</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-gray-900 dark:text-white mx-auto pr-10">
            읽기 플랜
          </h1>
        </div>

        {/* Hero — 인스타 스토리 그라데이션 링 */}
        <section className="mx-4 mt-5 rounded-[26px] p-[2.5px] bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 shadow-[0_10px_34px_-12px_rgba(168,85,247,0.65)]">
          <div className="relative overflow-hidden rounded-[23.5px] px-6 py-8 bg-gradient-to-br from-white to-purple-50 dark:from-[#16131f] dark:to-[#251a36]">
            {/* 감성 글로우 + 워터마크 */}
            <div className="absolute -top-10 -right-8 w-40 h-40 rounded-full bg-pink-400/25 dark:bg-pink-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-10 w-44 h-44 rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-3xl pointer-events-none" />
            <span className="absolute -right-2 -bottom-6 text-[120px] leading-none opacity-[0.08] dark:opacity-[0.12] rotate-12 select-none pointer-events-none">
              📖
            </span>

            <div className="relative z-10">
              <span className="block text-[11px] font-medium uppercase tracking-[0.34em] text-purple-500 dark:text-purple-300/90">
                Reading&nbsp;Plan
              </span>
              <h2 className="text-[26px] font-extrabold tracking-[-0.02em] leading-[1.25] text-gray-900 dark:text-white mt-3">
                오늘부터,
                <br />
                함께 읽어요
              </h2>
              <p className="text-[13px] font-light leading-[1.7] text-gray-500 dark:text-white/55 mt-3 max-w-[15rem]">
                계획을 골라 시작하면 매일 분량과 진행률·연속 기록을 챙겨드려요.
              </p>
            </div>
          </div>
        </section>

        {/* 본문 */}
        {isLoading ? (
          <PlanSkeletons />
        ) : error ? (
          <div className="text-center py-16 px-6">
            <span className="text-4xl block mb-3">😢</span>
            <p className="text-[13px] text-gray-500 dark:text-white/55">
              플랜을 불러오지 못했습니다
            </p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 px-6">
            <span className="text-4xl block mb-3">📭</span>
            <p className="text-[13px] text-gray-500 dark:text-white/55">
              아직 공개된 읽기 플랜이 없어요
            </p>
          </div>
        ) : (
          <>
            {myPlans.length > 0 && (
              <section className="px-4 pt-9">
                <SectionTitle>이어서 읽기</SectionTitle>
                <div className="space-y-3.5">
                  {myPlans.map((plan) => (
                    <FeaturedPlanCard
                      key={plan.id}
                      plan={plan}
                      onClick={() => navigate(`/bible/plans/${plan.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="px-4 pt-10">
              <SectionTitle>
                {myPlans.length > 0 ? '다른 플랜 둘러보기' : '플랜 둘러보기'}
              </SectionTitle>
              <div className="grid grid-cols-2 gap-3.5">
                {otherPlans.map((plan) => (
                  <FeedPlanCard
                    key={plan.id}
                    plan={plan}
                    onClick={() => navigate(`/bible/plans/${plan.id}`)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white tracking-[-0.02em] mb-5 px-0.5">
    {children}
  </h3>
)

// 해시태그 한 줄 — #7일완성 #입문 #습관
const Hashtags = ({ plan }: { plan: PlanSummary }) => {
  const tags = planHashtags(plan)
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
      {tags.map((t) => (
        <span
          key={t}
          className="text-[11px] font-medium tracking-[-0.02em] text-purple-500 dark:text-purple-300/80"
        >
          #{t}
        </span>
      ))}
    </div>
  )
}

// 카드 비주얼(감성 그래픽): accent 그라데이션 + 글로우 + 이모지.
// 추후 커버 이미지가 생기면 이 컴포넌트만 <img>로 교체하면 됨.
const PlanVisual = ({
  plan,
  size,
}: {
  plan: PlanSummary
  size: 'feed' | 'feature'
}) => {
  const grad = accentGradient(plan.accent)
  const emoji = plan.emoji || '📖'
  const mainSize = size === 'feed' ? 'text-[41px]' : 'text-[34px]'
  const markSize = size === 'feed' ? 'text-[88px]' : 'text-[72px]'

  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${grad}`}>
      {/* 밝은 하이라이트 글로우 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.4),transparent_58%)]" />
      {/* 하단 살짝 어둡게 (이모지 입체감) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      {/* 워터마크 이모지 */}
      <span
        className={`absolute -right-3 -bottom-5 ${markSize} leading-none opacity-20 blur-[1px] rotate-12 select-none pointer-events-none`}
      >
        {emoji}
      </span>
      {/* 중앙 이모지 */}
      <span
        className={`absolute inset-0 flex items-center justify-center ${mainSize} drop-shadow-[0_4px_14px_rgba(0,0,0,0.28)] select-none`}
      >
        {emoji}
      </span>
    </div>
  )
}

// 피드형 카드 (둘러보기 · 2열 그리드) — 이미지 우선 세로 카드
const FeedPlanCard = ({ plan, onClick }: { plan: PlanSummary; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative w-full text-left overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-purple-300/50 dark:hover:border-purple-400/30"
  >
    <div className="relative aspect-[4/5]">
      <PlanVisual plan={plan} size="feed" />
    </div>
    <div className="px-3 pt-3 pb-4">
      <h4 className="text-[14px] font-bold text-gray-900 dark:text-white tracking-[-0.015em] leading-snug line-clamp-2">
        {plan.title}
      </h4>
      <div className="mt-1">
        <Hashtags plan={plan} />
      </div>
    </div>
  </button>
)

// 피처형 카드 (이어서 읽기 · 가로형) — 진행률 강조
const FeaturedPlanCard = ({ plan, onClick }: { plan: PlanSummary; onClick: () => void }) => {
  const grad = accentGradient(plan.accent)
  const progress = plan.progress
  const subscribed = !!progress?.subscribed

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full text-left overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-purple-300/50 dark:hover:border-purple-400/30"
    >
      <div className="relative w-[104px] shrink-0 self-stretch">
        <PlanVisual plan={plan} size="feature" />
      </div>

      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start gap-2">
          <h4 className="flex-1 text-[16px] font-bold text-gray-900 dark:text-white tracking-[-0.015em] leading-snug truncate">
            {plan.title}
          </h4>
          {subscribed && progress && (
            <span className="shrink-0 text-[17px] font-extrabold leading-none" style={gradientTextStyle}>
              {progress.percent}%
            </span>
          )}
        </div>

        <div className="mt-2">
          <Hashtags plan={plan} />
        </div>

        {subscribed && progress && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${grad}`}
                style={{ width: `${Math.min(100, progress.percent)}%` }}
              />
            </div>
            <p className="text-[11px] font-light text-gray-400 dark:text-white/45 mt-1.5">
              {progress.status === 'completed'
                ? '완주했어요 🎉'
                : `${progress.completed_days} / ${progress.total_days}일 · ${progress.current_day}일차 진행 중`}
              {progress.streak_count > 0 && progress.status !== 'completed' && (
                <span className="ml-1">· 🔥 {progress.streak_count}일</span>
              )}
            </p>
          </div>
        )}
      </div>
    </button>
  )
}

const PlanSkeletons = () => (
  <div className="px-4 pt-9">
    <div className="h-4 w-24 rounded bg-gray-100 dark:bg-white/[0.06] animate-pulse mb-5" />
    <div className="grid grid-cols-2 gap-3.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse overflow-hidden"
        >
          <div className="aspect-[4/5]" />
          <div className="p-3 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-gray-200/70 dark:bg-white/[0.06]" />
            <div className="h-2.5 w-1/2 rounded bg-gray-200/70 dark:bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default PlanList
