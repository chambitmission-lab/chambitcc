import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { getAllDailyVerses, deleteDailyVerse } from '../../api/dailyVerse'
import type { DailyVerse } from '../../types/dailyVerse'
import DailyVerseComposer from './components/DailyVerseComposer'

type VerseFilter = 'all' | 'today' | 'upcoming' | 'past'
type SortKey = 'recent' | 'oldest'

const startOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

const diffInDays = (a: Date, b: Date) =>
  Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000)

const getVerseStatus = (verseDate: string): 'today' | 'upcoming' | 'past' => {
  const diff = diffInDays(new Date(verseDate), new Date())
  if (diff === 0) return 'today'
  if (diff > 0) return 'upcoming'
  return 'past'
}

const formatDateLabel = (verseDate: string) => {
  const d = new Date(verseDate)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')} (${days[d.getDay()]})`
}

const formatRelativeLabel = (verseDate: string): string => {
  const diff = diffInDays(new Date(verseDate), new Date())
  if (diff === 0) return '오늘'
  if (diff === 1) return '내일'
  if (diff === -1) return '어제'
  if (diff > 1 && diff < 7) return `D-${diff}`
  if (diff < -1 && diff > -7) return `${-diff}일 전`
  return formatDateLabel(verseDate)
}

const DailyVerseManagement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [verses, setVerses] = useState<DailyVerse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<VerseFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const [composerOpen, setComposerOpen] = useState(false)
  const [editingVerse, setEditingVerse] = useState<DailyVerse | null>(null)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    loadVerses()
  }, [navigate])

  const loadVerses = async () => {
    try {
      setLoading(true)
      const data = await getAllDailyVerses()
      setVerses(Array.isArray(data) ? data : [])
    } catch (err) {
      showToast(err instanceof Error ? err.message : '오늘의 말씀을 불러오는데 실패했습니다', 'error')
      setVerses([])
    } finally {
      setLoading(false)
    }
  }

  const invalidateUserCache = () => {
    queryClient.invalidateQueries({ queryKey: ['dailyVerse', 'today'] })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 말씀을 삭제하시겠습니까?')) return
    try {
      await deleteDailyVerse(id)
      showToast('오늘의 말씀이 삭제되었습니다', 'success')
      invalidateUserCache()
      loadVerses()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  const handleEdit = (verse: DailyVerse) => {
    setEditingVerse(verse)
    setComposerOpen(true)
  }

  const handleCreate = () => {
    setEditingVerse(null)
    setComposerOpen(true)
  }

  const handleComposerClose = () => {
    setComposerOpen(false)
    setEditingVerse(null)
  }

  const handleComposerSuccess = () => {
    handleComposerClose()
    invalidateUserCache()
    loadVerses()
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const arr = verses.filter(v => {
      const matchesSearch =
        !q ||
        v.verse_reference.toLowerCase().includes(q) ||
        v.verse_text.toLowerCase().includes(q)
      const status = getVerseStatus(v.verse_date)
      const matchesFilter = filter === 'all' || status === filter
      return matchesSearch && matchesFilter
    })

    return [...arr].sort((a, b) => {
      const at = new Date(a.verse_date).getTime()
      const bt = new Date(b.verse_date).getTime()
      return sortKey === 'recent' ? bt - at : at - bt
    })
  }, [verses, searchTerm, filter, sortKey])

  const todayCount = verses.filter(v => getVerseStatus(v.verse_date) === 'today').length
  const upcomingCount = verses.filter(v => getVerseStatus(v.verse_date) === 'upcoming').length

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
            오늘의 말씀
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* 통계 */}
        <div className="px-4 pt-4 pb-1 flex gap-2 flex-wrap">
          <StatChip label="전체" value={verses.length} />
          <StatChip label="오늘" value={todayCount} accent />
          {upcomingCount > 0 && <StatChip label="예정" value={upcomingCount} />}
        </div>

        {/* 검색 + 필터 카드 */}
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
                  placeholder="성경 구절 · 말씀 본문 검색"
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

              {/* 상태 필터 */}
              <FilterRow label="시점">
                {(
                  [
                    ['all', '전체'],
                    ['today', '오늘'],
                    ['upcoming', '예정'],
                    ['past', '지난'],
                  ] as const
                ).map(([v, l]) => (
                  <FilterChip key={v} active={filter === v} onClick={() => setFilter(v)}>
                    {l}
                  </FilterChip>
                ))}
              </FilterRow>

              {/* 정렬 */}
              <FilterRow label="정렬">
                {(
                  [
                    ['recent', '최신순'],
                    ['oldest', '오래된순'],
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
              <span className="text-4xl block mb-3">📖</span>
              <p className="text-[13px] text-gray-500 dark:text-white/55">
                {searchTerm || filter !== 'all'
                  ? '조건에 맞는 말씀이 없습니다'
                  : '아직 등록된 말씀이 없어요'}
              </p>
              <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
                {searchTerm || filter !== 'all'
                  ? '필터를 바꾸거나 검색어를 지워보세요'
                  : '오른쪽 아래 + 버튼으로 새 말씀을 등록하세요'}
              </p>
            </div>
          ) : (
            filtered.map(verse => (
              <VerseRow
                key={verse.id}
                verse={verse}
                expanded={expandedId === verse.id}
                onToggleExpand={() =>
                  setExpandedId(prev => (prev === verse.id ? null : verse.id))
                }
                onEdit={() => handleEdit(verse)}
                onDelete={() => handleDelete(verse.id)}
              />
            ))
          )}
        </div>

        {/* FAB */}
        <button
          type="button"
          onClick={handleCreate}
          className="fixed bottom-6 right-1/2 translate-x-[calc(min(50vw,14rem)-3.5rem)] z-30 inline-flex items-center gap-2 pl-4 pr-5 h-13 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_10px_30px_-6px_rgba(168,85,247,0.65)] hover:shadow-[0_14px_36px_-4px_rgba(236,72,153,0.7)] hover:-translate-y-0.5 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>새 말씀</span>
        </button>

        {composerOpen && (
          <DailyVerseComposer
            editingVerse={editingVerse}
            onClose={handleComposerClose}
            onSuccess={handleComposerSuccess}
          />
        )}
      </div>
    </div>
  )
}

