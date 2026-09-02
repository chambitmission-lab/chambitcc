// 행사 앨범 관리 (NewFamilyManagement 미러링)
// 컴팩트 한 줄 행 + accordion expand + 검색/필터/정렬 한 카드 + 통계 chip + FAB composer
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import {
  deleteEventAlbumPost,
  fetchEventAlbumPosts,
  updateEventAlbumPost,
} from '../../api/eventAlbum'
import { invalidateEventAlbum } from '../../hooks/useEventAlbum'
import { EVENT_ALBUM_TAGS } from '../../types/eventAlbum'
import type { EventAlbumPost } from '../../types/eventAlbum'
import EventAlbumComposer from './components/EventAlbumComposer'
import { FilterChip, FilterRow } from './components/FilterControls'
import { confirmDialog } from '../../utils/confirmDialog'
import { EventTagIcon } from '../News/components/NewsIcons'

type VisibilityFilter = 'all' | 'published' | 'hidden'
type SortKey = 'recent' | 'oldest' | 'reaction'

const formatDateLabel = (value: string) => {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return value
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = days[new Date(y, m - 1, d).getDay()]
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${weekday})`
}

const isThisYear = (value: string): boolean =>
  Number(value.slice(0, 4)) === new Date().getFullYear()

const EventAlbumManagement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [posts, setPosts] = useState<EventAlbumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [visibility, setVisibility] = useState<VisibilityFilter>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  // null = 닫힘, 'new' = 등록, EventAlbumPost = 수정
  const [composer, setComposer] = useState<'new' | EventAlbumPost | null>(null)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  const loadPosts = async () => {
    try {
      setLoading(true)
      // 관리자는 비공개 포스트도 함께 내려받는다 (백엔드에서 is_admin으로 분기)
      const response = await fetchEventAlbumPosts(1, 50)
      setPosts(response.data.items)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '목록을 불러오지 못했습니다', 'error')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  /** 관리 화면 mutation 뒤 — /news 목록(비활성 캐시)까지 최신화 */
  const refreshEverywhere = () => {
    invalidateEventAlbum(queryClient)
    loadPosts()
  }

  const handleDelete = async (post: EventAlbumPost) => {
    if (
      !(await confirmDialog({
        title: '행사 앨범 삭제',
        message: `"${post.title}" 앨범을 삭제하시겠습니까?`,
        description: '등록된 사진과 댓글도 함께 삭제됩니다.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteEventAlbumPost(post.id)
      showToast('삭제되었습니다', 'success')
      refreshEverywhere()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  const handleToggleVisibility = async (post: EventAlbumPost) => {
    try {
      const updated = await updateEventAlbumPost(post.id, { is_published: !post.is_published })
      setPosts(prev => prev.map(p => (p.id === post.id ? { ...p, ...updated } : p)))
      invalidateEventAlbum(queryClient)
      showToast(updated.is_published ? '공개로 전환했어요' : '비공개로 전환했어요', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '변경에 실패했습니다', 'error')
    }
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const arr = posts.filter(p => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q) ||
        (p.caption?.toLowerCase().includes(q) ?? false)
      const matchesVisibility =
        visibility === 'all' ||
        (visibility === 'published' && p.is_published) ||
        (visibility === 'hidden' && !p.is_published)
      const matchesTag = tagFilter === 'all' || p.tag === tagFilter
      return matchesSearch && matchesVisibility && matchesTag
    })
    return [...arr].sort((a, b) => {
      if (sortKey === 'reaction') return b.reaction_count - a.reaction_count
      const at = a.event_date
      const bt = b.event_date
      return sortKey === 'recent' ? bt.localeCompare(at) : at.localeCompare(bt)
    })
  }, [posts, searchTerm, visibility, tagFilter, sortKey])

  const thisYearCount = posts.filter(p => isThisYear(p.event_date)).length
  const hiddenCount = posts.filter(p => !p.is_published).length

  return (
    // lg 에선 이 페이지만 스스로 스크롤하는 상자로 만든다 — #root 의 overflow-y 탓에
    // sticky 가 전역으로 죽어 있어, 이 상자가 있어야 우측 도구 레일 sticky 가 산다.
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:h-[calc(100vh-56px)] lg:min-h-0 lg:overflow-y-auto">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-24 lg:max-w-[1100px] lg:mt-2 lg:mb-10 lg:min-h-0 lg:pb-8 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark">
        {/* 헤더 — lg 에선 검색/필터가 우측 레일에 고정되므로 sticky 를 풀어 둔다
            (sticky 인 채로 라운드 모서리를 주면 스크롤 중 둥근 막대가 떠 보인다) */}
        <div className="sticky top-0 lg:static lg:rounded-t-3xl z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">
            행사 앨범 관리
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* PC(lg+) 2단 — 좌: 앨범 목록 / 우: 도구(등록·통계·검색/필터)가 sticky.
            래퍼 3개는 lg 미만에서 display:contents 라 모바일 흐름은 기존과 완전히 동일하다. */}
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:items-start lg:px-5 lg:pt-4">
          <div className="contents lg:block lg:col-start-2 lg:row-start-1 lg:sticky lg:top-3 lg:space-y-3">
            {/* PC 전용 등록 버튼 — lg 에선 FAB 대신 레일 상단에서 연다 */}
            <button
              type="button"
              onClick={() => setComposer('new')}
              className="hidden lg:flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>행사 앨범</span>
            </button>

            {/* 통계 */}
            <div className="px-4 pt-4 pb-1 lg:px-0 lg:pt-0 flex gap-2 flex-wrap">
              <StatChip label="전체" value={posts.length} />
              <StatChip label="올해" value={thisYearCount} accent />
              <StatChip label="비공개" value={hiddenCount} />
            </div>

            {/* 검색 + 필터 */}
            <div className="px-4 py-3 lg:px-0 lg:py-0">
              <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] p-4">
                <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />

                <div className="relative z-10 space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="제목 · 태그 · 캡션 검색"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand transition-colors"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 p-1 rounded-full"
                        aria-label="검색어 지우기"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <FilterRow label="태그">
                    <FilterChip active={tagFilter === 'all'} onClick={() => setTagFilter('all')}>
                      전체
                    </FilterChip>
                    {EVENT_ALBUM_TAGS.map(t => (
                      <FilterChip key={t} active={tagFilter === t} onClick={() => setTagFilter(t)}>
                        {t}
                      </FilterChip>
                    ))}
                  </FilterRow>

                  <FilterRow label="공개">
                    {(
                      [
                        ['all', '전체'],
                        ['published', '공개'],
                        ['hidden', '비공개'],
                      ] as const
                    ).map(([v, l]) => (
                      <FilterChip key={v} active={visibility === v} onClick={() => setVisibility(v)}>
                        {l}
                      </FilterChip>
                    ))}
                  </FilterRow>

                  <FilterRow label="정렬">
                    {(
                      [
                        ['recent', '최신순'],
                        ['oldest', '오래된순'],
                        ['reaction', '반응 많은순'],
                      ] as const
                    ).map(([v, l]) => (
                      <FilterChip key={v} active={sortKey === v} onClick={() => setSortKey(v)}>
                        {l}
                      </FilterChip>
                    ))}
                  </FilterRow>
                </div>
              </div>
            </div>

            {/* 결과 카운트 */}
            <div className="px-5 pb-2 lg:px-1 lg:pb-0 text-[12px] text-gray-500 dark:text-white/55 flex items-center gap-2">
              <span>
                검색 결과 <span className="font-bold text-ink-strong">{filtered.length}</span>건
              </span>
              {searchTerm && (
                <span className="text-brand truncate">"{searchTerm}"</span>
              )}
            </div>

          </div>

          <div className="contents lg:block lg:col-start-1 lg:row-start-1 lg:min-w-0">
            {/* 목록 */}
            <div className="px-4 pb-32 lg:px-0 lg:pb-8 space-y-2">
              {loading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">📸</span>
                  <p className="text-[13px] text-gray-500 dark:text-white/55">
                    {searchTerm || visibility !== 'all' || tagFilter !== 'all'
                      ? '조건에 맞는 앨범이 없습니다'
                      : '아직 등록된 행사 앨범이 없어요'}
                  </p>
                  <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
                    {searchTerm || visibility !== 'all' || tagFilter !== 'all'
                      ? '필터를 바꾸거나 검색어를 지워보세요'
                      : '＋ 행사 앨범 버튼으로 등록해 보세요'}
                  </p>
                </div>
              ) : (
                filtered.map(post => (
                  <PostRow
                    key={post.id}
                    post={post}
                    expanded={expandedId === post.id}
                    onToggleExpand={() =>
                      setExpandedId(prev => (prev === post.id ? null : post.id))
                    }
                    onDelete={() => handleDelete(post)}
                    onEdit={() => setComposer(post)}
                    onToggleVisibility={() => handleToggleVisibility(post)}
                    onView={() => navigate('/news?tab=event-album')}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* FAB */}
        <button
          type="button"
          onClick={() => setComposer('new')}
          className="fixed bottom-6 right-1/2 translate-x-[calc(min(50vw,14rem)-3.5rem)] z-30 lg:hidden inline-flex items-center gap-2 pl-4 pr-5 h-13 py-3 rounded-full bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_10px_30px_-6px_var(--brand-glow)] hover:-translate-y-0.5 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>행사 앨범</span>
        </button>

        {composer && (
          <EventAlbumComposer
            // key — 다른 포스트를 연속으로 수정할 때 폼 상태가 남지 않도록 재마운트
            key={composer === 'new' ? 'new' : composer.id}
            post={composer === 'new' ? undefined : composer}
            onClose={() => setComposer(null)}
            onSuccess={() => {
              setComposer(null)
              refreshEverywhere()
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── Row ───────────────────────────────────────────────
interface PostRowProps {
  post: EventAlbumPost
  expanded: boolean
  onToggleExpand: () => void
  onDelete: () => void
  onEdit: () => void
  onToggleVisibility: () => void
  onView: () => void
}

const PostRow = ({
  post,
  expanded,
  onToggleExpand,
  onDelete,
  onEdit,
  onToggleVisibility,
  onView,
}: PostRowProps) => {
  const isCurrent = isThisYear(post.event_date)
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border transition-all duration-200',
        'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]',
        expanded
          ? 'border-[var(--brand-glow)]'
          : 'border-gray-200/70 dark:border-white/[0.08]',
      ].join(' ')}
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      {/* 공개된 글만 브랜드 솔리드, 비공개는 중립 회색 */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          post.is_published ? 'bg-brand' : 'bg-gray-300 dark:bg-white/10'
        }`}
      />

      <button
        type="button"
        onClick={onToggleExpand}
        className="relative z-10 w-full flex items-center gap-3 pl-3.5 pr-3 py-3 text-left"
        aria-expanded={expanded}
      >
        <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-[var(--brand-soft-strong)] border border-gray-200/70 dark:border-white/[0.08] flex items-center justify-center">
          {post.cover_url ? (
            <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[22px]">📸</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14.5px] font-bold text-ink-strong tracking-[-0.01em] truncate">
              {post.title}
            </span>
            {isCurrent && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.05em] shrink-0">
                올해
              </span>
            )}
            {!post.is_published && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60 shrink-0">
                비공개
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
            {formatDateLabel(post.event_date)}
            <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
            <EventTagIcon
              tag={post.tag}
              width={12}
              height={12}
              className="inline-block align-[-1px] mr-1"
            />
            {post.tag}
          </div>
          <div className="text-[11px] text-gray-400 dark:text-white/40 truncate mt-0.5">
            🖼️ {post.photo_count}장
            <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
            🙌 {post.reaction_count}
            <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
            💬 {post.comment_count}
            {post.event_id != null && (
              <>
                <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
                📅 일정 연결됨
              </>
            )}
          </div>
        </div>

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-gray-400 dark:text-white/40 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="relative z-10 px-3.5 pb-3.5 border-t border-gray-200/60 dark:border-white/[0.05] pt-3 space-y-2.5">
          {post.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {post.photos.map(photo => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden border border-gray-200/70 dark:border-white/[0.08] bg-gray-100 dark:bg-white/[0.03]"
                >
                  <img
                    src={photo.url}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {post.caption && (
            <p className="text-[12.5px] leading-[1.6] text-gray-700 dark:text-white/75 bg-gray-50 dark:bg-white/[0.03] rounded-xl px-3 py-2.5 whitespace-pre-wrap line-clamp-6">
              {post.caption}
            </p>
          )}

          <div className="space-y-1.5 text-[12.5px]">
            <InfoRow label="행사 날짜" value={formatDateLabel(post.event_date)} />
            <InfoRow label="태그" value={post.tag} />
            <InfoRow label="사진" value={`${post.photo_count}장`} />
            <InfoRow label="반응" value={`${post.reaction_count}명`} />
            <InfoRow label="댓글" value={`${post.comment_count}개`} />
            <InfoRow
              label="연결 일정"
              value={post.event_id != null ? `일정 #${post.event_id}` : '—'}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <RowAction onClick={onEdit} accent icon="edit" label="수정" />
            <RowAction onClick={onView} icon="eye" label="보기" />
            <RowAction
              onClick={onToggleVisibility}
              icon={post.is_published ? 'hide' : 'eye'}
              label={post.is_published ? '비공개' : '공개'}
            />
            <RowAction onClick={onDelete} destructive icon="trash" label="삭제" />
          </div>

          <p className="text-[11px] text-gray-400 dark:text-white/40 leading-[1.5] pt-1">
            * 수정에서 제목·캡션은 물론 사진 추가·삭제·순서 변경까지 가능해요. 맨 앞 사진이 대표가 됩니다.
          </p>
        </div>
      )}
    </div>
  )
}

