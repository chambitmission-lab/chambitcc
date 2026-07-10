// 성경 읽기 플랜 라이브러리 (/bible/plans)
// 인스타 감성 리디자인: 스토리형 Hero + 피드형 카드 그리드 + 해시태그 칩.
// 플랜 데이터에 커버 이미지가 없어 실사 대신 accent 그라데이션 + 이모지를
// '감성 그래픽'으로 사용한다. (추후 plan.cover_image 추가 시 PlanVisual 교체만 하면 됨)
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBiblePlans, useTodayReadings } from '../../../hooks/useBiblePlan'
import type { PlanSummary, TodayReading } from '../../../types/biblePlan'
import { isAuthenticated } from '../../../utils/auth'
import { accentGradient, gradientTextStyle, planHashtags } from './planVisuals'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'

const PlanList = () => {
  const navigate = useNavigate()
  const { data, isLoading, error } = useBiblePlans()
  // 오늘 분량(일차·본문 reference) — 이어서 읽기 카드의 CTA/미리보기에 사용
  const { data: todayData } = useTodayReadings(isAuthenticated())
  // 완주한 플랜은 기본 접힘 — 화면의 주인공은 "오늘 읽어야 할 플랜"
  const [showCompleted, setShowCompleted] = useState(false)
  // 둘러보기 해시태그 필터 (null = 전체)
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const plans = data?.items ?? []
  const myPlans = plans.filter((p) => p.progress?.subscribed)
  // 진행 중인 플랜을 최상단으로, 완주한 플랜은 별도 접이식 섹션으로 분리
  const activePlans = myPlans.filter((p) => p.progress?.status !== 'completed')
  const completedPlans = myPlans.filter((p) => p.progress?.status === 'completed')
  const otherPlans = plans.filter((p) => !p.progress?.subscribed)

  const todayByPlan = useMemo(
    () => new Map((todayData?.items ?? []).map((t) => [t.plan_id, t])),
    [todayData],
  )

  // 둘러보기 필터 칩 — 플랜 메타(level·category)에서 실제 존재하는 값만 수집
  const filterTags = useMemo(() => {
    const tags: string[] = []
    for (const p of otherPlans) {
      for (const t of [p.level, p.category]) {
        if (t && !tags.includes(t)) tags.push(t)
      }
    }
    return tags
  }, [otherPlans])
  const visibleOtherPlans = tagFilter
    ? otherPlans.filter((p) => p.level === tagFilter || p.category === tagFilter)
    : otherPlans

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
            {activePlans.length > 0 && (
              <section className="px-4 pt-9">
                <SectionTitle>이어서 읽기</SectionTitle>
                <div className="space-y-3.5">
                  {activePlans.map((plan) => (
                    <FeaturedPlanCard
                      key={plan.id}
                      plan={plan}
                      today={todayByPlan.get(plan.id)}
                      onClick={() => navigate(`/bible/plans/${plan.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 완주한 플랜 — 기본 접힘 아코디언. 펼쳐도 톤을 낮춰(투명도) 진행 중 플랜에 시선이 가게 한다 */}
            {completedPlans.length > 0 && (
              <section className="px-4 pt-8">
                <button
                  type="button"
                  onClick={() => setShowCompleted((v) => !v)}
                  aria-expanded={showCompleted}
                  className="w-full flex items-center justify-between px-0.5 py-1"
                >
                  <span className="flex items-center gap-1.5 text-[15px] font-extrabold text-gray-500 dark:text-white/55 tracking-[-0.02em]">
                    완주한 플랜
                    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-bold bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300">
                      {completedPlans.length}
                    </span>
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-gray-400 dark:text-white/40 transition-transform duration-200 ${showCompleted ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {showCompleted && (
                  <div className="space-y-3.5 mt-4">
                    {completedPlans.map((plan) => (
                      /* 끝난 플랜은 채도까지 죽여 회색조에 가깝게 — 진행 중 카드만 화면의 주인공 */
                      <div key={plan.id} className="opacity-70 saturate-[0.35]">
                        <FeaturedPlanCard
                          plan={plan}
                          onClick={() => navigate(`/bible/plans/${plan.id}`)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section className="px-4 pt-10">
              <SectionTitle>
                {myPlans.length > 0 ? '다른 플랜 둘러보기' : '플랜 둘러보기'}
              </SectionTitle>
              {/* 해시태그 필터 칩 — 플랜이 늘어도 수준·주제로 바로 좁힐 수 있게.
                  우측 페이드로 "밀어서 더 볼 수 있음"을 힌트하고, 그리드를 내려
                  보는 동안에도 상단 헤더(48px) 아래 붙어 즉시 필터를 바꿀 수 있다 */}
              {filterTags.length > 0 && (
                <div className="sticky top-[48px] z-10 -mx-4 mb-4 pt-2 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
                  <div className="flex gap-2 overflow-x-auto pb-1 px-4 pr-10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {[null, ...filterTags].map((tag) => {
                      const active = tagFilter === tag
                      return (
                        <button
                          key={tag ?? '전체'}
                          type="button"
                          onClick={() => setTagFilter(tag)}
                          className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold tracking-[-0.01em] transition-all duration-150 active:scale-95 ${
                            active
                              ? 'bg-[linear-gradient(135deg,#a855f7,#ec4899)] text-white shadow-[0_4px_12px_-4px_rgba(168,85,247,0.6)]'
                              : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60 hover:bg-purple-100 dark:hover:bg-white/[0.12]'
                          }`}
                        >
                          {tag ? `#${tag}` : '전체'}
                        </button>
                      )
                    })}
                  </div>
                  {/* 스크롤 힌트 — 우측 끝을 배경색으로 부드럽게 페이드 아웃 */}
                  <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-background-light dark:from-background-dark to-transparent" />
                </div>
              )}
              {visibleOtherPlans.length === 0 ? (
                <p className="text-center text-[13px] text-gray-400 dark:text-white/45 py-10">
                  이 태그의 플랜이 아직 없어요
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  {visibleOtherPlans.map((plan) => (
                    <FeedPlanCard
                      key={plan.id}
                      plan={plan}
                      onClick={() => navigate(`/bible/plans/${plan.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* 성경 섹션 하단 네비게이션 */}
      <BibleBottomNav active="plans" />
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
  // 격자(feed)에서는 오브젝트를 작게 두고 그라데이션 여백을 넉넉히 남긴다 —
  // 꽉 찬 일러스트보다 여백이 있어야 여유롭고 정돈된 인상
  const mainSize = size === 'feed' ? 'text-[28px]' : 'text-[34px]'
  const markSize = size === 'feed' ? 'text-[72px]' : 'text-[64px]'
  // 워터마크는 2열 격자에서 요소 과잉의 주범 — 겨우 느껴질 만큼만 남긴다
  const markOpacity = size === 'feed' ? 'opacity-[0.09]' : 'opacity-[0.14]'

  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${grad}`}>
      {/* 밝은 하이라이트 글로우 — 카드가 '눌러도 되는 활성 상태'로 읽히도록 충분히 밝게 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.48),transparent_60%)]" />
      {/* 하단 살짝 어둡게 (이모지 입체감) — 과하면 비활성처럼 보여 최소한만 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      {/* 워터마크 이모지 */}
      <span
        className={`absolute -right-3 -bottom-5 ${markSize} leading-none ${markOpacity} blur-[2px] rotate-12 select-none pointer-events-none`}
      >
        {emoji}
      </span>
      {/* 중앙 이모지 */}
      <span
        className={`absolute inset-0 flex items-center justify-center ${mainSize} drop-shadow-[0_5px_16px_rgba(0,0,0,0.35)] select-none`}
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
    className="group relative w-full text-left overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-purple-300/50 dark:hover:border-purple-400/30 active:scale-[0.97]"
  >
    {/* 정사각 → 5:4로 살짝 낮춰 무게중심을 텍스트 쪽으로 — 글씨가 먼저 읽힌다 */}
    <div className="relative aspect-[5/4]">
      <PlanVisual plan={plan} size="feed" />
    </div>
    {/* 텍스트와 화살표를 한 flex 행으로 완전히 분리 — 제목·태그가 길어져도
        겹치지 않고, 배경 없는 맨 화살표라 "카드 전체가 눌린다"로 읽힌다 */}
    <div className="px-3.5 pt-3.5 pb-[18px] flex items-center gap-1.5">
      <div className="flex-1 min-w-0">
        <h4 className="text-[14px] font-bold text-gray-900 dark:text-white tracking-[-0.015em] leading-snug line-clamp-2">
          {plan.title}
        </h4>
        <div className="mt-1">
          <Hashtags plan={plan} />
        </div>
      </div>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-gray-300 dark:text-white/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-purple-500 dark:group-hover:text-purple-300"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  </button>
)

// 피처형 카드 (이어서 읽기 · 가로형) — 진행률 강조
// 상태 색 규칙: 진행 중 = 브랜드 그라데이션(보라→핑크)으로 통일, 완주 = 차분한 에메랄드.
// 플랜별 accent 그라데이션은 커버 비주얼에만 쓰고 게이지에서는 빼서 "색 = 상태"가 되게 한다.
// today(오늘 분량)가 있으면 "N일차 · 본문" 미리보기 + [오늘 분량 읽기] CTA를 노출해
// 텍스트 정보만으로는 약했던 "지금 뭘 읽어야 하는지"를 카드에서 바로 답해준다.
const FeaturedPlanCard = ({
  plan,
  today,
  onClick,
}: {
  plan: PlanSummary
  today?: TodayReading
  onClick: () => void
}) => {
  const progress = plan.progress
  const subscribed = !!progress?.subscribed
  const completed = progress?.status === 'completed'
  const streak = progress?.streak_count ?? 0
  const doneToday = today?.done_today ?? progress?.completed_today ?? false
  const todayRefs = (today?.passages ?? [])
    .map((p) => p.reference)
    .filter(Boolean)
    .join(' · ')
  const todayDay = today?.day_number ?? progress?.current_day

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full text-left overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-purple-300/50 dark:hover:border-purple-400/30 active:scale-[0.985]"
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
            <span className="shrink-0 flex flex-col items-end gap-1.5">
              {completed ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300 text-[12px] font-extrabold leading-none">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  완주
                </span>
              ) : (
                <span className="text-[17px] font-extrabold leading-none" style={gradientTextStyle}>
                  {progress.percent}%
                </span>
              )}
              {/* 연속 기록 — 게임화의 핵심이라 우측 상단 독립 배지로 승격 */}
              {!completed && streak > 0 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-400/15 dark:bg-amber-400/20 text-[11px] font-bold leading-none text-amber-600 dark:text-amber-300">
                  🔥 {streak}일
                </span>
              )}
            </span>
          )}
        </div>

        <div className="mt-2">
          <Hashtags plan={plan} />
        </div>

        {subscribed && progress && (
          <div className="mt-3">
            {/* 진행 게이지 — 트랙에 브랜드 틴트(연보라→연핑크)를 깔아 카드 배경과
                확실히 분리하고, "앞으로 채워질 길"이 눈에 보이게 한다 */}
            <div
              className={`h-2.5 rounded-full overflow-hidden ${
                completed
                  ? 'bg-emerald-500/[0.12]'
                  : 'bg-[linear-gradient(90deg,rgba(168,85,247,0.22),rgba(236,72,153,0.22))] dark:bg-[linear-gradient(90deg,rgba(168,85,247,0.32),rgba(236,72,153,0.32))]'
              }`}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${
                  completed
                    ? 'bg-emerald-400/80 dark:bg-emerald-400/70'
                    : 'bg-[linear-gradient(90deg,#a855f7,#ec4899)] shadow-[0_0_8px_rgba(236,72,153,0.55)]'
                }`}
                style={{ width: `${Math.min(100, progress.percent)}%` }}
              />
            </div>
            <p className="text-[11px] font-light text-gray-400 dark:text-white/45 mt-1.5">
              {completed
                ? '완주했어요 🎉'
                : `${progress.completed_days} / ${progress.total_days}일 · ${progress.current_day}일차 진행 중`}
            </p>
          </div>
        )}

        {/* 오늘 분량 미리보기 + CTA — 카드 진입 즉시 "오늘 뭘 읽을지"가 보이게 */}
        {subscribed && !completed && todayDay != null && (
          <div className="mt-3 flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              {/* 제목은 말줄임 대신 2줄까지 허용 + 자간을 살짝 좁혀 최대한 다 보이게 */}
              <p className="text-[12px] font-bold tracking-[-0.03em] leading-[1.4] text-gray-800 dark:text-white/85 line-clamp-2">
                {todayDay}일차
                {today?.day_title ? ` · ${today.day_title}` : ''}
              </p>
              {todayRefs && (
                <p className="text-[11.5px] tracking-[-0.02em] text-purple-600 dark:text-purple-300/90 truncate mt-0.5">
                  {todayRefs}
                </p>
              )}
            </div>
            {doneToday ? (
              <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300 text-[12px] font-bold leading-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                오늘 완료
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[linear-gradient(135deg,#a855f7,#ec4899)] text-white text-[11.5px] font-bold tracking-[-0.02em] leading-none shadow-[0_4px_14px_-4px_rgba(236,72,153,0.7)] transition-transform group-hover:scale-[1.04]">
                오늘 분량 읽기
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            )}
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
          <div className="aspect-[5/4]" />
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
