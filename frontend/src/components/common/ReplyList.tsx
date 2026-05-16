// 댓글 목록 컴포넌트 (Single Responsibility: 댓글 표시만 담당)
import type { Reply } from '../../types/prayer'

interface ReplyListProps {
  replies: Reply[]
  isLoading: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
}

const ReplyList = ({
  replies,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: ReplyListProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-purple-500 dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (replies.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-4">
          <span className="text-4xl">💬</span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">아직 댓글이 없습니다</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          첫 번째 댓글을 작성해보세요
        </p>
      </div>
    )
  }

  return (
    <div className="reply-list space-y-5">
      {replies.map((reply) => (
        <div key={reply.id} className="reply-item flex gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/80 to-purple-600/60 dark:from-purple-500/55 dark:to-purple-700/35 border border-purple-400/40 dark:border-purple-400/25 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {reply.display_name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {reply.display_name}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {reply.time_ago}
              </span>
            </div>

            <p className="text-gray-700 dark:text-gray-200 text-[14px] leading-[1.65] whitespace-pre-wrap break-words">
              {reply.content}
            </p>
          </div>
        </div>
      ))}

      {hasNextPage && (
        <div className="flex justify-center pt-3">
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="px-5 py-2 text-xs font-semibold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingNextPage ? '불러오는 중...' : '댓글 더보기'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ReplyList
