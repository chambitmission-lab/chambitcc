// 응답의 전당 - 응답된 기도만 보여주는 페이지
import { useState } from 'react'
import { usePrayersInfinite } from '../../hooks/usePrayersQuery'
import PrayerCard from '../../components/prayer/PrayerCard'
import type { SortType } from '../../types/prayer'
import './AnsweredPrayers.css'

const AnsweredPrayers = () => {
  const [sort, setSort] = useState<SortType>('latest')
  
  const {
    prayers,
    loading,
    error,
    hasMore,
    loadMore,
    isFetchingMore,
    handlePrayerToggle,
    isToggling,
  } = usePrayersInfinite(sort, null, 'all')
  
  // 응답된 기도만 필터링 (백엔드 연동 전 임시)
  const answeredPrayers = prayers.filter(prayer => prayer.is_answered)
  
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
            응답의 전당
          </h1>
          <p 
            className="text-base"
            style={{
              color: '#e5e7eb',
              textShadow: '0 0 8px rgba(168, 85, 247, 0.4)'
            }}
          >
            하나님께서 응답하신 기도들
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
            인기순
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
            최신순
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
              ✨ {answeredPrayers.length}개의 응답
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
            <p className="text-white">응답된 기도를 불러오는 중...</p>
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
              다시 시도
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
              아직 응답된 기도가 없습니다
            </h3>
            <p className="text-gray-400">첫 번째 응답 간증을 남겨보세요!</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {answeredPrayers.map(prayer => (
                <PrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  onPrayerToggle={handlePrayerToggle}
                  isToggling={isToggling}
                  showAnswerButton={false}
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
                  {isFetchingMore ? '로딩 중...' : '더 보기'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
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
