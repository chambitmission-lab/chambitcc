// 행사 앨범 넘겨보기 (Single Responsibility: 모바일 전체 화면 몰입 열람)
// 행사 하나가 한 화면 — 위아래로 넘기면 다음/이전 행사, 좌우로 넘기면 그 행사의 사진.
// 화면은 위(행사 이름)·가운데(사진)·아래(반응·댓글 한 줄) 세 칸 — 사진 위에는 아무것도 얹지 않는다.
// 목록(EventAlbumList)에서 고른 앨범부터 열린다.
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
        className="absolute left-3 w-11 h-11 rounded-full flex items-center justify-center bg-white/15 text-white z-20"
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
    // 위(제목)·가운데(사진)·아래(반응) 세 칸으로 나눠, 사진 위에는 아무것도 얹지 않는다
    <section className="h-full w-full snap-start snap-always overflow-hidden flex flex-col" aria-label={post.title}>
      {/* 위: 진행 막대 + 행사 이름·날짜 + 몇 번째 사진 (닫기 버튼 자리만큼 왼쪽을 비운다) */}
      <header
        className="shrink-0 px-3 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
      >
        {total > 1 && total <= MAX_BARS ? (
          <div className="flex gap-[3px]">
            {post.photos.map((p, i) => (
              <span
                key={p.id}
                className={`h-[3px] flex-1 rounded-full ${i <= photoIndex ? 'bg-white' : 'bg-white/35'}`}
              />
            ))}
          </div>
        ) : total > 1 ? (
          <div className="h-[3px] rounded-full bg-white/35 overflow-hidden">
            <span
              className="block h-full bg-white rounded-full transition-[width] duration-200"
              style={{ width: `${((photoIndex + 1) / total) * 100}%` }}
            />
          </div>
        ) : (
          <div className="h-[3px]" />
        )}
        <div className="mt-[9px] min-h-11 pl-[52px] flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-bold leading-[1.3] tracking-[-0.025em] truncate">
              {post.title}
            </h3>
            <p className="mt-0.5 text-[12.5px] text-white/70 truncate">
              {post.tag} · {formatEventDate(post.event_date, t)} · {t('newsEaPhotoCount').replace('{n}', String(total))}
            </p>
          </div>
          {total > 1 && (
            <span className="shrink-0 px-2.5 h-7 inline-flex items-center rounded-full bg-white/15 text-[13px] font-bold tabular-nums">
              {photoIndex + 1} / {total}
            </span>
          )}
        </div>
      </header>

      {/* 가운데: 사진 — 단체·풍경 사진이 많아 잘라내지 않고(contain) 검은 바탕에 띄운다 */}
      <div className="relative flex-1 min-h-0">
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
      </div>

      {/* 아래: 설명 + 반응·댓글 한 줄 */}
      <footer
        className="shrink-0 px-3 pt-3"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${showHint ? 8 : 14}px)` }}
      >
        {post.caption && (
          <p className="px-1 text-[14px] leading-[1.6] text-white/85 line-clamp-2 whitespace-pre-wrap">
            {post.caption}
          </p>
        )}
        {post.event_id != null && (
          <button
            type="button"
            onClick={() => onOpenEvent(post.event_id!)}
            className="mt-2.5 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white text-[#191f28] text-[14px] font-bold active:scale-[0.97] transition-transform"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2.5" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
            {t('newsEaViewEvent')}
          </button>
        )}
        <div className="mt-3 grid grid-cols-5 gap-1.5">
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
                  'h-12 rounded-full flex items-center justify-center gap-1.5 active:scale-95 transition-transform',
                  active ? 'bg-[var(--brand)]/45 ring-2 ring-white' : 'bg-white/[0.13]',
                ].join(' ')}
              >
                <EventAlbumEmojiImg meta={meta} size={24} />
                {count > 0 && <span className="text-[13.5px] font-bold tabular-nums">{count}</span>}
              </button>
            )
          })}
          <button
            type="button"
            onClick={onOpenComments}
            aria-label={t('newsNfViewComments')}
            className="h-12 rounded-full flex items-center justify-center gap-1.5 bg-white/[0.13] active:scale-95 transition-transform"
          >
            <CommentIcon size={21} />
            <span className="text-[13.5px] font-bold tabular-nums">{post.comment_count}</span>
          </button>
        </div>
        {showHint && (
          <p className="pointer-events-none mt-2.5 text-center text-[12px] font-semibold text-white/60">
            {t('newsEaSwipeHint')}
          </p>
        )}
      </footer>
    </section>
  )
}

export default EventAlbumReel
