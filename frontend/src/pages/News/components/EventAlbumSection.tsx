// 행사 앨범 섹션 (/news 의 '행사' 탭 본문)
// Single Responsibility: 행사 피드/그리드 구성과 필터·모달 상태 관리
// 새가족 섹션(NewFamilySection)을 미러링하되, 태그·연도 필터와 "N년 전 오늘" 회상 카드가 추가된다.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import EventAlbumPostCard from './EventAlbumPostCard'
import EventAlbumCommentSheet from './EventAlbumCommentSheet'
import EventAlbumViewer from './EventAlbumViewer'
import {
  invalidateEventAlbum,
  useEventAlbumOnThisDay,
  useEventAlbumPosts,
  useEventAlbumStats,
  useToggleEventAlbumReaction,
} from '../../../hooks/useEventAlbum'
import { deleteEventAlbumPost, fetchEventAlbumPost } from '../../../api/eventAlbum'
import { isAdmin } from '../../../utils/auth'
import { showToast } from '../../../utils/toast'
import { confirmDialog } from '../../../utils/confirmDialog'
import { EVENT_ALBUM_TAGS, eventAlbumTagEmoji } from '../../../types/eventAlbum'
import type { EventAlbumPost } from '../../../types/eventAlbum'

type ViewMode = 'feed' | 'grid'

