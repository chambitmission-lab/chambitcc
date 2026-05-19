import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { getBulletins, deleteBulletin } from '../../api/bulletin'
import type { Bulletin } from '../../types/bulletin'
import BulletinComposer from './components/BulletinComposer'

type TimeFilter = 'all' | 'thisMonth' | 'past'
type SortKey = 'recent' | 'oldest' | 'views'

const formatDateLabel = (date: string) => {
  const d = new Date(date)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')} (${days[d.getDay()]})`
}

const formatLongDate = (date: string) =>
  new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

const isThisMonth = (date: string): boolean => {
  const d = new Date(date)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

const BulletinManagement = () => {
  const navigate = useNavigate()

  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    loadBulletins()
  }, [navigate])

  const loadBulletins = async () => {
    try {
      setLoading(true)
      const data = await getBulletins(0, 100)
      setBulletins(Array.isArray(data) ? data : [])
    } catch (err) {
      showToast(err instanceof Error ? err.message : '주보를 불러오는데 실패했습니다', 'error')
      setBulletins([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 주보를 삭제하시겠습니까?\n등록된 페이지 이미지도 함께 삭제됩니다.')) return
    try {
      await deleteBulletin(id)
      showToast('주보가 삭제되었습니다', 'success')
      loadBulletins()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  const handleComposerClose = () => setComposerOpen(false)
  const handleComposerSuccess = () => {
    setComposerOpen(false)
    loadBulletins()
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const arr = bulletins.filter(b => {
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        (b.description?.toLowerCase().includes(q) ?? false)
      const matchesTime =
        timeFilter === 'all' ||
        (timeFilter === 'thisMonth' && isThisMonth(b.bulletin_date)) ||
        (timeFilter === 'past' && !isThisMonth(b.bulletin_date))
      return matchesSearch && matchesTime
    })
    return [...arr].sort((a, b) => {
      if (sortKey === 'views') return (b.views ?? 0) - (a.views ?? 0)
      const at = new Date(a.bulletin_date).getTime()
      const bt = new Date(b.bulletin_date).getTime()
      return sortKey === 'recent' ? bt - at : at - bt
    })
  }, [bulletins, searchTerm, timeFilter, sortKey])

  const thisMonthCount = bulletins.filter(b => isThisMonth(b.bulletin_date)).length
  const totalViews = bulletins.reduce((sum, b) => sum + (b.views ?? 0), 0)

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
            주보 관리
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* 통계 */}
        <div className="px-4 pt-4 pb-1 flex gap-2 flex-wrap">
          <StatChip label="전체" value={bulletins.length} />
          <StatChip label="이번 달" value={thisMonthCount} accent />
          <StatChip label="총 조회" value={totalViews} />
        </div>

        {/* 검색 + 필터 */}
        <div className="px-4 py-3">
          <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] p-4">
            <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />

            <div className="relative z-10 space-y-3">
              {/* 검색 */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="제목 · 설명 검색"
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

              <FilterRow label="시점">
                {(
                  [
                    ['all', '전체'],
                    ['thisMonth', '이번 달'],
                    ['past', '지난 달들'],
                  ] as const
                ).map(([v, l]) => (
                  <FilterChip key={v} active={timeFilter === v} onClick={() => setTimeFilter(v)}>
                    {l}
                  </FilterChip>
                ))}
              </FilterRow>

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
              <span className="text-4xl block mb-3">📰</span>
              <p className="text-[13px] text-gray-500 dark:text-white/55">
                {searchTerm || timeFilter !== 'all'
                  ? '조건에 맞는 주보가 없습니다'
                  : '아직 등록된 주보가 없어요'}
              </p>
              <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
                {searchTerm || timeFilter !== 'all'
                  ? '필터를 바꾸거나 검색어를 지워보세요'
                  : '오른쪽 아래 + 버튼으로 새 주보를 등록하세요'}
              </p>
            </div>
          ) : (
            filtered.map(bulletin => (
              <BulletinRow
                key={bulletin.id}
                bulletin={bulletin}
                expanded={expandedId === bulletin.id}
                onToggleExpand={() =>
                  setExpandedId(prev => (prev === bulletin.id ? null : bulletin.id))
                }
                onDelete={() => handleDelete(bulletin.id)}
                onView={() => navigate('/news')}
              />
            ))
          )}
        </div>

        {/* FAB */}
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="fixed bottom-6 right-1/2 translate-x-[calc(min(50vw,14rem)-3.5rem)] z-30 inline-flex items-center gap-2 pl-4 pr-5 h-13 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_10px_30px_-6px_rgba(168,85,247,0.65)] hover:shadow-[0_14px_36px_-4px_rgba(236,72,153,0.7)] hover:-translate-y-0.5 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>새 주보</span>
        </button>

        {composerOpen && (
          <BulletinComposer onClose={handleComposerClose} onSuccess={handleComposerSuccess} />
        )}
      </div>
    </div>
  )
}

