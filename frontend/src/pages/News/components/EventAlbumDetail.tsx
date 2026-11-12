// 행사 앨범 상세 (Single Responsibility: PC 2단의 오른쪽 — 고른 앨범의 사진·반응·댓글)
// 피드 카드 + 댓글 모달을 오가던 것을 한 판에 펼친다. 사진을 누르면 풀스크린 뷰어(EventAlbumViewer).
import { useState } from 'react'
import { AnimatedEmojiText } from '../../../components/common/animatedEmoji'
import type { EventAlbumPost } from '../../../types/eventAlbum'
import { useLanguage } from '../../../contexts/LanguageContext'
import { formatEventDate } from './eventAlbumDate'
import { EventTagIcon } from './NewsIcons'
import EventAlbumReactionBar from './EventAlbumReactionBar'
import EventAlbumCommentThread from './EventAlbumCommentThread'

interface EventAlbumDetailProps {
  post: EventAlbumPost
  isAdmin?: boolean
  onToggleReaction: (emoji: string) => void
  onOpenViewer: (photoIndex: number) => void
  onOpenEvent: (eventId: number) => void
  onDelete?: () => void
}

/** 격자에 펼쳐 두는 최대 장수 — 넘치면 마지막 칸이 "+N" 으로 뷰어를 연다 */
const GRID_MAX = 13
const CAPTION_CLAMP = 160
/** 장수별 열 수 (Tailwind 가 읽도록 클래스 이름을 통째로 둔다). 5 = 5장 이상 */
const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-4',
}

const EventAlbumDetail = ({
  post,
  isAdmin,
  onToggleReaction,
  onOpenViewer,
  onOpenEvent,
  onDelete,
}: EventAlbumDetailProps) => {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)

  const caption = post.caption ?? ''
  const needsClamp = caption.length > CAPTION_CLAMP && !expanded
  const shownCaption = needsClamp ? `${caption.slice(0, CAPTION_CLAMP)}…` : caption

  const photos = post.photos
  // 5장 이상이면 큰 첫 장(2×2) 뒤로 4칸씩 줄이 꽉 차는 장수만 펼친다 — 마지막 줄이 들쭉날쭉하지 않게
  const cap = Math.min(photos.length, GRID_MAX)
  const shown = photos.slice(0, cap >= 5 ? 1 + Math.floor((cap - 1) / 4) * 4 : cap)
  const rest = photos.length - shown.length

  return (
    <article className="rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.3)] p-5">
      {/* 머리 */}
      <header className="flex items-start gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 h-6 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold">
              <EventTagIcon tag={post.tag} width={13} height={13} className="shrink-0" />
              {post.tag}
            </span>
            {isAdmin && !post.is_published && (
              <span className="inline-flex items-center px-2 h-6 rounded-full bg-gray-500/15 text-gray-600 dark:text-white/60 text-[13px] font-bold">
                {t('newsPrivate')}
              </span>
            )}
          </div>
          <h3 className="text-[24px] font-bold text-ink-strong tracking-[-0.025em] leading-[1.3] text-balance">
            {post.title}
          </h3>
          <p className="mt-1 text-[15px] text-gray-500 dark:text-white/55">
            {formatEventDate(post.event_date, t)} · {t('newsEaPhotoCount').replace('{n}', String(post.photo_count))}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-1">
          {post.event_id != null && (
            <button
              type="button"
              onClick={() => onOpenEvent(post.event_id!)}
              className="inline-flex items-center gap-1.5 px-3.5 h-10 rounded-full bg-[var(--brand-soft)] text-brand text-[14.5px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2.5" />
                <path d="M8 3v4M16 3v4M3 10h18" />
              </svg>
              {t('newsEaViewEvent')}
            </button>
          )}
          {isAdmin && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={t('newsDelete')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 dark:text-white/40 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* 사진 격자 — 5장 이상이면 첫 장(대표)을 2×2 로 크게, 그보다 적으면 같은 크기로 나란히 */}
      {shown.length > 0 && (
        <div className={`grid ${GRID_COLS[Math.min(shown.length, 5)]} gap-1.5 rounded-2xl overflow-hidden`}>
          {shown.map((photo, i) => {
            const isLast = i === shown.length - 1 && rest > 0
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => onOpenViewer(i)}
                aria-label={`${post.title} ${i + 1} / ${photos.length}`}
                className={[
                  'relative overflow-hidden bg-gray-100 dark:bg-white/[0.04] rounded-lg',
                  shown.length >= 5 && i === 0
                    ? 'col-span-2 row-span-2'
                    : shown.length === 1
                      ? 'aspect-[16/10]'
                      : 'aspect-square',
                ].join(' ')}
              >
                <img
                  src={photo.url}
                  alt=""
                  loading={i < 5 ? 'eager' : 'lazy'}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {isLast && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-[20px] font-bold tabular-nums">
                    +{rest + 1}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* 반응 */}
      <EventAlbumReactionBar post={post} onToggleReaction={onToggleReaction} className="mt-4" />
      {post.reaction_count > 0 && (
        <p className="mt-2 text-[15px] font-bold text-gray-700 dark:text-white/75">
          {t('newsEaReactedCount').replace('{n}', String(post.reaction_count))}
        </p>
      )}

      {/* 캡션 */}
      {caption && (
        <div className="mt-2">
          <AnimatedEmojiText
            content={shownCaption}
            className="text-[16.5px] leading-[1.7] text-gray-700 dark:text-white/80 whitespace-pre-wrap break-words"
          />
          {needsClamp && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-0.5 text-[15px] font-semibold text-gray-400 dark:text-white/40 hover:text-[var(--brand)] transition-colors"
            >
              {t('newsEaMore')}
            </button>
          )}
        </div>
      )}

      {/* 댓글 — 시트 대신 바로 아래 펼친다 */}
      <section className="mt-5 pt-4 border-t border-black/[0.05] dark:border-white/[0.07]">
        <p className="mb-2 text-[16px] font-bold text-ink-strong">
          {t('newsEaCommentTitle')}
          {post.comment_count > 0 && (
            <span className="ml-1.5 text-brand tabular-nums">{post.comment_count}</span>
          )}
        </p>
        {/* key: 앨범을 바꾸면 쓰던 글·스티커 패널을 비운다 */}
        <EventAlbumCommentThread key={post.id} postId={post.id} variant="inline" />
      </section>
    </article>
  )
}

export default EventAlbumDetail
