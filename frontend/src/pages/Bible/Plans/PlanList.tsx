// 성경 읽기 플랜 라이브러리 (/bible/plans)
// Hero + 내 플랜(구독) + 전체 플랜 카드. 다크모드 합의 토큰 적용.
import { useNavigate } from 'react-router-dom'
import { useBiblePlans } from '../../../hooks/useBiblePlan'
import type { PlanSummary } from '../../../types/biblePlan'
import { accentGradient, gradientTextStyle } from './planVisuals'

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

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl mx-4 mt-4 p-5 border border-purple-200/60 dark:border-white/[0.08] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-[#1e1b4b]/60 dark:to-[#4c1d95]/35 shadow-[0_4px_18px_-8px_rgba(168,85,247,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(168,85,247,0.12)]">
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-purple-500 to-pink-500" />
          <div className="relative z-10 flex items-start gap-3.5">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[22px] shadow-[0_6px_18px_-6px_rgba(168,85,247,0.6)]">
              📖
            </div>
            <div className="min-w-0">
              <span className="text-[10.5px] font-bold tracking-[0.12em] text-purple-600 dark:text-purple-300">
                READING PLAN
              </span>
              <h2 className="text-[20px] font-bold tracking-[-0.015em] leading-[1.3] text-gray-900 dark:text-white mt-0.5">
                오늘부터, 함께 읽어요
              </h2>
              <p className="text-[13px] leading-[1.6] text-gray-600 dark:text-white/65 mt-1.5">
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
              <section className="px-4 pt-6">
                <SectionTitle>내 플랜</SectionTitle>
                <div className="space-y-3">
                  {myPlans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      onClick={() => navigate(`/bible/plans/${plan.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="px-4 pt-6">
              <SectionTitle>
                {myPlans.length > 0 ? '다른 플랜 둘러보기' : '플랜 둘러보기'}
              </SectionTitle>
              <div className="space-y-3">
                {otherPlans.map((plan) => (
                  <PlanCard
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
  <h3 className="text-[13px] font-bold text-gray-500 dark:text-white/55 tracking-[-0.01em] mb-3 px-1">
    {children}
  </h3>
)

const PlanCard = ({ plan, onClick }: { plan: PlanSummary; onClick: () => void }) => {
  const grad = accentGradient(plan.accent)
  const progress = plan.progress
  const subscribed = !!progress?.subscribed

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative overflow-hidden w-full text-left rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] p-4 transition-all hover:-translate-y-0.5 hover:border-purple-300/50 dark:hover:border-purple-400/30"
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      <div className="relative z-10 flex items-start gap-3.5">
        <div
          className={`shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-[22px] shadow-[0_4px_14px_-5px_rgba(168,85,247,0.55)]`}
        >
          {plan.emoji || '📖'}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-[-0.015em] truncate">
            {plan.title}
          </h4>
          {plan.subtitle && (
            <p className="text-[12.5px] text-gray-500 dark:text-white/55 truncate mt-0.5">
              {plan.subtitle}
            </p>
          )}
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            <Chip>{plan.total_days}일</Chip>
            {plan.level && <Chip>{plan.level}</Chip>}
            {plan.category && <Chip>{plan.category}</Chip>}
          </div>
        </div>
        {subscribed && progress && (
          <div className="shrink-0 text-right">
            <span className="text-[18px] font-bold" style={gradientTextStyle}>
              {progress.percent}%
            </span>
            {progress.streak_count > 0 && (
              <p className="text-[11px] text-gray-400 dark:text-white/45 mt-0.5">
                🔥 {progress.streak_count}일
              </p>
            )}
          </div>
        )}
      </div>

      {subscribed && progress && (
        <div className="relative z-10 mt-3">
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${grad}`}
              style={{ width: `${Math.min(100, progress.percent)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 dark:text-white/45 mt-1.5">
            {progress.status === 'completed'
              ? '완주했어요 🎉'
              : `${progress.completed_days} / ${progress.total_days}일 · ${progress.current_day}일차 진행 중`}
          </p>
        </div>
      )}
    </button>
  )
}

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65">
    {children}
  </span>
)

const PlanSkeletons = () => (
  <div className="px-4 pt-6 space-y-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="h-[104px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse"
      />
    ))}
  </div>
)

export default PlanList
