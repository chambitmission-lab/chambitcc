// 행사 앨범 댓글 목록 + 작성 폼 (Single Responsibility: 댓글 열람/작성 본문)
// 모바일은 하단 시트(EventAlbumCommentSheet)가, PC 는 2단 상세(EventAlbumDetail)가 같은 본문을 쓴다.
// 목록은 공용 ReplyList 재사용, 작성은 실명 고정.
import { useState } from 'react'
import ReplyList from '../../../components/common/ReplyList'
import EmojiPickerPanel from '../../../components/common/EmojiPickerPanel'
import { useMyIdentity } from '../../../hooks/useProfile'
import {
  useCreateEventAlbumComment,
  useDeleteEventAlbumComment,
  useEventAlbumComments,
  useUpdateEventAlbumComment,
} from '../../../hooks/useEventAlbum'
import { toastFeedback } from '../../../utils/toast'
import { can } from '../../../utils/access'
import { useLanguage } from '../../../contexts/LanguageContext'

interface EventAlbumCommentThreadProps {
  postId: number
  /** sheet: 목록이 남은 높이를 채우며 스크롤, 폼은 아래 고정 / inline: 상세 카드 안에서 자연스럽게 흐름 */
  variant: 'sheet' | 'inline'
}

const MAX_LENGTH = 500

const EventAlbumCommentThread = ({ postId, variant }: EventAlbumCommentThreadProps) => {
  const { t } = useLanguage()
  const [content, setContent] = useState('')
  const [showStickers, setShowStickers] = useState(false)

  // 내 사진·이름 — 헤더가 캐시한 가벼운 /profile/stats(useMyIdentity)
  const { avatarUrl, displayName: myName } = useMyIdentity()
  const displayName = myName || t('newsCommentNameFallback')

  const { comments, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useEventAlbumComments(postId)
  const { createComment, isCreating } = useCreateEventAlbumComment(postId, toastFeedback<{ message?: string }>({ success: (response) => response.message, error: t('newsCommentCreateFailed') }))
  const { updateComment, isUpdating } = useUpdateEventAlbumComment(postId, toastFeedback<{ message?: string }>({ success: (response) => response.message, error: t('newsCommentUpdateFailed') }))
  const { deleteComment } = useDeleteEventAlbumComment(postId, toastFeedback<{ message?: string }>({ success: (response) => response.message, error: t('newsCommentDeleteFailed') }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || isCreating) return
    createComment(trimmed)
    setContent('')
    setShowStickers(false)
  }

  const sheet = variant === 'sheet'

  return (
    <>
      <div className={sheet ? 'relative z-10 flex-1 overflow-y-auto px-5 py-4' : 'pb-3'}>
        <ReplyList
          replies={comments}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
          onReplyUpdate={(commentId, newContent) =>
            updateComment({ commentId, content: newContent })
          }
          onReplyDelete={(commentId) => deleteComment(commentId)}
          isUpdating={isUpdating}
          canModerate={can('community:moderate')}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className={
          sheet
            ? 'relative z-10 shrink-0 border-t border-black/[0.04] dark:border-white/[0.06] bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm px-4 py-3'
            : 'pt-3 border-t border-black/[0.05] dark:border-white/[0.07]'
        }
      >
        {showStickers && (
          <EmojiPickerPanel
            className="mb-2"
            disabled={isCreating}
            onSelect={(char) => setContent((c) => (c + char).slice(0, MAX_LENGTH))}
          />
        )}

        <div className="flex items-end gap-2.5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-8 h-8 lg:w-9 lg:h-9 rounded-full object-cover shadow-[0_0_0_1px_var(--card-border)] shrink-0"
            />
          ) : (
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full brand-gradient flex items-center justify-center text-[13px] font-semibold shrink-0 shadow-[0_2px_10px_var(--brand-glow)]">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0 flex items-end gap-1.5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-2 py-1.5 focus-within:border-[var(--brand)] transition-colors">
            <button
              type="button"
              aria-label={t('newsAnimatedSticker')}
              aria-expanded={showStickers}
              disabled={isCreating}
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
              placeholder={t('newsEaCommentPlaceholder')}
              rows={1}
              disabled={isCreating}
              className="flex-1 min-w-0 bg-transparent resize-none py-1.5 text-[14px] lg:text-[16px] leading-[1.5] text-ink-strong placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none max-h-24 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!content.trim() || isCreating}
            className="shrink-0 px-4 h-9 lg:h-10 rounded-full brand-gradient text-[13px] lg:text-[15px] font-bold shadow-[0_4px_14px_-4px_var(--brand-glow)] active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isCreating ? t('newsCommentSending') : t('newsCommentSubmit')}
          </button>
        </div>

        <p className="mt-1.5 pl-[42px] text-[10.5px] lg:text-[13px] text-gray-400 dark:text-white/35">
          {t('newsCommentSignature').replace('{name}', displayName)}
        </p>
      </form>
    </>
  )
}

export default EventAlbumCommentThread
