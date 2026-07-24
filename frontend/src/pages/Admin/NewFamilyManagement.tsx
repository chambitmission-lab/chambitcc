import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import {
  deleteNewFamilyPost,
  fetchNewFamilyPosts,
  updateNewFamilyPost,
} from '../../api/newFamily'
import type { NewFamilyPost } from '../../types/newFamily'
import NewFamilyComposer from './components/NewFamilyComposer'
import { FilterChip, FilterRow } from './components/FilterControls'

type VisibilityFilter = 'all' | 'published' | 'hidden'
type SortKey = 'recent' | 'oldest' | 'welcome'

const formatDateLabel = (value: string) => {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return value
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = days[new Date(y, m - 1, d).getDay()]
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${weekday})`
}

const isThisMonth = (value: string): boolean => {
  const [y, m] = value.split('-').map(Number)
  const now = new Date()
  return y === now.getFullYear() && m === now.getMonth() + 1
}

const NewFamilyManagement = () => {
  const navigate = useNavigate()

  const [posts, setPosts] = useState<NewFamilyPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [visibility, setVisibility] = useState<VisibilityFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  // null = 닫힘, 'new' = 등록, NewFamilyPost = 수정
  const [composer, setComposer] = useState<'new' | NewFamilyPost | null>(null)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    loadPosts()
  }, [navigate])

  const loadPosts = async () => {
    try {
      setLoading(true)
      // 관리자는 비공개 포스트도 함께 내려받는다 (백엔드에서 is_admin으로 분기)
      const response = await fetchNewFamilyPosts(1, 50)
      setPosts(response.data.items)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '목록을 불러오지 못했습니다', 'error')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (post: NewFamilyPost) => {
    if (
      !confirm(
        `${post.member_name} 소식을 삭제하시겠습니까?\n등록된 사진과 환영 댓글도 함께 삭제됩니다.`,
      )
    )
      return
    try {
      await deleteNewFamilyPost(post.id)
      showToast('삭제되었습니다', 'success')
      loadPosts()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  const handleToggleVisibility = async (post: NewFamilyPost) => {
    try {
      const updated = await updateNewFamilyPost(post.id, { is_published: !post.is_published })
      setPosts(prev => prev.map(p => (p.id === post.id ? { ...p, ...updated } : p)))
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
        p.member_name.toLowerCase().includes(q) ||
        (p.group_name?.toLowerCase().includes(q) ?? false) ||
        (p.greeting?.toLowerCase().includes(q) ?? false)
      const matchesVisibility =
        visibility === 'all' ||
        (visibility === 'published' && p.is_published) ||
        (visibility === 'hidden' && !p.is_published)
      return matchesSearch && matchesVisibility
    })
    return [...arr].sort((a, b) => {
      if (sortKey === 'welcome') return b.welcome_count - a.welcome_count
      const at = a.registered_at
      const bt = b.registered_at
      return sortKey === 'recent' ? bt.localeCompare(at) : at.localeCompare(bt)
    })
  }, [posts, searchTerm, visibility, sortKey])

  const thisMonthCount = posts.filter(p => isThisMonth(p.registered_at)).length
  const hiddenCount = posts.filter(p => !p.is_published).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-24">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-gray-900 dark:text-white">
            새가족 앨범 관리
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* 통계 */}
        <div className="px-4 pt-4 pb-1 flex gap-2 flex-wrap">
          <StatChip label="전체" value={posts.length} />
          <StatChip label="이번 달" value={thisMonthCount} accent />
          <StatChip label="비공개" value={hiddenCount} />
        </div>

        {/* 검색 + 필터 */}
        <div className="px-4 py-3">
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
                  placeholder="이름 · 부서 · 인사말 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
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
                    ['welcome', '환영 많은순'],
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
        <div className="px-5 pb-2 text-[12px] text-gray-500 dark:text-white/55 flex items-center gap-2">
          <span>
            검색 결과 <span className="font-bold text-gray-900 dark:text-white">{filtered.length}</span>건
          </span>
          {searchTerm && (
            <span className="text-purple-600 dark:text-purple-300 truncate">"{searchTerm}"</span>
          )}
        </div>

        {/* 목록 */}
        <div className="px-4 pb-32 space-y-2">
          {loading ? (
            <SkeletonRows />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">🌱</span>
              <p className="text-[13px] text-gray-500 dark:text-white/55">
                {searchTerm || visibility !== 'all'
                  ? '조건에 맞는 새가족이 없습니다'
                  : '아직 등록된 새가족이 없어요'}
              </p>
              <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
                {searchTerm || visibility !== 'all'
                  ? '필터를 바꾸거나 검색어를 지워보세요'
                  : '오른쪽 아래 + 버튼으로 새가족을 등록하세요'}
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
                onView={() => navigate('/news?tab=new-family')}
              />
            ))
          )}
        </div>

        {/* FAB */}
        <button
          type="button"
          onClick={() => setComposer('new')}
          className="fixed bottom-6 right-1/2 translate-x-[calc(min(50vw,14rem)-3.5rem)] z-30 inline-flex items-center gap-2 pl-4 pr-5 h-13 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_10px_30px_-6px_rgba(168,85,247,0.65)] hover:shadow-[0_14px_36px_-4px_rgba(236,72,153,0.7)] hover:-translate-y-0.5 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>새가족</span>
        </button>

        {composer && (
          <NewFamilyComposer
            // key — 다른 포스트를 연속으로 수정할 때 폼 상태가 남지 않도록 재마운트
            key={composer === 'new' ? 'new' : composer.id}
            post={composer === 'new' ? undefined : composer}
            onClose={() => setComposer(null)}
            onSuccess={() => {
              setComposer(null)
              loadPosts()
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── Row ───────────────────────────────────────────────
interface PostRowProps {
  post: NewFamilyPost
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
  const isCurrent = isThisMonth(post.registered_at)
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border transition-all duration-200',
        'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]',
        expanded
          ? 'border-purple-300/50 dark:border-purple-400/30'
          : 'border-gray-200/70 dark:border-white/[0.08]',
      ].join(' ')}
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          post.is_published
            ? 'bg-gradient-to-b from-purple-500 to-pink-500'
            : 'bg-gradient-to-b from-gray-400/60 to-gray-500/40'
        }`}
      />

      <button
        type="button"
        onClick={onToggleExpand}
        className="relative z-10 w-full flex items-center gap-3 pl-3.5 pr-3 py-3 text-left"
        aria-expanded={expanded}
      >
        <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-gray-200/70 dark:border-white/[0.08] flex items-center justify-center">
          {post.cover_url ? (
            <img src={post.cover_url} alt={post.member_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[22px]">🌱</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em] truncate">
              {post.member_name}
            </span>
            {isCurrent && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 tracking-[0.05em] shrink-0">
                이번 달
              </span>
            )}
            {!post.is_published && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60 shrink-0">
                비공개
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
            {formatDateLabel(post.registered_at)}
            {post.group_name && (
              <>
                <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
                {post.group_name}
              </>
            )}
          </div>
          <div className="text-[11px] text-gray-400 dark:text-white/40 truncate mt-0.5">
            🖼️ {post.photo_count}장
            <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
            👋 {post.welcome_count}
            <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
            💬 {post.comment_count}
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
                    src={photo.image_url}
                    alt={post.member_name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {post.greeting && (
            <p className="text-[12.5px] leading-[1.6] text-gray-700 dark:text-white/75 bg-gray-50 dark:bg-white/[0.03] rounded-xl px-3 py-2.5 whitespace-pre-wrap line-clamp-6">
              {post.greeting}
            </p>
          )}

          <div className="space-y-1.5 text-[12.5px]">
            <InfoRow label="등록 주일" value={formatDateLabel(post.registered_at)} />
            <InfoRow label="부서" value={post.group_name || '—'} />
            <InfoRow label="사진" value={`${post.photo_count}장`} />
            <InfoRow label="환영" value={`${post.welcome_count}명`} />
            <InfoRow label="댓글" value={`${post.comment_count}개`} />
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
            * 수정에서 이름·인사말은 물론 사진 추가·삭제·순서 변경까지 가능해요. 맨 앞 사진이 대표가 됩니다.
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
        ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-[12px] font-semibold text-purple-700 dark:text-purple-300'
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
      'bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25 dark:border-purple-400/30 hover:bg-purple-500/18 dark:hover:bg-purple-500/22'
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

export default NewFamilyManagement
