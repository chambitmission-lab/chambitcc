// 응답의 전당 - 응답된 기도만 보여주는 페이지
import { useState } from 'react'
import { usePrayersInfinite } from '../../hooks/usePrayersQuery'
import PrayerCard from '../../components/prayer/PrayerCard'
import AnswerModal from '../../components/prayer/AnswerModal'
import { useLanguage } from '../../contexts/LanguageContext'
import type { Prayer, SortType } from '../../types/prayer'
import './AnsweredPrayers.css'

const AnsweredPrayers = () => {
  const { t } = useLanguage()
  const [sort, setSort] = useState<SortType>('latest')
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null)

  // 백엔드에 is_answered=true 필터 전달 → 응답된 기도만 페이지네이션으로 받음
  const {
    prayers: answeredPrayers,
    loading,
    error,
    hasMore,
    loadMore,
    isFetchingMore,
    handlePrayerToggle,
    isToggling,
    updatePrayerAnswer,
    cancelPrayerAnswer,
    isAnswering,
  } = usePrayersInfinite(sort, null, 'all', true)

  const handleEditAnswer = (prayerId: number) => {
    const prayer = answeredPrayers.find(p => p.id === prayerId)
    if (prayer) setEditingPrayer(prayer)
  }

  const handleCancelAnswer = async (prayerId: number) => {
    const ok = window.confirm(t('answeredCancelConfirm'))
    if (!ok) return
    try {
      await cancelPrayerAnswer(prayerId)
    } catch {
      // mutation onError에서 toast 처리
    }
  }

  const handleSubmitEdit = async (testimony: string) => {
    if (!editingPrayer) return
    try {
      await updatePrayerAnswer(editingPrayer.id, testimony)
      setEditingPrayer(null)
    } catch {
      // mutation onError에서 toast 처리
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-24 pb-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div 
          className="text-center mb-8 p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(147, 51, 234, 0.25) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.5)',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div 
            className="text-5xl mb-2"
            style={{
              filter: 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.6))',
              animation: 'sparkle 2s ease-in-out infinite'
            }}
          >
            ✨
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{
              color: '#ffffff',
              textShadow: '0 0 10px rgba(168, 85, 247, 0.5), 0 0 20px rgba(168, 85, 247, 0.3)'
            }}
          >
            {t('answeredPageTitle')}
          </h1>
          <p
            className="text-base"
            style={{
              color: '#e5e7eb',
              textShadow: '0 0 8px rgba(168, 85, 247, 0.4)'
            }}
          >
            {t('answeredPageSubtitle')}
          </p>
        </div>
        
        {/* 정렬 버튼 */}
        <div className="flex items-center gap-2 px-4 pb-4 flex-wrap">
          <button
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              sort === 'popular'
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                : 'bg-transparent border-purple-500/30 text-gray-400 hover:bg-purple-500/10'
            }`}
            style={{ border: '1px solid' }}
            onClick={() => setSort('popular')}
          >
            {t('sortPopular')}
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              sort === 'latest'
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                : 'bg-transparent border-purple-500/30 text-gray-400 hover:bg-purple-500/10'
            }`}
            style={{ border: '1px solid' }}
            onClick={() => setSort('latest')}
          >
            {t('sortLatest')}
          </button>
          
          {/* 응답된 기도 개수 */}
          {answeredPrayers.length > 0 && (
            <span 
              className="ml-auto text-xs font-semibold"
              style={{
                color: 'rgb(168, 85, 247)',
                textShadow: '0 0 8px rgba(168, 85, 247, 0.4)'
              }}
            >
              ✨ {answeredPrayers.length}{t('answeredCountSuffix')}
            </span>
          )}
        </div>
        
        {/* 기도 목록 */}
        {loading && answeredPrayers.length === 0 ? (
          <div 
            className="text-center py-16 px-8 rounded-2xl"
            style={{
              background: 'rgba(31, 41, 55, 0.5)',
              border: '1px solid rgba(168, 85, 247, 0.2)'
            }}
          >
            <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">{t('answeredLoading')}</p>
          </div>
        ) : error ? (
          <div 
            className="text-center py-16 px-8 rounded-2xl"
            style={{
              background: 'rgba(31, 41, 55, 0.5)',
              border: '1px solid rgba(168, 85, 247, 0.2)'
            }}
          >
            <p className="text-red-400 mb-4">❌ {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
            >
              {t('retry')}
            </button>
          </div>
        ) : answeredPrayers.length === 0 ? (
          <div 
            className="text-center py-16 px-8 rounded-2xl"
            style={{
              background: 'rgba(31, 41, 55, 0.5)',
              border: '1px solid rgba(168, 85, 247, 0.2)'
            }}
          >
            <div 
              className="text-6xl mb-4"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.3))'
              }}
            >
              ✨
            </div>
            <h3
              className="text-xl mb-2 font-bold"
              style={{
                color: '#ffffff',
                textShadow: '0 0 10px rgba(168, 85, 247, 0.3)'
              }}
            >
              {t('answeredEmptyTitle')}
            </h3>
            <p className="text-gray-400">{t('answeredEmptyDesc')}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {answeredPrayers.map(prayer => (
                <PrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  onPrayerToggle={handlePrayerToggle}
                  onEditAnswer={handleEditAnswer}
                  onCancelAnswer={handleCancelAnswer}
                  isToggling={isToggling}
                  /* 응답의 전당은 모두 응답된 기도이므로 응답 등록 버튼은 안 뜨고
                     수정/취소 버튼만 작성자 본인에게 노출됨 */
                  showAnswerButton={true}
                />
              ))}
            </div>
            
            {/* 더 보기 버튼 */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => loadMore()}
                  disabled={isFetchingMore}
                  className="px-8 py-3.5 bg-transparent text-purple-400 border-2 border-purple-500/30 rounded-lg font-semibold hover:bg-purple-500/10 hover:border-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {isFetchingMore ? t('loading') : t('loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 간증 수정 모달 */}
      <AnswerModal
        isOpen={!!editingPrayer}
        onClose={() => setEditingPrayer(null)}
        onSubmit={handleSubmitEdit}
        prayerTitle={editingPrayer?.title ?? ''}
        initialTestimony={editingPrayer?.testimony}
        isSubmitting={isAnswering}
      />

      <style>{`
        @keyframes sparkle {
          0%, 100% {
            filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 18px rgba(168, 85, 247, 0.9));
          }
        }
      `}</style>
    </div>
  )
}

export default AnsweredPrayers
