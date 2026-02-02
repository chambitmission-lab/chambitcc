// 기도 요청 상세 페이지
import { useState } from 'react'
import { usePrayerDetail } from '../../../hooks/usePrayersQuery'
import { useReplies, useCreateReply } from '../../../hooks/useReplies'
import ReplyList from '../../../components/common/ReplyList'
import ReplyComposer from '../../../components/common/ReplyComposer'

interface PrayerDetailProps {
  prayerId: number
  onClose: () => void
}

const PrayerDetail = ({ prayerId, onClose }: PrayerDetailProps) => {
  const { prayer, loading, error, handlePrayerToggle, isToggling } = usePrayerDetail(prayerId)
  const [showEnglish, setShowEnglish] = useState(false)
  const [showReplies, setShowReplies] = useState(false)

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

  const handleReplySubmit = (content: string, displayName: string, fingerprint: string) => {
    createReply({ content, display_name: displayName, fingerprint })
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">기도 요청</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="material-icons-outlined text-gray-600 dark:text-gray-400">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Author Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-gray-900">
                {prayer.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{prayer.display_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{prayer.time_ago}</p>
              </div>
            </div>
            {hasTranslation && (
              <button
                onClick={() => setShowEnglish(!showEnglish)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {showEnglish ? '🇰🇷 한글' : '🇺🇸 EN'}
              </button>
            )}
          </div>

          {/* Prayer Content */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-6 mb-6 border border-indigo-100/50 dark:border-gray-700/50">
            <h3 className={`text-xs font-bold text-primary mb-3 tracking-wider ${!showEnglish ? 'uppercase' : ''}`}>
              {displayTitle}
            </h3>
            <p className="text-base text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
              {displayContent}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handlePrayerToggle}
              disabled={isToggling}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                prayer.is_prayed
                  ? 'bg-primary text-white'
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
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                showReplies
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="material-icons-outlined text-xl transform -scale-x-100">chat_bubble_outline</span>
              <span>댓글 {prayer.reply_count > 0 && `(${prayer.reply_count})`}</span>
            </button>
          </div>

          {/* Stats */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="font-bold text-gray-900 dark:text-white">{prayer.prayer_count}명</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">이 기도중</span>
              </div>
              {prayer.reply_count > 0 && (
                <div>
                  <span className="font-bold text-gray-900 dark:text-white">{prayer.reply_count}개</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">의 댓글</span>
                </div>
              )}
            </div>
          </div>

          {/* Owner Badge */}
          {prayer.is_owner && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <span className="material-icons-outlined text-base">info</span>
                내가 작성한 기도 요청입니다
              </p>
            </div>
          )}

          {/* Replies Section */}
          {showReplies && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                댓글 {prayer.reply_count > 0 && `(${prayer.reply_count})`}
              </h3>

              {/* Reply Composer */}
              <div className="mb-8">
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
    </div>
  )
}

export default PrayerDetail
