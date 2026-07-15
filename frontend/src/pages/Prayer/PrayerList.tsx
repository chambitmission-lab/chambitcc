// 기도 목록 페이지 (소그룹 기능 포함)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrayersInfinite } from '../../hooks/usePrayersQuery'
import GroupFilter from '../../components/prayer/GroupFilter'
import { CreateGroupModal, JoinGroupModal } from '../../components/prayer/GroupModals'
import AnswerModal from '../../components/prayer/AnswerModal'
import PrayerCard from '../../components/prayer/PrayerCard'
import type { SortType, PrayerFilterType, Prayer } from '../../types/prayer'
import './PrayerList.css'

const PrayerList = () => {
  const navigate = useNavigate()
  const [sort, setSort] = useState<SortType>('popular')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<PrayerFilterType>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null)
  
  const {
    prayers,
    loading,
    error,
    hasMore,
    loadMore,
    isFetchingMore,
    handlePrayerToggle,
    isToggling,
    answerPrayer,
    updatePrayerAnswer,
    cancelPrayerAnswer,
    isAnswering,
  } = usePrayersInfinite(sort, selectedGroupId, selectedFilter)

  // 댓글 클릭 → 홈의 기도 상세 모달을 댓글 열린 상태로 연다
  const handleReplyClick = (prayerId: number) => {
    navigate('/', { state: { openPrayerId: prayerId, openReplies: true } })
  }

  const handleAnswerToggle = (prayerId: number) => {
    const prayer = prayers.find(p => p.id === prayerId)
    if (prayer) {
      setSelectedPrayer(prayer)
      setShowAnswerModal(true)
    }
  }

  // 응답된 기도의 간증 수정 진입점 (응답된 기도에서만 호출됨)
  const handleEditAnswer = (prayerId: number) => {
    const prayer = prayers.find(p => p.id === prayerId)
    if (prayer) {
      setSelectedPrayer(prayer)
      setShowAnswerModal(true)
    }
  }

  // 응답 등록 취소
  const handleCancelAnswer = async (prayerId: number) => {
    const ok = window.confirm('응답 등록을 취소하시겠습니까? 등록한 간증이 삭제됩니다.')
    if (!ok) return
    try {
      await cancelPrayerAnswer(prayerId)
    } catch {
      // mutation onError에서 toast 처리됨
    }
  }

  const handleAnswerSubmit = async (testimony: string) => {
    if (!selectedPrayer) return
    try {
      // 이미 응답된 기도면 수정, 아니면 신규 등록
      if (selectedPrayer.is_answered) {
        await updatePrayerAnswer(selectedPrayer.id, testimony)
      } else {
        await answerPrayer(selectedPrayer.id, testimony)
      }
      // 성공 시 모달 닫기 (실패 시에는 사용자가 다시 시도할 수 있도록 열어둠)
      setShowAnswerModal(false)
      setSelectedPrayer(null)
    } catch {
      // mutation의 onError에서 toast 처리됨
    }
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
        
        {/* 정렬 버튼만 (슬림하게) */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              className={`
                px-3 py-1.5 text-xs font-medium rounded-full transition-all
                ${sort === 'popular' 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
              onClick={() => setSort('popular')}
            >
              인기순
            </button>
            <button
              className={`
                px-3 py-1.5 text-xs font-medium rounded-full transition-all
                ${sort === 'latest' 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
              onClick={() => setSort('latest')}
            >
              최신순
            </button>
          </div>
          
          {/* 기도 개수 표시 */}
          {prayers.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {prayers.length}개의 기도
            </span>
          )}
        </div>
        
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              하단의 + 버튼을 눌러 기도를 작성해보세요
            </p>
          </div>
        ) : (
          <>
            <div className="prayer-list">
              {prayers.map(prayer => (
                <PrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  onPrayerToggle={handlePrayerToggle}
                  onReplyClick={handleReplyClick}
                  onAnswerToggle={handleAnswerToggle}
                  onEditAnswer={handleEditAnswer}
                  onCancelAnswer={handleCancelAnswer}
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
      <AnswerModal
        isOpen={showAnswerModal}
        onClose={() => {
          setShowAnswerModal(false)
          setSelectedPrayer(null)
        }}
        onSubmit={handleAnswerSubmit}
        prayerTitle={selectedPrayer?.title || ''}
        initialTestimony={selectedPrayer?.is_answered ? selectedPrayer?.testimony : undefined}
        isSubmitting={isAnswering}
      />
    </div>
  )
}

export default PrayerList
