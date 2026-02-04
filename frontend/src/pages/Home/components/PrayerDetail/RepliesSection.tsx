// 댓글 섹션 컴포넌트
import ReplyList from '../../../../components/common/ReplyList'
import ReplyComposer from '../../../../components/common/ReplyComposer'
import type { Reply } from '../../../../types/prayer'

interface RepliesSectionProps {
  replyCount: number
  replies: Reply[]
  isLoading: boolean
  isCreating: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onReplySubmit: (content: string, displayName: string) => void
  onLoadMore: () => void
}

const RepliesSection = ({
  replyCount,
  replies,
  isLoading,
  isCreating,
  hasNextPage,
  isFetchingNextPage,
  onReplySubmit,
  onLoadMore,
}: RepliesSectionProps) => {
  return (
    <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
        댓글 {replyCount > 0 && `(${replyCount})`}
      </h3>

      {/* Reply Composer */}
      <div className="mb-6">
        <ReplyComposer onSubmit={onReplySubmit} isSubmitting={isCreating} />
      </div>

      {/* Reply List */}
      <ReplyList
        replies={replies}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={onLoadMore}
      />
    </div>
  )
}

export default RepliesSection
