// 알림장 댓글 하단 시트 — 기도 댓글과 같은 공용 ReplyList + 이모티콘 피커 재사용.
// 알림장 댓글은 실명 고정 (반 안에서의 소통이라 익명이 어울리지 않는다)
import { useState } from 'react'
import EmojiPickerPanel from '../../../components/common/EmojiPickerPanel'
import ReplyList from '../../../components/common/ReplyList'
import {
  useClassPostComments,
  useCreateClassPostComment,
  useDeleteClassPostComment,
  useUpdateClassPostComment,
} from '../../../hooks/useClassRoom'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useProfileDetail } from '../../../hooks/useProfile'
import type { Reply } from '../../../types/prayer'
import type { ClassPost } from '../../../types/classRoom'
import { timeAgo } from '../classUi'

const MAX_LENGTH = 500

interface ClassCommentSheetProps {
  post: ClassPost
  isTeacher: boolean
  onClose: () => void
}

const ClassCommentSheet = ({ post, isTeacher, onClose }: ClassCommentSheetProps) => {
  const [content, setContent] = useState('')
  const [showStickers, setShowStickers] = useState(false)

  useModalBackButton(onClose)

  const { data: profileDetail } = useProfileDetail()
  const avatarUrl = profileDetail?.stats.avatar_url ?? null
  const displayName =
    profileDetail?.stats.full_name ||
    localStorage.getItem('user_full_name') ||
    localStorage.getItem('user_username') ||
    '성도'

  const { data: comments, isLoading } = useClassPostComments(post.class_id, post.id, true)
  const createComment = useCreateClassPostComment(post.class_id, post.id)
  const updateComment = useUpdateClassPostComment(post.class_id, post.id)
  const deleteComment = useDeleteClassPostComment(post.class_id, post.id)

  // 공용 ReplyList가 기대하는 형태로 변환 (기도 댓글과 동일한 UI를 그대로 쓴다)
  const replies: Reply[] = (comments ?? []).map((c) => ({
    id: c.id,
    display_name: c.author_name,
    avatar_url: c.avatar_url,
    content: c.content,
    created_at: c.created_at,
    time_ago: timeAgo(c.created_at),
    is_owner: c.is_mine,
    is_edited: !!c.updated_at,
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || createComment.isPending) return
    createComment.mutate(trimmed)
    setContent('')
    setShowStickers(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg h-[85vh] sm:h-[80vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 + 헤더 */}
        <div className="relative z-10 shrink-0">
          <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
            <span className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.04] dark:border-white/[0.06]">
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-ink-strong tracking-[-0.015em]">댓글</p>
              <p className="text-[12px] text-gray-500 dark:text-white/50 truncate">
                {post.title || post.content.slice(0, 30) || '알림'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* 댓글 목록 */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-4">
          <ReplyList
            replies={replies}
            isLoading={isLoading}
            onReplyUpdate={(commentId, newContent) =>
              updateComment.mutate({ commentId, content: newContent })
            }
            onReplyDelete={(commentId) => deleteComment.mutate(commentId)}
            isUpdating={updateComment.isPending}
            canModerate={isTeacher}
          />
        </div>

        {/* 작성 폼 */}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 shrink-0 border-t border-black/[0.04] dark:border-white/[0.06] bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm px-4 py-3"
        >
          {showStickers && (
            <EmojiPickerPanel
              className="mb-2"
              disabled={createComment.isPending}
              onSelect={(char) => setContent((c) => (c + char).slice(0, MAX_LENGTH))}
            />
          )}

          <div className="flex items-end gap-2.5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full object-cover shadow-[0_0_0_1px_var(--card-border)] shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-[13px] font-semibold shrink-0 shadow-[0_2px_10px_var(--brand-glow)]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0 flex items-end gap-1.5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-2 py-1.5 focus-within:border-brand transition-colors">
              <button
                type="button"
                aria-label="움직이는 이모티콘"
                aria-expanded={showStickers}
                disabled={createComment.isPending}
                onClick={() => setShowStickers((v) => !v)}
                className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
                  showStickers
                    ? 'text-[var(--brand)] bg-[var(--brand-soft)]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-[var(--brand)]'
                }`}
              >
                <span className="material-icons-round text-[21px]">mood</span>
              </button>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
                placeholder="댓글을 남겨주세요"
                rows={1}
                disabled={createComment.isPending}
                className="flex-1 min-w-0 bg-transparent resize-none py-1.5 text-[14px] leading-[1.5] text-ink-strong placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none max-h-24 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={!content.trim() || createComment.isPending}
              className="shrink-0 px-4 h-9 rounded-full brand-gradient text-[13px] font-bold shadow-[0_4px_14px_-4px_var(--brand-glow)] active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {createComment.isPending ? '전송중' : '등록'}
            </button>
          </div>

          <p className="mt-1.5 pl-[42px] text-[10.5px] text-gray-400 dark:text-white/35">
            {displayName} 이름으로 남겨져요
          </p>
        </form>
      </div>
    </div>
  )
}

export default ClassCommentSheet
