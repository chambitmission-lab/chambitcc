import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import PrayerComposer from './components/PrayerComposer'
import PrayerDetail from './components/PrayerDetail'
import TodaysVerse from './components/TodaysVerse'
import SortTabs from './components/SortTabs'
import PrayerComposerInput from './components/PrayerComposerInput'
import PrayerFeed from './components/PrayerFeed'
import BottomNavigation from './components/BottomNavigation'
import GroupFilter from '../../components/prayer/GroupFilter'
import { CreateGroupModal, JoinGroupModal } from '../../components/prayer/GroupModals'
import { usePrayersInfinite } from '../../hooks/usePrayersQuery'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../contexts/LanguageContext'
import { showToast } from '../../utils/toast'
import type { SortType, PrayerFilterType } from '../../types/prayer'

const NewHome = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { requireAuth, requireAuthWithRedirect } = useAuth()
  const { t } = useLanguage()
  const [showComposer, setShowComposer] = useState(false)
  const [selectedPrayerId, setSelectedPrayerId] = useState<number | null>(null)
  const [openReplies, setOpenReplies] = useState(false) // 댓글 자동 열기 상태
  const [sort, setSort] = useState<SortType>('popular')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<PrayerFilterType>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const prayerHook = usePrayersInfinite(sort, selectedGroupId, selectedFilter)  // ✅ selectedFilter 전달
  const mainRef = useRef<HTMLDivElement>(null)

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

  const handlePrayerToggle = async (prayerId: number) => {
    try {
      await prayerHook.handlePrayerToggle(prayerId)
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('prayerFailed'), 'error')
    }
  }

  const handlePrayerClick = (prayerId: number, shouldOpenReplies = false) => {
    setSelectedPrayerId(prayerId)
    setOpenReplies(shouldOpenReplies)
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

  // 초기 로딩 상태 표시
  if (prayerHook.loading && prayerHook.prayers.length === 0) {
    return (
      <ErrorBoundary>
        <div className="bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200">
          <div className="max-w-md mx-auto min-h-screen bg-background-light dark:bg-background-dark shadow-2xl relative flex flex-col border-x border-border-light dark:border-border-dark">
            <main className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-900 dark:text-white font-semibold">{t('loadingPrayerList')}</p>
              </div>
            </main>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  // 에러 상태 표시
  if (prayerHook.error) {
    return (
      <ErrorBoundary>
        <div className="bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200">
          <div className="max-w-md mx-auto min-h-screen bg-background-light dark:bg-background-dark shadow-2xl relative flex flex-col border-x border-border-light dark:border-border-dark">
            <main className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <span className="text-6xl mb-4 block">⚠️</span>
                <p className="text-gray-900 dark:text-white font-semibold mb-2">{t('cannotLoadData')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{prayerHook.error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:shadow-lg transition-all"
                >
                  {t('refresh')}
                </button>
              </div>
            </main>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl relative border-x border-border-light dark:border-border-dark">
          
          <main ref={mainRef} className="pb-20">
            <TodaysVerse />
            
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
            <PrayerComposerInput onComposerOpen={handleComposerOpen} />
            
            <PrayerFeed
              prayers={prayerHook.prayers}
              loading={prayerHook.loading}
              hasMore={prayerHook.hasMore}
              isFetchingMore={prayerHook.isFetchingMore}
              onLoadMore={prayerHook.loadMore}
              onPrayerToggle={handlePrayerToggle}
              onPrayerClick={handlePrayerClick}
            />
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
        </div>

        {/* Bottom Navigation - Fixed at bottom, centered with max-w-md */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <BottomNavigation 
              onProfileClick={handleProfileClick}
              onComposeClick={handleComposerOpen}
              onScrollToTop={handleScrollToTop}
              onFocusModeClick={handleFocusModeClick}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default NewHome
