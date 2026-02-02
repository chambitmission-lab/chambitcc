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
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (replies.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-icons-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">
          chat_bubble_outline
        </span>
        <p className="text-gray-500 dark:text-gray-400">아직 댓글이 없습니다</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          첫 번째 댓글을 작성해보세요
        </p>
      </div>
    )
  }

  return (
    <div className="reply-list space-y-4">
      {replies.map((reply) => (
        <div key={reply.id} className="reply-item flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
            {reply.display_name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {reply.display_name}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {reply.time_ago}
              </span>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
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
            className="px-6 py-2 text-sm text-primary font-semibold hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? '불러오는 중...' : '댓글 더보기'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ReplyList
