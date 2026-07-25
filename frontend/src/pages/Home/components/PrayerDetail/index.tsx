// 기도 요청 상세 페이지 - 메인 컨테이너
import { useState, useEffect, useRef } from 'react'
import { usePrayerDetail } from '../../../../hooks/usePrayersQuery'
import { useReplies, useCreateReply, useUpdateReply, useDeleteReply } from '../../../../hooks/useReplies'
import { usePrayerDelete } from '../../../../hooks/usePrayerDelete'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { isAdmin } from '../../../../utils/auth'
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
  const repliesSectionRef = useRef<HTMLDivElement>(null)

  // 브라우저/안드로이드 뒤로가기: 모달을 닫는다 (댓글은 항상 펼쳐져 있어 별도 단계 없음)
  useModalBackButton(onClose)

  // 댓글 섹션으로 스크롤 (약간의 딜레이를 주어 렌더링 완료 후 스크롤)
  const scrollToReplies = () => {
    setTimeout(() => {
      repliesSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)
  }

  // 피드에서 댓글 아이콘으로 진입한 경우 댓글 위치로 바로 이동
  useEffect(() => {
    if (initialOpenReplies) {
      scrollToReplies()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const { createReply, isCreating } = useCreateReply({ prayerId })

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

  // 관리자는 부적절한 글을 즉시 정리할 수 있도록 남의 글에도 삭제 버튼 노출 (백엔드도 is_admin 허용)
  const isOwner = prayer.is_owner || false
  const isAdminDelete = !isOwner && isAdmin()

  return (
    <>
      <PrayerDetailModal>
        <PrayerDetailHeader
          canDelete={isOwner || isAdminDelete}
          onClose={onClose}
          onDeleteClick={() => setShowDeleteConfirm(true)}
        />

        <div className="flex-1 overflow-y-auto p-5">
          <PrayerAuthorInfo
            prayerId={prayer.id}
            displayName={prayer.display_name}
            avatarUrl={prayer.avatar_url ?? null}
            timeAgo={prayer.time_ago}
            isOwner={isOwner}
            hasTranslation={hasTranslation}
            showTranslation={showTranslation}
            nextLanguage={nextLanguage}
            onTranslationToggle={toggleTranslation}
          />

          <PrayerContent title={displayTitle} content={displayContent} />

          <PrayerStats prayerCount={prayer.prayer_count} />

          {/* 댓글은 토글 없이 항상 인라인 — 짧은 글일 때 하단이 텅 비지 않고
              댓글·입력창이 자연스럽게 이어져 화면을 채운다 */}
          <div ref={repliesSectionRef} className="scroll-mt-2">
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
        </div>

        {/* 하단 고정 액션 바 — 짧은 글에서도 버튼이 어중간한 높이에 뜨지 않고
            항상 엄지 존에 머문다. 설치형 PWA 홈 인디케이터 영역만큼 safe-area 패딩 */}
        <div className="shrink-0 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-black/[0.06] dark:border-white/[0.08] bg-background-light dark:bg-background-dark">
          <PrayerActions
            isPrayed={prayer.is_prayed}
            isToggling={isToggling}
            replyCount={prayer.reply_count}
            onPrayerToggle={handlePrayerToggle}
            onCommentClick={scrollToReplies}
          />
        </div>
      </PrayerDetailModal>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          isAdminDelete={isAdminDelete}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}

export default PrayerDetail
