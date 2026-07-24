import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import {
  getUserList,
  updateUserRole,
  updateUserStatus,
  updateUserApproval,
  getAdminSettings,
  updateAdminSettings,
  type User,
} from '../../api/user'
import { FilterChip, FilterRow } from './components/FilterControls'

type RoleFilter = 'all' | 'admin' | 'user'
type StatusFilter = 'all' | 'active' | 'inactive' | 'pending'
type SortKey = 'recentLogin' | 'createdAt' | 'name'

const UserManagement = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<RoleFilter>('all')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('recentLogin')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [requireApproval, setRequireApproval] = useState(false)
  const [savingApproval, setSavingApproval] = useState(false)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    loadUsers()
    loadSettings()
  }, [navigate])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await getUserList()
      setUsers(data.users)
    } catch (error) {
      console.error('회원 목록 로드 에러:', error)
      showToast('회원 목록을 불러오는데 실패했습니다', 'error')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const settings = await getAdminSettings()
      setRequireApproval(settings.require_signup_approval)
    } catch (error) {
      console.error('운영 설정 로드 에러:', error)
    }
  }

  const handleToggleRequireApproval = async () => {
    const next = !requireApproval
    if (
      next &&
      !confirm('이제부터 가입하는 회원은 관리자가 승인해야 로그인할 수 있습니다.\n켜시겠습니까?')
    ) {
      return
    }
    setSavingApproval(true)
    // 낙관적 반영 — 실패하면 되돌린다
    setRequireApproval(next)
    try {
      const settings = await updateAdminSettings({ require_signup_approval: next })
      setRequireApproval(settings.require_signup_approval)
      showToast(next ? '가입 승인제를 켰습니다' : '가입 승인제를 껐습니다', 'success')
    } catch {
      setRequireApproval(!next)
      showToast('설정 변경에 실패했습니다', 'error')
    } finally {
      setSavingApproval(false)
    }
  }

  const handleApproval = async (userId: number, approve: boolean) => {
    if (!approve && !confirm('가입을 거절하시겠습니까?\n계정은 남지만 로그인이 차단됩니다.')) return
    try {
      await updateUserApproval(userId, approve)
      showToast(approve ? '승인되었습니다' : '가입을 거절했습니다', 'success')
      loadUsers()
    } catch {
      showToast('승인 처리에 실패했습니다', 'error')
    }
  }

  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    if (!confirm(`정말 ${currentStatus ? '일반 사용자로' : '관리자로'} 변경하시겠습니까?`)) return
    try {
      await updateUserRole(userId, !currentStatus)
      showToast('권한이 변경되었습니다', 'success')
      loadUsers()
    } catch {
      showToast('권한 변경에 실패했습니다', 'error')
    }
  }

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    if (!confirm(`정말 ${currentStatus ? '비활성화' : '활성화'}하시겠습니까?`)) return
    try {
      await updateUserStatus(userId, !currentStatus)
      showToast('상태가 변경되었습니다', 'success')
      loadUsers()
    } catch {
      showToast('상태 변경에 실패했습니다', 'error')
    }
  }

  const filteredAndSorted = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const filtered = users.filter(user => {
      const matchesSearch =
        !q ||
        user.username.toLowerCase().includes(q) ||
        (user.full_name?.toLowerCase().includes(q) ?? false)
      const matchesRole =
        filterRole === 'all' ||
        (filterRole === 'admin' && user.is_admin) ||
        (filterRole === 'user' && !user.is_admin)
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && user.is_active) ||
        (filterStatus === 'inactive' && !user.is_active) ||
        (filterStatus === 'pending' && user.approval_status === 'pending')
      return matchesSearch && matchesRole && matchesStatus
    })

    // 승인 대기는 항상 맨 위로 — 처리해야 할 일이 정렬 기준에 묻히지 않게
    return [...filtered].sort((a, b) => {
      const aPending = a.approval_status === 'pending' ? 1 : 0
      const bPending = b.approval_status === 'pending' ? 1 : 0
      if (aPending !== bPending) return bPending - aPending

      if (sortKey === 'recentLogin') {
        const av = a.last_login ? new Date(a.last_login).getTime() : 0
        const bv = b.last_login ? new Date(b.last_login).getTime() : 0
        return bv - av
      }
      if (sortKey === 'createdAt') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      return (a.full_name || a.username).localeCompare(b.full_name || b.username, 'ko')
    })
  }, [users, searchTerm, filterRole, filterStatus, sortKey])

  const adminCount = users.filter(u => u.is_admin).length
  const activeCount = users.filter(u => u.is_active).length
  const pendingCount = users.filter(u => u.approval_status === 'pending').length

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  const formatRelative = (d?: string) => {
    if (!d) return '로그인 기록 없음'
    const diff = Date.now() - new Date(d).getTime()
    const min = 60 * 1000
    const hour = 60 * min
    const day = 24 * hour
    if (diff < hour) return `${Math.max(1, Math.floor(diff / min))}분 전`
    if (diff < day) return `${Math.floor(diff / hour)}시간 전`
    if (diff < 7 * day) return `${Math.floor(diff / day)}일 전`
    return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
          >
            <span className="material-icons-outlined">arrow_back</span>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-gray-900 dark:text-white">회원 관리</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* 통계 칩 */}
        <div className="px-4 pt-4 pb-1 flex gap-2 flex-wrap">
          <StatChip label="전체" value={users.length} />
          <StatChip label="관리자" value={adminCount} accent />
          <StatChip label="활성" value={activeCount} />
          {pendingCount > 0 && <StatChip label="승인 대기" value={pendingCount} warn />}
        </div>

        {/* 가입 승인제 토글 */}
        <div className="px-4 pt-3">
          <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] p-4">
            <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />

            <div className="relative z-10 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-gray-900 dark:text-white tracking-[-0.01em]">
                  가입 승인제
                </p>
                <p className="text-[12px] text-gray-500 dark:text-white/55 mt-1 leading-relaxed">
                  {requireApproval
                    ? '새로 가입한 회원은 관리자 승인 후에만 로그인할 수 있습니다.'
                    : '누구나 회원가입 후 바로 이용할 수 있습니다.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleRequireApproval}
                disabled={savingApproval}
                role="switch"
                aria-checked={requireApproval}
                aria-label="가입 승인제"
                className={`relative shrink-0 w-[52px] h-[30px] rounded-full transition-all duration-200 disabled:opacity-50 ${
                  requireApproval
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_16px_rgba(168,85,247,0.40)]'
                    : 'bg-gray-300 dark:bg-white/[0.12]'
                }`}
              >
                <span
                  className={`absolute top-1/2 -translate-y-1/2 w-[24px] h-[24px] rounded-full bg-white shadow-sm transition-all duration-200 ${
                    requireApproval ? 'left-[25px]' : 'left-[3px]'
                  }`}
                />
              </button>
            </div>

            {requireApproval && pendingCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className="relative z-10 mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-400/30 hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-colors"
              >
                <span className="material-icons-outlined text-[16px]">how_to_reg</span>
                <span>승인 대기 {pendingCount}명 보기</span>
              </button>
            )}
          </div>
        </div>

        {/* 검색 + 필터 카드 */}
        <div className="px-4 py-3">
          <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] p-4">
            <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />

            <div className="relative z-10 space-y-3">
              {/* 검색 */}
              <div className="relative">
                <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 text-[20px] pointer-events-none">search</span>
                <input
                  type="text"
                  placeholder="아이디 · 이름 검색"
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
                    <span className="material-icons-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              {/* 권한 */}
              <FilterRow align="center" label="권한">
                {([['all', '전체'], ['admin', '관리자'], ['user', '일반']] as const).map(([v, l]) => (
                  <FilterChip key={v} active={filterRole === v} onClick={() => setFilterRole(v)}>{l}</FilterChip>
                ))}
              </FilterRow>

              {/* 상태 */}
              <FilterRow align="center" label="상태">
                {([['all', '전체'], ['active', '활성'], ['inactive', '비활성'], ['pending', '승인 대기']] as const).map(([v, l]) => (
                  <FilterChip key={v} active={filterStatus === v} onClick={() => setFilterStatus(v)}>{l}</FilterChip>
                ))}
              </FilterRow>

              {/* 정렬 */}
              <FilterRow align="center" label="정렬">
                {([['recentLogin', '최근 로그인'], ['createdAt', '가입일'], ['name', '이름']] as const).map(([v, l]) => (
                  <FilterChip key={v} active={sortKey === v} onClick={() => setSortKey(v)}>{l}</FilterChip>
                ))}
              </FilterRow>
            </div>
          </div>
        </div>

        {/* 결과 카운트 */}
        <div className="px-5 pb-2 text-[12px] text-gray-500 dark:text-white/55 flex items-center gap-2">
          <span>
            검색 결과 <span className="font-bold text-gray-900 dark:text-white">{filteredAndSorted.length}</span>명
          </span>
          {searchTerm && (
            <span className="text-purple-600 dark:text-purple-300 truncate">"{searchTerm}"</span>
          )}
        </div>

        {/* 회원 목록 */}
        <div className="px-4 pb-10 space-y-2">
          {loading ? (
            <SkeletonRows />
          ) : filteredAndSorted.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="text-[13px] text-gray-500 dark:text-white/55">검색 결과가 없습니다</p>
              <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">필터/검색어를 바꿔보세요</p>
            </div>
          ) : (
            filteredAndSorted.map(user => (
              <UserRow
                key={user.id}
                user={user}
                expanded={expandedId === user.id}
                onToggleExpand={() => setExpandedId(prev => (prev === user.id ? null : user.id))}
                onToggleAdmin={() => handleToggleAdmin(user.id, user.is_admin)}
                onToggleStatus={() => handleToggleStatus(user.id, user.is_active)}
                onApproval={(approve) => handleApproval(user.id, approve)}
                formatDate={formatDate}
                formatRelative={formatRelative}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── 통계 칩 ─────────────────────────────────────────────
interface StatChipProps {
  label: string
  value: number
  accent?: boolean
  /** 처리 대기 중인 항목 — 앰버로 눈에 띄게 (브랜드 purple과 역할 구분) */
  warn?: boolean
}
const StatChip = ({ label, value, accent, warn }: StatChipProps) => {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-semibold '
  const tone = warn
    ? 'bg-amber-500/15 dark:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300'
    : accent
      ? 'bg-purple-500/15 dark:bg-purple-500/20 border-purple-500/30 text-purple-700 dark:text-purple-300'
      : 'bg-gray-100 dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.06] text-gray-700 dark:text-white/75'
  return (
    <span className={base + tone}>
      {label}
      <span className="font-bold">{value}</span>
    </span>
  )
}

// ── 필터 행 ─────────────────────────────────────────────

// ── 스켈레톤 ─────────────────────────────────────────────
const SkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-[68px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

// ── 회원 행 ─────────────────────────────────────────────
interface UserRowProps {
  user: User
  expanded: boolean
  onToggleExpand: () => void
  onToggleAdmin: () => void
  onToggleStatus: () => void
  onApproval: (approve: boolean) => void
  formatDate: (d: string) => string
  formatRelative: (d?: string) => string
}

const UserRow = ({
  user,
  expanded,
  onToggleExpand,
  onToggleAdmin,
  onToggleStatus,
  onApproval,
  formatDate,
  formatRelative,
}: UserRowProps) => (
  <div
    className={`relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] transition-all duration-200 ${
      user.approval_status === 'pending'
        ? 'border-amber-300 dark:border-amber-400/40'
        : 'border-gray-200/70 dark:border-white/[0.08]'
    }`}
  >
    <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />

    {/* 컴팩트 헤더 — 행 전체 클릭으로 펼침 */}
    <button
      type="button"
      onClick={onToggleExpand}
      className="relative z-10 w-full flex items-center gap-3 px-3.5 py-3 text-left"
      aria-expanded={expanded}
    >
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[15px] font-bold">
          {(user.full_name || user.username).charAt(0).toUpperCase()}
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-background-light dark:ring-card-dark ${
            user.approval_status === 'pending'
              ? 'bg-amber-500'
              : user.approval_status === 'rejected'
                ? 'bg-red-500'
                : user.is_active
                  ? 'bg-green-500'
                  : 'bg-gray-400 dark:bg-white/30'
          }`}
          aria-label={
            user.approval_status === 'pending'
              ? '승인 대기'
              : user.approval_status === 'rejected'
                ? '가입 거절'
                : user.is_active
                  ? '활성'
                  : '비활성'
          }
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[14.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em] truncate">
            {user.full_name || user.username}
          </span>
          {user.is_admin && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 tracking-[0.05em] shrink-0">
              ADMIN
            </span>
          )}
          {user.approval_status === 'pending' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 shrink-0">
              승인 대기
            </span>
          )}
          {user.approval_status === 'rejected' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 dark:bg-red-500/15 border border-red-400/30 text-red-600 dark:text-red-300 shrink-0">
              거절됨
            </span>
          )}
        </div>
        <div className="text-[11.5px] text-gray-500 dark:text-white/50 truncate">
          {/* 승인 대기 회원은 로그인 기록이 없으므로 가입 시점을 보여준다 */}
          @{user.username} ·{' '}
          {user.approval_status === 'pending'
            ? `${formatRelative(user.created_at)} 가입 신청`
            : formatRelative(user.last_login)}
        </div>
      </div>

      <span
        className={`material-icons-outlined text-[20px] text-gray-400 dark:text-white/40 transition-transform duration-200 ${
          expanded ? 'rotate-180' : ''
        }`}
      >
        expand_more
      </span>
    </button>

    {/* 확장 영역 */}
    {expanded && (
      <div className="relative z-10 px-3.5 pb-3.5 border-t border-gray-200/60 dark:border-white/[0.05] pt-3 space-y-1.5 text-[12.5px]">
        <InfoRow label="아이디" value={user.username} />
        {user.full_name && <InfoRow label="이름" value={user.full_name} />}
        <InfoRow label="가입일" value={formatDate(user.created_at)} />
        <InfoRow
          label="최근 로그인"
          value={user.last_login ? formatDate(user.last_login) : '로그인 기록 없음'}
        />

        {/* 승인 처리 — 대기/거절 상태일 때만 노출 */}
        {user.approval_status !== 'approved' && (
          <div className="flex gap-2 pt-3">
            <RowAction
              onClick={() => onApproval(true)}
              accent
              icon="how_to_reg"
              label={user.approval_status === 'pending' ? '가입 승인' : '승인으로 되돌리기'}
            />
            {user.approval_status === 'pending' && (
              <RowAction
                onClick={() => onApproval(false)}
                destructive
                icon="person_off"
                label="가입 거절"
              />
            )}
          </div>
        )}

        <div className="flex gap-2 pt-3">
          <RowAction
            onClick={onToggleAdmin}
            accent={!user.is_admin}
            icon={user.is_admin ? 'person' : 'shield_person'}
            label={user.is_admin ? '일반 사용자로' : '관리자로'}
          />
          <RowAction
            onClick={onToggleStatus}
            destructive={user.is_active}
            icon={user.is_active ? 'block' : 'check_circle'}
            label={user.is_active ? '비활성화' : '활성화'}
          />
        </div>
      </div>
    )}
  </div>
)

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-gray-500 dark:text-white/50">{label}</span>
    <span className="text-gray-800 dark:text-white/85 font-medium truncate">{value}</span>
  </div>
)

interface RowActionProps {
  onClick: () => void
  accent?: boolean
  destructive?: boolean
  icon: string
  label: string
}

const RowAction = ({ onClick, accent, destructive, icon, label }: RowActionProps) => {
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
      <span className="material-icons-outlined text-[16px]">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

export default UserManagement