// ── 작은 컴포넌트들 ──────────────────────────────────────
const StatChip = ({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) => (
  <span
    className={
      accent
        ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-[12px] font-semibold text-brand'
        : 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] text-[12px] font-semibold text-gray-700 dark:text-white/75'
    }
  >
    {label}
    <span className="font-bold">{value}</span>
  </span>
)

const SkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="h-[86px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse"
      />
    ))}
  </div>
)

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-gray-500 dark:text-white/50 shrink-0">{label}</span>
    <span className="text-gray-800 dark:text-white/85 font-medium truncate text-right min-w-0">
      {value}
    </span>
  </div>
)

const ACTION_ICONS: Record<string, ReactNode> = {
  eye: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  hide: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
}

const RowAction = ({
  onClick,
  accent,
  destructive,
  icon,
  label,
}: {
  onClick: () => void
  accent?: boolean
  destructive?: boolean
  icon: keyof typeof ACTION_ICONS
  label: string
}) => {
  let cls =
    'flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all '
  if (destructive) {
    cls +=
      'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-400/30 hover:bg-red-100 dark:hover:bg-red-500/15'
  } else if (accent) {
    cls +=
      'bg-[var(--brand-soft)] text-brand border border-[var(--brand-glow)] hover:bg-[var(--brand-soft-strong)]'
  } else {
    cls +=
      'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/80 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.08]'
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {ACTION_ICONS[icon]}
      <span>{label}</span>
    </button>
  )
}

export default EventAlbumManagement
