// 성경 읽기 플랜 라이브러리 (/bible/plans)
// 2026-10 '도장판 여정' 개편: 오늘 카드(히어로 + 오늘 분량 티켓 + 이번 주 도장) → 읽는 중 플랜마다
// 말씀 오솔길(지나는 성경 구간 위 내 위치) + 25/50/75/완주 이정표 → 도장 수첩(완주) → 둘러보기 쿠폰.
// 기능은 예전 그대로다(이어서 읽기·오늘 분량·연속 기록·완주 목록·묵상방·나만의 플랜·초대 코드·태그 필터).
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBiblePlans, useTodayReadings } from '../../../hooks/useBiblePlan'
import { isAuthenticated } from '../../../utils/auth'
import { CloudOffIcon, DoveIcon, EmptyTrayIcon } from './PlanIcons'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import PersonalPlanSheet from './components/PersonalPlanSheet'
import './plan-hero.css'
import './plan-journey.css'
import { useThemeArt } from '../../../hooks/useThemeArt'
import { PLAN_HERO, ROOMS_HERO, warmPair } from '../../../utils/themeAssets'
import { showToast } from '../../../utils/toast'
import { CouponPlanCard, PlanSkeletons, SectionTitle } from './list/PlanCards'
import { PersonalPlanEntry } from './list/PersonalPlanEntry'
import TodayHero from './list/TodayHero'
import JourneyBoard from './list/JourneyBoard'
import StampBook from './list/StampBook'