const EventAlbumSection = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const isLoggedIn = !!localStorage.getItem('access_token')
  const admin = isAdmin()

  const [viewMode, setViewMode] = useState<ViewMode>('feed')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [commentPost, setCommentPost] = useState<EventAlbumPost | null>(null)
  const [viewer, setViewer] = useState<{ post: EventAlbumPost; index: number } | null>(null)

  const filter = useMemo(
    () => ({ tag: selectedTag ?? undefined, year: selectedYear ?? undefined }),
    [selectedTag, selectedYear],
  )

  const { posts, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage, error } =
    useEventAlbumPosts(filter, 10, isLoggedIn)
  const { data: stats } = useEventAlbumStats(isLoggedIn)
  const { data: onThisDay } = useEventAlbumOnThisDay(isLoggedIn)
  const { toggleReaction } = useToggleEventAlbumReaction()

  // ── 딥링크: /news?tab=event-album&post=123 → 해당 포스트 뷰어 자동 오픈 ──
  const openedDeepLink = useRef(false)
  const postParam = searchParams.get('post')
  useEffect(() => {
    if (!isLoggedIn || !postParam || openedDeepLink.current) return
    const postId = Number(postParam)
    if (!Number.isFinite(postId) || postId <= 0) return
    openedDeepLink.current = true

    let cancelled = false
    fetchEventAlbumPost(postId)
      .then((post) => {
        if (!cancelled) setViewer({ post, index: 0 })
      })
      .catch(() => {
        if (!cancelled) showToast('해당 행사 소식을 찾지 못했습니다', 'error')
      })
      .finally(() => {
        if (!cancelled) {
          // 파라미터를 지워 뒤로가기·새로고침 시 다시 열리지 않게 한다
          setSearchParams({ tab: 'event-album' }, { replace: true })
        }
      })
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, postParam, setSearchParams])

  // 시트가 열려 있는 동안 목록이 갱신되면 최신 카운트로 따라가게 한다
  const activeCommentPost = commentPost
    ? posts.find((p) => p.id === commentPost.id) ?? commentPost
    : null

  const handleDelete = async (post: EventAlbumPost) => {
    if (
      !(await confirmDialog({
        title: '행사 앨범 삭제',
        message: `"${post.title}" 앨범을 삭제할까요?`,
        description: '등록된 사진과 댓글도 함께 삭제됩니다.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteEventAlbumPost(post.id)
      showToast('삭제되었습니다', 'success')
      invalidateEventAlbum(queryClient)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  // ── 비로그인: 초상권 보호를 위해 목록 자체를 가린다 ──
  if (!isLoggedIn) {
    return (
      <div className="px-4 pt-3 pb-8">
        <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] px-6 py-12 text-center">
          <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] mb-3">
              <span className="text-[28px]">🔒</span>
            </div>
            <p className="text-ink-strong text-[15px] font-bold mb-1.5">
              성도님만 볼 수 있어요
            </p>
            <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.65] mb-5">
              행사 사진에는 성도들의 얼굴이 담겨 있어
              <br />
              로그인한 성도에게만 공개됩니다
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] active:scale-[0.98] transition-all"
            >
              로그인하고 보기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const years = stats?.years ?? []
  const hasFilter = selectedTag !== null || selectedYear !== null

  return (
    <div className="px-4 pt-3 pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.3)] p-5 mb-4">
        <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-[var(--brand-soft-strong)] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-brand flex items-center justify-center text-[20px] shadow-[0_6px_18px_-6px_var(--brand-glow)]">
              📸
            </div>
            <div>
              <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">
                EVENT ALBUM
              </p>
              <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
                행사 앨범
              </h2>
            </div>
          </div>

          <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6] mb-4">
            함께한 예배와 행사의 순간들을 모았습니다. 추억에 반응을 남겨주세요.
          </p>

          <div className="flex items-center gap-5">
            <HeroStat label="앨범" value={stats?.total_posts ?? 0} />
            <HeroStat label="사진" value={stats?.total_photos ?? 0} />
            <HeroStat label="연도" value={years.length} />

            {/* 뷰 전환 */}
            <div className="ml-auto inline-flex p-0.5 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.06]">
              <ViewToggle active={viewMode === 'feed'} onClick={() => setViewMode('feed')} label="피드로 보기">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="8" rx="2" />
                  <rect x="3" y="13" width="18" height="8" rx="2" />
                </svg>
              </ViewToggle>
              <ViewToggle active={viewMode === 'grid'} onClick={() => setViewMode('grid')} label="그리드로 보기">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </ViewToggle>
            </div>
          </div>
        </div>
      </div>

      {/* 태그 필터 — 가로 스크롤 칩 */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
        <FilterPill active={selectedTag === null} onClick={() => setSelectedTag(null)}>
          전체
        </FilterPill>
        {EVENT_ALBUM_TAGS.map((tag) => {
          const count = stats?.tags?.[tag] ?? 0
          return (
            <FilterPill
              key={tag}
              active={selectedTag === tag}
              onClick={() => setSelectedTag((prev) => (prev === tag ? null : tag))}
            >
              <span aria-hidden="true" className="mr-1">
                {eventAlbumTagEmoji(tag)}
              </span>
              {tag}
              {count > 0 && (
                <span className="ml-1 text-[10.5px] font-bold tabular-nums opacity-70">
                  {count}
                </span>
              )}
            </FilterPill>
          )
        })}
      </div>

      {/* 연도 필터 — stats.years 기반 */}
      {years.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-3">
          <FilterPill active={selectedYear === null} onClick={() => setSelectedYear(null)}>
            모든 해
          </FilterPill>
          {years.map((year) => (
            <FilterPill
              key={year}
              active={selectedYear === year}
              onClick={() => setSelectedYear((prev) => (prev === year ? null : year))}
            >
              {year}년
            </FilterPill>
          ))}
        </div>
      )}

      {/* "N년 전 오늘" 회상 카드 — 필터가 없을 때만, 결과 있을 때만 */}
      {!hasFilter && (onThisDay?.length ?? 0) > 0 && (
        <OnThisDayCard
          posts={onThisDay!}
          onOpen={(post) => setViewer({ post, index: 0 })}
        />
      )}

      {/* 목록 */}
      {isLoading ? (
        <SkeletonFeed />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : '불러오지 못했습니다'} />
      ) : posts.length === 0 ? (
        <EmptyState filtered={hasFilter} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setViewer({ post, index: 0 })}
              className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-white/[0.04] active:scale-[0.97] transition-transform"
            >
              {post.cover_url ? (
                <img
                  src={post.cover_url}
                  alt={post.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[22px]">
                  📸
                </span>
              )}
              {post.photo_count > 1 && (
                <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold flex items-center justify-center">
                  {post.photo_count}
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 px-1.5 py-1 bg-gradient-to-t from-black/75 to-transparent text-white text-[10px] font-bold truncate text-left">
                {post.title}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <EventAlbumPostCard
              key={post.id}
              post={post}
              isAdmin={admin}
              onToggleReaction={(emoji) => toggleReaction({ postId: post.id, emoji })}
              onOpenComments={() => setCommentPost(post)}
              onOpenViewer={(index) => setViewer({ post, index })}
              onOpenEvent={(eventId) => navigate(`/events/${eventId}`)}
              onDelete={() => handleDelete(post)}
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-5">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-5 h-10 rounded-full text-[12.5px] font-bold text-[var(--brand)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? '불러오는 중...' : '지난 행사 더 보기'}
          </button>
        </div>
      )}

      {activeCommentPost && (
        <EventAlbumCommentSheet post={activeCommentPost} onClose={() => setCommentPost(null)} />
      )}
      {viewer && (
        <EventAlbumViewer
          post={viewer.post}
          initialIndex={viewer.index}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  )
}

// ── "N년 전 오늘" 회상 카드 ──────────────────────────────
const yearsAgoLabel = (eventDate: string): string => {
  const year = Number(eventDate.slice(0, 4))
  const diff = new Date().getFullYear() - year
  return diff <= 1 ? '1년 전 오늘' : `${diff}년 전 오늘`
}

const OnThisDayCard = ({
  posts,
  onOpen,
}: {
  posts: EventAlbumPost[]
  onOpen: (post: EventAlbumPost) => void
}) => (
  <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] p-4 mb-4">
    <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />

    <div className="relative z-10">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[15px]" aria-hidden="true">
          🕰️
        </span>
        <p className="text-[12.5px] font-bold text-ink-strong tracking-[-0.01em]">
          그날의 추억
        </p>
        <p className="text-[11px] text-gray-400 dark:text-white/40 ml-auto">
          이맘때 함께했던 순간
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {posts.map((post) => (
          <button
            key={post.id}
            type="button"
            onClick={() => onOpen(post)}
            className="relative shrink-0 w-24 aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.04] active:scale-[0.97] transition-transform"
          >
            {post.cover_url ? (
              <img
                src={post.cover_url}
                alt={post.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[20px]">
                📸
              </span>
            )}
            <span className="absolute top-1 left-1 inline-flex items-center px-1.5 h-5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[9px] font-bold">
              {yearsAgoLabel(post.event_date)}
            </span>
            <span className="absolute inset-x-0 bottom-0 px-1.5 py-1 bg-gradient-to-t from-black/75 to-transparent text-white text-[9.5px] font-bold truncate text-left">
              {post.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
)

// ── 작은 컴포넌트들 ────────────────────────────────────
const HeroStat = ({ label, value }: { label: string; value: number }) => (
  <div>
    <p className="text-[10.5px] font-semibold text-gray-400 dark:text-white/40 mb-0.5">{label}</p>
    <p className="text-[20px] font-bold leading-none brand-text-gradient tabular-nums">
      {value}
    </p>
  </div>
)

const FilterPill = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={[
      'shrink-0 inline-flex items-center px-3 h-8 rounded-full text-[11.5px] font-bold border whitespace-nowrap transition-colors',
      active
        ? 'bg-[var(--brand-soft-strong)] border-[var(--brand-glow)] text-brand'
        : 'bg-white/80 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/60 hover:bg-[var(--brand-soft)] hover:text-brand',
    ].join(' ')}
  >
    {children}
  </button>
)

const ViewToggle = ({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
    className={[
      'w-8 h-8 rounded-full flex items-center justify-center transition-all',
      active
        ? 'bg-brand text-white shadow-[0_3px_10px_-3px_var(--brand-glow)]'
        : 'text-gray-500 dark:text-white/50 hover:text-brand',
    ].join(' ')}
  >
    {children}
  </button>
)

const SkeletonFeed = () => (
  <div className="space-y-4">
    {Array.from({ length: 2 }).map((_, i) => (
      <div
        key={i}
        className="rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] overflow-hidden animate-pulse"
      >
        <div className="h-16" />
        <div className="aspect-square bg-gray-200/60 dark:bg-white/[0.05]" />
        <div className="h-20" />
      </div>
    ))}
  </div>
)

const EmptyState = ({ filtered }: { filtered: boolean }) => (
  <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] py-12 px-6 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] mb-3">
      <span className="text-[28px]">📸</span>
    </div>
    <p className="text-ink-strong text-[14.5px] font-bold mb-1">
      {filtered ? '조건에 맞는 앨범이 없어요' : '아직 등록된 행사 앨범이 없어요'}
    </p>
    <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
      {filtered
        ? '태그나 연도를 바꿔서 다시 찾아보세요'
        : '행사 사진이 올라오면 이곳에서 만나볼 수 있어요'}
    </p>
  </div>
)

const ErrorState = ({ message }: { message: string }) => (
  <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 py-8 px-6 text-center">
    <p className="text-red-600 dark:text-red-300 text-[13px] font-semibold">{message}</p>
  </div>
)

export default EventAlbumSection
