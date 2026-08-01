/**
 * 그룹 관리 (관리자)
 *
 * 관리자가 하는 일은 셋이다 — (1) 어떤 그룹이 있는지 훑고, (2) 특정 그룹을 찾아
 * 초대 코드를 알려주고, (3) 방치된 그룹을 정리한다. 화면도 그 순서로 짰다.
 * 공지사항 관리와 같은 구조(스티키 헤더 · 통계 칩 · 검색/필터 카드 · 접히는 행)를
 * 써서 어드민 화면끼리 조작법이 같게 유지한다.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { fetchAdminGroups, deleteAdminGroup } from '../../api/admin'
import type { AdminGroupListResponse } from '../../api/admin'
import { groupInviteUrl } from '../../utils/inviteLink'
import { FilterChip, FilterRow } from './components/FilterControls'

type AdminGroup = AdminGroupListResponse['data']['items'][number]

type SortKey = 'recent' | 'members' | 'prayers' | 'name'
type ActivityFilter = 'all' | 'active' | 'quiet'

/** 서버 상한(100) — 검색은 전체를 대상으로 해야 하므로 페이지를 모두 받아 둔다 */
const PAGE_LIMIT = 100
/** 안전장치 — 그룹이 폭증해도 요청이 무한정 늘지 않게 */
const MAX_PAGES = 10

/** 기도가 하나도 없고 멤버도 혼자면 '조용한 그룹' — 정리 후보 */
const isQuiet = (g: AdminGroup) => g.prayer_count === 0 && g.member_count <= 1

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 만든 지 얼마나 됐는지 — 날짜만으로는 감이 안 오는 '방치 기간'을 보여준다 */
const daysSince = (iso: string) => {
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  return Math.round((startOf(new Date()) - startOf(new Date(iso))) / 86_400_000)
}

const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 권한 거부·비보안 컨텍스트 — 아래 폴백으로 */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

