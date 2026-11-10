// 기도 요청 상세 페이지 - 메인 컨테이너 (데이터·변경만 맡고, 화면은 PrayerDetailView 가 그린다)
import { useState } from 'react'
import { usePrayerDetail } from '../../../../hooks/usePrayersQuery'
import { useReplies, useCreateReply, useUpdateReply, useDeleteReply } from '../../../../hooks/useReplies'
import { usePrayerDelete } from '../../../../hooks/usePrayerDelete'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import type { Prayer } from '../../../../types/prayer'
import { useTranslation } from './useTranslation'
import PrayerDetailView from './PrayerDetailView'
import LoadingState from './LoadingState'
import ErrorState from './ErrorState'
import DeleteConfirmModal from './DeleteConfirmModal'
import { toastFeedback, showToast } from '../../../../utils/toast'
import { confirmDialog } from '../../../../utils/confirmDialog'
import { usePrayerVisibility } from '../../../../hooks/usePrayerVisibility'
import { prayerToastFeedback } from '../../../../components/prayer/prayerFeedback'
import { can } from '../../../../utils/access'
import { useLanguage } from '../../../../contexts/LanguageContext'

interface PrayerDetailProps {
  prayerId: number
  initialData?: Prayer
  onClose: () => void
  onDelete?: () => void
  /** 나만 보기 기도를 전체 공개로 전환 */
  onMakePublic?: (prayerId: number) => void
  initialOpenReplies?: boolean
}

const PrayerDetail = ({ prayerId, initialData, onClose, onDelete, onMakePublic, initialOpenReplies = false }: PrayerDetailProps) => {
  const { t } = useLanguage()
  const { prayer, loading, error, handlePrayerToggle, isToggling } = usePrayerDetail(prayerId, initialData, prayerToastFeedback)

  // 브라우저/안드로이드 뒤로가기: 모달을 닫는다 (댓글은 항상 펼쳐져 있어 별도 단계 없음)
  useModalBackButton(onClose)

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
    feedback: toastFeedback<{ message?: string }, number>({
      success: (data) => data.message || '기도 요청이 삭제되었습니다.',
      error: '기도 요청 삭제에 실패했습니다.',
    }),
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

  const { createReply, isCreating } = useCreateReply({ prayerId, feedback: toastFeedback<{ message?: string }>({ success: (response) => response.message, error: '댓글 등록에 실패했습니다' }) })

  const { updateReply, isUpdating } = useUpdateReply({ prayerId, feedback: toastFeedback<{ message?: string }>({ success: (response) => response.message, error: '댓글 수정에 실패했습니다' }) })
  const { deleteReply } = useDeleteReply({ prayerId, feedback: toastFeedback<{ message?: string }>({ success: (response) => response.message, error: '댓글 삭제에 실패했습니다' }) })

  const handleReplySubmit = (content: string, displayName: string) => {
    createReply({ content, display_name: displayName })
  }

  const handleReplyUpdate = (replyId: number, content: string) => {
    updateReply({ replyId, content })
  }

  const handleReplyDelete = (replyId: number) => {
    deleteReply(replyId)
  }

  // 나만 보기 ↔ 목사님과 함께 — 둘 다 성도 피드에는 없는 글이라 이 화면 안에서 끝난다
  // (전체 공개 전환은 피드 갱신이 걸려 있어 호출부의 onMakePublic 이 맡는다)
  const { setVisibility, isUpdating: isSwitchingVisibility } = usePrayerVisibility({
    onError: (err) => showToast(err.message, 'error'),
  })
  const handleShareWithPastor = async () => {
    const ok = await confirmDialog({
      title: t('sharePrayerWithPastorTitle'),
      message: t('sharePrayerWithPastorMessage'),
      description: t('sharePrayerWithPastorDescription'),
      confirmText: t('sharePrayerWithPastorConfirm'),
      cancelText: t('cancel'),
    })
    if (!ok) return
    try {
      await setVisibility(prayerId, true, true)
      showToast(t('prayerSharedWithPastor'), 'success')
    } catch {
      // onError 토스트
    }
  }
  const handleUnshareWithPastor = async () => {
    try {
      await setVisibility(prayerId, true, false)
      showToast(t('prayerUnsharedWithPastor'), 'success')
    } catch {
      // onError 토스트
    }
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
  const isAdminDelete = !isOwner && can('community:moderate')

  return (
    <>
      <PrayerDetailView
        prayer={prayer}
        displayTitle={displayTitle}
        displayContent={displayContent}
        hasTranslation={hasTranslation}
        showTranslation={showTranslation}
        nextLanguage={nextLanguage}
        onTranslationToggle={toggleTranslation}
        canDelete={isOwner || isAdminDelete}
        onClose={onClose}
        onDeleteClick={() => setShowDeleteConfirm(true)}
        isToggling={isToggling}
        onPrayerToggle={handlePrayerToggle}
        replies={replies}
        repliesLoading={repliesLoading}
        isCreating={isCreating}
        isUpdating={isUpdating}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onReplySubmit={handleReplySubmit}
        onReplyUpdate={handleReplyUpdate}
        onReplyDelete={handleReplyDelete}
        onLoadMore={fetchNextPage}
        onMakePublic={onMakePublic}
        onShareWithPastor={handleShareWithPastor}
        onUnshareWithPastor={handleUnshareWithPastor}
        isSwitchingVisibility={isSwitchingVisibility}
        initialOpenReplies={initialOpenReplies}
      />

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
