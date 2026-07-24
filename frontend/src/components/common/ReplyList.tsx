// 댓글 목록 컴포넌트 (Single Responsibility: 댓글 표시만 담당)
import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import type { Reply } from '../../types/prayer'
import { AnimatedEmojiText } from './animatedEmoji'

interface ReplyListProps {
  replies: Reply[]
  isLoading: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  onReplyUpdate?: (replyId: number, content: string) => void
  onReplyDelete?: (replyId: number) => void
  isUpdating?: boolean
  /** 관리자 모더레이션 — 남의 댓글도 '삭제'만 노출 (수정은 본인만) */
  canModerate?: boolean
}

const ReplyList = ({
  replies,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onReplyUpdate,
  onReplyDelete,
  isUpdating,
  canModerate,
}: ReplyListProps) => {
  const { t } = useLanguage()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

  // 익명 댓글 — 데이터 값('익명')은 그대로 두고 골방 기도자로 보여준다 (피드와 동일)
  const isAnonymousReply = (reply: Reply) =>
    reply.display_name === '익명' || reply.display_name === 'Anonymous'

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

  const handleDelete = (reply: Reply) => {
    if (!window.confirm('댓글을 삭제할까요?')) return
    if (editingId === reply.id) cancelEdit()
    onReplyDelete?.(reply.id)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (replies.length === 0) {
    return (
      <div className="text-center py-14 px-4">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-14 h-14 mx-auto text-blue-300/70 dark:text-blue-300/20"
          aria-hidden="true"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          <circle cx="8.2" cy="11.5" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="12" cy="11.5" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="15.8" cy="11.5" r="0.9" fill="currentColor" stroke="none" />
        </svg>
        <p className="mt-4 text-sm font-medium text-gray-400 dark:text-gray-500">아직 댓글이 없습니다</p>
        <p className="mt-1 text-[13px] text-gray-400/80 dark:text-gray-600">
          첫 번째 댓글을 작성해보세요
        </p>
      </div>
    )
  }

  return (
    <div className="reply-list space-y-5">
      {replies.map((reply) => (
        <div key={reply.id} className="reply-item flex gap-3">
          {isAnonymousReply(reply) ? (
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-400 dark:text-gray-500 shadow-[0_0_0_1px_var(--card-border)] flex-shrink-0">
              <span className="material-icons-outlined text-[18px]">person</span>
            </div>
          ) : reply.avatar_url ? (
            <img
              src={reply.avatar_url}
              alt=""
              loading="lazy"
              className="w-9 h-9 rounded-full object-cover shadow-[0_0_0_1px_var(--card-border)] flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-sm font-semibold shadow-[0_2px_10px_var(--brand-glow)] flex-shrink-0">
              {reply.display_name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm ${
                isAnonymousReply(reply)
                  ? 'font-medium text-gray-500 dark:text-gray-400'
                  : 'font-semibold text-gray-900 dark:text-white'
              }`}>
                {isAnonymousReply(reply) ? t('anonymousDisplayName') : reply.display_name}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {reply.time_ago}
              </span>
              {reply.is_edited && (
                <span className="text-xs text-gray-400/80 dark:text-gray-600">(수정됨)</span>
              )}
              {(reply.is_owner || canModerate) && editingId !== reply.id && (
                <span className="ml-auto flex items-center gap-2.5">
                  {/* 수정은 언제나 본인만 — 관리자에게 띄우면 서버에서 403이 난다 */}
                  {reply.is_owner && onReplyUpdate && (
                    <button
                      onClick={() => startEdit(reply)}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-[var(--brand)] transition-colors"
                    >
                      수정
                    </button>
                  )}
                  {onReplyDelete && (
                    <button
                      onClick={() => handleDelete(reply)}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </span>
              )}
            </div>

            {editingId === reply.id ? (
              <div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  maxLength={500}
                  autoFocus
                  disabled={isUpdating}
                  className="w-full px-3 py-2.5 text-[14px] leading-[1.65] border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-glow)] resize-none disabled:opacity-50 transition-all"
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={cancelEdit}
                    disabled={isUpdating}
                    className="px-4 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full transition-colors disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => saveEdit(reply)}
                    disabled={!editContent.trim() || isUpdating}
                    className="px-4 py-1.5 text-xs font-semibold brand-gradient rounded-full shadow-[0_3px_10px_-3px_var(--brand-glow)] active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? '저장중...' : '저장'}
                  </button>
                </div>
              </div>
            ) : (
              <AnimatedEmojiText
                content={reply.content}
                className="text-gray-700 dark:text-gray-200 text-[14px] leading-[1.65] whitespace-pre-wrap break-words"
              />
            )}
          </div>
        </div>
      ))}

      {hasNextPage && (
        <div className="flex justify-center pt-3">
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="px-5 py-2 text-xs font-semibold text-[var(--brand)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingNextPage ? '불러오는 중...' : '댓글 더보기'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ReplyList
