// 댓글 섹션 컴포넌트
import ReplyList from '../../../../components/common/ReplyList'
import ReplyComposer from '../../../../components/common/ReplyComposer'
import type { Reply } from '../../../../types/prayer'

interface RepliesSectionProps {
  replyCount: number
  replies: Reply[]
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onReplySubmit: (content: string, displayName: string) => void
  onReplyUpdate: (replyId: number, content: string) => void
  onReplyDelete: (replyId: number) => void
  onLoadMore: () => void
  onComposerExpandedChange?: (expanded: boolean) => void
}

const RepliesSection = ({
  replyCount,
  replies,
  isLoading,
  isCreating,
  isUpdating,
  hasNextPage,
  isFetchingNextPage,
  onReplySubmit,
  onReplyUpdate,
  onReplyDelete,
  onLoadMore,
  onComposerExpandedChange,
}: RepliesSectionProps) => {
  return (
    // lg: 상세 모달 오른쪽 칸 — 제목·작성창은 위에 고정하고 목록만 따로 스크롤한다.
    // 긴 댓글을 읽다가도 작성창을 찾으러 내려갈 필요가 없다
    <div className="mt-8 lg:mt-0 lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
      <div className="lg:shrink-0 lg:max-h-[65%] lg:overflow-y-auto lg:px-8 lg:pt-7 lg:pb-6 lg:border-b lg:border-[var(--card-border)]">
      <h3 className="text-[15px] lg:text-[length:calc(17px*var(--fs,1))] font-semibold text-ink-strong mb-5">
        댓글 {replyCount > 0 && <span className="text-gray-500 dark:text-gray-400 font-normal">({replyCount})</span>}
      </h3>

      {/* Reply Composer */}
      <div className="mb-6 lg:mb-0">
        <ReplyComposer
          onSubmit={onReplySubmit}
          isSubmitting={isCreating}
          onExpandedChange={onComposerExpandedChange}
        />
      </div>
      </div>

      {/* Reply List */}
      <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:py-6">
      <ReplyList
        replies={replies}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={onLoadMore}
        onReplyUpdate={onReplyUpdate}
        onReplyDelete={onReplyDelete}
        isUpdating={isUpdating}
      />
      </div>
    </div>
  )
}

export default RepliesSection
