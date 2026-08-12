// 행사 앨범 포스트 카드 (Single Responsibility: 인스타형 포스트 한 장 표시)
// 새가족 카드(NewFamilyPostCard)를 미러링하되, 액센트는 브랜드 토큰(--brand)으로 통일한다.
import { useMemo, useState } from 'react'
import NewFamilyPhotoCarousel from './NewFamilyPhotoCarousel'
import { EVENT_ALBUM_EMOJI_META, EventAlbumEmojiImg } from './eventAlbumEmoji'
import { AnimatedEmojiText } from '../../../components/common/animatedEmoji'
import { eventAlbumTagEmoji } from '../../../types/eventAlbum'
import type { EventAlbumPost } from '../../../types/eventAlbum'

interface EventAlbumPostCardProps {
  post: EventAlbumPost
  onToggleReaction: (emoji: string) => void
  onOpenComments: () => void
  onOpenViewer: (photoIndex: number) => void
  /** 연결된 일정이 있을 때 "일정 보기" 배지 탭 */
  onOpenEvent?: (eventId: number) => void
  isAdmin?: boolean
  onDelete?: () => void
}

export const formatEventDate = (value: string): string => {
  // 'YYYY-MM-DD' — 타임존 보정 없이 그대로 읽는다 (행사일은 날짜 개념)
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return value
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = days[new Date(y, m - 1, d).getDay()]
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${weekday})`
}

const CAPTION_CLAMP = 90

const EventAlbumPostCard = ({
  post,
  onToggleReaction,
  onOpenComments,
  onOpenViewer,
  onOpenEvent,
  isAdmin,
  onDelete,
}: EventAlbumPostCardProps) => {
  const [expanded, setExpanded] = useState(false)

  const caption = post.caption ?? ''
  const needsClamp = caption.length > CAPTION_CLAMP && !expanded
  const shownCaption = needsClamp ? `${caption.slice(0, CAPTION_CLAMP)}…` : caption

  // 캐러셀은 새가족 것을 그대로 재사용 — 사진 필드명(url ↔ image_url)만 맞춰준다
  const carouselPhotos = useMemo(
    () =>
      post.photos.map((p) => ({ id: p.id, image_url: p.url, sort_order: p.sort_order })),
    [post.photos],
  )

  return (
    <article className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.3)]">
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-3xl" />

      {/* 헤더 */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white text-[17px] shadow-[0_4px_12px_-3px_var(--brand-glow)]">
          📸
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14.5px] font-bold text-ink-strong tracking-[-0.01em] truncate">
              {post.title}
            </span>
            {isAdmin && !post.is_published && (
              <span className="shrink-0 inline-flex items-center px-2 h-5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60 text-[10.5px] font-bold">
                비공개
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
            <p className="text-[11.5px] text-gray-500 dark:text-white/50 truncate">
              {formatEventDate(post.event_date)}
            </p>
            <span className="shrink-0 inline-flex items-center gap-0.5 px-2 h-5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-glow)] text-brand text-[10.5px] font-bold">
              <span aria-hidden="true">{eventAlbumTagEmoji(post.tag)}</span>
              {post.tag}
            </span>
          </div>
        </div>

        {post.event_id != null && onOpenEvent && (
          <button
            type="button"
            onClick={() => onOpenEvent(post.event_id!)}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-glow)] text-brand text-[11px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="2.5" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
            일정 보기
          </button>
        )}

        {isAdmin && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="삭제"
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 dark:text-white/40 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        )}
      </div>

      {/* 사진 캐러셀 — 행사 사진은 단체·풍경이 많아 4:5 크롭 대신 정사각이 안전하다 */}
      <div className="relative z-10">
        <NewFamilyPhotoCarousel
          photos={carouselPhotos}
          alt={post.title}
          onPhotoClick={onOpenViewer}
          ratio="1/1"
        />
      </div>

      {/* 리액션 바 */}
      <div className="relative z-10 flex items-center gap-1.5 px-3 pt-3 pb-1">
        {EVENT_ALBUM_EMOJI_META.map((meta) => {
          const count = post.reaction_breakdown[meta.char] ?? 0
          const active = post.my_reaction === meta.char
          return (
            <button
              key={meta.char}
              type="button"
              onClick={() => onToggleReaction(meta.char)}
              aria-label={meta.label}
              aria-pressed={active}
              className={[
                'inline-flex items-center gap-1 h-9 rounded-full border transition-all active:scale-90',
                count > 0 ? 'pl-1.5 pr-2.5' : 'px-1.5',
                active
                  ? 'bg-[var(--brand-soft-strong)] border-[var(--brand)] shadow-[0_2px_10px_-3px_var(--brand-glow)]'
                  : 'bg-gray-100/70 dark:bg-white/[0.05] border-gray-200/70 dark:border-white/[0.08] hover:bg-[var(--brand-soft)]',
              ].join(' ')}
            >
              <EventAlbumEmojiImg meta={meta} size={22} />
              {count > 0 && (
                <span
                  className={[
                    'text-[12px] font-bold tabular-nums',
                    active
                      ? 'text-[var(--brand)]'
                      : 'text-gray-600 dark:text-white/65',
                  ].join(' ')}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}

        <button
          type="button"
          onClick={onOpenComments}
          className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-gray-500 dark:text-white/60 hover:text-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors"
          aria-label="댓글 보기"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span className="text-[12.5px] font-bold tabular-nums">{post.comment_count}</span>
        </button>
      </div>

      {/* 리액션 수 요약 */}
      {post.reaction_count > 0 && (
        <p className="relative z-10 px-4 text-[12.5px] font-bold text-gray-700 dark:text-white/75">
          {post.reaction_count}명이 반응했어요
        </p>
      )}

      {/* 캡션 */}
      {caption && (
        <div className="relative z-10 px-4 pt-1.5">
          <AnimatedEmojiText
            content={shownCaption}
            className="text-[13.5px] leading-[1.65] text-gray-700 dark:text-white/80 whitespace-pre-wrap break-words"
          />
          {needsClamp && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-0.5 text-[12.5px] font-semibold text-gray-400 dark:text-white/40 hover:text-[var(--brand)] transition-colors"
            >
              더 보기
            </button>
          )}
        </div>
      )}

      {/* 댓글 진입 */}
      <div className="relative z-10 px-4 pt-2 pb-3.5">
        <button
          type="button"
          onClick={onOpenComments}
          className="text-[12.5px] font-semibold text-gray-400 dark:text-white/40 hover:text-[var(--brand)] transition-colors"
        >
          {post.comment_count > 0
            ? `댓글 ${post.comment_count}개 모두 보기`
            : '첫 댓글을 남겨보세요'}
        </button>
        <p className="text-[10.5px] text-gray-400 dark:text-white/30 mt-1">{post.time_ago}</p>
      </div>
    </article>
  )
}

export default EventAlbumPostCard
