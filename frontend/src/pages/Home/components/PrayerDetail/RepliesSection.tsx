// 곁에 머문 마음 — 함께 기도한 수·쪽지 수 한 줄 + 말풍선 대화.
// 작성창은 여기 없다: 화면 맨 아래 입력 바(PrayerDetailView 의 .pd-dock)에 늘 붙어 있다.
import ReplyBubbles from './ReplyBubbles'
import type { Reply } from '../../../../types/prayer'

interface RepliesSectionProps {
  /** 함께 기도한 수 — 목양 기도(작성자·목회자 둘만의 자리)에선 숨긴다 */
  prayerCount: number | null
  replyCount: number
  replies: Reply[]
  isLoading: boolean
  isUpdating: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onReplyUpdate: (replyId: number, content: string) => void
  onReplyDelete: (replyId: number) => void
  onLoadMore: () => void
}

const RepliesSection = ({
  prayerCount,
  replyCount,
  replies,
  isLoading,
  isUpdating,
  hasNextPage,
  isFetchingNextPage,
  onReplyUpdate,
  onReplyDelete,
  onLoadMore,
}: RepliesSectionProps) => {
  const counts = [
    prayerCount !== null && prayerCount > 0 ? `기도 ${prayerCount}` : null,
    replyCount > 0 ? `쪽지 ${replyCount}` : null,
  ].filter(Boolean)

  return (
    <div>
      <div className="flex items-baseline gap-2.5 mb-4">
        <h3 className="text-[15.5px] lg:text-[length:calc(16.5px*var(--fs,1))] font-bold text-ink-strong">곁에 머문 마음</h3>
        {counts.length > 0 && (
          <span className="text-[13px] lg:text-[length:calc(13.5px*var(--fs,1))] text-ink-muted">{counts.join(' · ')}</span>
        )}
      </div>
      <ReplyBubbles
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
  )
}

export default RepliesSection
