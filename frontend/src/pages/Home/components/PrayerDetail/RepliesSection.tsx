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
    <div className="mt-10">
      <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-5">
        댓글 {replyCount > 0 && <span className="text-gray-400 dark:text-gray-500 font-normal">({replyCount})</span>}
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
