import { useState } from 'react'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import PrayerComposer from './components/PrayerComposer'
import { usePrayers } from '../../hooks/usePrayers'
import type { Prayer, SortType } from '../../types/prayer'

const NewHome = () => {
  const [showComposer, setShowComposer] = useState(false)
  const [sort, setSort] = useState<SortType>('popular')
  const prayerHook = usePrayers(sort)

  const handleSortChange = (newSort: SortType) => {
    setSort(newSort)
    prayerHook.changeSort(newSort)
  }

  return (
    <ErrorBoundary>
      <div className="bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <div className="max-w-md mx-auto min-h-screen bg-background-light dark:bg-background-dark shadow-2xl relative flex flex-col border-x border-border-light dark:border-border-dark">
          
          <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
            {/* Story Section */}
            <section className="pt-3 pb-2 border-b border-border-light dark:border-border-dark">
              <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-2">
                {/* Your Prayer Story */}
                <div className="flex flex-col items-center gap-1 min-w-[72px]">
                  <div className="w-[68px] h-[68px] rounded-full p-[2px] relative cursor-pointer">
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                      <span className="text-2xl">🙏</span>
                    </div>
                    <div className="absolute bottom-0 right-0 bg-primary text-white text-[14px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-black shadow-sm font-bold leading-none pb-0.5">
                      +
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Your Prayer</span>
                </div>

                {/* Category Stories */}
                {[
                  { name: 'Health', emoji: '💊', active: true },
                  { name: 'Family', emoji: '👨‍👩‍👧‍👦', active: true },
                  { name: 'Work', emoji: '💼', active: false },
                  { name: 'Peace', emoji: '☮️', active: false },
                ].map((category) => (
                  <div key={category.name} className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer group">
                    <div className={`w-[68px] h-[68px] rounded-full p-[2px] ${category.active ? 'story-ring-gradient' : 'bg-gray-200 dark:bg-gray-700'} ${category.active ? 'group-hover:scale-105' : ''} transition-transform duration-200`}>
                      <div className="w-full h-full bg-white dark:bg-black rounded-full p-[2px] flex items-center justify-center">
                        <span className={`text-3xl ${!category.active && 'filter grayscale opacity-50'}`}>
                          {category.emoji}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${category.active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Sort Tabs */}
            <section className="bg-background-light dark:bg-background-dark py-3 px-4 flex items-center justify-between border-b border-border-light dark:border-border-dark sticky top-14 z-40">
              <div className="flex gap-6">
                <button
                  onClick={() => handleSortChange('popular')}
                  className={`text-sm font-bold pb-1.5 -mb-1.5 ${
                    sort === 'popular'
                      ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  Popular
                </button>
                <button
                  onClick={() => handleSortChange('latest')}
                  className={`text-sm font-bold pb-1.5 -mb-1.5 ${
                    sort === 'latest'
                      ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  Latest
                </button>
                <button className="text-sm font-medium text-gray-400 dark:text-gray-500 pb-1.5 hover:text-gray-600 dark:hover:text-gray-300">
                  My Feed
                </button>
              </div>
            </section>

            {/* Prayer Composer Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <div className="flex-1">
                <input
                  className="w-full bg-surface-light dark:bg-surface-dark border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-primary dark:text-white placeholder-gray-500"
                  placeholder="Share a prayer request..."
                  type="text"
                  onClick={() => setShowComposer(true)}
                  readOnly
                />
              </div>
              <button
                onClick={() => setShowComposer(true)}
                className="text-primary font-semibold text-sm"
              >
                Post
              </button>
            </div>

            {/* Prayer Feed */}
            <div className="flex flex-col">
              {prayerHook.prayers.map((prayer) => (
                <PrayerArticle
                  key={prayer.id}
                  prayer={prayer}
                  onPrayerToggle={prayerHook.handlePrayerToggle}
                />
              ))}

              {/* Loading State */}
              {prayerHook.loading && (
                <div className="py-8 text-center">
                  <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading prayers...</p>
                </div>
              )}

              {/* Empty State */}
              {!prayerHook.loading && prayerHook.prayers.length === 0 && (
                <div className="py-12 text-center">
                  <span className="text-6xl mb-4 block">🙏</span>
                  <p className="text-gray-500 dark:text-gray-400">No prayers yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to share</p>
                </div>
              )}
            </div>
          </main>

          {/* Floating Action Button */}
          <div className="absolute bottom-24 right-5 md:hidden z-40">
            <button
              onClick={() => setShowComposer(true)}
              className="w-14 h-14 bg-primary rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center text-white hover:bg-blue-600 transition-all transform hover:scale-105 active:scale-95"
            >
              <span className="material-icons-outlined text-2xl">edit</span>
            </button>
          </div>

          {/* Bottom Navigation */}
          <nav className="sticky bottom-0 bg-background-light dark:bg-background-dark border-t border-border-light dark:border-border-dark h-[84px] pb-5 px-6 flex justify-between items-center z-50">
            <button className="flex flex-col items-center justify-center w-10 text-gray-900 dark:text-white">
              <span className="material-icons-round text-[30px]">home</span>
            </button>
            <button className="flex flex-col items-center justify-center w-10 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <span className="material-icons-outlined text-[30px]">search</span>
            </button>
            <button
              onClick={() => setShowComposer(true)}
              className="flex flex-col items-center justify-center w-10 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span className="material-icons-outlined text-[30px]">add_box</span>
            </button>
            <button className="flex flex-col items-center justify-center w-10 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <span className="material-icons-outlined text-[30px]">favorite_border</span>
            </button>
            <button className="flex flex-col items-center justify-center w-10">
              <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                <span className="text-xs">👤</span>
              </div>
            </button>
          </nav>

          {/* Prayer Composer Modal */}
          {showComposer && (
            <PrayerComposer
              onClose={() => setShowComposer(false)}
              onSuccess={(newPrayer) => {
                prayerHook.addPrayer(newPrayer)
                setShowComposer(false)
              }}
              fingerprint={prayerHook.fingerprint}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

// Prayer Article Component
interface PrayerArticleProps {
  prayer: Prayer
  onPrayerToggle: (prayerId: number) => void
}

const PrayerArticle = ({ prayer, onPrayerToggle }: PrayerArticleProps) => {
  const [isPraying, setIsPraying] = useState(false)

  const handlePray = async () => {
    if (isPraying) return
    setIsPraying(true)
    await onPrayerToggle(prayer.id)
    setIsPraying(false)
  }

  return (
    <article className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark pb-2">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-black">
            {prayer.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">
              {prayer.display_name}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {prayer.time_ago}
            </span>
          </div>
        </div>
        <button className="text-gray-500 dark:text-gray-400">
          <span className="material-icons-outlined">more_horiz</span>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 mb-3">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 border border-indigo-100/50 dark:border-gray-700/50 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-full blur-3xl"></div>
          <h3 className="text-[11px] font-bold text-primary mb-3 uppercase tracking-[0.1em] relative z-10">
            {prayer.title}
          </h3>
          <p className="text-[15px] text-gray-900 dark:text-gray-100 leading-[1.7] relative z-10 font-normal tracking-[-0.02em]">
            {prayer.content}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePray}
            disabled={isPraying}
            className={`group flex items-center gap-1 transition-colors ${
              prayer.is_prayed ? 'text-primary' : 'text-gray-800 dark:text-white hover:opacity-70'
            }`}
          >
            <span className={`text-[28px] ${prayer.is_prayed ? 'material-icons-round' : 'material-icons-outlined'}`}>
              volunteer_activism
            </span>
          </button>
          <button className="text-gray-800 dark:text-white hover:opacity-60 transition-opacity">
            <span className="material-icons-outlined text-[26px] transform -scale-x-100">
              chat_bubble_outline
            </span>
          </button>
          <button className="text-gray-800 dark:text-white hover:opacity-60 transition-opacity">
            <span className="material-icons-outlined text-[26px] -rotate-45 mb-1">send</span>
          </button>
        </div>
        <button className="text-gray-800 dark:text-white hover:opacity-60 transition-opacity">
          <span className="material-icons-outlined text-[28px]">bookmark_border</span>
        </button>
      </div>

      {/* Stats */}
      <div className="px-4">
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {prayer.prayer_count} praying
        </div>
        {prayer.reply_count > 0 && (
          <button className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            View all {prayer.reply_count} comments
          </button>
        )}
        <div className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide">
          {prayer.time_ago}
        </div>
      </div>
    </article>
  )
}

export default NewHome
