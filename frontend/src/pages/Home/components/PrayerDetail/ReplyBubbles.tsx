// 기도 상세 댓글 — 말풍선 대화 (남의 글은 왼쪽 회색, 내 글은 오른쪽 브랜드 블루).
// 공용 ReplyList(교실·소식 시트와 함께 씀)와 같은 동작(수정·삭제·더보기)을 말풍선 모양으로만 다시 그린다.
import { useState } from 'react'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { Reply } from '../../../../types/prayer'
import { AnimatedEmojiText } from '../../../../components/common/animatedEmoji'
import { confirmDialog } from '../../../../utils/confirmDialog'

interface ReplyBubblesProps {
  replies: Reply[]
  isLoading: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  onReplyUpdate?: (replyId: number, content: string) => void
  onReplyDelete?: (replyId: number) => void
  isUpdating?: boolean
}

const isAnonymousReply = (reply: Reply) => reply.display_name === '익명' || reply.display_name === 'Anonymous'

const ReplyBubbles = ({
  replies,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onReplyUpdate,
  onReplyDelete,
  isUpdating,
}: ReplyBubblesProps) => {
  const { t } = useLanguage()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

  const startEdit = (reply: Reply) => {
    setEditingId(reply.id)
    setEditContent(reply.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const saveEdit = (reply: Reply) => {
    const trimmed = editContent.trim()
    if (!trimmed || trimmed === reply.content) {
      cancelEdit()
      return
    }
    onReplyUpdate?.(reply.id, trimmed)
    cancelEdit()
  }

  const handleDelete = async (reply: Reply) => {
    if (
      !(await confirmDialog({
        title: '댓글 삭제',
        message: '이 댓글을 삭제할까요?',
        description: '삭제된 내용은 복구할 수 없습니다.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    if (editingId === reply.id) cancelEdit()
    onReplyDelete?.(reply.id)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-7 h-7 border-[3px] border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (replies.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="pd-chat-name font-medium text-ink-muted">아직 남겨진 마음이 없어요</p>
        <p className="pd-chat-meta mt-1 text-ink-muted">아래에서 한 번 눌러 첫 마음을 전해 보세요</p>
      </div>
    )
  }

  const nameOf = (reply: Reply) =>
    // 목양 기도의 목회자 답글 — 익명으로 남겨도 '목사님'임은 알 수 있게
    reply.is_pastor && isAnonymousReply(reply)
      ? t('pastorReplyBadge')
      : isAnonymousReply(reply)
        ? t('anonymousDisplayName')
        : reply.display_name

  return (
    <div className="flex flex-col gap-3.5">
      {replies.map((reply) => {
        const mine = !!reply.is_owner
        const editing = editingId === reply.id

        if (editing) {
          return (
            <div key={reply.id}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                maxLength={500}
                autoFocus
                disabled={isUpdating}
                className="reply-composer-input w-full px-3.5 py-2.5 text-[15px] leading-[1.6] border rounded-2xl text-ink-strong focus:outline-none focus:ring-2 focus:ring-[var(--brand-glow)] resize-none disabled:opacity-50"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={cancelEdit}
                  disabled={isUpdating}
                  className="pd-chat-name px-4 py-2 font-semibold text-ink-muted rounded-full disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={() => saveEdit(reply)}
                  disabled={!editContent.trim() || isUpdating}
                  className="pd-chat-name px-4 py-2 font-semibold brand-gradient rounded-full active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? '저장중...' : '저장'}
                </button>
              </div>
            </div>
          )
        }

        const meta = (
          <span className="pd-chat-meta shrink-0 pb-0.5 text-ink-muted whitespace-nowrap">
            {reply.time_ago}
            {reply.is_edited && ' · 수정됨'}
          </span>
        )

        if (mine) {
          return (
            <div key={reply.id} className="flex flex-col items-end gap-1">
              <div className="flex items-end justify-end gap-2 max-w-full pl-8">
                {meta}
                <AnimatedEmojiText content={reply.content} className="pd-bubble pd-bubble--mine min-w-0" />
              </div>
              <div className="flex items-center gap-3 pr-1">
                {onReplyUpdate && (
                  <button
                    onClick={() => startEdit(reply)}
                    className="pd-chat-meta py-1 text-ink-muted hover:text-[var(--brand)] transition-colors"
                  >
                    수정
                  </button>
                )}
                {onReplyDelete && (
                  <button
                    onClick={() => handleDelete(reply)}
                    className="pd-chat-meta py-1 text-ink-muted hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          )
        }

        return (
          <div key={reply.id} className="flex items-end gap-2.5 pr-6">
            {isAnonymousReply(reply) ? (
              <div className="pd-chat-avatar shrink-0 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-500 dark:text-gray-400">
                <span className="material-icons-outlined text-[17px]">person</span>
              </div>
            ) : reply.avatar_url ? (
              <img src={reply.avatar_url} alt="" loading="lazy" className="pd-chat-avatar shrink-0 rounded-full object-cover" />
            ) : (
              <div className="pd-chat-avatar shrink-0 rounded-full bg-[var(--brand-soft-strong)] text-[var(--brand)] flex items-center justify-center text-[13px] font-bold">
                {reply.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex flex-col items-start gap-1">
              <span className="pd-chat-name pl-1 flex items-center gap-1.5 text-ink-muted">
                <span className={reply.is_pastor ? 'font-semibold text-[var(--brand)]' : 'font-medium'}>{nameOf(reply)}</span>
                {reply.is_pastor && !isAnonymousReply(reply) && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-[var(--brand-soft-strong)] text-[10px] font-bold leading-none text-[var(--brand)]">
                    {t('pastorReplyBadge')}
                  </span>
                )}
              </span>
              <AnimatedEmojiText content={reply.content} className="pd-bubble" />
            </div>
            {meta}
          </div>
        )
      })}

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="pd-chat-name px-5 py-2 font-semibold text-[var(--brand)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingNextPage ? '불러오는 중...' : '더 보기'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ReplyBubbles
