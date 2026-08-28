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
import { planCover } from './planCovers'
import heroCover from '../../../assets/plans/bible-365.jpg'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'
import BibleSectionTabs from '../../../components/bible/BibleSectionTabs'
import PersonalPlanSheet from './components/PersonalPlanSheet'
import { showToast } from '../../../utils/toast'

const PlanList = () => {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch, isFetching } = useBiblePlans()
  // 오늘 분량(일차·본문 reference) — 이어서 읽기 카드의 CTA/미리보기에 사용
  const { data: todayData } = useTodayReadings(isAuthenticated())
  // 완주한 플랜은 기본 접힘 — 화면의 주인공은 "오늘 읽어야 할 플랜"
  const [showCompleted, setShowCompleted] = useState(false)
  // 둘러보기 해시태그 필터 (null = 전체)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  // 나만의 플랜 만들기 시트 / 초대 코드 입력
  const [sheetOpen, setSheetOpen] = useState(false)
  const [codeOpen, setCodeOpen] = useState(false)
  const [codeValue, setCodeValue] = useState('')

  // 로딩 중엔 매 렌더 새 빈 배열이 되어 아래 useMemo 들이 무력화된다 — 참조를 고정
  const plans = useMemo(() => data?.items ?? [], [data])
  const myPlans = plans.filter((p) => p.progress?.subscribed)
  // 진행 중인 플랜을 최상단으로, 완주한 플랜은 별도 접이식 섹션으로 분리
  const activePlans = myPlans.filter((p) => p.progress?.status !== 'completed')
  const completedPlans = myPlans.filter((p) => p.progress?.status === 'completed')
  const otherPlans = useMemo(() => plans.filter((p) => !p.progress?.subscribed), [plans])

  const todayByPlan = useMemo(
    () => new Map((todayData?.items ?? []).map((t) => [t.plan_id, t])),
    [todayData],
  )

  // 내가 만든 개인 플랜(1인 1플랜) — 있으면 "만들기" 대신 그 플랜으로 안내
  const ownedPlan = useMemo(() => plans.find((p) => p.is_owner) ?? null, [plans])

  const openCreate = () => {
    if (!isAuthenticated()) {
      showToast('로그인이 필요합니다', 'error')
      navigate('/login')
      return
    }
    if (ownedPlan) {
      navigate(`/bible/plans/${ownedPlan.id}`)
      return
    }
    setSheetOpen(true)
  }

  const submitCode = () => {
    const code = codeValue.trim().toUpperCase()
    if (code.length < 4) {
      showToast('초대 코드를 입력해 주세요', 'error')
      return
    }
    navigate(`/bible/plans/join/${code}`)
  }

  const personalEntry = (
    <PersonalPlanEntry
      ownedPlan={ownedPlan}
      codeOpen={codeOpen}
      codeValue={codeValue}
      onCreate={openCreate}
      onToggleCode={() => setCodeOpen((v) => !v)}
      onCodeChange={setCodeValue}
      onSubmitCode={submitCode}
    />
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
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      {/* PC 전용 섹션 탭 — 하단 도크는 lg에서 숨는다 */}
      <BibleSectionTabs active="plans" />
      {/* lg+: 좁은 셸을 풀고 본문(플랜 목록) + 우측 레일(묵상방·태그 필터) 2단 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-bottomnav-safe lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:min-h-0 lg:rounded-3xl lg:border lg:pb-8 lg:overflow-hidden">
        {/* 헤더 — PC에선 위 섹션 탭이 내비를 담당하므로 뒤로가기 버튼은 모바일 전용 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button
            onClick={() => navigate('/bible')}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors lg:hidden"
            aria-label="성경 공부로"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">성경</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong mx-auto pr-10">
            읽기 플랜
          </h1>
        </div>

        {/* Hero — 말씀 읽는 손 실사 + 좌→우 스크림 (홈 묵상 히어로와 같은 문법).
            사진이 원래 푸른 톤이라 브랜드 블루와 자연스럽게 이어진다 */}
        <section className="relative mx-4 mt-5 overflow-hidden rounded-[26px] px-6 py-8 bg-[#0b1224] ring-1 ring-white/[0.08] shadow-[0_10px_34px_-12px_rgba(0,0,0,0.55)]">
          <img
            src={heroCover}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-[68%_32%]"
          />
          {/* 좌측을 짙게 — 텍스트 가독성 확보, 우측엔 펼친 성경이 비친다 */}
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(9,16,34,0.92)_0%,rgba(9,16,34,0.66)_46%,rgba(9,16,34,0.22)_100%)]" />
          {/* 하단 정돈 + 은은한 브랜드 틴트로 앱 톤과 묶는다 */}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(9,16,34,0.55)] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[rgba(49,130,246,0.14)] mix-blend-multiply" />

          <div className="relative z-10">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.34em] text-white/65">
              Reading&nbsp;Plan
            </span>
            <h2 className="text-[26px] font-extrabold tracking-[-0.02em] leading-[1.25] text-white mt-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              오늘부터,
              <br />
              함께 읽어요
            </h2>
            <p className="text-[13px] font-light leading-[1.7] text-white/80 mt-3 max-w-[15rem] break-keep">
              계획을 골라 시작하면 매일 분량과 진행률·연속 기록을 챙겨드려요.
            </p>
          </div>
        </section>

        {/* 공동 묵상방 진입 — 혼자 읽는 플랜과 달리 "함께" 읽는 새 기능 */}
        <button
          type="button"
          onClick={() => navigate('/rooms')}
          className="lg:hidden mx-4 mt-3.5 w-[calc(100%-2rem)] flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.985] text-left"
        >
          <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center text-[19px]">
            🕊️
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-bold text-ink-strong tracking-[-0.015em]">
              공동 묵상방
            </span>
            <span className="block text-[11.5px] text-gray-400 dark:text-white/45 mt-0.5">
              초대 링크로 모여 같은 본문을 함께 묵상해요
            </span>
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-300 dark:text-white/30">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* 나만의 플랜 — 관리자 큐레이션이 아니라 성도가 직접 범위·기간을 정하는 플랜 (모바일) */}
        <div className="lg:hidden mx-4 mt-3">{personalEntry}</div>

        {/* 본문 — 에러여도 캐시된 목록이 있으면 그대로 보여준다
            (일시적 실패가 멀쩡한 데이터를 가리는 게 이 화면의 간헐적 에러 원인이었음) */}
        {isLoading ? (
          <PlanSkeletons />
        ) : error && plans.length === 0 ? (
          <div className="text-center py-16 px-6">
            <span className="text-4xl block mb-3">😢</span>
            <p className="text-[13px] text-gray-500 dark:text-white/55">
              플랜을 불러오지 못했습니다
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="mt-5 px-5 py-2.5 rounded-full bg-brand text-white text-[13px] font-bold tracking-[-0.01em] shadow-[0_4px_14px_-4px_var(--brand-glow)] transition-all duration-150 active:scale-95 disabled:opacity-60"
            >
              {isFetching ? '불러오는 중…' : '다시 시도'}
            </button>
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
                <div className="space-y-3.5 lg:grid lg:grid-cols-2 lg:gap-3.5 lg:space-y-0 lg:items-start">
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
                  <div className="space-y-3.5 mt-4 lg:grid lg:grid-cols-2 lg:gap-3.5 lg:space-y-0 lg:items-start">
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
                <div className="lg:hidden sticky top-[48px] z-10 -mx-4 mb-4 pt-2 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
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
                              ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                              : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60 hover:bg-[var(--brand-soft)] dark:hover:bg-white/[0.12]'
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
                <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3">
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

      {/* 우측 위젯 레일 (lg+) — 태그 필터를 본문 밖으로 빼 목록이 끊기지 않게 하고,
          공동 묵상방 진입을 항상 보이는 자리에 둔다 */}
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
        <button
          type="button"
          onClick={() => navigate('/rooms')}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--brand-soft-strong)] text-left"
        >
          <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center text-[19px]">
            🕊️
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-bold text-ink-strong tracking-[-0.015em]">
              공동 묵상방
            </span>
            <span className="block text-[11.5px] text-gray-400 dark:text-white/45 mt-0.5">
              함께 같은 본문을 묵상해요
            </span>
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-300 dark:text-white/30">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {personalEntry}

        {myPlans.length > 0 && (
          <section className="rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none">
            <p className="mb-2.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
              나의 플랜
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
                  읽는 중
                </span>
                <span className="text-[16px] font-bold text-brand tabular-nums">
                  {activePlans.length}
                </span>
              </div>
              {completedPlans.length > 0 && (
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
                    완주
                  </span>
                  <span className="text-[16px] font-bold text-emerald-600 dark:text-emerald-300 tabular-nums">
                    {completedPlans.length}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {filterTags.length > 0 && (
          <section className="rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none">
            <p className="mb-1.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
              플랜 찾기
            </p>
            <div className="flex flex-col -mx-1">
              {[null, ...filterTags].map((tag) => {
                const active = tagFilter === tag
                const count =
                  tag === null
                    ? otherPlans.length
                    : otherPlans.filter((p) => p.level === tag || p.category === tag).length
                return (
                  <button
                    key={tag ?? '전체'}
                    type="button"
                    onClick={() => setTagFilter(tag)}
                    className={`flex items-center justify-between gap-2 px-1 py-2 rounded-lg text-left transition-colors ${
                      active ? 'bg-[var(--brand-soft-strong)]' : 'hover:bg-[var(--brand-soft)]'
                    }`}
                  >
                    <span
                      className={`min-w-0 truncate text-[12.5px] ${
                        active ? 'font-bold text-brand' : 'font-semibold text-ink-strong'
                      }`}
                    >
                      {tag ? `#${tag}` : '전체'}
                    </span>
                    <span className="shrink-0 text-[11.5px] font-semibold tabular-nums text-gray-400 dark:text-white/40">
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </aside>
      </div>

      {sheetOpen && (
        <PersonalPlanSheet
          onClose={() => setSheetOpen(false)}
          onCreated={(plan) => {
            setSheetOpen(false)
            navigate(`/bible/plans/${plan.id}`)
          }}
        />
      )}

      {/* 성경 섹션 하단 네비게이션 */}
      <BibleBottomNav active="plans" />
    </div>
  )
}

// 나만의 플랜 진입 카드 — 만들기(또는 내 플랜으로 가기) + 초대 코드로 함께하기
const PersonalPlanEntry = ({
  ownedPlan,
  codeOpen,
  codeValue,
  onCreate,
  onToggleCode,
  onCodeChange,
  onSubmitCode,
}: {
  ownedPlan: PlanSummary | null
  codeOpen: boolean
  codeValue: string
  onCreate: () => void
  onToggleCode: () => void
  onCodeChange: (v: string) => void
  onSubmitCode: () => void
}) => (
  <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm overflow-hidden">
    <button
      type="button"
      onClick={onCreate}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--brand-soft)]"
    >
      <span className="shrink-0 w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-[0_6px_16px_-6px_var(--brand-glow)]">
        {ownedPlan ? (
          <span className="text-[19px]">{ownedPlan.emoji || '📖'}</span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-bold text-ink-strong tracking-[-0.015em] truncate">
          {ownedPlan ? ownedPlan.title : '나만의 플랜 만들기'}
        </span>
        <span className="block text-[11.5px] text-gray-400 dark:text-white/45 mt-0.5 truncate">
          {ownedPlan
            ? `내가 만든 플랜 · ${(ownedPlan.participant_count ?? 1)}명이 함께 읽어요`
            : '읽을 범위와 기간을 정하고, 소그룹과 함께 읽어요'}
        </span>
      </span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-300 dark:text-white/30">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
    <div className="border-t border-gray-100 dark:border-white/[0.06] px-4 py-2">
      {codeOpen ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmitCode()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={codeValue}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
            placeholder="초대 코드 8자리"
            maxLength={8}
            autoFocus
            autoCapitalize="characters"
            className="flex-1 min-w-0 h-9 px-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] font-bold tracking-[0.12em] text-ink-strong placeholder:font-medium placeholder:tracking-normal placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="shrink-0 h-9 px-3.5 rounded-full bg-brand text-white text-[12px] font-bold"
          >
            함께하기
          </button>
          <button
            type="button"
            onClick={onToggleCode}
            aria-label="닫기"
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={onToggleCode}
          className="w-full flex items-center justify-between text-[12px] font-semibold text-gray-500 dark:text-white/55 hover:text-brand py-1"
        >
          <span>🔑 초대 코드로 함께하기</span>
          <span className="text-brand">입력</span>
        </button>
      )}
    </div>
  </div>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[15px] font-extrabold text-ink-strong tracking-[-0.02em] mb-5 px-0.5">
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
          className="text-[11px] font-medium tracking-[-0.02em] text-brand"
        >
          #{t}
        </span>
      ))}
    </div>
  )
}

// 카드 비주얼(감성 그래픽): accent 그라데이션 + 글로우 + 이모지.
// 추후 커버 이미지가 생기면 이 컴포넌트만 <img>로 교체하면 됨.
// 세로 띠 커버의 오른쪽 끝 — 카드 바탕색으로 서서히 녹여 이미지/텍스트 경계선을 지운다
const STRIP_MASK =
  'linear-gradient(to right, #000 0%, #000 78%, rgba(0,0,0,0.5) 92%, transparent 100%)'

const PlanVisual = ({
  plan,
  size,
}: {
  plan: PlanSummary
  size: 'feed' | 'feature'
}) => {
  const grad = accentGradient(plan.accent)
  const emoji = plan.emoji || '📖'
  const cover = planCover(plan.slug)
  // 이모지 배지 — 사진 위에선 좌상단 작은 유리 배지, 그라데이션 폴백에선 중앙 크게
  const badgeSize = size === 'feed' ? 'text-[15px]' : 'text-[17px]'

  // 실제 커버 그림이 있으면 배경으로 — 수채 일러스트라 틴트는 아주 옅게만 얹는다
  if (cover) {
    // 가로형 카드의 세로 띠(104px)는 3:2 그림의 한가운데(빈 안개)만 잘려 '반쪽'처럼 보인다.
    // 주인공이 있는 오른쪽을 기준으로 자르고, 오른쪽 끝은 카드 바탕으로 녹여 한 장처럼 잇는다.
    const strip = size === 'feature'
    return (
      <div className={`relative h-full w-full overflow-hidden ${strip ? '' : 'bg-gray-100 dark:bg-white/5'}`}>
        <div
          className="absolute inset-0"
          style={strip ? { maskImage: STRIP_MASK, WebkitMaskImage: STRIP_MASK } : undefined}
        >
          <img
            src={cover}
            alt=""
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover ${strip ? 'object-[85%_50%]' : ''}`}
          />
          {/* 브랜드 틴트(블루, 저채도) — 그림마다 다른 색감을 하나의 톤으로 묶는다 */}
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(49,130,246,0.14),rgba(96,165,250,0.06))] mix-blend-multiply" />
        </div>
        {/* 이모지 유리 배지 — 그림 위에 플랜 정체성을 한 점 남긴다.
            배경이 옅은 수채라 어둡게 누르는 대신 밝은 유리로 띄운다 (좌상단을 흐리면 얼룩처럼 보인다) */}
        <span
          className={`absolute left-2 top-2 inline-flex items-center justify-center ${badgeSize} leading-none rounded-full w-7 h-7 bg-white/70 backdrop-blur-md ring-1 ring-white/70 shadow-[0_2px_8px_-2px_rgba(16,32,64,0.28)] select-none`}
        >
          {emoji}
        </span>
      </div>
    )
  }

  // ── 폴백: 커버 사진이 없는 플랜은 기존 accent 그라데이션 + 이모지 ──
  // 격자(feed)에서는 오브젝트를 작게 두고 그라데이션 여백을 넉넉히 남긴다
  const mainSize = size === 'feed' ? 'text-[28px]' : 'text-[34px]'
  const markSize = size === 'feed' ? 'text-[72px]' : 'text-[64px]'
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
    className="group relative flex h-full w-full flex-col text-left overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.97]"
  >
    {/* 정사각 → 5:4로 살짝 낮춰 무게중심을 텍스트 쪽으로 — 글씨가 먼저 읽힌다 */}
    <div className="relative aspect-[5/4] shrink-0">
      <PlanVisual plan={plan} size="feed" />
    </div>
    {/* 텍스트와 화살표를 한 flex 행으로 완전히 분리 — 제목·태그가 길어져도
        겹치지 않고, 배경 없는 맨 화살표라 "카드 전체가 눌린다"로 읽힌다.
        flex-1 로 남는 높이를 흡수해 2열 카드가 항상 같은 높이로 정렬된다 */}
    <div className="flex-1 px-3.5 pt-3.5 pb-[18px] flex items-center gap-1.5">
      <div className="flex-1 min-w-0">
        {/* 제목은 1~2줄로 갈리므로 최소 2줄 높이를 확보해 해시태그 baseline 을 맞춘다 */}
        <h4 className="min-h-[2.5em] text-[14px] font-bold text-ink-strong tracking-[-0.015em] leading-snug line-clamp-2">
          {plan.title}
        </h4>
        <div className="mt-1">
          <Hashtags plan={plan} />
        </div>
        {/* 사회적 증거 — 몇 명이 함께 읽는지 보여 시작 문턱을 낮춘다 */}
        {(plan.participant_count ?? 0) > 0 && (
          <p className="mt-1 text-[11px] font-medium tracking-[-0.01em] text-gray-400 dark:text-white/45">
            👥 {(plan.participant_count ?? 0).toLocaleString()}명 참여 중
          </p>
        )}
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
        className="shrink-0 text-gray-300 dark:text-white/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  </button>
)

// 피처형 카드 (이어서 읽기 · 가로형) — 진행률 강조
// 상태 색 규칙: 진행 중 = 브랜드 블루로 통일, 완주 = 차분한 에메랄드.
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
  const lastDoneDay = today?.last_completed_day ?? progress?.last_completed_day ?? null
  const todayRefs = (today?.passages ?? [])
    .map((p) => p.reference)
    .filter(Boolean)
    .join(' · ')
  const todayDay = today?.day_number ?? progress?.current_day

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full text-left overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.985]"
    >
      <div className="relative w-[104px] shrink-0 self-stretch">
        <PlanVisual plan={plan} size="feature" />
      </div>

      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start gap-2">
          <h4 className="flex-1 text-[16px] font-bold text-ink-strong tracking-[-0.015em] leading-snug truncate">
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

        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {/* 개인 플랜 표시 — 내가 만든 것/초대받은 것 구분 + 함께 읽는 인원 */}
          {plan.is_personal && (
            <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full bg-[var(--brand-soft-strong)] text-brand text-[10.5px] font-bold leading-none">
              {plan.is_owner ? '내 플랜' : `${plan.owner_name ?? '친구'}님의 플랜`}
              {(plan.participant_count ?? 0) > 1 && ` · ${plan.participant_count}명`}
            </span>
          )}
          <Hashtags plan={plan} />
        </div>

        {subscribed && progress && (
          <div className="mt-3">
            {/* 진행 게이지 — 트랙에 브랜드 틴트를 깔아 카드 배경과
                확실히 분리하고, "앞으로 채워질 길"이 눈에 보이게 한다 */}
            <div
              className={`h-2.5 rounded-full overflow-hidden ${
                completed ? 'bg-emerald-500/[0.12]' : 'bg-[var(--brand-soft-strong)]'
              }`}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${
                  completed
                    ? 'bg-emerald-400/80 dark:bg-emerald-400/70'
                    : 'bg-brand shadow-[0_0_8px_var(--brand-glow)]'
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
                <p className="text-[11.5px] tracking-[-0.02em] text-brand truncate mt-0.5">
                  {todayRefs}
                </p>
              )}
            </div>
            {doneToday ? (
              <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300 text-[12px] font-bold leading-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {lastDoneDay ? `${lastDoneDay}일차 완료` : '오늘 완료'}
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand text-white text-[11.5px] font-bold tracking-[-0.02em] leading-none shadow-[0_4px_14px_-4px_var(--brand-glow)] transition-transform group-hover:scale-[1.04]">
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
