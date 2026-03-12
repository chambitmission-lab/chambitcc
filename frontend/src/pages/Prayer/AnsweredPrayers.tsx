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
    <div className="answered-prayers-page">
      <div className="answered-prayers-container">
        {/* 헤더 */}
        <div className="page-header">
          <div className="header-icon">✨</div>
          <h1>응답의 전당</h1>
          <p>하나님께서 응답하신 기도들</p>
        </div>
        
        {/* 정렬 버튼 */}
        <div className="sort-controls">
          <button
            className={`sort-btn ${sort === 'popular' ? 'active' : ''}`}
            onClick={() => setSort('popular')}
          >
            인기순
          </button>
          <button
            className={`sort-btn ${sort === 'latest' ? 'active' : ''}`}
            onClick={() => setSort('latest')}
          >
            최신순
          </button>
          
          {/* 응답된 기도 개수 */}
          {answeredPrayers.length > 0 && (
            <span className="count-badge">
              ✨ {answeredPrayers.length}개의 응답
            </span>
          )}
        </div>
        
        {/* 기도 목록 */}
        {loading && answeredPrayers.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>응답된 기도를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={() => window.location.reload()}>
              다시 시도
            </button>
          </div>
        ) : answeredPrayers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✨</div>
            <h3>아직 응답된 기도가 없습니다</h3>
            <p>첫 번째 응답 간증을 남겨보세요!</p>
          </div>
        ) : (
          <>
            <div className="answered-prayers-list">
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
              <div className="load-more">
                <button
                  onClick={() => loadMore()}
                  disabled={isFetchingMore}
                  className="load-more-button"
                >
                  {isFetchingMore ? '로딩 중...' : '더 보기'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AnsweredPrayers
