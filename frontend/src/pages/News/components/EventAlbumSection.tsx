import { Lock } from '../../../components/icons/phosphor'
// 행사 앨범 섹션 (/news 의 '행사' 탭 본문)
// Single Responsibility: 필터·목록 데이터와 열람 상태(선택·넘겨보기·뷰어·댓글) 관리
// 2026-11-12 E안 개편 — 피드 카드+모달 대신
//   PC(lg+): 왼쪽 앨범 목록 | 오른쪽 상세(사진 격자·반응·댓글) 2단
//   모바일: 연도별 앨범 목록 → 누르면 전체 화면 넘겨보기(위아래=행사, 좌우=사진)
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import EventAlbumCommentSheet from './EventAlbumCommentSheet'
import EventAlbumViewer from './EventAlbumViewer'
import EventAlbumList from './EventAlbumList'
import EventAlbumDetail from './EventAlbumDetail'
import EventAlbumReel from './EventAlbumReel'
import {
  invalidateEventAlbum,
  useEventAlbumOnThisDay,
  useEventAlbumPosts,
  useEventAlbumStats,
  useToggleEventAlbumReaction,
} from '../../../hooks/useEventAlbum'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
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

const EventAlbumSection = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const isLoggedIn = !!tokenStore.getAccess()
  const admin = can('content:manage')

  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  /** PC 2단에서 오른쪽에 펼친 앨범 (없으면 목록 첫 앨범) */
  const [selectedId, setSelectedId] = useState<number | null>(null)
  /** 목록 밖에서 들어온 앨범(딥링크·"그날의 추억") — 목록 맨 앞에 끼워 연다 */
  const [pinned, setPinned] = useState<EventAlbumPost | null>(null)
  /** 모바일 넘겨보기 — 열려 있으면 시작 앨범 id */
  const [reelStartId, setReelStartId] = useState<number | null>(null)
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

  // 목록 밖 앨범은 맨 앞에 붙인다. 목록에 이미 있으면 목록 쪽(반응이 실시간으로 반영되는 캐시)을 쓴다
  const listPosts = useMemo(
    () => (pinned && !posts.some((p) => p.id === pinned.id) ? [pinned, ...posts] : posts),
    [pinned, posts],
  )
  const selectedPost = listPosts.find((p) => p.id === selectedId) ?? listPosts[0] ?? null

  /** 앨범 하나를 연다 — PC 는 오른쪽 상세로, 모바일은 넘겨보기로 */
  const openAlbum = (post: EventAlbumPost, fromOutside = false) => {
    if (fromOutside) setPinned(post)
    if (isDesktop) setSelectedId(post.id)
    else setReelStartId(post.id)
  }

  // ── 딥링크: /news?tab=event-album&post=123 → 해당 앨범을 연다 ──
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
        if (!cancelled) openAlbum(post, true)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t·openAlbum: 딥링크는 한 번만 연다. 진행 중인 fetch 를 끊을 이유가 없다
  }, [isLoggedIn, postParam, setSearchParams])

  // 시트가 열려 있는 동안 목록이 갱신되면 최신 카운트로 따라가게 한다
  const activeCommentPost = commentPost
    ? listPosts.find((p) => p.id === commentPost.id) ?? commentPost
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
      if (pinned?.id === post.id) setPinned(null)
      if (selectedId === post.id) setSelectedId(null)
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
  const reelIndex = reelStartId != null ? listPosts.findIndex((p) => p.id === reelStartId) : -1

  const loadMoreButton = hasNextPage && !switching && !knownEmpty && (
    <div className="flex justify-center pt-4 pb-1">
      <button
        type="button"
        onClick={() => fetchNextPage()}
        disabled={isFetchingNextPage}
        className="px-5 h-10 lg:h-12 lg:px-7 rounded-full text-[12.5px] lg:text-[15.5px] font-bold text-[var(--brand)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition-colors disabled:opacity-50"
      >
        {isFetchingNextPage ? t('newsLoadingMore') : t('newsEaLoadMore')}
      </button>
    </div>
  )

  return (
    <div className="px-4 pt-3 pb-8 lg:px-6">
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

            {/* 모바일: 첫 앨범부터 넘겨보기 */}
            {!isDesktop && listPosts.length > 0 && (
              <button
                type="button"
                onClick={() => setReelStartId(listPosts[0].id)}
                className="ml-auto inline-flex items-center gap-1.5 pl-3 pr-3.5 h-10 rounded-full bg-brand text-white text-[13px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)] active:scale-[0.97] transition-transform"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                </svg>
                {t('newsEaSwipeView')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 태그 필터 — 가로 스크롤 칩 */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 lg:-mx-6 lg:px-6 pb-2">
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
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 lg:-mx-6 lg:px-6 pb-3">
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
        <OnThisDayCard posts={onThisDay!} onOpen={(post) => openAlbum(post, true)} />
      )}

      {/* 목록(+PC 상세) — 필터 전환 중엔 직전 목록을 흐리게 두고 누르지 못하게 */}
      <div
        className={`transition-opacity duration-150 ${switching ? 'opacity-50 pointer-events-none' : ''}`}
        aria-busy={switching}
      >
        {knownEmpty ? (
          <EmptyState filtered />
        ) : isLoading && !isPlaceholderData ? (
          <SkeletonList />
        ) : error ? (
          <ErrorState message={error instanceof Error ? error.message : t('newsLoadFailed')} />
        ) : listPosts.length === 0 ? (
          <EmptyState filtered={hasFilter} />
        ) : isDesktop ? (
          // PC 2단 — 목록은 화면에 붙어(sticky) 제 안에서 스크롤, 상세는 본문 흐름대로
          <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
            <div className="sticky top-[4.75rem] max-h-[calc((100vh-6rem)/var(--az,1))] overflow-y-auto overscroll-contain rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm px-2 pb-2">
              <EventAlbumList
                posts={listPosts}
                selectedId={selectedPost?.id}
                onSelect={(post) => setSelectedId(post.id)}
                isAdmin={admin}
              />
              {loadMoreButton}
            </div>
            {selectedPost && (
              <EventAlbumDetail
                post={selectedPost}
                isAdmin={admin}
                onToggleReaction={(emoji) => toggleReaction({ postId: selectedPost.id, emoji })}
                onOpenViewer={(index) => setViewer({ post: selectedPost, index })}
                onOpenEvent={(eventId) => navigate(`/events/${eventId}`)}
                onDelete={() => handleDelete(selectedPost)}
              />
            )}
          </div>
        ) : (
          <>
            <div className="rounded-3xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm px-2 pb-2">
              <EventAlbumList posts={listPosts} onSelect={(post) => openAlbum(post)} isAdmin={admin} />
            </div>
            {loadMoreButton}
          </>
        )}
      </div>

      {reelIndex >= 0 && (
        <EventAlbumReel
          posts={listPosts}
          initialIndex={reelIndex}
          onClose={() => setReelStartId(null)}
          onToggleReaction={(postId, emoji) => toggleReaction({ postId, emoji })}
          onOpenComments={(post) => setCommentPost(post)}
          onOpenEvent={(eventId) => navigate(`/events/${eventId}`)}
          hasNextPage={hasNextPage && !knownEmpty}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={() => void fetchNextPage()}
        />
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

const SkeletonList = () => (
  <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5">
    <div className="rounded-3xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] p-2 space-y-1 animate-pulse">
      <div className="h-6 w-14 mx-2 mt-2 rounded bg-gray-200/70 dark:bg-white/[0.06]" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <div className="w-[68px] h-[68px] lg:w-16 lg:h-16 rounded-xl bg-gray-200/70 dark:bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-200/70 dark:bg-white/[0.06]" />
            <div className="h-3 w-1/2 rounded bg-gray-200/50 dark:bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
    <div className="hidden lg:block h-[560px] rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
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
