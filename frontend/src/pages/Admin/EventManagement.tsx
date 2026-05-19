import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { fetchAllEvents, deleteEvent } from '../../api/event'
import type { Event, EventCategory } from '../../types/event'
import { ALL_CATEGORIES, CATEGORY_VISUAL } from '../Events/utils/categoryConfig'
import { formatDDay, formatEventTime, formatEventDateLabel } from '../Events/utils/dateGrouping'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../locales'
import EventComposer from './components/EventComposer'

type PublishFilter = 'all' | 'published' | 'draft'
type SortKey = 'upcoming' | 'recent' | 'attendance'

const EventManagement = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = translations[language]

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<EventCategory | 'all'>('all')
  const [filterPublish, setFilterPublish] = useState<PublishFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('upcoming')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const [composerOpen, setComposerOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    loadEvents()
  }, [navigate])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const response = await fetchAllEvents(0, 200)
      if (response.success) setEvents(response.data.items)
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.error, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (eventId: number) => {
    if (!confirm(t.confirmDelete)) return
    try {
      await deleteEvent(eventId)
      showToast(t.deleteSuccess, 'success')
      loadEvents()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.error, 'error')
    }
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setComposerOpen(true)
  }

  const handleCreate = () => {
    setEditingEvent(null)
    setComposerOpen(true)
  }

  const handleComposerClose = () => {
    setComposerOpen(false)
    setEditingEvent(null)
  }

  const handleComposerSuccess = () => {
    handleComposerClose()
    loadEvents()
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const arr = events.filter(ev => {
      const matchesSearch =
        !q ||
        ev.title.toLowerCase().includes(q) ||
        (ev.location?.toLowerCase().includes(q) ?? false) ||
        (ev.description?.toLowerCase().includes(q) ?? false)
      const matchesCategory = filterCategory === 'all' || ev.category === filterCategory
      const matchesPublish =
        filterPublish === 'all' ||
        (filterPublish === 'published' && ev.is_published) ||
        (filterPublish === 'draft' && !ev.is_published)
      return matchesSearch && matchesCategory && matchesPublish
    })

    return [...arr].sort((a, b) => {
      if (sortKey === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortKey === 'attendance') {
        return (b.attendance_count ?? 0) - (a.attendance_count ?? 0)
      }
      // upcoming
      return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    })
  }, [events, searchTerm, filterCategory, filterPublish, sortKey])

  const publishedCount = events.filter(e => e.is_published).length
  const draftCount = events.length - publishedCount
  const upcomingCount = events.filter(e => new Date(e.start_datetime).getTime() >= Date.now()).length

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
            일정 관리
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* 통계 칩 */}
        <div className="px-4 pt-4 pb-1 flex gap-2 flex-wrap">
          <StatChip label="전체" value={events.length} />
          <StatChip label="다가올 일정" value={upcomingCount} accent />
          <StatChip label="공개" value={publishedCount} />
          {draftCount > 0 && <StatChip label="임시저장" value={draftCount} muted />}
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
                  placeholder="제목 · 장소 · 설명 검색"
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

              {/* 카테고리 (이모지 pill) */}
              <FilterRow label="분류">
                <FilterChip active={filterCategory === 'all'} onClick={() => setFilterCategory('all')}>
                  전체
                </FilterChip>
                {ALL_CATEGORIES.map(cat => (
                  <FilterChip
                    key={cat}
                    active={filterCategory === cat}
                    onClick={() => setFilterCategory(cat)}
                  >
                    <span className="mr-1">{CATEGORY_VISUAL[cat].emoji}</span>
                    {t.categories[cat]}
                  </FilterChip>
                ))}
              </FilterRow>

              {/* 공개 상태 */}
              <FilterRow label="상태">
                {(
                  [
                    ['all', '전체'],
                    ['published', '공개'],
                    ['draft', '임시저장'],
                  ] as const
                ).map(([v, l]) => (
                  <FilterChip key={v} active={filterPublish === v} onClick={() => setFilterPublish(v)}>
                    {l}
                  </FilterChip>
                ))}
              </FilterRow>

              {/* 정렬 */}
              <FilterRow label="정렬">
                {(
                  [
                    ['upcoming', '다가오는 순'],
                    ['recent', '최근 등록'],
                    ['attendance', '참석 많은 순'],
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
              <span className="text-4xl block mb-3">📭</span>
              <p className="text-[13px] text-gray-500 dark:text-white/55">
                {searchTerm || filterCategory !== 'all' || filterPublish !== 'all'
                  ? '조건에 맞는 일정이 없습니다'
                  : '아직 등록된 일정이 없어요'}
              </p>
              <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
                {searchTerm || filterCategory !== 'all' || filterPublish !== 'all'
                  ? '필터를 바꾸거나 검색어를 지워보세요'
                  : '오른쪽 아래 + 버튼으로 새 일정을 등록하세요'}
              </p>
            </div>
          ) : (
            filtered.map(event => (
              <EventRow
                key={event.id}
                event={event}
                categoryLabel={t.categories[event.category]}
                expanded={expandedId === event.id}
                onToggleExpand={() =>
                  setExpandedId(prev => (prev === event.id ? null : event.id))
                }
                onEdit={() => handleEdit(event)}
                onDelete={() => handleDelete(event.id)}
                onView={() => navigate(`/events/${event.id}`)}
              />
            ))
          )}
        </div>

        {/* FAB - 새 일정 등록 */}
        <button
          type="button"
          onClick={handleCreate}
          className="fixed bottom-6 right-1/2 translate-x-[calc(min(50vw,14rem)-3.5rem)] z-30 inline-flex items-center gap-2 pl-4 pr-5 h-13 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_10px_30px_-6px_rgba(168,85,247,0.65)] hover:shadow-[0_14px_36px_-4px_rgba(236,72,153,0.7)] hover:-translate-y-0.5 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>새 일정</span>
        </button>

        {composerOpen && (
          <EventComposer
            editingEvent={editingEvent}
            onClose={handleComposerClose}
            onSuccess={handleComposerSuccess}
          />
        )}
      </div>
    </div>
  )
}