const GroupManagement = () => {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [activity, setActivity] = useState<ActivityFilter>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  /* 페이지를 나눠 받으면 검색이 '현재 페이지 안에서만' 걸린다 — 관리자는
     없는 그룹이라고 오해하게 된다. 그래서 전체를 받아 두고 검색·정렬은
     클라이언트에서 처리한다 (그룹 수는 많아야 수백 단위). */
  const loadGroups = useCallback(async () => {
    try {
      setLoading(true)
      const first = await fetchAdminGroups(1, PAGE_LIMIT)
      let items = first.data.items
      const pages = Math.min(first.data.total_pages, MAX_PAGES)
      if (pages > 1) {
        const rest = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) => fetchAdminGroups(i + 2, PAGE_LIMIT)),
        )
        items = items.concat(...rest.map(r => r.data.items))
      }
      setGroups(items)
      if (first.data.total > items.length) {
        showToast(`그룹이 많아 최근 ${items.length}개만 불러왔습니다`, 'info')
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : '그룹 목록을 불러오는데 실패했습니다',
        'error',
      )
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    void loadGroups()
  }, [navigate, loadGroups])

  const handleDelete = async (group: AdminGroup) => {
    // 그룹 삭제는 되돌릴 수 없다 — 무엇이 함께 사라지는지 숫자로 보여주고 묻는다
    const detail = [
      `멤버 ${group.member_count}명`,
      `기도제목 ${group.prayer_count}개`,
    ].join(' · ')
    if (
      !confirm(
        `"${group.name}" 그룹을 삭제할까요?\n\n${detail}\n\n그룹에 쌓인 데이터가 모두 사라지며 되돌릴 수 없습니다.`,
      )
    ) {
      return
    }
    try {
      await deleteAdminGroup(group.id)
      showToast('그룹이 삭제되었습니다', 'success')
      void loadGroups()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '그룹 삭제에 실패했습니다', 'error')
    }
  }

  const handleCopyCode = async (group: AdminGroup) => {
    if (!group.invite_code) return
    const ok = await copyText(group.invite_code)
    showToast(
      ok ? `초대 코드 ${group.invite_code}를 복사했습니다` : '복사에 실패했습니다',
      ok ? 'success' : 'error',
    )
  }

  const handleCopyLink = async (group: AdminGroup) => {
    if (!group.invite_code) return
    const ok = await copyText(groupInviteUrl(group.invite_code))
    showToast(ok ? '초대 링크를 복사했습니다' : '복사에 실패했습니다', ok ? 'success' : 'error')
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const arr = groups.filter(g => {
      const matchesSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        (g.description ?? '').toLowerCase().includes(q) ||
        g.creator_name.toLowerCase().includes(q) ||
        (g.invite_code ?? '').toLowerCase().includes(q)
      const matchesActivity =
        activity === 'all' ||
        (activity === 'active' && !isQuiet(g)) ||
        (activity === 'quiet' && isQuiet(g))
      return matchesSearch && matchesActivity
    })

    return [...arr].sort((a, b) => {
      if (sortKey === 'members') return b.member_count - a.member_count
      if (sortKey === 'prayers') return b.prayer_count - a.prayer_count
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'ko')
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [groups, searchTerm, sortKey, activity])

  const totalMembers = groups.reduce((sum, g) => sum + g.member_count, 0)
  const totalPrayers = groups.reduce((sum, g) => sum + g.prayer_count, 0)
  const quietCount = groups.filter(isQuiet).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-24">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">그룹 관리</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* 한눈에 보는 규모 — 그룹 수만으로는 실제 활동을 알 수 없다 */}
        <div className="px-4 pt-4 pb-1 flex gap-2 flex-wrap">
          <StatChip label="그룹" value={groups.length} />
          <StatChip label="멤버" value={totalMembers} accent />
          <StatChip label="기도" value={totalPrayers} />
          {quietCount > 0 && <StatChip label="조용한 그룹" value={quietCount} muted />}
        </div>

        {/* 검색 + 필터 카드 */}
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
                  placeholder="그룹명 · 설명 · 생성자 · 초대 코드"
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

              <FilterRow label="정렬">
                {(
                  [
                    ['recent', '최근 생성'],
                    ['members', '멤버 많은 순'],
                    ['prayers', '기도 많은 순'],
                    ['name', '이름 순'],
                  ] as const
                ).map(([v, l]) => (
                  <FilterChip key={v} active={sortKey === v} onClick={() => setSortKey(v)}>
                    {l}
                  </FilterChip>
                ))}
              </FilterRow>

              <FilterRow label="활동">
                {(
                  [
                    ['all', '전체'],
                    ['active', '활동 중'],
                    ['quiet', '조용함'],
                  ] as const
                ).map(([v, l]) => (
                  <FilterChip key={v} active={activity === v} onClick={() => setActivity(v)}>
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
            검색 결과 <span className="font-bold text-ink-strong">{filtered.length}</span>개
          </span>
          {searchTerm && <span className="text-brand truncate">"{searchTerm}"</span>}
        </div>

        {/* 목록 */}
        <div className="px-4 pb-16 space-y-2">
          {loading ? (
            <SkeletonRows />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">👥</span>
              <p className="text-[13px] text-gray-500 dark:text-white/55">
                {searchTerm || activity !== 'all'
                  ? '조건에 맞는 그룹이 없습니다'
                  : '아직 만들어진 그룹이 없어요'}
              </p>
              <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
                {searchTerm || activity !== 'all'
                  ? '필터를 바꾸거나 검색어를 지워보세요'
                  : '성도들이 홈에서 소그룹을 만들면 여기에 나타납니다'}
              </p>
            </div>
          ) : (
            filtered.map(group => (
              <GroupRow
                key={group.id}
                group={group}
                expanded={expandedId === group.id}
                onToggleExpand={() =>
                  setExpandedId(prev => (prev === group.id ? null : group.id))
                }
                onCopyCode={() => handleCopyCode(group)}
                onCopyLink={() => handleCopyLink(group)}
                onDelete={() => handleDelete(group)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── 그룹 행 ────────────────────────────────────────────
interface GroupRowProps {
  group: AdminGroup
  expanded: boolean
  onToggleExpand: () => void
  onCopyCode: () => void
  onCopyLink: () => void
  onDelete: () => void
}

const GroupRow = ({
  group,
  expanded,
  onToggleExpand,
  onCopyCode,
  onCopyLink,
  onDelete,
}: GroupRowProps) => {
  const quiet = isQuiet(group)
  const age = daysSince(group.created_at)

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border transition-all duration-200',
        'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]',
        expanded ? 'border-[var(--brand-glow)]' : 'border-gray-200/70 dark:border-white/[0.08]',
      ].join(' ')}
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />

      <button
        type="button"
        onClick={onToggleExpand}
        className="relative z-10 w-full flex items-center gap-3 px-3.5 py-3 text-left"
        aria-expanded={expanded}
      >
        <div
          className="shrink-0 w-11 h-11 rounded-[14px] flex items-center justify-center text-[20px]"
          style={{ background: 'var(--brand-soft)' }}
        >
          {group.icon || '👥'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14.5px] font-bold text-ink-strong tracking-[-0.01em] truncate">
              {group.name}
            </span>
            {quiet && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-white/[0.08] text-gray-600 dark:text-white/60 tracking-[0.05em] shrink-0">
                조용함
              </span>
            )}
          </div>
          {group.description && (
            <p className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
              {group.description}
            </p>
          )}
          {/* 관리 판단에 필요한 세 가지 — 규모 · 활동 · 누가 만들었나 */}
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 dark:text-white/50">
            <MetaStat icon="users" value={`${group.member_count}명`} />
            <span className="text-gray-300 dark:text-white/20">·</span>
            <MetaStat icon="pray" value={`${group.prayer_count}개`} />
            <span className="text-gray-300 dark:text-white/20">·</span>
            <span className="truncate">{group.creator_name}</span>
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
        <div className="relative z-10 px-3.5 pb-3.5 border-t border-gray-200/60 dark:border-white/[0.05] pt-3 space-y-3">
          {/* 초대 코드 — 관리자가 이 화면에서 가장 자주 꺼내 쓰는 값이라
              읽고 옮겨 적는 대신 바로 복사할 수 있게 둔다 */}
          {group.invite_code ? (
            <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06] px-3 py-2.5">
              <p className="text-[11px] text-gray-500 dark:text-white/50">초대 코드</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 min-w-0 truncate text-[15px] font-bold tracking-[0.12em] text-ink-strong tabular-nums">
                  {group.invite_code}
                </code>
                <button
                  type="button"
                  onClick={onCopyCode}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold bg-[var(--brand-soft-strong)] text-brand hover:opacity-80 transition-opacity"
                >
                  <CopyIcon />
                  코드
                </button>
                <button
                  type="button"
                  onClick={onCopyLink}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-white/75 hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
                >
                  <LinkIcon />
                  링크
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-gray-500 dark:text-white/50">초대 코드가 없는 그룹입니다</p>
          )}

          <div className="space-y-1.5 text-[12.5px]">
            <InfoRow label="생성자" value={group.creator_name} />
            <InfoRow
              label="생성일"
              value={`${formatDate(group.created_at)}${age > 0 ? ` (${age}일 전)` : ' (오늘)'}`}
            />
            {group.updated_at !== group.created_at && (
              <InfoRow label="수정일" value={formatDate(group.updated_at)} />
            )}
            <InfoRow label="그룹 ID" value={`#${group.id}`} />
          </div>

          {/* 삭제는 펼친 뒤에만 노출 — 목록을 훑다 잘못 누르는 사고를 막는다 */}
          <button
            type="button"
            onClick={onDelete}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-400/30 hover:bg-red-100 dark:hover:bg-red-500/15 transition-colors"
          >
            <TrashIcon />
            그룹 삭제
          </button>
        </div>
      )}
    </div>
  )
}

// ── 작은 컴포넌트들 ────────────────────────────────────
const MetaStat = ({ icon, value }: { icon: 'users' | 'pray'; value: string }) => (
  <span className="inline-flex items-center gap-1 shrink-0 tabular-nums">
    {icon === 'users' ? (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    ) : (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 21s-7-4.35-9.33-8.5A5.5 5.5 0 0 1 12 6.5a5.5 5.5 0 0 1 9.33 6c-2.33 4.15-9.33 8.5-9.33 8.5z" />
      </svg>
    )}
    {value}
  </span>
)

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
  if (accent) tone = 'bg-[var(--brand-soft-strong)] border-[var(--brand-glow)] text-brand'
  else if (muted)
    tone =
      'bg-gray-50 dark:bg-white/[0.03] border-gray-200/70 dark:border-white/[0.05] text-gray-500 dark:text-white/55'
  return (
    <span className={`${base} ${tone}`}>
      {label}
      <span className="font-bold tabular-nums">{value}</span>
    </span>
  )
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-gray-500 dark:text-white/50 shrink-0">{label}</span>
    <span className="text-gray-800 dark:text-white/85 font-medium truncate text-right min-w-0">
      {value}
    </span>
  </div>
)

const SkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-[86px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const LinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

export default GroupManagement
