// 행사 앨범 넘겨보기 (Single Responsibility: 모바일 전체 화면 몰입 열람)
// 행사 하나가 한 화면 — 위아래로 넘기면 다음/이전 행사, 좌우로 넘기면 그 행사의 사진.
// 반응·댓글은 오른쪽 세로 줄에 두어 엄지로 바로 누른다. 목록(EventAlbumList)에서 고른 앨범부터 열린다.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { EventAlbumPost } from '../../../types/eventAlbum'
import { useLanguage } from '../../../contexts/LanguageContext'
import { formatEventDate } from './eventAlbumDate'
import { EventAlbumEmojiImg } from './eventAlbumEmoji'
import { EVENT_ALBUM_EMOJI_META } from './eventAlbumEmojiMeta'
import { CommentIcon } from './EventAlbumReactionBar'

interface EventAlbumReelProps {
  posts: EventAlbumPost[]
  initialIndex: number
  onClose: () => void
  onToggleReaction: (postId: number, emoji: string) => void
  onOpenComments: (post: EventAlbumPost) => void
  onOpenEvent: (eventId: number) => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage: () => void
}

/** 진행 막대를 칸으로 쪼개는 최대 장수 — 넘으면 막대 대신 숫자만 */
const MAX_BARS = 12

const EventAlbumReel = ({
  posts,
  initialIndex,
  onClose,
  onToggleReaction,
  onOpenComments,
  onOpenEvent,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: EventAlbumReelProps) => {
  const { t } = useLanguage()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(initialIndex)

  useModalBackButton(onClose)
  useEscapeKey(onClose)

  // 고른 앨범에서 바로 열리도록 첫 그림 전에 위치를 맞춘다(애니메이션 없이)
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = initialIndex * el.clientHeight
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 처음 열 때 한 번만
  }, [])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || el.clientHeight === 0) return
    const next = Math.round(el.scrollTop / el.clientHeight)
    if (next !== current) setCurrent(next)
  }

  // 끝에서 두 번째 앨범에 닿으면 다음 쪽을 미리 불러 둔다
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && current >= posts.length - 2) fetchNextPage()
  }, [current, posts.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  // 키보드(태블릿·PC 창을 좁힌 경우): ↑↓ 로 행사를 넘긴다
  const step = useCallback((dir: 1 | -1) => {
    const el = scrollRef.current
    if (el) el.scrollBy({ top: dir * el.clientHeight, behavior: 'smooth' })
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        step(1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        step(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  return (
    <div className="fixed inset-0 z-[115] bg-black text-white" role="dialog" aria-modal="true" aria-label={t('newsEaTitle')}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory overscroll-contain scrollbar-hide"
      >
        {posts.map((post, i) => (
          <ReelItem
            key={post.id}
            post={post}
            // 지금 보는 앨범과 바로 위·아래만 사진을 다 싣는다 — 나머지는 표지 한 장
            near={Math.abs(i - current) <= 1}
            showHint={i === 0 && posts.length > 1}
            onToggleReaction={(emoji) => onToggleReaction(post.id, emoji)}
            onOpenComments={() => onOpenComments(post)}
            onOpenEvent={onOpenEvent}
          />
        ))}
        {isFetchingNextPage && (
          <div className="h-24 flex items-center justify-center snap-end">
            <div className="w-7 h-7 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 닫기 — 목록으로 돌아간다 */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('newsClose')}
        className="absolute left-3 w-11 h-11 rounded-full flex items-center justify-center bg-black/35 backdrop-blur-md text-white z-20"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 22px)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

// ── 한 행사 = 한 화면 ──────────────────────────────────
const ReelItem = ({
  post,
  near,
  showHint,
  onToggleReaction,
  onOpenComments,
  onOpenEvent,
}: {
  post: EventAlbumPost
  near: boolean
  showHint: boolean
  onToggleReaction: (emoji: string) => void
  onOpenComments: () => void
  onOpenEvent: (eventId: number) => void
}) => {
  const { t } = useLanguage()
  const photoRef = useRef<HTMLDivElement>(null)
  const [photoIndex, setPhotoIndex] = useState(0)

  const photos = near
    ? post.photos
    : post.photos.slice(0, 1)
  const total = post.photos.length

  const handlePhotoScroll = () => {
    const el = photoRef.current
    if (!el || el.clientWidth === 0) return
    const next = Math.round(el.scrollLeft / el.clientWidth)
    if (next !== photoIndex) setPhotoIndex(next)
  }

  return (
    <section className="relative h-full w-full snap-start snap-always overflow-hidden" aria-label={post.title}>
      {/* 사진 — 단체·풍경 사진이 많아 잘라내지 않고(contain) 검은 바탕에 띄운다 */}
      <div
        ref={photoRef}
        onScroll={handlePhotoScroll}
        className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {photos.length === 0 ? (
          <div className="w-full h-full shrink-0" />
        ) : (
          photos.map((photo, i) => (
            <div key={photo.id} className="w-full h-full shrink-0 snap-center flex items-center justify-center">
              <img
                src={photo.url}
                alt={`${post.title} ${i + 1} / ${total}`}
                draggable={false}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="max-w-full max-h-full object-contain select-none"
              />
            </div>
          ))
        )}
      </div>

      {/* 글자가 사진 위에서도 읽히게 위·아래만 어둡게 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      {/* 위: 진행 막대 + 몇 번째 사진 */}
      {total > 1 && (
        <div
          className="pointer-events-none absolute inset-x-3 flex flex-col gap-2"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
        >
          {total <= MAX_BARS ? (
            <div className="flex gap-[3px]">
              {post.photos.map((p, i) => (
                <span
                  key={p.id}
                  className={`h-[3px] flex-1 rounded-full ${i <= photoIndex ? 'bg-white' : 'bg-white/35'}`}
                />
              ))}
            </div>
          ) : (
            <div className="h-[3px] rounded-full bg-white/35 overflow-hidden">
              <span
                className="block h-full bg-white rounded-full transition-[width] duration-200"
                style={{ width: `${((photoIndex + 1) / total) * 100}%` }}
              />
            </div>
          )}
          <span className="self-end mt-1.5 px-2.5 h-7 inline-flex items-center rounded-full bg-black/35 backdrop-blur-md text-[13px] font-bold tabular-nums">
            {photoIndex + 1} / {total}
          </span>
        </div>
      )}

      {/* 오른쪽: 반응 + 댓글 */}
      <div className="absolute right-2.5 bottom-[calc(env(safe-area-inset-bottom,0px)+150px)] flex flex-col items-center gap-3">
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
              className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
            >
              <span
                className={[
                  'w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md',
                  active ? 'bg-[var(--brand)]/45 ring-2 ring-white' : 'bg-white/15',
                ].join(' ')}
              >
                <EventAlbumEmojiImg meta={meta} size={26} />
              </span>
              <span className="text-[12.5px] font-bold tabular-nums min-h-[1em] drop-shadow">
                {count > 0 ? count : ''}
              </span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onOpenComments}
          aria-label={t('newsNfViewComments')}
          className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
        >
          <span className="w-12 h-12 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-md">
            <CommentIcon size={22} />
          </span>
          <span className="text-[12.5px] font-bold tabular-nums drop-shadow">{post.comment_count}</span>
        </button>
      </div>

      {/* 아래: 행사 정보 */}
      <div
        className="absolute left-4 right-[76px]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 34px)' }}
      >
        <span className="inline-flex items-center px-2.5 h-6 rounded-full bg-white/20 backdrop-blur-md text-[12.5px] font-bold">
          {post.tag}
        </span>
        <h3 className="mt-2 text-[22px] font-bold leading-[1.3] tracking-[-0.025em] drop-shadow">
          {post.title}
        </h3>
        <p className="mt-1 text-[13.5px] text-white/80">
          {formatEventDate(post.event_date, t)} · {t('newsEaPhotoCount').replace('{n}', String(total))}
        </p>
        {post.caption && (
          <p className="mt-2 text-[14px] leading-[1.6] text-white/85 line-clamp-2 whitespace-pre-wrap">
            {post.caption}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {post.event_id != null && (
            <button
              type="button"
              onClick={() => onOpenEvent(post.event_id!)}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white text-[#191f28] text-[14px] font-bold active:scale-[0.97] transition-transform"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2.5" />
                <path d="M8 3v4M16 3v4M3 10h18" />
              </svg>
              {t('newsEaViewEvent')}
            </button>
          )}
          {post.reaction_count > 0 && (
            <span className="inline-flex items-center h-10 text-[13px] font-bold text-white/80">
              {t('newsEaReactedCount').replace('{n}', String(post.reaction_count))}
            </span>
          )}
        </div>
      </div>

      {showHint && (
        <p
          className="pointer-events-none absolute inset-x-0 text-center text-[12px] font-semibold text-white/60"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
        >
          {t('newsEaSwipeHint')}
        </p>
      )}
    </section>
  )
}

export default EventAlbumReel
