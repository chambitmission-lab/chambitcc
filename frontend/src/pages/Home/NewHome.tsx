import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import PrayerComposer from './components/PrayerComposer'
import PrayerDetail from './components/PrayerDetail'
// TodaysVerse — AnnualThemeVerse 전용 카드로 대체. 다시 살리려면 아래 import와 <TodaysVerse /> 주석을 해제하세요.
// import TodaysVerse from './components/TodaysVerse'
import AnnualThemeVerse from './components/AnnualThemeVerse'
import HomeNotice from './components/HomeNotice'
import DailyMeditationCard from './components/DailyMeditationCard'
import TimeCapsuleCard from './components/TimeCapsuleCard'
import TodayPlanCard from './components/TodayPlanCard'
import AnsweredPrayersBanner from './components/AnsweredPrayersBanner'
import ThanksTicker from './components/ThanksTicker'
import GlobalThanksComposer from './components/GlobalThanksComposer'
import WeeklyPrayerBanner from './components/WeeklyPrayerBanner'
// 오늘의 감사 — 임시 비활성화. 다시 활성화하려면 아래 import와 <ThanksThread /> 주석을 해제하세요.
// import ThanksThread from './components/ThanksThread'
import SortTabs from './components/SortTabs'
import PrayerFeed from './components/PrayerFeed'
import BottomNavigation from './components/BottomNavigation'
import GroupFilter from '../../components/prayer/GroupFilter'
import { CreateGroupModal, JoinGroupModal } from '../../components/prayer/GroupModals'
import AnswerModal from '../../components/prayer/AnswerModal'
import { usePrayersInfinite } from '../../hooks/usePrayersQuery'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../contexts/LanguageContext'
import { showToast } from '../../utils/toast'
import { preloadNavRoutes, preloadRoute, isRoutePreloaded } from '../../utils/routePreload'
import type { SortType, PrayerFilterType, Prayer } from '../../types/prayer'
import { confirmDialog } from '../../utils/confirmDialog'

