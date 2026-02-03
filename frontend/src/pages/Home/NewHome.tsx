import { useState } from 'react'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import PrayerComposer from './components/PrayerComposer'
import PrayerDetail from './components/PrayerDetail'
import TodaysVerse from './components/TodaysVerse'
import SortTabs from './components/SortTabs'
import PrayerComposerInput from './components/PrayerComposerInput'
import PrayerFeed from './components/PrayerFeed'
import FloatingActionButton from './components/FloatingActionButton'
import BottomNavigation from './components/BottomNavigation'
import { usePrayersInfinite } from '../../hooks/usePrayersQuery'
import { useAuth } from '../../hooks/useAuth'
import { showToast } from '../../utils/toast'
import type { SortType } from '../../types/prayer'

const NewHome = () => {
  const { requireAuth, requireAuthWithRedirect } = useAuth()
  const [showComposer, setShowComposer] = useState(false)
  const [selectedPrayerId, setSelectedPrayerId] = useState<number | null>(null)
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
      showToast(error instanceof Error ? error.message : '기도 처리에 실패했습니다', 'error')
    }
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
              onPrayerClick={setSelectedPrayerId}
            />
          </main>

          <FloatingActionButton onClick={handleComposerOpen} />
          <BottomNavigation 
            onComposerOpen={handleComposerOpen}
            onProfileClick={handleProfileClick}
          />

          {/* Prayer Composer Modal */}
          {showComposer && (
            <PrayerComposer
              onClose={() => setShowComposer(false)}
              onSuccess={() => {
                prayerHook.refresh()
                setShowComposer(false)
              }}
            />
          )}

          {/* Prayer Detail Modal */}
          {selectedPrayerId && (
            <PrayerDetail
              prayerId={selectedPrayerId}
              initialData={prayerHook.prayers.find(p => p.id === selectedPrayerId)}
              onClose={() => setSelectedPrayerId(null)}
              onDelete={() => {
                setSelectedPrayerId(null)
                prayerHook.refresh()
              }}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default NewHome
