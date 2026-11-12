// 행사 앨범 반응 칩 줄 (Single Responsibility: 🙏❤️🎉🙌 토글 + 댓글 진입)
// 한 사람당 하나 — 같은 이모지 재클릭은 취소, 다른 이모지는 교체(useToggleEventAlbumReaction).
import { EventAlbumEmojiImg } from './eventAlbumEmoji'
import { EVENT_ALBUM_EMOJI_META } from './eventAlbumEmojiMeta'
import type { EventAlbumPost } from '../../../types/eventAlbum'
import { useLanguage } from '../../../contexts/LanguageContext'

interface EventAlbumReactionBarProps {
  post: EventAlbumPost
  onToggleReaction: (emoji: string) => void
  /** 없으면 댓글 버튼을 그리지 않는다(PC 상세는 댓글이 바로 아래 펼쳐져 있다) */
  onOpenComments?: () => void
  className?: string
}

const EventAlbumReactionBar = ({
  post,
  onToggleReaction,
  onOpenComments,
  className = '',
}: EventAlbumReactionBarProps) => {
  const { t } = useLanguage()
  return (
    <div className={`flex items-center gap-1.5 lg:gap-2 ${className}`}>
      {EVENT_ALBUM_EMOJI_META.map((meta) => {
        const count = post.reaction_breakdown[meta.char] ?? 0
        const active = post.my_reaction === meta.char
        return (
          <button
            key={meta.char}
            type="button"
            onClick={() => onToggleReaction(meta.char)}
            aria-label={t(meta.labelKey)}
            aria-pressed={active}
            className={[
              'inline-flex items-center gap-1 h-9 lg:h-11 rounded-full border transition-all active:scale-90',
              count > 0 ? 'pl-1.5 pr-2.5 lg:pl-2 lg:pr-3.5' : 'px-1.5 lg:px-2',
              active
                ? 'bg-[var(--brand-soft-strong)] border-[var(--brand)] shadow-[0_2px_10px_-3px_var(--brand-glow)]'
                : 'bg-gray-100/70 dark:bg-white/[0.05] border-gray-200/70 dark:border-white/[0.08] hover:bg-[var(--brand-soft)]',
            ].join(' ')}
          >
            <EventAlbumEmojiImg meta={meta} size={22} className="lg:!w-[26px] lg:!h-[26px]" />
            {count > 0 && (
              <span
                className={[
                  'text-[12px] lg:text-[15px] font-bold tabular-nums',
                  active ? 'text-[var(--brand)]' : 'text-gray-600 dark:text-white/65',
                ].join(' ')}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}

      {onOpenComments && (
        <button
          type="button"
          onClick={onOpenComments}
          className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-gray-500 dark:text-white/60 hover:text-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors"
          aria-label={t('newsNfViewComments')}
        >
          <CommentIcon />
          <span className="text-[12.5px] lg:text-[15.5px] font-bold tabular-nums">{post.comment_count}</span>
        </button>
      )}
    </div>
  )
}

export const CommentIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

export default EventAlbumReactionBar
