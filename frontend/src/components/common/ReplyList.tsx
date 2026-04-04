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
    <div className="reply-list space-y-4">
      {replies.map((reply) => (
        <div key={reply.id} className="reply-item flex gap-3 p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-purple-500/30 dark:hover:border-white/30 transition-all">
          <div className="relative flex-shrink-0">
            {/* 하늘에서 내려오는 빛 효과 - 댓글용 (더 작게) */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-gradient-to-b from-transparent via-indigo-400/50 to-indigo-500/70 dark:via-purple-400/50 dark:to-purple-500/70 blur-[1px]"></div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-gradient-to-b from-transparent via-indigo-500/70 to-indigo-600 dark:via-purple-500/70 dark:to-purple-600"></div>
            {/* 주변 빛 확산 효과 */}
            <div className="absolute inset-0 rounded-full bg-indigo-400/20 dark:bg-purple-400/20 blur-md animate-pulse"></div>
            <div className="w-10 h-10 rounded-full backdrop-blur-md bg-gradient-to-b from-indigo-400/60 via-indigo-500/40 to-purple-600/25 dark:from-purple-400/60 dark:via-purple-500/40 dark:to-purple-600/25 border-2 border-indigo-500/70 dark:border-purple-500/70 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.5),0_-6px_15px_rgba(99,102,241,0.4),inset_0_1px_3px_rgba(255,255,255,0.7)] dark:shadow-[0_0_20px_rgba(168,85,247,0.4),0_-6px_15px_rgba(168,85,247,0.3),inset_0_1px_3px_rgba(255,255,255,0.6)] relative z-10">
              {reply.display_name.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {reply.display_name}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {reply.time_ago}
              </span>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {reply.content}
            </p>
          </div>
        </div>
      ))}

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="px-6 py-2.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-500/40 dark:hover:shadow-purple-900/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isFetchingNextPage ? '불러오는 중...' : '댓글 더보기'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ReplyList
