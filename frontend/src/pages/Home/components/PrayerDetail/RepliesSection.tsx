// 댓글 섹션 컴포넌트
// 2026-11-18 D안: 목록은 위, 작성창은 아래(채팅 습관). PC(lg)에선 루트를 display:contents 로 풀어
// 목록은 오른쪽 칸 1행, 작성창은 2행(왼쪽 기도 바와 같은 줄)에 직접 앉힌다 — 하단 한 줄이 좌우로 맞는다.
import type { ReactNode } from 'react'
import ReplyList from '../../../../components/common/ReplyList'
import ReplyComposer from '../../../../components/common/ReplyComposer'
import type { Reply } from '../../../../types/prayer'
import { tokenStore } from '../../../../utils/tokenStore'
import { showToast } from '../../../../utils/toast'

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
  /** 목록 맨 위 안내(목양 기도의 "목사님께만 전해져요" 등) */
  hint?: ReactNode
  /** 한 번 눌러 남기는 짧은 말 — 골방 기도자(익명)로 바로 보낸다. 비우면 칩 줄을 숨긴다 */
  quickReplies?: string[]
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
  hint,
  quickReplies,
}: RepliesSectionProps) => {
  const sendQuick = (text: string) => {
    if (isCreating) return
    if (!tokenStore.getAccess()) {
      showToast('로그인이 필요합니다', 'error')
      return
    }
    onReplySubmit(text, '익명')
  }

  return (
    <div className="mt-6 lg:mt-0 lg:contents">
      {/* 목록 — lg: 오른쪽 칸 위, 따로 스크롤 */}
      <div className="pd-replies-list rd-side lg:col-start-2 lg:row-start-1 lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:pt-7 lg:pb-6 lg:border-l lg:border-[var(--card-border)] lg:bg-[var(--surface-inset)]">
        <h3 className="text-[15px] lg:text-[length:calc(17px*var(--fs,1))] font-bold text-ink-strong mb-4">
          댓글 {replyCount > 0 && <span className="text-[var(--brand)]">{replyCount}</span>}
        </h3>
        {hint}

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

        {quickReplies && quickReplies.length > 0 && (
          <div className="mt-5 lg:mt-6">
            <p className="text-[12px] lg:text-[length:calc(13px*var(--fs,1))] text-gray-500 dark:text-gray-400 mb-2">
              한 번 눌러 남기기 <span className="text-gray-400 dark:text-gray-500">· 골방 기도자로 남겨져요</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => sendQuick(text)}
                  disabled={isCreating}
                  className="pd-quick px-3.5 py-2 lg:px-4 lg:py-2.5 rounded-full border border-[var(--card-border)] bg-[var(--surface-container)] text-[13px] lg:text-[length:calc(14px*var(--fs,1))] font-medium text-ink-strong hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors disabled:opacity-50"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 작성창 — 모바일은 목록 아래, lg 는 오른쪽 칸 맨 아래(왼쪽 기도 바와 같은 줄) */}
      <div className="pd-replies-compose rd-side mt-6 lg:mt-0 lg:col-start-2 lg:row-start-2 lg:flex lg:items-center lg:px-6 lg:py-5 lg:border-l lg:border-t lg:border-[var(--card-border)] lg:bg-[var(--surface-inset)]">
        <div className="w-full">
          <ReplyComposer
            onSubmit={onReplySubmit}
            isSubmitting={isCreating}
            onExpandedChange={onComposerExpandedChange}
          />
        </div>
      </div>
    </div>
  )
}

export default RepliesSection
