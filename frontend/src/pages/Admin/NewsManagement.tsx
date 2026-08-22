// 교회소식 관리 (관리자)
// Single Responsibility: 소식 목록 조회·필터와 등록/수정/공개·고정/삭제 액션
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import { deleteNews, fetchNewsList, patchNews } from '../../api/news'
import type { NewsItem } from '../../types/news'
import NewsComposer from './components/NewsComposer'
import { FilterChip, FilterRow } from './components/FilterControls'

type VisibilityFilter = 'all' | 'published' | 'hidden'
type SortKey = 'recent' | 'oldest' | 'views'

const formatDate = (value: string | null) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')} (${days[d.getDay()]})`
}

const timeOf = (news: NewsItem) => new Date(news.published_at ?? news.created_at ?? 0).getTime()

const NewsManagement = () => {
  const navigate = useNavigate()

  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [visibility, setVisibility] = useState<VisibilityFilter>('all')
  const [category, setCategory] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  // null = 닫힘, 'new' = 등록, NewsItem = 수정
  const [composer, setComposer] = useState<'new' | NewsItem | null>(null)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    loadNews()
  }, [navigate])

  const loadNews = async () => {
    try {
      setLoading(true)
      // 관리자는 비공개 글도 함께 내려받는다 (백엔드에서 is_admin으로 분기)
      const response = await fetchNewsList(1, 50)
      setItems(response.data.items)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '목록을 불러오지 못했습니다', 'error')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (news: NewsItem) => {
    if (
      !(await confirmDialog({
        title: '소식 삭제',
        message: `"${news.title}" 소식을 삭제하시겠습니까?`,
        description: '첨부한 사진과 파일도 함께 삭제됩니다.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteNews(news.id)
      showToast('삭제되었습니다', 'success')
      loadNews()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  const applyPatch = async (
    news: NewsItem,
    patch: { is_published?: boolean; is_pinned?: boolean },
    message: string,
  ) => {
    try {
      const updated = await patchNews(news.id, patch)
      setItems((prev) => prev.map((n) => (n.id === news.id ? { ...n, ...updated } : n)))
      showToast(message, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '변경에 실패했습니다', 'error')
    }
  }

  const categories = useMemo(
    () => Array.from(new Set(items.map((n) => n.category).filter((c): c is string => !!c))).sort(),
    [items],
  )

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const arr = items.filter((n) => {
      const matchesSearch =
        !q || n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q)
      const matchesVisibility =
        visibility === 'all' ||
        (visibility === 'published' && n.is_published) ||
        (visibility === 'hidden' && !n.is_published)
      const matchesCategory = !category || n.category === category
      return matchesSearch && matchesVisibility && matchesCategory
    })
    return [...arr].sort((a, b) => {
      if (sortKey === 'views') return b.views - a.views
      // 고정글은 목록에서도 위에 둔다 (성도 화면과 같은 감각)
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
      return sortKey === 'recent' ? timeOf(b) - timeOf(a) : timeOf(a) - timeOf(b)
    })
  }, [items, searchTerm, visibility, category, sortKey])

  const hiddenCount = items.filter((n) => !n.is_published).length
  const pinnedCount = items.filter((n) => n.is_pinned).length

  return (
    // lg 에선 이 페이지만 스스로 스크롤하는 상자로 만든다 — #root 의 overflow-y 탓에
    // sticky 가 전역으로 죽어 있어, 이 상자가 있어야 우측 도구 레일 sticky 가 산다.
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:h-[calc(100vh-56px)] lg:min-h-0 lg:overflow-y-auto">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-24 lg:max-w-[1100px] lg:mt-2 lg:mb-10 lg:min-h-0 lg:pb-8 lg:rounded-3xl lg:border">
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
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">교회소식 관리</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* PC(lg+) 2단 — 좌: 목록 / 우: 도구(등록·통계·검색/필터)가 sticky */}
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:items-start lg:px-5 lg:pt-4">
          <div className="contents lg:block lg:col-start-2 lg:row-start-1 lg:sticky lg:top-3 lg:space-y-3">
            <button
              type="button"
              onClick={() => setComposer('new')}
              className="hidden lg:flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>소식 등록</span>
            </button>

            {/* 통계 */}
            <div className="px-4 pt-4 pb-1 lg:px-0 lg:pt-0 flex gap-2 flex-wrap">
              <StatChip label="전체" value={items.length} />
              <StatChip label="고정" value={pinnedCount} accent />
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
                      placeholder="제목 · 내용 검색"
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

                  {categories.length > 0 && (
                    <FilterRow label="분류">
                      <FilterChip active={category === null} onClick={() => setCategory(null)}>
                        전체
                      </FilterChip>
                      {categories.map((name) => (
                        <FilterChip
                          key={name}
                          active={category === name}
                          onClick={() => setCategory(category === name ? null : name)}
                        >
                          {name}
                        </FilterChip>
                      ))}
                    </FilterRow>
                  )}

                  <FilterRow label="정렬">
                    {(
                      [
                        ['recent', '최신순'],
                        ['oldest', '오래된순'],
                        ['views', '조회 많은순'],
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

            <div className="px-5 pb-2 lg:px-1 lg:pb-0 text-[12px] text-gray-500 dark:text-white/55 flex items-center gap-2">
              <span>
                검색 결과 <span className="font-bold text-ink-strong">{filtered.length}</span>건
              </span>
              {searchTerm && <span className="text-brand truncate">"{searchTerm}"</span>}
            </div>
          </div>

          <div className="contents lg:block lg:col-start-1 lg:row-start-1 lg:min-w-0">
            <div className="px-4 pb-32 lg:px-0 lg:pb-8 space-y-2">
              {loading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">📢</span>
                  <p className="text-[13px] text-gray-500 dark:text-white/55">
                    {searchTerm || visibility !== 'all' || category
                      ? '조건에 맞는 소식이 없습니다'
                      : '아직 등록된 소식이 없어요'}
                  </p>
                  <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
                    {searchTerm || visibility !== 'all' || category
                      ? '필터를 바꾸거나 검색어를 지워보세요'
                      : '＋ 소식 버튼으로 첫 소식을 올려보세요'}
                  </p>
                </div>
              ) : (
                filtered.map((news) => (
                  <NewsRow
                    key={news.id}
                    news={news}
                    expanded={expandedId === news.id}
                    onToggleExpand={() =>
                      setExpandedId((prev) => (prev === news.id ? null : news.id))
                    }
                    onEdit={() => setComposer(news)}
                    onView={() => navigate(`/news?tab=news&post=${news.id}`)}
                    onTogglePublished={() =>
                      applyPatch(
                        news,
                        { is_published: !news.is_published },
                        news.is_published ? '비공개로 전환했어요' : '공개로 전환했어요',
                      )
                    }
                    onTogglePinned={() =>
                      applyPatch(
                        news,
                        { is_pinned: !news.is_pinned },
                        news.is_pinned ? '고정을 해제했어요' : '상단에 고정했어요',
                      )
                    }
                    onDelete={() => handleDelete(news)}
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
          <span>소식</span>
        </button>

        {composer && (
          <NewsComposer
            // key — 다른 글을 연속으로 수정할 때 폼 상태가 남지 않도록 재마운트
            key={composer === 'new' ? 'new' : composer.id}
            news={composer === 'new' ? undefined : composer}
            onClose={() => setComposer(null)}
            onSuccess={() => {
              setComposer(null)
              loadNews()
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── Row ───────────────────────────────────────────────
interface NewsRowProps {
  news: NewsItem
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onView: () => void
  onTogglePublished: () => void
  onTogglePinned: () => void
  onDelete: () => void
}

const NewsRow = ({
  news,
  expanded,
  onToggleExpand,
  onEdit,
  onView,
  onTogglePublished,
  onTogglePinned,
  onDelete,
}: NewsRowProps) => (
  <div
    className={[
      'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border transition-all duration-200',
      'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]',
      expanded ? 'border-[var(--brand-glow)]' : 'border-gray-200/70 dark:border-white/[0.08]',
    ].join(' ')}
  >
    <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
    <div
      className={`absolute left-0 top-0 bottom-0 w-1 ${
        news.is_published ? 'bg-brand' : 'bg-gray-300 dark:bg-white/10'
      }`}
    />

    <button
      type="button"
      onClick={onToggleExpand}
      className="relative z-10 w-full flex items-center gap-3 pl-3.5 pr-3 py-3 text-left"
      aria-expanded={expanded}
    >
      <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-[var(--brand-soft-strong)] border border-gray-200/70 dark:border-white/[0.08] flex items-center justify-center">
        {news.thumbnail_url ? (
          <img src={news.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[22px]">📢</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {news.is_pinned && (
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-brand text-white shrink-0">
              고정
            </span>
          )}
          <span className="text-[14.5px] font-bold text-ink-strong tracking-[-0.01em] truncate">
            {news.title}
          </span>
          {!news.is_published && (
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60 shrink-0">
              비공개
            </span>
          )}
        </div>
        <div className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
          {formatDate(news.published_at)}
          {news.category && (
            <>
              <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
              {news.category}
            </>
          )}
        </div>
        <div className="text-[11px] text-gray-400 dark:text-white/40 truncate mt-0.5">
          👁 {news.views}
          <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
          🖼️ {news.image_count}
          <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
          📎 {news.file_count}
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
        {news.summary && (
          <p className="text-[12.5px] leading-[1.6] text-gray-700 dark:text-white/75 bg-gray-50 dark:bg-white/[0.03] rounded-xl px-3 py-2.5 whitespace-pre-wrap">
            {news.summary}
          </p>
        )}

        <div className="space-y-1.5 text-[12.5px]">
          <InfoRow label="게시일" value={formatDate(news.published_at)} />
          <InfoRow label="분류" value={news.category || '—'} />
          <InfoRow label="작성자" value={news.author || '관리자'} />
          <InfoRow label="조회" value={`${news.views}회`} />
          <InfoRow label="첨부" value={`사진 ${news.image_count}장 · 파일 ${news.file_count}개`} />
        </div>

        <div className="flex gap-2 pt-1">
          <RowAction onClick={onEdit} accent icon="edit" label="수정" />
          <RowAction onClick={onView} icon="eye" label="보기" />
          <RowAction
            onClick={onTogglePublished}
            icon={news.is_published ? 'hide' : 'eye'}
            label={news.is_published ? '비공개' : '공개'}
          />
          <RowAction onClick={onTogglePinned} icon="pin" label={news.is_pinned ? '고정해제' : '고정'} />
          <RowAction onClick={onDelete} destructive icon="trash" label="삭제" />
        </div>
      </div>
    )}
  </div>
)

// ── 작은 컴포넌트들 ──────────────────────────────────────
const StatChip = ({ label, value, accent }: { label: string; value: number; accent?: boolean }) => (
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
      <div key={i} className="h-[86px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
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
  pin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M9 2h6l-1 6 3.5 3.5V14H6.5v-2.5L10 8 9 2z" />
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
    'flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[12px] font-semibold transition-all '
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

export default NewsManagement
