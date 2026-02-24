// 기도 목록 페이지 (소그룹 기능 포함)
import { useState } from 'react'
import { usePrayersInfinite } from '../../hooks/usePrayersQuery'
import GroupFilter from '../../components/prayer/GroupFilter'
import { CreateGroupModal, JoinGroupModal } from '../../components/prayer/GroupModals'
import PrayerComposer from '../../components/prayer/PrayerComposer'
import PrayerCard from '../../components/prayer/PrayerCard'
import type { SortType, PrayerFilterType } from '../../types/prayer'
import './PrayerList.css'

const PrayerList = () => {
  const [sort, setSort] = useState<SortType>('popular')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<PrayerFilterType>('all')
  const [showComposer, setShowComposer] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  
  const {
    prayers,
    loading,
    error,
    hasMore,
    loadMore,
    isFetchingMore,
    handlePrayerToggle,
    isToggling,
    createPrayer,
    isCreating,
  } = usePrayersInfinite(sort, selectedGroupId, selectedFilter)
  
  const handleCreatePrayer = async (data: any) => {
    // 선택된 그룹이 있으면 group_id 추가
    const prayerData = {
      ...data,
      group_id: selectedGroupId,
    }
    await createPrayer(prayerData)
    setShowComposer(false)
  }
  
  return (
    <div className="prayer-list-page">
      <div className="prayer-list-container">
        {/* 헤더 */}
        <div className="page-header">
          <h1>기도 나눔</h1>
          <p>함께 기도하며 서로를 격려해요</p>
        </div>
        
        {/* 그룹 필터 */}
        <GroupFilter
          selectedGroupId={selectedGroupId}
          selectedFilter={selectedFilter}
          onGroupChange={setSelectedGroupId}
          onFilterChange={setSelectedFilter}
          onCreateGroup={() => setShowCreateModal(true)}
          onJoinGroup={() => setShowJoinModal(true)}
        />
        
        {/* 정렬 & 작성 버튼 */}
        <div className="list-controls">
          <div className="sort-buttons">
            <button
              className={`sort-button ${sort === 'popular' ? 'active' : ''}`}
              onClick={() => setSort('popular')}
            >
              인기순
            </button>
            <button
              className={`sort-button ${sort === 'latest' ? 'active' : ''}`}
              onClick={() => setSort('latest')}
            >
              최신순
            </button>
          </div>
          
          <button
            className="compose-button"
            onClick={() => setShowComposer(!showComposer)}
          >
            {showComposer ? '취소' : '+ 기도 요청하기'}
          </button>
        </div>
        
        {/* 기도 작성 폼 */}
        {showComposer && (
          <PrayerComposer
            onSubmit={handleCreatePrayer}
            isSubmitting={isCreating}
            initialGroupId={selectedGroupId}
          />
        )}
        
        {/* 기도 목록 */}
        {loading && prayers.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>기도 목록을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={() => window.location.reload()}>
              다시 시도
            </button>
          </div>
        ) : prayers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🙏</div>
            <h3>아직 기도 요청이 없습니다</h3>
            <p>첫 번째 기도 요청을 올려보세요!</p>
            <button
              className="compose-button"
              onClick={() => setShowComposer(true)}
            >
              기도 요청하기
            </button>
          </div>
        ) : (
          <>
            <div className="prayer-list">
              {prayers.map(prayer => (
                <PrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  onPrayerToggle={handlePrayerToggle}
                  isToggling={isToggling}
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
      
      {/* 모달들 */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <JoinGroupModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </div>
  )
}

export default PrayerList
