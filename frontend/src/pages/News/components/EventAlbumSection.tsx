import { Lock } from '../../../components/icons/phosphor'
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
import { tokenStore } from '../../../utils/tokenStore'
import { deleteEventAlbumPost, fetchEventAlbumPost } from '../../../api/eventAlbum'
import { showToast, toastFeedback } from '../../../utils/toast'
import { confirmDialog } from '../../../utils/confirmDialog'
import { EVENT_ALBUM_TAGS } from '../../../types/eventAlbum'
import type { EventAlbumPost } from '../../../types/eventAlbum'
import { AlbumIcon } from './NewsIcons'
import { EventTagIcon } from './NewsIcons'
import '../news-hero.css'
import { can } from '../../../utils/access'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { Translate } from '../../../locales'

type ViewMode = 'feed' | 'grid'

const EventAlbumSection = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const isLoggedIn = !!tokenStore.getAccess()
  const admin = can('content:manage')

  const [viewMode, setViewMode] = useState<ViewMode>('feed')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [commentPost, setCommentPost] = useState<EventAlbumPost | null>(null)
  const [viewer, setViewer] = useState<{ post: EventAlbumPost; index: number } | null>(null)

  const filter = useMemo(
    () => ({ tag: selectedTag ?? undefined, year: selectedYear ?? undefined }),
    [selectedTag, selectedYear],
  )

  const { data: stats } = useEventAlbumStats(isLoggedIn)
  // 연도 없이 태그만 골랐고 통계상 그 태그가 0건이면 서버에 물을 것도 없다 — 바로 빈 화면
  const knownEmpty =
    selectedYear === null && selectedTag !== null && !!stats && (stats.tags?.[selectedTag] ?? 0) === 0
  const { posts, isLoading, isPlaceholderData, hasNextPage, isFetchingNextPage, fetchNextPage, error } =
    useEventAlbumPosts(filter, 10, isLoggedIn && !knownEmpty)
  // 필터를 바꾼 직후 — 새 결과가 오기 전까지 직전 목록을 흐리게 남겨 둔다
  const switching = isPlaceholderData && !knownEmpty
  const { data: onThisDay } = useEventAlbumOnThisDay(isLoggedIn)
  const { toggleReaction } = useToggleEventAlbumReaction(toastFeedback({ error: t('newsEaReactionFailed') }))

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
        if (!cancelled) showToast(t('newsEaNotFound'), 'error')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t: 딥링크는 한 번만 연다. 언어가 바뀌었다고 진행 중인 fetch 를 끊을 이유가 없다
  }, [isLoggedIn, postParam, setSearchParams])

  // 시트가 열려 있는 동안 목록이 갱신되면 최신 카운트로 따라가게 한다
  const activeCommentPost = commentPost
    ? posts.find((p) => p.id === commentPost.id) ?? commentPost
    : null

  const handleDelete = async (post: EventAlbumPost) => {
    if (
      !(await confirmDialog({
        title: t('newsEaDeleteTitle'),
        message: t('newsEaDeleteMessage').replace('{title}', post.title),
        description: t('newsEaDeleteDescription'),
        confirmText: t('newsDelete'),
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteEventAlbumPost(post.id)
      showToast(t('newsEaDeleted'), 'success')
      invalidateEventAlbum(queryClient)
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('newsEaDeleteFailed'), 'error')
    }
  }

  // ── 비로그인: 초상권 보호를 위해 목록 자체를 가린다 ──
  if (!isLoggedIn) {
    return (
      <div className="px-4 pt-3 pb-8">
        <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] px-6 py-12 text-center">
          <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] text-brand mb-3">
              <Lock size={30} weight="duotone" color="currentColor" aria-hidden="true" />
            </div>
            <p className="text-ink-strong text-[15px] lg:text-[18px] font-bold mb-1.5">
              {t('newsGateTitle')}
            </p>
            <p className="text-gray-500 dark:text-white/55 text-[12.5px] lg:text-[15.5px] leading-[1.65] mb-5">
              {t('newsGateEventLine1')}
              <br />
              {t('newsGateLine2')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-brand hover:bg-brand-dim text-white text-[13.5px] lg:text-[16.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] active:scale-[0.98] transition-all"
            >
              {t('newsGateCta')}
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
      {/* Hero — 배경 삽화는 news-hero.css(.nh-hero--album).
          그림은 오른쪽 끝에 높이맞춤으로 서고, 왼쪽·아래는 알파로 카드에 녹는다 */}
      <div className="nh-hero nh-hero--album relative overflow-hidden rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] p-5 mb-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-brand text-white flex items-center justify-center shadow-[0_6px_18px_-6px_var(--brand-glow)]">
              <AlbumIcon width={23} height={23} />
            </div>
            <div>
              <p className="text-brand text-[10.5px] lg:text-[13px] font-bold tracking-[0.12em] uppercase">
                EVENT ALBUM
              </p>
              <h2 className="text-ink-strong text-[17px] lg:text-[22px] font-bold tracking-[-0.015em]">
                {t('newsEaTitle')}
              </h2>
            </div>
          </div>

          {/* 글줄이 삽화 위로 넘어가지 않게 폭을 잡는다 — 삽화 위치가 바뀌면 이 값도 다시 볼 것 */}
          <p className="text-gray-500 dark:text-white/55 text-[12.5px] lg:text-[15.5px] leading-[1.6] mb-4 max-w-[60%] lg:max-w-[52%]">
            {t('newsEaIntro')}
          </p>

          {/* PC 에선 삽화(오른쪽 43%)를 덮지 않게 글 칼럼 폭에 맞춘다 */}
          <div className="flex items-center gap-5 lg:max-w-[52%]">
            <HeroStat label={t('newsEaStatPosts')} value={stats?.total_posts ?? 0} />
            <HeroStat label={t('newsEaStatPhotos')} value={stats?.total_photos ?? 0} />
            <HeroStat label={t('newsEaStatYears')} value={years.length} />

            {/* 뷰 전환 */}
            <div className="ml-auto inline-flex p-0.5 rounded-full bg-gray-100/90 dark:bg-white/[0.05] backdrop-blur-sm border border-gray-200/70 dark:border-white/[0.06]">
              <ViewToggle active={viewMode === 'feed'} onClick={() => setViewMode('feed')} label={t('newsNfViewFeed')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="8" rx="2" />
                  <rect x="3" y="13" width="18" height="8" rx="2" />
                </svg>
              </ViewToggle>
              <ViewToggle active={viewMode === 'grid'} onClick={() => setViewMode('grid')} label={t('newsNfViewGrid')}>
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
          {t('newsEaTagAll')}
        </FilterPill>
        {EVENT_ALBUM_TAGS.map((tag) => {
          const count = stats?.tags?.[tag] ?? 0
          return (
            <FilterPill
              key={tag}
              active={selectedTag === tag}
              onClick={() => setSelectedTag((prev) => (prev === tag ? null : tag))}
            >
              <EventTagIcon tag={tag} width={14} height={14} className="mr-1 shrink-0" />
              {tag}
              {count > 0 && (
                <span className="ml-1 text-[10.5px] lg:text-[13px] font-bold tabular-nums opacity-70">
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
            {t('newsEaYearAll')}
          </FilterPill>
          {years.map((year) => (
            <FilterPill
              key={year}
              active={selectedYear === year}
              onClick={() => setSelectedYear((prev) => (prev === year ? null : year))}
            >
              {t('newsEaYear').replace('{year}', String(year))}
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

      {/* 목록 — 필터 전환 중엔 직전 목록을 흐리게 두고 누르지 못하게 */}
      <div
        className={`transition-opacity duration-150 ${switching ? 'opacity-50 pointer-events-none' : ''}`}
        aria-busy={switching}
      >
      {knownEmpty ? (
        <EmptyState filtered />
      ) : isLoading && !isPlaceholderData ? (
        <SkeletonFeed />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : t('newsLoadFailed')} />
      ) : posts.length === 0 ? (
        <EmptyState filtered={hasFilter} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-3 gap-1 lg:grid-cols-4 lg:gap-1.5">
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
                <span className="absolute inset-0 flex items-center justify-center text-brand opacity-55">
                  <AlbumIcon width={24} height={24} />
                </span>
              )}
              {post.photo_count > 1 && (
                <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[9px] lg:text-[11.5px] font-bold flex items-center justify-center">
                  {post.photo_count}
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 px-1.5 py-1 bg-gradient-to-t from-black/75 to-transparent text-white text-[10px] lg:text-[12.5px] font-bold truncate text-left">
                {post.title}
              </span>
            </button>
          ))}
        </div>
      ) : (
        // lg+: 넓어진 본문을 한 줄로만 쓰지 않도록 2열 카드 그리드
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 lg:items-start">
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
      </div>

      {hasNextPage && !switching && !knownEmpty && (
        <div className="flex justify-center pt-5">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-5 h-10 lg:h-12 lg:px-7 rounded-full text-[12.5px] lg:text-[15.5px] font-bold text-[var(--brand)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? t('newsLoadingMore') : t('newsEaLoadMore')}
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
const yearsAgoLabel = (eventDate: string, t: Translate): string => {
  const year = Number(eventDate.slice(0, 4))
  const diff = new Date().getFullYear() - year
  return diff <= 1
    ? t('newsEaAnniversaryToday')
    : t('newsEaAnniversaryYears').replace('{n}', String(diff))
}

const OnThisDayCard = ({
  posts,
  onOpen,
}: {
  posts: EventAlbumPost[]
  onOpen: (post: EventAlbumPost) => void
}) => {
  const { t } = useLanguage()
  return (
  <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] p-4 mb-4">
    <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />

    <div className="relative z-10">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[15px] lg:text-[18px]" aria-hidden="true">
          🕰️
        </span>
        <p className="text-[12.5px] lg:text-[15.5px] font-bold text-ink-strong tracking-[-0.01em]">
          {t('newsEaMemoryTitle')}
        </p>
        <p className="text-[11px] lg:text-[13.5px] text-gray-400 dark:text-white/40 ml-auto">
          {t('newsEaMemorySubtitle')}
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
              <span className="absolute inset-0 flex items-center justify-center text-brand opacity-55">
                <AlbumIcon width={22} height={22} />
              </span>
            )}
            <span className="absolute top-1 left-1 inline-flex items-center px-1.5 h-5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[9px] lg:text-[11.5px] font-bold">
              {yearsAgoLabel(post.event_date, t)}
            </span>
            <span className="absolute inset-x-0 bottom-0 px-1.5 py-1 bg-gradient-to-t from-black/75 to-transparent text-white text-[9.5px] lg:text-[12px] font-bold truncate text-left">
              {post.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
  )
}

// ── 작은 컴포넌트들 ────────────────────────────────────
const HeroStat = ({ label, value }: { label: string; value: number }) => (
  <div>
    <p className="text-[10.5px] lg:text-[13px] font-semibold text-gray-400 dark:text-white/40 mb-0.5">{label}</p>
    <p className="text-[20px] lg:text-[25px] font-bold leading-none brand-text-gradient tabular-nums">
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
      'shrink-0 inline-flex items-center px-3 h-8 lg:h-10 lg:px-4 rounded-full text-[11.5px] lg:text-[14.5px] font-bold border whitespace-nowrap transition-colors',
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
  <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
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

const EmptyState = ({ filtered }: { filtered: boolean }) => {
  const { t } = useLanguage()
  return (
  <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] py-12 px-6 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] mb-3">
      <AlbumIcon width={30} height={30} className="text-brand" />
    </div>
    <p className="text-ink-strong text-[14.5px] lg:text-[18px] font-bold mb-1">
      {t(filtered ? 'newsEaEmptyFilteredTitle' : 'newsEaEmptyTitle')}
    </p>
    <p className="text-gray-500 dark:text-white/55 text-[12.5px] lg:text-[15.5px] leading-[1.6]">
      {t(filtered ? 'newsEaEmptyFilteredDesc' : 'newsEaEmptyDesc')}
    </p>
  </div>
  )
}

const ErrorState = ({ message }: { message: string }) => (
  <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 py-8 px-6 text-center">
    <p className="text-red-600 dark:text-red-300 text-[13px] lg:text-[16px] font-semibold">{message}</p>
  </div>
)

export default EventAlbumSection
