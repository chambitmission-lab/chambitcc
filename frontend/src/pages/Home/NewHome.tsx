import { useState } from 'react'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import PrayerComposer from './components/PrayerComposer'
import PrayerDetail from './components/PrayerDetail'
import TodaysVerse from './components/TodaysVerse'
import SortTabs from './components/SortTabs'
import PrayerComposerInput from './components/PrayerComposerInput'
import PrayerFeed from './components/PrayerFeed'
import BottomNavigation from './components/BottomNavigation'
import { usePrayersInfinite } from '../../hooks/usePrayersQuery'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../contexts/LanguageContext'
import { showToast } from '../../utils/toast'
import type { SortType } from '../../types/prayer'

const NewHome = () => {
  const { requireAuth, requireAuthWithRedirect } = useAuth()
  const { t } = useLanguage()
  const [showComposer, setShowComposer] = useState(false)
  const [selectedPrayerId, setSelectedPrayerId] = useState<number | null>(null)
  const [openReplies, setOpenReplies] = useState(false) // 댓글 자동 열기 상태
  const [sort, setSort] = useState<SortType>('popular')
  const prayerHook = usePrayersInfinite(sort)

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
        <div className="max-w-md mx-auto min-h-screen bg-background-light dark:bg-background-dark shadow-2xl relative flex flex-col border-x border-border-light dark:border-border-dark">
          
          <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
            <TodaysVerse />
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
        </div>

        {/* Bottom Navigation - Fixed at bottom, centered with max-w-md */}
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <BottomNavigation 
              onProfileClick={handleProfileClick}
              onComposeClick={handleComposerOpen}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default NewHome
