import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import PrayerComposer from './components/PrayerComposer'
import PrayerDetail from './components/PrayerDetail'
import { usePrayersInfinite } from '../../hooks/usePrayersQuery'
import { showToast } from '../../utils/toast'
import type { Prayer, SortType } from '../../types/prayer'

const NewHome = () => {
  const navigate = useNavigate()
  const [showComposer, setShowComposer] = useState(false)
  const [selectedPrayerId, setSelectedPrayerId] = useState<number | null>(null)
  const [sort, setSort] = useState<SortType>('popular')
  const prayerHook = usePrayersInfinite(sort)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const handleSortChange = (newSort: SortType) => {
    setSort(newSort)
  }

  // 기도 작성 버튼 클릭 핸들러 (로그인 체크)
  const handleComposerOpen = () => {
    const isLoggedIn = !!localStorage.getItem('access_token')
    if (!isLoggedIn) {
      showToast('로그인이 필요합니다', 'error')
      return
    }
    setShowComposer(true)
  }

  // 프로필 버튼 클릭 핸들러 (로그인 체크)
  const handleProfileClick = () => {
    const isLoggedIn = !!localStorage.getItem('access_token')
    if (!isLoggedIn) {
      showToast('로그인 후 사용할 수 있습니다', 'info')
      navigate('/login')
      return
    }
    navigate('/profile')
  }

  // 기도 토글 핸들러 with 토스트 메시지
  const handlePrayerToggle = async (prayerId: number) => {
    try {
      await prayerHook.handlePrayerToggle(prayerId)
      // 성공 메시지는 usePrayerToggle 훅에서 처리
    } catch (error) {
      showToast(error instanceof Error ? error.message : '기도 처리에 실패했습니다', 'error')
    }
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
                  onClick={handleComposerOpen}
                  readOnly
                />
              </div>
              <button
                onClick={handleComposerOpen}
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
                  onPrayerToggle={handlePrayerToggle}
                  onClick={() => setSelectedPrayerId(prayer.id)}
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
              onClick={handleComposerOpen}
              className="w-14 h-14 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center text-white hover:scale-105 transition-all active:scale-95"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          {/* Bottom Navigation */}
          <nav className="sticky bottom-0 bg-background-light dark:bg-background-dark border-t border-border-light dark:border-border-dark h-[84px] pb-5 px-6 flex justify-between items-center z-50">
            {/* Home */}
            <button className="flex flex-col items-center justify-center w-10 text-gray-900 dark:text-white transition-all hover:opacity-60">
              <svg className="w-[27px] h-[27px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 23h-6.001a1 1 0 0 1-1-1v-5.455a2.997 2.997 0 1 0-5.993 0V22a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V11.543a1.002 1.002 0 0 1 .31-.724l10-9.543a1.001 1.001 0 0 1 1.38 0l10 9.543a1.002 1.002 0 0 1 .31.724V22a1 1 0 0 1-1 1Z"/>
              </svg>
            </button>
            
            {/* Search */}
            <button className="flex flex-col items-center justify-center w-10 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all">
              <svg className="w-[27px] h-[27px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                <circle cx="10.5" cy="10.5" r="7.5"/>
                <line x1="16.5" y1="16.5" x2="22" y2="22"/>
              </svg>
            </button>
            
            {/* Add/Create */}
            <button
              onClick={handleComposerOpen}
              className="flex flex-col items-center justify-center w-10 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              <svg className="w-[27px] h-[27px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </button>
            
            {/* Likes/Favorites */}
            <button className="flex flex-col items-center justify-center w-10 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all">
              <svg className="w-[27px] h-[27px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            
            {/* Profile */}
            <button 
              onClick={handleProfileClick}
              className="flex flex-col items-center justify-center w-10 transition-all hover:opacity-80"
            >
              <div className="w-[27px] h-[27px] rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                <svg className="w-[16px] h-[16px]" fill="white" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
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

// Prayer Article Component
interface PrayerArticleProps {
  prayer: Prayer
  onPrayerToggle: (prayerId: number) => void
  onClick: () => void
}

const PrayerArticle = ({ prayer, onPrayerToggle, onClick }: PrayerArticleProps) => {
  const [isPraying, setIsPraying] = useState(false)
  const [showEnglish, setShowEnglish] = useState(false)

  const handlePray = async (e: React.MouseEvent) => {
    e.stopPropagation() // 카드 클릭 이벤트 방지
    if (isPraying) return
    setIsPraying(true)
    try {
      await onPrayerToggle(prayer.id)
    } finally {
      setIsPraying(false)
    }
  }

  // 영어 번역이 있는지 확인
  const hasTranslation = !!(prayer.title_en && prayer.content_en)
  
  // 현재 표시할 제목과 내용 결정
  const displayTitle = showEnglish && prayer.title_en ? prayer.title_en : prayer.title
  const displayContent = showEnglish && prayer.content_en ? prayer.content_en : prayer.content

  return (
    <article 
      className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark pb-3 mb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
      onClick={onClick}
    >
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
              onClick={(e) => {
                e.stopPropagation()
                setShowEnglish(!showEnglish)
              }}
              className="px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
              title={showEnglish ? '한글로 보기' : 'View in English'}
            >
              {showEnglish ? '🇰🇷 한글' : '🇺🇸 EN'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mb-3">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 border border-indigo-100/50 dark:border-gray-700/50 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-full blur-2xl"></div>
          <h3 className={`text-base font-bold text-primary mb-2.5 tracking-[0.02em] relative z-10 ${!showEnglish ? 'uppercase' : ''}`}>
            {displayTitle}
          </h3>
          <p className="text-[15px] text-gray-900 dark:text-gray-100 leading-[1.7] relative z-10 font-normal tracking-[-0.01em]">
            {displayContent}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 flex items-center gap-3 mb-2">
        <button
          onClick={handlePray}
          disabled={isPraying}
          className={`group flex items-center gap-1 transition-colors ${
            prayer.is_prayed ? 'text-ig-red' : 'text-gray-800 dark:text-white hover:opacity-70'
          }`}
        >
          <span className={`text-[24px] ${prayer.is_prayed ? 'material-icons-round' : 'material-icons-outlined'}`}>
            volunteer_activism
          </span>
        </button>
      </div>

      {/* Stats - 한 줄로 통합 */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-gray-900 dark:text-white">
            {prayer.prayer_count}명이 기도중
          </span>
          {prayer.reply_count > 0 && (
            <>
              <span className="text-gray-400 dark:text-gray-600">·</span>
              <button 
                onClick={(e) => e.stopPropagation()}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                댓글 {prayer.reply_count}개
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export default NewHome
