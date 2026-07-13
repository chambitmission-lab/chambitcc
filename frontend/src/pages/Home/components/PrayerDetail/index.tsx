// 기도 요청 상세 페이지 - 메인 컨테이너
import { useState, useEffect, useRef } from 'react'
import { usePrayerDetail } from '../../../../hooks/usePrayersQuery'
import { useReplies, useCreateReply, useUpdateReply, useDeleteReply } from '../../../../hooks/useReplies'
import { usePrayerDelete } from '../../../../hooks/usePrayerDelete'
import type { Prayer } from '../../../../types/prayer'
import { useTranslation } from './useTranslation'
import PrayerDetailModal from './PrayerDetailModal'
import PrayerDetailHeader from './PrayerDetailHeader'
import LoadingState from './LoadingState'
import ErrorState from './ErrorState'
import PrayerAuthorInfo from './PrayerAuthorInfo'
import PrayerContent from './PrayerContent'
import PrayerActions from './PrayerActions'
import PrayerStats from './PrayerStats'
import RepliesSection from './RepliesSection'
import DeleteConfirmModal from './DeleteConfirmModal'

interface PrayerDetailProps {
  prayerId: number
  initialData?: Prayer
  onClose: () => void
  onDelete?: () => void
  initialOpenReplies?: boolean
}

const PrayerDetail = ({ prayerId, initialData, onClose, onDelete, initialOpenReplies = false }: PrayerDetailProps) => {
  const { prayer, loading, error, handlePrayerToggle, isToggling } = usePrayerDetail(prayerId, initialData)
  const [showReplies, setShowReplies] = useState(initialOpenReplies)
  const repliesSectionRef = useRef<HTMLDivElement>(null)

  // 브라우저 뒤로가기 처리 - 모달 열림
  useEffect(() => {
    // 모달이 열릴 때 히스토리 엔트리 추가
    window.history.pushState({ modal: 'prayer-detail', replies: false }, '')

    const handlePopState = () => {
      // 댓글이 열려있으면 댓글만 닫기
      if (showReplies) {
        setShowReplies(false)
        // 댓글을 닫았으니 다시 히스토리 엔트리 추가
        window.history.pushState({ modal: 'prayer-detail', replies: false }, '')
      } else {
        // 댓글이 닫혀있으면 모달 전체 닫기
        onClose()
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onClose, showReplies])

  // 댓글 열림/닫힘 상태 변경 시 히스토리 관리 및 스크롤
  useEffect(() => {
    if (showReplies) {
      // 댓글이 열릴 때 히스토리 엔트리 추가
      window.history.pushState({ modal: 'prayer-detail', replies: true }, '')
      
      // 댓글 섹션으로 스크롤 (약간의 딜레이를 주어 렌더링 완료 후 스크롤)
      setTimeout(() => {
        repliesSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)
    }
  }, [showReplies])

  // 번역 관련
  const {
    toggleTranslation,
    hasTranslation,
    showTranslation,
    displayTitle,
    displayContent,
    nextLanguage,
  } = useTranslation(prayer || null)

  // 삭제 관련
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { deletePrayer, isDeleting } = usePrayerDelete({
    onSuccess: () => {
      setShowDeleteConfirm(false)
      onClose()
      onDelete?.()
    },
  })

  const handleDelete = () => {
    deletePrayer(prayerId)
  }

  // 댓글 관련
  const {
    replies,
    isLoading: repliesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReplies({ prayerId })

  const { createReply, isCreating } = useCreateReply({
    prayerId,
    onSuccess: () => {
      setShowReplies(true)
    },
  })

  const { updateReply, isUpdating } = useUpdateReply({ prayerId })
  const { deleteReply } = useDeleteReply({ prayerId })

  const handleReplySubmit = (content: string, displayName: string) => {
    createReply({ content, display_name: displayName })
  }

  const handleReplyUpdate = (replyId: number, content: string) => {
    updateReply({ replyId, content })
  }

  const handleReplyDelete = (replyId: number) => {
    deleteReply(replyId)
  }

  // 로딩 상태
  if (loading) {
    return <LoadingState />
  }

  // 에러 상태
  if (error || !prayer) {
    return <ErrorState error={error || '기도 요청을 찾을 수 없습니다'} onClose={onClose} />
  }

  return (
    <>
      <PrayerDetailModal>
        <PrayerDetailHeader
          isOwner={prayer.is_owner || false}
          onClose={onClose}
          onDeleteClick={() => setShowDeleteConfirm(true)}
        />

        <div className="flex-1 overflow-y-auto p-5">
          <PrayerAuthorInfo
            displayName={prayer.display_name}
            avatarUrl={prayer.avatar_url ?? null}
            timeAgo={prayer.time_ago}
            isOwner={prayer.is_owner || false}
            hasTranslation={hasTranslation}
            showTranslation={showTranslation}
            nextLanguage={nextLanguage}
            onTranslationToggle={toggleTranslation}
          />

          <PrayerContent title={displayTitle} content={displayContent} />

          {/* 통계를 버튼 바로 위에 붙여 "5명이 함께 기도 중 → 나도 기도하기" 흐름으로 */}
          <PrayerStats
            prayerCount={prayer.prayer_count}
            replyCount={prayer.reply_count}
            onReplyCountClick={() => setShowReplies(true)}
          />

          <PrayerActions
            isPrayed={prayer.is_prayed}
            isToggling={isToggling}
            showReplies={showReplies}
            replyCount={prayer.reply_count}
            onPrayerToggle={handlePrayerToggle}
            onRepliesToggle={() => setShowReplies(!showReplies)}
          />

          {showReplies && (
            <div ref={repliesSectionRef}>
              <RepliesSection
                replyCount={prayer.reply_count}
                replies={replies}
                isLoading={repliesLoading}
                isCreating={isCreating}
                isUpdating={isUpdating}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onReplySubmit={handleReplySubmit}
                onReplyUpdate={handleReplyUpdate}
                onReplyDelete={handleReplyDelete}
                onLoadMore={fetchNextPage}
              />
            </div>
          )}
        </div>
      </PrayerDetailModal>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}

export default PrayerDetail
