import { useState, useEffect, useRef } from 'react'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import PrayerComposer from './components/PrayerComposer'
import { usePrayersInfinite } from '../../hooks/usePrayersQuery'
import type { Prayer, SortType } from '../../types/prayer'

const NewHome = () => {
  const [showComposer, setShowComposer] = useState(false)
  const [sort, setSort] = useState<SortType>('popular')
  const prayerHook = usePrayersInfinite(sort)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const handleSortChange = (newSort: SortType) => {
    setSort(newSort)
  }

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || prayerHook.loading || !prayerHook.hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !prayerHook.isFetchingMore) {
          prayerHook.loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [prayerHook.loading, prayerHook.hasMore, prayerHook.isFetchingMore])

  return (
    <ErrorBoundary>
      <div className="bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <div className="max-w-md mx-auto min-h-screen bg-background-light dark:bg-background-dark shadow-2xl relative flex flex-col border-x border-border-light dark:border-border-dark">
          
          <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
            {/* Today's Verse Banner */}
            <section className="px-4 py-4 border-b border-border-light dark:border-border-dark">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-5 border border-blue-100/50 dark:border-gray-700/50">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="material-icons-round text-primary text-xl">auto_stories</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">오늘의 말씀</p>
                    <p className="text-sm text-gray-900 dark:text-white leading-relaxed font-medium">
                      "너희 마른 뼈들아, 이제 살아나리라!"
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">에스겔 37:5, 10</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Sort Tabs */}
            <section className="bg-background-light dark:bg-background-dark py-3 px-4 flex items-center justify-between border-b border-border-light dark:border-border-dark sticky top-0 z-40">
              <div className="flex gap-6">
                <button
                  onClick={() => handleSortChange('popular')}
                  className={`text-sm font-bold pb-1.5 -mb-1.5 ${
                    sort === 'popular'
                      ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  인기
                </button>
                <button
                  onClick={() => handleSortChange('latest')}
                  className={`text-sm font-bold pb-1.5 -mb-1.5 ${
                    sort === 'latest'
                      ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  최신
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
                  placeholder="기도 제목을 나눠주세요..."
                  type="text"
                  onClick={() => setShowComposer(true)}
                  readOnly
                />
              </div>
              <button
                onClick={() => setShowComposer(true)}
                className="text-primary font-semibold text-sm"
              >
                작성
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
                  <p className="mt-2 text-sm text-gray-500">기도 요청을 불러오는 중...</p>
                </div>
              )}

              {/* Empty State */}
              {!prayerHook.loading && prayerHook.prayers.length === 0 && (
                <div className="py-12 text-center">
                  <span className="text-6xl mb-4 block">🙏</span>
                  <p className="text-gray-500 dark:text-gray-400">아직 기도 요청이 없습니다</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">첫 번째로 나눠주세요</p>
                </div>
              )}

              {/* Infinite Scroll Trigger */}
              {prayerHook.hasMore && <div ref={loadMoreRef} className="h-10" />}

              {/* Loading More State */}
              {prayerHook.isFetchingMore && (
                <div className="py-4 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
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
              onSuccess={() => {
                prayerHook.refresh()
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
  const [showEnglish, setShowEnglish] = useState(false)

  const handlePray = async () => {
    if (isPraying) return
    setIsPraying(true)
    await onPrayerToggle(prayer.id)
    setIsPraying(false)
  }

  // 영어 번역이 있는지 확인
  const hasTranslation = !!(prayer.title_en && prayer.content_en)
  
  // 현재 표시할 제목과 내용 결정
  const displayTitle = showEnglish && prayer.title_en ? prayer.title_en : prayer.title
  const displayContent = showEnglish && prayer.content_en ? prayer.content_en : prayer.content

  return (
    <article className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark pb-3 mb-2">
      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between">
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
        <div className="flex items-center gap-2">
          {hasTranslation && (
            <button
              onClick={() => setShowEnglish(!showEnglish)}
              className="px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
              title={showEnglish ? '한글로 보기' : 'View in English'}
            >
              {showEnglish ? '🇰🇷 한글' : '🇺🇸 EN'}
            </button>
          )}
          <button className="text-gray-500 dark:text-gray-400">
            <span className="material-icons-outlined">more_horiz</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mb-3">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 border border-indigo-100/50 dark:border-gray-700/50 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-full blur-2xl"></div>
          <h3 className={`text-[10px] font-bold text-primary mb-2 tracking-[0.08em] relative z-10 ${!showEnglish ? 'uppercase' : ''}`}>
            {displayTitle}
          </h3>
          <p className="text-[13px] text-gray-900 dark:text-gray-100 leading-[1.5] relative z-10 font-normal tracking-[-0.01em]">
            {displayContent}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePray}
            disabled={isPraying}
            className={`group flex items-center gap-1 transition-colors ${
              prayer.is_prayed ? 'text-primary' : 'text-gray-800 dark:text-white hover:opacity-70'
            }`}
          >
            <span className={`text-[24px] ${prayer.is_prayed ? 'material-icons-round' : 'material-icons-outlined'}`}>
              volunteer_activism
            </span>
          </button>
          <button className="text-gray-800 dark:text-white hover:opacity-60 transition-opacity">
            <span className="material-icons-outlined text-[22px] transform -scale-x-100">
              chat_bubble_outline
            </span>
          </button>
          <button className="text-gray-800 dark:text-white hover:opacity-60 transition-opacity">
            <span className="material-icons-outlined text-[22px] -rotate-45 mb-1">send</span>
          </button>
        </div>
        <button className="text-gray-800 dark:text-white hover:opacity-60 transition-opacity">
          <span className="material-icons-outlined text-[24px]">bookmark_border</span>
        </button>
      </div>

      {/* Stats */}
      <div className="px-4">
        <div className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">
          {prayer.prayer_count}명이 기도중
        </div>
        {prayer.reply_count > 0 && (
          <button className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            댓글 {prayer.reply_count}개 모두 보기
          </button>
        )}
      </div>
    </article>
  )
}

export default NewHome