const PlanList = () => {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch, isFetching } = useBiblePlans()
  // 오늘 분량(일차·본문 reference) — 이어서 읽기 카드의 CTA/미리보기에 사용
  const { data: todayData } = useTodayReadings(isAuthenticated())
  // 도장 수첩은 완주 도장 몇 개만 보이고 나머지는 +N 으로 접는다
  const [showCompleted, setShowCompleted] = useState(false)
  // 둘러보기 해시태그 필터 (null = 전체)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  // 나만의 플랜 만들기 시트 / 초대 코드 입력
  const [sheetOpen, setSheetOpen] = useState(false)
  const [codeValue, setCodeValue] = useState('')
  // 도장 수첩의 빈 칸(+) → 둘러보기로 내려간다
  const discoverRef = useRef<HTMLElement>(null)

  // 히어로 삽화는 CSS 배경이라 이 엘리먼트가 렌더된 뒤에야 요청이 나간다(themeAssets.ts 참고).
  // 하단 도크·레일이 미리 데워 뒀으면 첫 렌더부터 보이고, 아니면 도착에 맞춰 페이드인한다.
  const artReady = useThemeArt(PLAN_HERO)

  // /rooms 히어로 삽화도 CSS 배경이라 화면이 그려진 뒤에야 요청이 나간다.
  // 여기가 /rooms 로 들어가는 유일한 길목이므로, 버튼에 손이 닿는 순간 미리 데운다.
  const warmRooms = () => {
    void warmPair(ROOMS_HERO)
  }

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

  // 오늘 카드에 올릴 플랜 — 오늘 아직 안 읽은 첫 플랜, 다 읽었으면 첫 플랜. 오솔길 카드도 이 플랜부터
  const focusPlan =
    activePlans.find((p) => !(todayByPlan.get(p.id)?.done_today ?? p.progress?.completed_today)) ??
    activePlans[0] ??
    null
  const boardPlans = focusPlan ? [focusPlan, ...activePlans.filter((p) => p.id !== focusPlan.id)] : []

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
      codeValue={codeValue}
      onCreate={openCreate}
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

  // 둘러보기 태그별 개수 — PC 칩 옆 숫자
  const tagCount = (tag: string | null) =>
    tag === null
      ? otherPlans.length
      : otherPlans.filter((p) => p.level === tag || p.category === tag).length

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 좁은 셸을 풀고 좌측 섹션 레일 + 본문 카드 2단. 하단 도크는 lg에서 숨고 좌측 레일이 섹션 내비를 맡는다.
          ★2026-10: 우측 위젯 레일을 본문 카드 밖에 따로 세우던 3단은 가운데 목록이 ~480px로 눌려
          둘러보기 카드가 한 줄에 한 장씩 거대한 정사각형으로 늘어섰다. 이제 위젯은 본문 카드 안
          '위쪽 2단'(히어로·이어서 읽기 | 위젯)에만 두고, 둘러보기·완주는 카드 전체 폭 격자로 편다 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
      <BibleSideRail active="plans" />
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-bottomnav-safe lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:min-h-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:pb-10 lg:overflow-clip">
        {/* 헤더 — PC에선 좌측 레일이 내비를 담당하므로 뒤로가기 버튼은 모바일 전용 */}
        <div className="sticky top-14 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
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
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong mx-auto pr-10 lg:pr-0">
            읽기 플랜
          </h1>
        </div>

        {/* 위쪽 — 모바일은 [오늘 카드 → 오솔길 → 묵상방·나만의 플랜·도장 수첩]으로 쌓이고,
            PC는 [오늘 카드 + 오솔길 | 300px 보조 칸] 2단. 좁은 PC 폭 + 글씨 크기 zoom 에선
            plan-journey.css 가 2단을 풀어 모바일처럼 쌓는다(보조 칸을 숨기지 않고 아래로 내린다) */}
        <div className="pj-top px-4 pt-5 lg:px-7 lg:pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6 lg:items-start">
          <div className="min-w-0 space-y-3.5 lg:space-y-4">
            <TodayHero
              plan={isLoading ? null : focusPlan}
              today={focusPlan ? todayByPlan.get(focusPlan.id) : undefined}
              artReady={artReady}
              onOpen={() => focusPlan && navigate(`/bible/plans/${focusPlan.id}`)}
            />
            {!isLoading &&
              boardPlans.map((plan) => (
                <JourneyBoard
                  key={plan.id}
                  plan={plan}
                  today={todayByPlan.get(plan.id)}
                  showToday={plan.id !== focusPlan?.id}
                  onClick={() => navigate(`/bible/plans/${plan.id}`)}
                />
              ))}
          </div>

          <aside className="pj-aside mt-3.5 lg:mt-0 grid gap-3 content-start">
            {/* 공동 묵상방 — 혼자 읽는 플랜과 달리 "함께" 읽는 기능 */}
            <button
              type="button"
              onClick={() => navigate('/rooms')}
              onPointerEnter={warmRooms}
              onTouchStart={warmRooms}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[20px] bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.985] text-left"
            >
              <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-brand flex items-center justify-center">
                <DoveIcon size={21} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] lg:text-[17px] font-extrabold text-ink-strong tracking-[-0.015em]">
                  공동 묵상방
                </span>
                <span className="block text-[12px] lg:text-[13.5px] text-gray-400 dark:text-white/45 mt-0.5">
                  같은 본문을 함께 묵상해요
                </span>
              </span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-300 dark:text-white/30">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {personalEntry}

            {myPlans.length > 0 && (
              <StampBook
                activeCount={activePlans.length}
                completed={completedPlans}
                expanded={showCompleted}
                onToggle={() => setShowCompleted((v) => !v)}
                onOpen={(plan) => navigate(`/bible/plans/${plan.id}`)}
                onFindMore={() => discoverRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              />
            )}
          </aside>
        </div>

        {/* 본문 — 에러여도 캐시된 목록이 있으면 그대로 보여준다
            (일시적 실패가 멀쩡한 데이터를 가리는 게 이 화면의 간헐적 에러 원인이었음) */}
        {isLoading ? (
          <PlanSkeletons />
        ) : error && plans.length === 0 ? (
          <div className="text-center py-16 px-6">
            <span className="mx-auto mb-3 block w-fit text-gray-300 dark:text-white/25">
              <CloudOffIcon size={38} />
            </span>
            <p className="text-[13px] lg:text-[16px] text-gray-500 dark:text-white/55">
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
            <span className="mx-auto mb-3 block w-fit text-gray-300 dark:text-white/25">
              <EmptyTrayIcon size={38} />
            </span>
            <p className="text-[13px] lg:text-[16px] text-gray-500 dark:text-white/55">
              아직 공개된 읽기 플랜이 없어요
            </p>
          </div>
        ) : (
          <>
            <section ref={discoverRef} className="px-4 pt-10 lg:px-7 scroll-mt-[112px]">
              {/* PC — 제목과 태그 칩을 한 줄에: 필터가 목록 바로 위에 있어야 "골라서 본다"가 읽힌다 */}
              <div className="lg:flex lg:items-end lg:justify-between lg:gap-6 lg:mb-6">
                <div className="lg:[&>h3]:mb-0">
                  <SectionTitle>
                    {myPlans.length > 0 ? '새 도장판 고르기' : '플랜 둘러보기'}
                  </SectionTitle>
                </div>
                {filterTags.length > 0 && (
                  <div className="hidden lg:flex lg:flex-wrap lg:justify-end lg:gap-2 zoom-narrow-hide">
                    {[null, ...filterTags].map((tag) => {
                      const active = tagFilter === tag
                      return (
                        <button
                          key={tag ?? '전체'}
                          type="button"
                          onClick={() => setTagFilter(tag)}
                          aria-pressed={active}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[15px] font-bold tracking-[-0.01em] transition-colors duration-150 ${
                            active
                              ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                              : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/65 hover:bg-[var(--brand-soft-strong)] hover:text-brand'
                          }`}
                        >
                          {tag ? `#${tag}` : '전체'}
                          <span className={`text-[13px] font-semibold tabular-nums ${active ? 'text-white/75' : 'text-gray-400 dark:text-white/40'}`}>
                            {tagCount(tag)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              {/* 해시태그 필터 칩 (모바일) — 플랜이 늘어도 수준·주제로 바로 좁힐 수 있게.
                  우측 페이드로 "밀어서 더 볼 수 있음"을 힌트하고, 그리드를 내려
                  보는 동안에도 앱바(56)+상단 헤더(48) 아래 붙어 즉시 필터를 바꿀 수 있다 */}
              {filterTags.length > 0 && (
                <div className="lg:hidden zoom-narrow-show sticky top-[104px] z-10 -mx-4 mb-4 pt-2 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm lg:static lg:mx-0">
                  <div className="flex gap-2 overflow-x-auto pb-1 px-4 pr-10 lg:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                <p className="text-center text-[13px] lg:text-[16px] text-gray-400 dark:text-white/45 py-10">
                  이 태그의 플랜이 아직 없어요
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] lg:gap-5">
                  {visibleOtherPlans.map((plan, i) => (
                    <CouponPlanCard
                      key={plan.id}
                      plan={plan}
                      index={i}
                      onClick={() => navigate(`/bible/plans/${plan.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
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


export default PlanList