// ── Row ───────────────────────────────────────────────
interface BulletinRowProps {
  bulletin: Bulletin
  expanded: boolean
  onToggleExpand: () => void
  onDelete: () => void
  onView: () => void
}

const BulletinRow = ({
  bulletin,
  expanded,
  onToggleExpand,
  onDelete,
  onView,
}: BulletinRowProps) => {
  const isCurrent = isThisMonth(bulletin.bulletin_date)
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
          isCurrent
            ? 'bg-gradient-to-b from-purple-500 to-pink-500'
            : 'bg-gradient-to-b from-fuchsia-500/60 to-purple-500/40'
        }`}
      />

      <button
        type="button"
        onClick={onToggleExpand}
        className="relative z-10 w-full flex items-center gap-3 pl-3.5 pr-3 py-3 text-left"
        aria-expanded={expanded}
      >
        {/* 썸네일 */}
        <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-gray-200/70 dark:border-white/[0.08] flex items-center justify-center">
          {bulletin.thumbnail_url ? (
            <img
              src={bulletin.thumbnail_url}
              alt={bulletin.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[22px]">📰</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em] truncate">
              {bulletin.title}
            </span>
            {isCurrent && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 tracking-[0.05em] shrink-0">
                이번 달
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
            {formatDateLabel(bulletin.bulletin_date)}
            <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
            📄 {bulletin.page_count ?? 0}P
            <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
            👁️ {bulletin.views ?? 0}
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
          {bulletin.thumbnail_url && (
            <div className="rounded-xl overflow-hidden border border-gray-200/70 dark:border-white/[0.08] bg-gray-100 dark:bg-white/[0.03] aspect-[4/3]">
              <img
                src={bulletin.thumbnail_url}
                alt={bulletin.title}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {bulletin.description && (
            <p className="text-[12.5px] leading-[1.6] text-gray-700 dark:text-white/75 bg-gray-50 dark:bg-white/[0.03] rounded-xl px-3 py-2.5 line-clamp-5 whitespace-pre-wrap">
              {bulletin.description}
            </p>
          )}

          <div className="space-y-1.5 text-[12.5px]">
            <InfoRow label="주보 날짜" value={formatDateLabel(bulletin.bulletin_date)} />
            <InfoRow label="페이지" value={`${bulletin.page_count ?? 0}장`} />
            <InfoRow label="조회수" value={`${bulletin.views ?? 0}회`} />
            <InfoRow label="등록일" value={formatLongDate(bulletin.created_at)} />
          </div>

          <div className="flex gap-2 pt-1">
            <RowAction onClick={onView} icon="eye" label="보기" />
            <RowAction onClick={onDelete} destructive icon="trash" label="삭제" />
          </div>

          <p className="text-[11px] text-gray-400 dark:text-white/40 leading-[1.5] pt-1">
            * 주보는 등록 후 수정할 수 없어요. 내용을 바꾸려면 삭제 후 새로 등록해주세요.
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

const FilterRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-start gap-2 flex-wrap">
    <span className="text-[11px] font-semibold text-gray-500 dark:text-white/45 w-9 shrink-0 pt-1">
      {label}
    </span>
    <div className="flex gap-1.5 flex-wrap min-w-0">{children}</div>
  </div>
)

const FilterChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-[12px] font-medium px-3 py-1 rounded-full transition-all duration-150 ${
      active
        ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300'
        : 'text-gray-500 dark:text-white/45 hover:text-gray-700 dark:hover:text-white/70 hover:bg-gray-100/70 dark:hover:bg-white/[0.04]'
    }`}
  >
    {children}
  </button>
)

const SkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="h-[78px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse"
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
    'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold transition-all '
  if (destructive) {
    cls +=
      'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-400/30 hover:bg-red-100 dark:hover:bg-red-500/15'
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

export default BulletinManagement