const NewHome = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { requireAuth, requireAuthWithRedirect, isLoggedIn } = useAuth()
  const { t } = useLanguage()
  const [showComposer, setShowComposer] = useState(false)
  // FAB 스피드 다이얼·전역 레일 → 감사 한 줄 작성 (티커와 같은 캐시라 등록 즉시 반영)
  const [showThanksComposer, setShowThanksComposer] = useState(false)
  const [selectedPrayerId, setSelectedPrayerId] = useState<number | null>(null)
  const [openReplies, setOpenReplies] = useState(false) // 댓글 자동 열기 상태
  const [sort, setSort] = useState<SortType>('popular')
  // 기도방 홈에서 "이 방의 기도 보러 가기"로 진입하면 ?group=ID 로 필터를 미리 선택
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(() => {
    const g = new URLSearchParams(location.search).get('group')
    const parsed = g ? Number(g) : NaN
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  })
  const [selectedFilter, setSelectedFilter] = useState<PrayerFilterType>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const [selectedPrayerForAnswer, setSelectedPrayerForAnswer] = useState<Prayer | null>(null)
  // 하단 네비에서 lazy 청크를 받는 중인 경로 — 해당 아이콘에 스피너를 띄운다
  const [navPending, setNavPending] = useState<string | null>(null)
  const prayerHook = usePrayersInfinite(sort, selectedGroupId, selectedFilter)  // ✅ selectedFilter 전달
  const mainRef = useRef<HTMLDivElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  // 기도방 홈에서 ?group= 으로 진입하면 기도 피드로 자동 스크롤,
  // &compose=1 이면 (첫 기도제목) 작성 모달까지 바로 연다
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (!params.get('group')) return
    const timer = setTimeout(() => {
      feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      if (params.get('compose') === '1') {
        requireAuth(() => setShowComposer(true))
      }
    }, 150)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 핸들러 안정화용 ref — prayerHook은 매 렌더 새 객체라 useCallback deps에 못 넣음
  const prayerHookRef = useRef(prayerHook)
  prayerHookRef.current = prayerHook

  // 하단 네비 목적지(성경/집중기도/프로필) lazy 청크 prefetch — 첫 탭에서 다운로드를 시작하면
  // react-router v7의 startTransition 탓에 청크가 올 때까지 화면이 안 바뀌어 "안 눌린 것처럼" 느껴짐.
  // idle 대기(최대 3초)를 두면 콜드 스타트 직후 누른 첫 탭이 그대로 먹히므로 마운트 즉시 시작한다.
  useEffect(() => {
    void preloadNavRoutes()
  }, [])

  // 로그인 상태 변경 시 필터 초기화
  useEffect(() => {
    if (!isLoggedIn() && (selectedFilter === 'my_prayers' || selectedFilter === 'prayed_by_me')) {
      setSelectedFilter('all')
      setSelectedGroupId(null)
    }
  }, [isLoggedIn, selectedFilter])

  // 프로필/응답의 전당에서 넘어온 기도 ID, 전역 레일(다른 페이지)에서 넘어온
  // "기도제목 나누기/감사 한 줄" 열기 요청 처리
  useEffect(() => {
    const state = location.state as {
      openPrayerId?: number
      openReplies?: boolean
      openComposer?: boolean
      openThanks?: boolean
    } | null
    if (!state) return
    if (state.openPrayerId) {
      setSelectedPrayerId(state.openPrayerId)
      setOpenReplies(!!state.openReplies)
    }
    if (state.openComposer) setShowComposer(true)
    if (state.openThanks) setShowThanksComposer(true)
    if (state.openPrayerId || state.openComposer || state.openThanks) {
      // state 초기화 (뒤로가기 시 다시 열리지 않도록) — 라우터 히스토리 state(idx/key)를
      // 건드리지 않도록 raw replaceState 대신 navigate로 정리한다
      navigate(location.pathname, { replace: true })
    }
  }, [location, navigate])

  const handleComposerOpen = () => {
    requireAuth(() => setShowComposer(true))
  }

  const handleThanksOpen = () => {
    requireAuth(() => setShowThanksComposer(true))
  }

  // 청크가 아직 안 왔으면 다운로드를 기다렸다가 이동한다.
  // 기다리는 동안 눌린 아이콘에 스피너를 띄워 "안 눌렸다"는 오해를 없앤다
  // (startTransition 중에는 Suspense fallback이 뜨지 않아 화면이 그대로 멈춘 것처럼 보임).
  const goLazy = useCallback(async (path: string) => {
    if (isRoutePreloaded(path)) {
      navigate(path)
      return
    }
    setNavPending(path)
    try {
      await preloadRoute(path)
    } finally {
      setNavPending(null)
    }
    navigate(path)
  }, [navigate])

  const handleProfileClick = () => {
    // 비로그인이면 기존 경로 그대로 (토스트 후 /login)
    if (!isLoggedIn()) {
      requireAuthWithRedirect('/profile')
      return
    }
    void goLazy('/profile')
  }

  const handlePrayerToggle = useCallback(async (prayerId: number) => {
    try {
      await prayerHookRef.current.handlePrayerToggle(prayerId)
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('prayerFailed'), 'error')
    }
  }, [t])

  const handlePrayerClick = useCallback((prayerId: number, shouldOpenReplies = false) => {
    setSelectedPrayerId(prayerId)
    setOpenReplies(shouldOpenReplies)
  }, [])

  const handleAnswerToggle = useCallback((prayerId: number) => {
    const prayer = prayerHookRef.current.prayers.find(p => p.id === prayerId)
    if (prayer) {
      setSelectedPrayerForAnswer(prayer)
      setShowAnswerModal(true)
    }
  }, [])

  // 응답된 기도의 간증 수정 진입점
  const handleEditAnswer = useCallback((prayerId: number) => {
    const prayer = prayerHookRef.current.prayers.find(p => p.id === prayerId)
    if (prayer) {
      setSelectedPrayerForAnswer(prayer)
      setShowAnswerModal(true)
    }
  }, [])

  // 응답 등록 취소
  const handleCancelAnswer = useCallback(async (prayerId: number) => {
    const ok = await confirmDialog({
      title: '응답 등록 취소',
      message: '응답 등록을 취소하시겠습니까?',
      description: '등록한 간증이 함께 삭제됩니다.',
      confirmText: '취소하기',
      cancelText: '닫기',
      icon: 'undo',
    })
    if (!ok) return
    try {
      await prayerHookRef.current.cancelPrayerAnswer(prayerId)
    } catch {
      // mutation onError에서 toast 처리됨
    }
  }, [])

  const handleAnswerSubmit = async (testimony: string) => {
    if (!selectedPrayerForAnswer) return
    try {
      // 이미 응답된 기도면 수정, 아니면 신규 등록
      if (selectedPrayerForAnswer.is_answered) {
        await prayerHook.updatePrayerAnswer(selectedPrayerForAnswer.id, testimony)
      } else {
        await prayerHook.answerPrayer(selectedPrayerForAnswer.id, testimony)
      }
      // 성공 시 모달 닫기 (실패 시에는 사용자가 다시 시도할 수 있도록 열어둠)
      setShowAnswerModal(false)
      setSelectedPrayerForAnswer(null)
    } catch {
      // mutation onError에서 toast 처리됨
    }
  }

  const handleScrollToTop = () => {
    // 모든 가능한 스크롤 요소를 맨 위로
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    
    // mainRef가 있다면 그것도 스크롤
    if (mainRef.current) {
      mainRef.current.scrollTop = 0
    }
  }

  const handleFocusModeClick = () => {
    void goLazy('/prayer-focus')
  }

  const handleBibleClick = () => {
    void goLazy('/bible')
  }

  // 초기 로딩/에러는 PrayerFeed 영역 안에서만 표시 — 상단 카드(올해의 말씀, 묵상, 감사)는
  // 독립 쿼리이므로 기도 목록 fetch와 무관하게 즉시 렌더되어야 LCP 손해가 없다.
  const showOfflineWithoutCache =
    !!prayerHook.error && prayerHook.prayers.length === 0

  return (
    <ErrorBoundary>
      <div className="bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200">
        {/* PC 좌측 내비 레일은 전역 레이아웃(App.tsx의 DesktopNavRail)이 담당한다 */}

        {/* 모바일: 폰 프레임(max-w-md) / lg+: 프레임을 풀어 전체 폭 캔버스로 */}
        {/* 배경은 --app-canvas — 라이트에서 배경이 흰색이면 흰 카드가 배경에 잠겨
            카드 경계가 사라진다. 캔버스를 한 톤 낮춰 카드가 떠 보이게 한다 */}
        <div className="max-w-md mx-auto bg-[var(--app-canvas)] shadow-2xl relative border-x border-border-light dark:border-border-dark lg:max-w-none lg:shadow-none lg:border-x-0">

          {/* lg+: 레일 오프셋은 전역 main(App.tsx)이 처리 — 피드+사이드바를 남은 공간 중앙에 배치 */}
          <main ref={mainRef} className="pb-dock-safe lg:pb-12">
            {/* 오프라인 배너 - 캐시된 데이터를 보여주면서 알림 */}
            {prayerHook.error && prayerHook.prayers.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
                <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                  <span>📡</span>
                  <span>오프라인 모드 - 저장된 데이터를 표시하고 있습니다</span>
                </div>
              </div>
            )}
            
            {/* 관리자 팝업 공지 — 진입 시 전면 팝업, 닫으면 이 자리에 배너로 남는다 */}
            <HomeNotice />

            {/* lg+: 인스타그램식 2컬럼 — 기도 피드(좌) + 오늘/공동체 카드 사이드바(우, sticky).
                모바일에선 이 래퍼가 그냥 세로 스택이라 기존 순서(카드들 → 피드) 그대로다 */}
            <div className="lg:flex lg:items-start lg:justify-center lg:gap-8 lg:px-6 lg:pt-6">

            {/* 사이드바 — 모바일에서 피드 위에 쌓이던 카드들을 데스크톱에선 우측 위젯 컬럼으로 */}
            <div className="lg:order-2 lg:w-[368px] lg:shrink-0 lg:sticky lg:top-[4.5rem] lg:self-start lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto scrollbar-hide lg:pb-4">

            {/* 오늘의 묵상 카드 — 시간대별 히어로가 홈의 첫인사 역할 (위계 최상단) */}
            <DailyMeditationCard onWriteMeditation={handleComposerOpen} />

            {/* 오늘의 읽기 — 진행 중인 구독형 읽기 플랜(bible_plans) */}
            <TodayPlanCard />

            {/* 올해의 말씀 — 교회 연간 비전. 매일 바뀌는 '오늘' 영역과
                커뮤니티(감사·기도) 영역 사이를 잇는 다리 위치 */}
            <AnnualThemeVerse />

            {/* 공동체 소식 — 감사 한 줄 + 응답의 전당을 하나의 그룹 리스트 카드로 묶어
                "관련 항목 한 덩어리"로 스캔되게 한다 (토스식 grouped list) */}
            <section className="px-4 pt-3 pb-1.5">
              <p className="px-1 mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.05em] text-[var(--text-muted)]">
                {/* 올해의 말씀 장식과 같은 금색 반짝임 — 두 섹션을 은은하게 잇는다 */}
                <svg width="10" height="10" viewBox="0 0 10 10" className="text-[#d9a514] shrink-0" aria-hidden>
                  <path d="M5 0 L6.1 3.9 L10 5 L6.1 6.1 L5 10 L3.9 6.1 L0 5 L3.9 3.9 Z" fill="currentColor" />
                </svg>
                함께 나누는 은혜
              </p>
              <div className="feed-card rounded-2xl overflow-hidden divide-y divide-[var(--card-border)]">
                <ThanksTicker />
                <WeeklyPrayerBanner />
                <AnsweredPrayersBanner />
              </div>
            </section>

            {/* 타임캡슐 — 밤하늘 봉인 편지 히어로 (내 캡슐 상태 반영 동적 문구) */}
            <TimeCapsuleCard />

            {/* 오늘의 감사 (Small Thanks Thread) — 임시 비활성화 */}
            {/* <ThanksThread /> */}

            </div>{/* /사이드바 */}

            {/* 피드 컬럼 — 데스크톱에선 접속 즉시 기도 피드가 보인다 */}
            <div className="lg:order-1 lg:w-full lg:max-w-[480px] lg:min-w-0">

            {/* PC 전용 인라인 작성바 — 키보드가 있는 환경에선 작성 진입을 피드 최상단에 */}
            <div className="hidden lg:block px-4 pt-1">
              <button
                type="button"
                onClick={handleComposerOpen}
                className="w-full feed-card rounded-2xl pl-3 pr-4 py-3 flex items-center gap-3 text-left hover:border-[var(--brand-glow)] hover:shadow-[0_6px_18px_-6px_var(--brand-glow)] active:scale-[0.99] transition-[border-color,box-shadow,transform] duration-150"
              >
                <span className="w-9 h-9 rounded-full bg-[var(--brand-soft-strong)] text-brand flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M11 6.5 C11.65 10.4 13.8 12.55 17.7 13.2 C13.8 13.85 11.65 16 11 19.9 C10.35 16 8.2 13.85 4.3 13.2 C8.2 12.55 10.35 10.4 11 6.5 Z" />
                  </svg>
                </span>
                <span className="flex-1 text-[14px] text-gray-400 dark:text-white/40">
                  오늘의 기도제목을 나눠보세요…
                </span>
                <span className="text-[13px] font-bold text-brand shrink-0">나누기</span>
              </button>
            </div>

            {/* 소그룹 필터 — scroll-mt는 고정 헤더에 안 가리게 하는 오프셋 */}
            <div ref={feedRef} className="px-4 py-3 overflow-x-auto scrollbar-hide scroll-mt-16">
              <GroupFilter
                selectedGroupId={selectedGroupId}
                selectedFilter={selectedFilter}
                onGroupChange={setSelectedGroupId}
                onFilterChange={setSelectedFilter}
                onCreateGroup={() => setShowCreateModal(true)}
                onJoinGroup={() => setShowJoinModal(true)}
              />
            </div>
            
            <SortTabs currentSort={sort} onSortChange={setSort} />

            {showOfflineWithoutCache ? (
              <div className="px-4 py-12 text-center">
                <span className="text-5xl mb-3 block">📡</span>
                <p className="text-ink-strong font-semibold mb-1">
                  오프라인 상태입니다
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  네트워크 연결을 확인해주세요
                </p>
                <button
                  onClick={() => prayerHook.refresh()}
                  className="px-5 py-2 brand-gradient text-sm font-bold rounded-full hover:shadow-lg transition-all"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <PrayerFeed
                prayers={prayerHook.prayers}
                loading={prayerHook.loading}
                hasMore={prayerHook.hasMore}
                isFetchingMore={prayerHook.isFetchingMore}
                onLoadMore={prayerHook.loadMore}
                onPrayerToggle={handlePrayerToggle}
                onAnswerToggle={handleAnswerToggle}
                onEditAnswer={handleEditAnswer}
                onCancelAnswer={handleCancelAnswer}
                onPrayerClick={handlePrayerClick}
              />
            )}

            </div>{/* /피드 컬럼 */}
            </div>{/* /lg 2컬럼 래퍼 */}
          </main>

          {/* Prayer Composer Modal */}
          {showComposer && (
            <PrayerComposer
              sort={sort}
              groupId={selectedGroupId}  // ✅ selectedGroupId 전달
              onClose={() => setShowComposer(false)}
              onSuccess={() => {
                // Optimistic Update가 자동으로 처리됨
                // 성경 구절 모달이 있을 수 있으므로 PrayerComposer가 자체적으로 닫힘 처리
              }}
            />
          )}

          {/* Prayer Detail Modal */}
          {selectedPrayerId && (
            <PrayerDetail
              prayerId={selectedPrayerId}
              initialData={prayerHook.prayers.find(p => p.id === selectedPrayerId)}
              onClose={() => {
                setSelectedPrayerId(null)
                setOpenReplies(false)
              }}
              onDelete={() => {
                setSelectedPrayerId(null)
                setOpenReplies(false)
                // Optimistic Update가 자동으로 처리됨
              }}
              initialOpenReplies={openReplies}
            />
          )}

          {/* 그룹 모달 */}
          <CreateGroupModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />
          <JoinGroupModal
            isOpen={showJoinModal}
            onClose={() => setShowJoinModal(false)}
          />
          
          {/* 응답 모달 */}
          <AnswerModal
            isOpen={showAnswerModal}
            onClose={() => {
              setShowAnswerModal(false)
              setSelectedPrayerForAnswer(null)
            }}
            onSubmit={handleAnswerSubmit}
            prayerTitle={selectedPrayerForAnswer?.title || ''}
            initialTestimony={
              selectedPrayerForAnswer?.is_answered
                ? selectedPrayerForAnswer?.testimony
                : undefined
            }
            isSubmitting={prayerHook.isAnswering}
          />
        </div>

        {/* FAB 스피드 다이얼 → 감사 한 줄 작성 */}
        {showThanksComposer && (
          <GlobalThanksComposer onClose={() => setShowThanksComposer(false)} />
        )}

        {/* Bottom Navigation - Fixed at bottom, centered with max-w-md (lg+에선 좌측 레일이 대신한다) */}
        <div className="bottom-dock-anchor fixed bottom-0 left-0 right-0 z-[100] pointer-events-none lg:hidden">
          <div className="max-w-md mx-auto pointer-events-auto">
            <BottomNavigation
              onProfileClick={handleProfileClick}
              onComposeClick={handleComposerOpen}
              onThanksClick={handleThanksOpen}
              onVerseCardClick={() => void goLazy('/bible/photo-verse')}
              onScrollToTop={handleScrollToTop}
              onFocusModeClick={handleFocusModeClick}
              onBibleClick={handleBibleClick}
              pendingPath={navPending}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default NewHome
