// 기도 요청 상세 페이지
import { useState } from 'react'
import { usePrayerDetail } from '../../../hooks/usePrayersQuery'
import { useReplies, useCreateReply } from '../../../hooks/useReplies'
import { deletePrayer } from '../../../api/prayer'
import ReplyList from '../../../components/common/ReplyList'
import ReplyComposer from '../../../components/common/ReplyComposer'
import { showToast } from '../../../utils/toast'
import type { Prayer } from '../../../types/prayer'

interface PrayerDetailProps {
  prayerId: number
  initialData?: Prayer
  onClose: () => void
  onDelete?: () => void
}

const PrayerDetail = ({ prayerId, initialData, onClose, onDelete }: PrayerDetailProps) => {
  const { prayer, loading, error, handlePrayerToggle, isToggling } = usePrayerDetail(prayerId, initialData)
  const [showTranslation, setShowTranslation] = useState(false)
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
        <div className="bg-background-light dark:bg-background-dark rounded-2xl p-8 max-w-md w-full mx-4">
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
        <div className="bg-background-light dark:bg-background-dark rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || '기도 요청을 찾을 수 없습니다'}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-surface-light dark:bg-surface-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 번역이 있는지 확인 (한글→영어 또는 영어→한글)
  // 번역이 있는지 확인 (한글→영어 또는 영어→한글)
  const hasEnTranslation = !!(prayer.title_en && prayer.content_en)
  const hasKoTranslation = !!(prayer.title_ko && prayer.content_ko)
  const hasTranslation = hasEnTranslation || hasKoTranslation
  
  // 현재 표시할 제목과 내용 결정
  const displayTitle = showTranslation 
    ? (prayer.title_en || prayer.title_ko || prayer.title)
    : prayer.title
  const displayContent = showTranslation 
    ? (prayer.content_en || prayer.content_ko || prayer.content)
    : prayer.content
  
  // 버튼 텍스트 결정
  const translationButtonText = showTranslation 
    ? (hasKoTranslation ? '🇺🇸 English' : '🇰🇷 한글')
    : (hasKoTranslation ? '🇰🇷 한글' : '🇺🇸 English')

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-background-light dark:bg-background-dark rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">기도 요청 상세</h2>
          <div className="flex items-center gap-2">
            {prayer?.is_owner && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                title="삭제"
              >
                <span className="material-icons-outlined text-[22px] text-gray-700 dark:text-gray-300">more_horiz</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
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
              <div className="relative">
                {/* 하늘에서 내려오는 빛 효과 - 테마별 색상 */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[3px] h-10 bg-gradient-to-b from-transparent via-purple-400/60 to-purple-500/80 dark:via-white/60 dark:to-white/80 blur-[2px]"></div>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[1px] h-10 bg-gradient-to-b from-transparent via-purple-500/80 to-purple-600 dark:via-white/80 dark:to-white"></div>
                {/* 주변 빛 확산 효과 */}
                <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-white/20 blur-md animate-pulse"></div>
                <div className="w-11 h-11 rounded-full backdrop-blur-md bg-gradient-to-b from-purple-400/60 via-purple-500/40 to-purple-600/25 dark:from-white/50 dark:via-white/30 dark:to-white/15 border-2 border-purple-500/70 dark:border-white/60 flex items-center justify-center text-white text-base font-bold shadow-[0_0_25px_rgba(168,85,247,0.6),0_-8px_20px_rgba(168,85,247,0.5),inset_0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[0_0_25px_rgba(255,255,255,0.4),0_-8px_20px_rgba(255,255,255,0.3),inset_0_1px_3px_rgba(255,255,255,0.6)] relative z-10">
                  {prayer.display_name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{prayer.display_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{prayer.time_ago}</p>
              </div>
            </div>
            {hasTranslation && (
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="px-3 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {translationButtonText}
              </button>
            )}
          </div>

          {/* Prayer Content */}
          <div className="relative mb-5">
            {/* 위에서 내려오는 빛 효과 - 테마별 색상 */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-gradient-to-b from-transparent via-purple-400/40 to-purple-500/60 dark:via-white/30 dark:to-white/50 blur-[1px]"></div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-gradient-to-b from-transparent via-purple-500/60 to-purple-600/80 dark:via-white/50 dark:to-white/70"></div>
            
            {/* 기도 카드 - 글래스모피즘 */}
            <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-5 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              {/* 내부 빛 효과 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-2xl"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-white/10 dark:to-white/5 rounded-full blur-2xl"></div>
              
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-3 tracking-[0.02em] relative z-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] uppercase">
                {displayTitle}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap relative z-10 drop-shadow-[0_0_6px_rgba(168,85,247,0.2)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">
                {displayContent}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handlePrayerToggle}
              disabled={isToggling}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                prayer.is_prayed
                  ? 'bg-ig-red text-white shadow-md shadow-red-200 dark:shadow-red-900/30'
                  : 'bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
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
                  : 'bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
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
            <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark">
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
          <div className="bg-background-light dark:bg-background-dark rounded-2xl p-6 max-w-sm w-full shadow-2xl">
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
                className="flex-1 py-2.5 px-4 bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white rounded-xl font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
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