// ── 행 ────────────────────────────────────────────────
interface VerseRowProps {
  verse: DailyVerse
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
}

const STATUS_STYLE: Record<
  'today' | 'upcoming' | 'past',
  { bar: string; chipBg: string; chipText: string }
> = {
  today: {
    bar: 'from-purple-500 to-pink-500',
    chipBg: 'bg-purple-500/15 dark:bg-purple-500/20',
    chipText: 'text-purple-700 dark:text-purple-300',
  },
  upcoming: {
    bar: 'from-fuchsia-500 to-purple-500',
    chipBg: 'bg-fuchsia-500/12 dark:bg-fuchsia-500/15',
    chipText: 'text-fuchsia-700 dark:text-fuchsia-300',
  },
  past: {
    bar: 'from-white/15 to-white/5',
    chipBg: 'bg-gray-100 dark:bg-white/[0.06]',
    chipText: 'text-gray-500 dark:text-white/55',
  },
}

const VerseRow = ({ verse, expanded, onToggleExpand, onEdit, onDelete }: VerseRowProps) => {
  const status = getVerseStatus(verse.verse_date)
  const style = STATUS_STYLE[status]
  const preview = verse.verse_text.replace(/\s+/g, ' ').trim()

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border transition-all duration-200',
        'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]',
        expanded
          ? 'border-purple-300/50 dark:border-purple-400/30'
          : 'border-gray-200/70 dark:border-white/[0.08]',
        status === 'past' && !expanded && 'opacity-75',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      {/* 좌측 컬러 바 */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${style.bar}`} />

      <button
        type="button"
        onClick={onToggleExpand}
        className="relative z-10 w-full flex items-center gap-3 pl-3.5 pr-3 py-3 text-left"
        aria-expanded={expanded}
      >
        <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[18px] shadow-[0_4px_12px_-4px_rgba(168,85,247,0.5)]">
          📖
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em] truncate">
              {verse.verse_reference}
            </span>
          </div>
          <p className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
            {preview || '내용 없음'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`inline-flex items-center px-1.5 h-5 rounded-full ${style.chipBg} ${style.chipText} text-[10.5px] font-bold tracking-wide`}
          >
            {formatRelativeLabel(verse.verse_date)}
          </span>
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
          {/* 그라데이션 미니 카드 (사용자 화면 미리보기) */}
          <div className="relative overflow-hidden rounded-xl p-3.5 bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_22px_-10px_rgba(168,85,247,0.5)]">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.15) 100%)',
              }}
            />
            <div
              className="absolute -top-5 -right-5 w-28 h-28 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '12px 12px',
              }}
            />
            <div className="relative">
              <h4 className="text-white text-[14px] font-bold mb-1.5 leading-[1.3]">
                {verse.verse_reference}
              </h4>
              <p className="text-white/95 text-[13px] leading-[1.7] font-medium whitespace-pre-wrap">
                "{verse.verse_text}"
              </p>
            </div>
          </div>

          <div className="space-y-1.5 text-[12.5px]">
            <InfoRow label="게시일" value={formatDateLabel(verse.verse_date)} />
            <InfoRow
              label="등록일"
              value={new Date(verse.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
            {verse.updated_at !== verse.created_at && (
              <InfoRow
                label="마지막 수정"
                value={new Date(verse.updated_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <RowAction onClick={onEdit} accent icon="edit" label="수정" />
            <RowAction onClick={onDelete} destructive icon="trash" label="삭제" />
          </div>
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
        className="h-[72px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse"
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
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
    'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold transition-all '
  if (accent) {
    cls +=
      'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-[0_0_16px_rgba(168,85,247,0.40)]'
  } else if (destructive) {
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

export default DailyVerseManagement
