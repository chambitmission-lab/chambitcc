// 기도 요청 상세 페이지 - 메인 컨테이너
import { useState } from 'react'
import { usePrayerDetail } from '../../../../hooks/usePrayersQuery'
import { useReplies, useCreateReply } from '../../../../hooks/useReplies'
import type { Prayer } from '../../../../types/prayer'
import { useTranslation } from './useTranslation'
import { usePrayerDelete } from './usePrayerDelete'
import PrayerDetailModal from './PrayerDetailModal'
import PrayerDetailHeader from './PrayerDetailHeader'
import LoadingState from './LoadingState'
import ErrorState from './ErrorState'
import PrayerAuthorInfo from './PrayerAuthorInfo'
import PrayerContent from './PrayerContent'
import PrayerActions from './PrayerActions'
import PrayerStats from './PrayerStats'
import OwnerBadge from './OwnerBadge'
import RepliesSection from './RepliesSection'
import DeleteConfirmModal from './DeleteConfirmModal'

interface PrayerDetailProps {
  prayerId: number
  initialData?: Prayer
  onClose: () => void
  onDelete?: () => void
}

const PrayerDetail = ({ prayerId, initialData, onClose, onDelete }: PrayerDetailProps) => {
  const { prayer, loading, error, handlePrayerToggle, isToggling } = usePrayerDetail(prayerId, initialData)
  const [showReplies, setShowReplies] = useState(false)

  // 번역 관련
  const {
    toggleTranslation,
    hasTranslation,
    displayTitle,
    displayContent,
    translationButtonText,
  } = useTranslation(prayer || null)

  // 삭제 관련
  const {
    showDeleteConfirm,
    isDeleting,
    setShowDeleteConfirm,
    handleDelete,
  } = usePrayerDelete(prayerId, onClose, onDelete)

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

  const handleReplySubmit = (content: string, displayName: string) => {
    createReply({ content, display_name: displayName })
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

        <div className="p-5">
          <PrayerAuthorInfo
            displayName={prayer.display_name}
            timeAgo={prayer.time_ago}
            hasTranslation={hasTranslation}
            translationButtonText={translationButtonText}
            onTranslationToggle={toggleTranslation}
          />

          <PrayerContent title={displayTitle} content={displayContent} />

          <PrayerActions
            isPrayed={prayer.is_prayed}
            isToggling={isToggling}
            showReplies={showReplies}
            onPrayerToggle={handlePrayerToggle}
            onRepliesToggle={() => setShowReplies(!showReplies)}
          />

          <PrayerStats
            prayerCount={prayer.prayer_count}
            replyCount={prayer.reply_count}
            onPrayerCountClick={handlePrayerToggle}
            onReplyCountClick={() => setShowReplies(true)}
          />

          {prayer.is_owner && <OwnerBadge />}

          {showReplies && (
            <RepliesSection
              replyCount={prayer.reply_count}
              replies={replies}
              isLoading={repliesLoading}
              isCreating={isCreating}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onReplySubmit={handleReplySubmit}
              onLoadMore={fetchNextPage}
            />
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