// ── 컴팩트 일정 행 ──────────────────────────────────────
interface EventRowProps {
  event: Event
  categoryLabel: string
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onView: () => void
}

const EventRow = ({
  event,
  categoryLabel,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onView,
}: EventRowProps) => {
  const v = CATEGORY_VISUAL[event.category]
  const dday = formatDDay(event.start_datetime)
  const time = formatEventTime(event.start_datetime)
  const dateLabel = formatEventDateLabel(event.start_datetime)
  const isPast = new Date(event.start_datetime).getTime() < Date.now()

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border transition-all duration-200',
        'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]',
        expanded
          ? 'border-purple-300/50 dark:border-purple-400/30'
          : 'border-gray-200/70 dark:border-white/[0.08]',
        isPast && !expanded && 'opacity-70',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      {/* 좌측 카테고리 컬러 바 */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${v.gradient}`} />

      {/* 컴팩트 헤더 */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="relative z-10 w-full flex items-center gap-3 pl-3.5 pr-3 py-3 text-left"
        aria-expanded={expanded}
      >
        <div
          className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${v.gradient} flex items-center justify-center text-[18px] shadow-[0_4px_12px_-4px_rgba(168,85,247,0.5)]`}
        >
          {v.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em] truncate">
              {event.title}
            </span>
            {!event.is_published && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-white/[0.08] text-gray-600 dark:text-white/60 tracking-[0.05em] shrink-0">
                임시저장
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
            {dateLabel} · {time}
            {event.location && (
              <>
                <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
                <span className="truncate">{event.location}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {!isPast && (
            <span
              className={`inline-flex items-center px-1.5 h-5 rounded-full ${v.chipBg} ${v.chipText} text-[10.5px] font-bold tracking-wide`}
            >
              {dday}
            </span>
          )}
          <span className="text-[10.5px] text-gray-400 dark:text-white/40 font-medium">
            👥 {event.attendance_count}
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

      {/* 펼침 */}
      {expanded && (
        <div className="relative z-10 px-3.5 pb-3.5 border-t border-gray-200/60 dark:border-white/[0.05] pt-3 space-y-2.5">
          <div className="space-y-1.5 text-[12.5px]">
            <InfoRow label="분류" value={categoryLabel} />
            <InfoRow
              label="기간"
              value={`${dateLabel} ${time} ~ ${formatEventDateLabel(event.end_datetime)} ${formatEventTime(event.end_datetime)}`}
            />
            {event.location && <InfoRow label="장소" value={event.location} />}
            {event.group && (
              <InfoRow
                label="공개 범위"
                value={`${event.group.icon ?? ''} ${event.group.name}`.trim()}
              />
            )}
            {!event.group && <InfoRow label="공개 범위" value="전체 공개" />}
            {event.repeat_type !== 'none' && (
              <InfoRow
                label="반복"
                value={
                  event.repeat_type === 'daily'
                    ? '매일'
                    : event.repeat_type === 'weekly'
                      ? '매주'
                      : '매월'
                }
              />
            )}
            {event.rsvp_deadline && (
              <InfoRow
                label="RSVP 마감"
                value={`${formatEventDateLabel(event.rsvp_deadline)} ${formatEventTime(event.rsvp_deadline)}`}
              />
            )}
            <InfoRow label="참석 예정" value={`${event.attendance_count}명`} />
            <InfoRow label="조회수" value={`${event.views}회`} />
          </div>

          {event.description && (
            <p className="text-[12.5px] leading-[1.6] text-gray-700 dark:text-white/75 bg-gray-50 dark:bg-white/[0.03] rounded-xl px-3 py-2.5 line-clamp-4 whitespace-pre-wrap">
              {event.description}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <RowAction onClick={onView} icon="eye" label="보기" />
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
  muted,
}: {
  label: string
  value: number
  accent?: boolean
  muted?: boolean
}) => {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-semibold'
  let tone =
    'bg-gray-100 dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.06] text-gray-700 dark:text-white/75'
  if (accent)
    tone =
      'bg-purple-500/15 dark:bg-purple-500/20 border-purple-500/30 text-purple-700 dark:text-purple-300'
  else if (muted)
    tone =
      'bg-gray-50 dark:bg-white/[0.03] border-gray-200/70 dark:border-white/[0.05] text-gray-500 dark:text-white/55'
  return (
    <span className={`${base} ${tone}`}>
      {label}
      <span className="font-bold">{value}</span>
    </span>
  )
}

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
  eye: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
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
  icon: keyof typeof ACTION_ICONS | string
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

export default EventManagement
