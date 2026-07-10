import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import PrayerComposer from './components/PrayerComposer'
import PrayerDetail from './components/PrayerDetail'
// TodaysVerse — AnnualThemeVerse 전용 카드로 대체. 다시 살리려면 아래 import와 <TodaysVerse /> 주석을 해제하세요.
// import TodaysVerse from './components/TodaysVerse'
import AnnualThemeVerse from './components/AnnualThemeVerse'
import DailyMeditationCard from './components/DailyMeditationCard'
import TodayPlanCard from './components/TodayPlanCard'
import AnsweredPrayersBanner from './components/AnsweredPrayersBanner'
import ThanksTicker from './components/ThanksTicker'
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
import type { SortType, PrayerFilterType, Prayer } from '../../types/prayer'

const NewHome = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { requireAuth, requireAuthWithRedirect, isLoggedIn } = useAuth()
  const { t } = useLanguage()
  const [showComposer, setShowComposer] = useState(false)
  const [selectedPrayerId, setSelectedPrayerId] = useState<number | null>(null)
  const [openReplies, setOpenReplies] = useState(false) // 댓글 자동 열기 상태
  const [sort, setSort] = useState<SortType>('popular')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<PrayerFilterType>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const [selectedPrayerForAnswer, setSelectedPrayerForAnswer] = useState<Prayer | null>(null)
  const prayerHook = usePrayersInfinite(sort, selectedGroupId, selectedFilter)  // ✅ selectedFilter 전달
  const mainRef = useRef<HTMLDivElement>(null)

  // 핸들러 안정화용 ref — prayerHook은 매 렌더 새 객체라 useCallback deps에 못 넣음
  const prayerHookRef = useRef(prayerHook)
  prayerHookRef.current = prayerHook

  // 로그인 상태 변경 시 필터 초기화
  useEffect(() => {
    if (!isLoggedIn() && (selectedFilter === 'my_prayers' || selectedFilter === 'prayed_by_me')) {
      setSelectedFilter('all')
      setSelectedGroupId(null)
    }
  }, [isLoggedIn, selectedFilter])

  // 프로필에서 넘어온 기도 ID 처리
  useEffect(() => {
    const state = location.state as { openPrayerId?: number } | null
    if (state?.openPrayerId) {
      setSelectedPrayerId(state.openPrayerId)
      // state 초기화 (뒤로가기 시 다시 열리지 않도록)
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const handleComposerOpen = () => {
    requireAuth(() => setShowComposer(true))
  }

  const handleProfileClick = () => {
    requireAuthWithRedirect('/profile')
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
    const ok = window.confirm('응답 등록을 취소하시겠습니까? 등록한 간증이 삭제됩니다.')
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
    navigate('/prayer-focus')
  }

  const handleBibleClick = () => {
    navigate('/bible')
  }

  // 초기 로딩/에러는 PrayerFeed 영역 안에서만 표시 — 상단 카드(올해의 말씀, 묵상, 감사)는
  // 독립 쿼리이므로 기도 목록 fetch와 무관하게 즉시 렌더되어야 LCP 손해가 없다.
  const showOfflineWithoutCache =
    !!prayerHook.error && prayerHook.prayers.length === 0

  return (
    <ErrorBoundary>
      <div className="bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl relative border-x border-border-light dark:border-border-dark">
          
          <main ref={mainRef} className="pb-28">
            {/* 오프라인 배너 - 캐시된 데이터를 보여주면서 알림 */}
            {prayerHook.error && prayerHook.prayers.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
                <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                  <span>📡</span>
                  <span>오프라인 모드 - 저장된 데이터를 표시하고 있습니다</span>
                </div>
              </div>
            )}
            
            {/* 올해의 말씀 — 교회 연간 표어 (메인 화면 위계 최상단) */}
            <AnnualThemeVerse />

            {/* 오늘의 묵상 카드 (통독표 + 시간대/감정 컨텍스트) */}
            <DailyMeditationCard onWriteMeditation={handleComposerOpen} />

            {/* 오늘의 읽기 — 진행 중인 구독형 읽기 플랜(bible_plans) */}
            <TodayPlanCard />

            {/* 오늘의 감사 한 줄 (전광판 마퀴) */}
            <ThanksTicker />

            {/* 응답의 전당 배너 */}
            <AnsweredPrayersBanner />

            {/* 오늘의 감사 (Small Thanks Thread) — 임시 비활성화 */}
            {/* <ThanksThread /> */}

            {/* 소그룹 필터 */}
            <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
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
                <p className="text-gray-900 dark:text-white font-semibold mb-1">
                  오프라인 상태입니다
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  네트워크 연결을 확인해주세요
                </p>
                <button
                  onClick={() => prayerHook.refresh()}
                  className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full hover:shadow-lg transition-all"
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

        {/* Bottom Navigation - Fixed at bottom, centered with max-w-md */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <BottomNavigation
              onProfileClick={handleProfileClick}
              onComposeClick={handleComposerOpen}
              onScrollToTop={handleScrollToTop}
              onFocusModeClick={handleFocusModeClick}
              onBibleClick={handleBibleClick}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default NewHome
