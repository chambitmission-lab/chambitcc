// 기도 요청 상세 페이지
import { useState } from 'react'
import { usePrayerDetail } from '../../../hooks/usePrayersQuery'
import { useReplies, useCreateReply } from '../../../hooks/useReplies'
import { deletePrayer } from '../../../api/prayer'
import ReplyList from '../../../components/common/ReplyList'
import ReplyComposer from '../../../components/common/ReplyComposer'
import { showToast } from '../../../utils/toast'

interface PrayerDetailProps {
  prayerId: number
  onClose: () => void
  onDelete?: () => void
}

const PrayerDetail = ({ prayerId, onClose, onDelete }: PrayerDetailProps) => {
  const { prayer, loading, error, handlePrayerToggle, isToggling } = usePrayerDetail(prayerId)
  const [showEnglish, setShowEnglish] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 댓글 관련 훅
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

  const handleDelete = async () => {
    if (isDeleting) return

    try {
      setIsDeleting(true)
      const result = await deletePrayer(prayerId)
      showToast(result.message || '기도 요청이 삭제되었습니다', 'success')
      onClose()
      onDelete?.()
    } catch (err: any) {
      console.error('기도 요청 삭제 실패:', err)
      showToast(err.message || '기도 요청 삭제에 실패했습니다', 'error')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">기도 요청을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !prayer) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || '기도 요청을 찾을 수 없습니다'}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const hasTranslation = !!(prayer.title_en && prayer.content_en)
  const displayTitle = showEnglish && prayer.title_en ? prayer.title_en : prayer.title
  const displayContent = showEnglish && prayer.content_en ? prayer.content_en : prayer.content

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">기도 요청 상세</h2>
          <div className="flex items-center gap-2">
            {prayer?.is_owner && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="삭제"
              >
                <span className="material-icons-outlined text-[22px] text-gray-700 dark:text-gray-300">more_horiz</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="material-icons-outlined text-[22px] text-gray-500 dark:text-gray-400">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Author Info */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-base font-semibold shadow-md">
                {prayer.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{prayer.display_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{prayer.time_ago}</p>
              </div>
            </div>
            {hasTranslation && (
              <button
                onClick={() => setShowEnglish(!showEnglish)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {showEnglish ? '🇰🇷 한글' : '🇺🇸 English'}
              </button>
            )}
          </div>

          {/* Prayer Content */}
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-gray-800/50 dark:to-gray-800/50 rounded-xl p-5 mb-5 border border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              {displayTitle}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {displayContent}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handlePrayerToggle}
              disabled={isToggling}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                prayer.is_prayed
                  ? 'bg-ig-red text-white shadow-md shadow-red-200 dark:shadow-red-900/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className={`text-xl ${prayer.is_prayed ? 'material-icons-round' : 'material-icons-outlined'}`}>
                volunteer_activism
              </span>
              <span>{prayer.is_prayed ? '기도중' : '기도하기'}</span>
            </button>
            <button
              onClick={() => setShowReplies(!showReplies)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                showReplies
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="material-icons-outlined text-xl transform -scale-x-100">chat_bubble_outline</span>
              <span>댓글</span>
            </button>
          </div>

          {/* Stats - 버튼 바로 아래 */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-5 px-1">
            <button 
              onClick={handlePrayerToggle}
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <span className="font-semibold text-gray-900 dark:text-white">{prayer.prayer_count}명</span>이 기도중
            </button>
            {prayer.reply_count > 0 && (
              <button 
                onClick={() => setShowReplies(true)}
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                댓글 <span className="font-semibold text-gray-900 dark:text-white">{prayer.reply_count}개</span> 모두 보기
              </button>
            )}
          </div>

          {/* Owner Badge */}
          {prayer.is_owner && (
            <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <span className="material-icons-outlined text-base">info</span>
                내가 작성한 기도 요청입니다
              </p>
            </div>
          )}

          {/* Replies Section */}
          {showReplies && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
                댓글 {prayer.reply_count > 0 && `(${prayer.reply_count})`}
              </h3>

              {/* Reply Composer */}
              <div className="mb-6">
                <ReplyComposer onSubmit={handleReplySubmit} isSubmitting={isCreating} />
              </div>

              {/* Reply List */}
              <ReplyList
                replies={replies}
                isLoading={repliesLoading}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onLoadMore={fetchNextPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="material-icons-outlined text-red-600 dark:text-red-400 text-2xl">warning</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">기도 요청 삭제</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              이 기도 요청을 삭제하시겠습니까?<br />
              삭제된 내용은 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    삭제 중...
                  </>
                ) : (
                  '삭제'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PrayerDetail
