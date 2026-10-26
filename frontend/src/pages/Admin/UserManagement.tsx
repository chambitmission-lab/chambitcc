import { formatLongDate, timeAgo } from '../../utils/dateUtils'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../utils/toast'
import {
  getUserList,
  updateUserRole,
  updateUserPastor,
  updateUserChurchTitle,
  updateUserStatus,
  updateUserApproval,
  resetUserPassword,
  getAdminSettings,
  updateAdminSettings,
  type User,
} from '../../api/user'
import { confirmDialog } from '../../utils/confirmDialog'
import { can } from '../../utils/access'
import { CLERGY_TITLES } from '../../utils/churchTitles'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import {
  EmptyList,
  MemberDetail,
  MemberListItem,
  SkeletonRows,
  SwitchVisual,
  TempPasswordDialog,
  memberStatus,
} from './userManagementParts'

// 권한·상태를 한 줄 세그먼트로 — 관리자가 실제로 찾는 묶음만
type ListTab = 'all' | 'pending' | 'admin' | 'pastor' | 'inactive'
type SortKey = 'recentLogin' | 'createdAt' | 'name'
type TitleFilter = 'all' | 'clergy' | 'elder' | 'kwonsa' | 'none'

const TITLE_FILTERS: [TitleFilter, string][] = [
  ['all', '전체 직분'],
  ['clergy', '교역자'],
  ['elder', '장로'],
  ['kwonsa', '권사'],
  ['none', '미지정'],
]

const SORTS: [SortKey, string][] = [
  ['recentLogin', '최근 로그인순'],
  ['createdAt', '가입일순'],
  ['name', '이름순'],
]

const matchesTitleFilter = (title: string | null | undefined, f: TitleFilter) => {
  if (f === 'all') return true
  if (f === 'none') return !title
  if (!title) return false
  // 명부에서 '시무장로'·'시무권사'처럼 직접 입력한 값도 같은 묶음으로
  if (f === 'clergy') return CLERGY_TITLES.includes(title) || title.endsWith('목사') || title.endsWith('전도사')
  if (f === 'elder') return title.includes('장로')
  return title.includes('권사')
}

const matchesTab = (u: User, tab: ListTab) => {
  if (tab === 'all') return true
  if (tab === 'admin') return u.is_admin
  if (tab === 'pastor') return !!u.is_pastor
  const st = memberStatus(u)
  if (tab === 'pending') return st === 'pending'
  return st === 'inactive' || st === 'rejected'
}

const isTypingTarget = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el as HTMLElement).isContentEditable)

const UserManagement = () => {
  const navigate = useNavigate()
  const isLg = useMediaQuery('(min-width: 1024px)')
  const searchRef = useRef<HTMLInputElement>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tab, setTab] = useState<ListTab>('all')
  const [filterTitle, setFilterTitle] = useState<TitleFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('recentLogin')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // 모바일: 목록 ↔ 상세를 한 화면씩. PC 는 늘 나란히라 쓰지 않는다
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [requireApproval, setRequireApproval] = useState(false)
  const [savingApproval, setSavingApproval] = useState(false)
  const [tempPassword, setTempPassword] = useState<{ name: string; password: string } | null>(null)

  useEffect(() => {
    if (!can('admin:access')) {
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
      !(await confirmDialog({
        title: '가입 승인제 켜기',
        message: '이제부터 가입하는 회원은 관리자가 승인해야 로그인할 수 있습니다.',
        description: '켜시겠습니까?',
        confirmText: '켜기',
        tone: 'warning',
        icon: 'verified_user',
      }))
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
    if (
      !approve &&
      !(await confirmDialog({
        title: '가입 거절',
        message: '가입을 거절하시겠습니까?',
        description: '계정은 남지만 로그인이 차단됩니다.',
        confirmText: '거절',
        icon: 'person_off',
      }))
    )
      return
    try {
      await updateUserApproval(userId, approve)
      showToast(approve ? '승인되었습니다' : '가입을 거절했습니다', 'success')
      loadUsers()
    } catch {
      showToast('승인 처리에 실패했습니다', 'error')
    }
  }

  // 승인 대기 여러 명 한 번에 — 서버가 요청을 직렬로 처리하므로 한 명씩 차례로 보낸다
  const handleApproveAll = async (ids: number[]) => {
    if (
      !(await confirmDialog({
        title: `${ids.length}명 한 번에 승인`,
        message: `승인 대기 중인 ${ids.length}명을 모두 승인하시겠습니까?`,
        description: '승인하면 바로 로그인할 수 있습니다.',
        confirmText: '모두 승인',
        tone: 'brand',
        icon: 'how_to_reg',
      }))
    )
      return
    let done = 0
    for (const id of ids) {
      try {
        await updateUserApproval(id, true)
        done++
      } catch {
        // 실패한 회원은 대기로 남는다 — 아래 안내로 알린다
      }
    }
    if (done === ids.length) showToast(`${done}명을 승인했습니다`, 'success')
    else showToast(`${done}명 승인, ${ids.length - done}명은 실패했습니다`, 'error')
    loadUsers()
  }

  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    if (
      !(await confirmDialog({
        title: '권한 변경',
        message: `정말 ${currentStatus ? '일반 사용자로' : '관리자로'} 변경하시겠습니까?`,
        description: currentStatus
          ? '관리자 메뉴에 더 이상 접근할 수 없게 됩니다.'
          : '모든 관리자 메뉴에 접근할 수 있게 됩니다.',
        confirmText: '변경',
        tone: 'warning',
        icon: 'admin_panel_settings',
      }))
    )
      return
    try {
      await updateUserRole(userId, !currentStatus)
      showToast('권한이 변경되었습니다', 'success')
      loadUsers()
    } catch {
      showToast('권한 변경에 실패했습니다', 'error')
    }
  }

  const handleTogglePastor = async (userId: number, name: string, currentStatus: boolean) => {
    if (
      !(await confirmDialog({
        title: currentStatus ? '목회자 권한 해제' : '목회자 권한 주기',
        message: currentStatus
          ? `${name} 님의 목회자 권한을 해제하시겠습니까?`
          : `${name} 님에게 목회자 권한을 주시겠습니까?`,
        description: currentStatus
          ? "목회자 화면과 '목사님과 함께'로 올라온 기도를 더 이상 볼 수 없게 됩니다. 직분은 그대로 남습니다."
          : "목회자 화면(성도 명부·심방 기록)과 성도님들이 '목사님과 함께'로 나눈 비밀 기도를 볼 수 있게 됩니다. 교역자에게만 주세요.",
        confirmText: currentStatus ? '해제' : '지정',
        tone: 'warning',
        icon: 'church',
      }))
    )
      return
    try {
      await updateUserPastor(userId, !currentStatus)
      showToast(currentStatus ? '목회자 권한을 해제했습니다' : '목회자 권한을 주었습니다', 'success')
      loadUsers()
    } catch {
      showToast('목회자 지정에 실패했습니다', 'error')
    }
  }

  const handleChurchTitle = async (user: User, title: string | null) => {
    const name = user.full_name || user.username
    // 교역자 직분은 목양 기록 열람 권한까지 켜지므로 한 번 확인한다
    if (
      title &&
      CLERGY_TITLES.includes(title) &&
      !user.is_pastor &&
      !(await confirmDialog({
        title: `${title}(으)로 지정`,
        message: `${name} 님을 ${title}(으)로 지정하시겠습니까?`,
        description:
          "교역자 직분이라 목회자 권한도 함께 켜집니다. 목회자 화면(성도 명부·심방 기록)과 '목사님과 함께' 기도를 볼 수 있게 됩니다.",
        confirmText: '지정',
        tone: 'warning',
        icon: 'church',
      }))
    )
      return
    try {
      const res = await updateUserChurchTitle(user.id, title)
      showToast(res.message, 'success')
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, church_title: res.user.church_title, is_pastor: res.user.is_pastor } : u,
        ),
      )
    } catch {
      showToast('직분 지정에 실패했습니다', 'error')
    }
  }

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    if (
      !(await confirmDialog({
        title: currentStatus ? '계정 비활성화' : '계정 활성화',
        message: `정말 ${currentStatus ? '비활성화' : '활성화'}하시겠습니까?`,
        description: currentStatus
          ? '비활성화된 계정은 로그인할 수 없습니다.'
          : '다시 로그인할 수 있게 됩니다.',
        confirmText: currentStatus ? '비활성화' : '활성화',
        tone: currentStatus ? 'danger' : 'brand',
        icon: currentStatus ? 'block' : 'how_to_reg',
      }))
    )
      return
    try {
      await updateUserStatus(userId, !currentStatus)
      showToast('상태가 변경되었습니다', 'success')
      loadUsers()
    } catch {
      showToast('상태 변경에 실패했습니다', 'error')
    }
  }

  const handleResetPassword = async (userId: number, name: string) => {
    if (
      !(await confirmDialog({
        title: '비밀번호 초기화',
        message: `'${name}' 회원의 비밀번호를 임시 비밀번호로 초기화하시겠습니까?`,
        description: '기존 비밀번호는 즉시 사용할 수 없게 됩니다.',
        confirmText: '초기화',
        tone: 'warning',
        icon: 'lock_reset',
      }))
    )
      return
    try {
      const { temp_password } = await resetUserPassword(userId)
      // 임시 비밀번호를 놓치지 않도록 복사 버튼이 있는 안내창으로 (회원에게 전달 후 직접 변경)
      setTempPassword({ name, password: temp_password })
    } catch {
      showToast('비밀번호 초기화에 실패했습니다', 'error')
    }
  }

  const filteredAndSorted = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const filtered = users.filter(user => {
      const matchesSearch =
        !q ||
        user.username.toLowerCase().includes(q) ||
        (user.full_name?.toLowerCase().includes(q) ?? false)
      return matchesSearch && matchesTab(user, tab) && matchesTitleFilter(user.church_title, filterTitle)
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
  }, [users, searchTerm, tab, filterTitle, sortKey])

  const pendingInList = filteredAndSorted.filter(u => u.approval_status === 'pending')
  const restInList = filteredAndSorted.filter(u => u.approval_status !== 'pending')

  // PC: 고른 회원이 목록에서 빠지면(승인 대기 탭에서 승인 등) 다음 사람을 자동으로 보여 준다
  const activeId = isLg
    ? filteredAndSorted.some(u => u.id === selectedId)
      ? selectedId
      : (filteredAndSorted[0]?.id ?? null)
    : selectedId
  const selectedUser = activeId != null ? (users.find(u => u.id === activeId) ?? null) : null
  const showMobileDetail = !isLg && mobileDetailOpen && !!selectedUser

  const closeMobileDetail = useCallback(() => setMobileDetailOpen(false), [])
  useModalBackButton(closeMobileDetail, showMobileDetail)

  const selectUser = (id: number) => {
    setSelectedId(id)
    if (!isLg) {
      setMobileDetailOpen(true)
      document.getElementById('user-mgmt-top')?.scrollIntoView()
    }
  }

  // PC 키보드 — '/' 검색, ↑↓ 회원 이동 (확인창이 떠 있거나 입력 중이면 무시)
  useEffect(() => {
    if (!isLg) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (document.querySelector('[role="alertdialog"]')) return
      if (isTypingTarget(document.activeElement)) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      if (filteredAndSorted.length === 0) return
      e.preventDefault()
      const i = filteredAndSorted.findIndex(u => u.id === activeId)
      const next =
        e.key === 'ArrowDown' ? Math.min(filteredAndSorted.length - 1, i + 1) : Math.max(0, i - 1)
      const id = filteredAndSorted[next].id
      setSelectedId(id)
      document.getElementById(`member-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isLg, filteredAndSorted, activeId])

  const counts = useMemo(
    () => ({
      all: users.length,
      pending: users.filter(u => u.approval_status === 'pending').length,
      admin: users.filter(u => u.is_admin).length,
      pastor: users.filter(u => u.is_pastor).length,
      inactive: users.filter(u => ['inactive', 'rejected'].includes(memberStatus(u))).length,
      active: users.filter(u => u.is_active).length,
    }),
    [users],
  )

  const TABS: [ListTab, string, number][] = [
    ['all', '전체', counts.all],
    ['pending', '대기', counts.pending],
    ['admin', '관리자', counts.admin],
    ['pastor', '목회자', counts.pastor],
    ['inactive', '비활성', counts.inactive],
  ]

  const resetFilters = () => {
    setSearchTerm('')
    setTab('all')
    setFilterTitle('all')
  }

  const formatDate = (d: string) => formatLongDate(d)

  const formatRelative = (d?: string) =>
    d ? timeAgo(d, { maxDays: 7, beyond: x => formatLongDate(x.toISOString()) }) : '로그인 기록 없음'

  const groupLabel = (text: string) => (
    <p className="px-4 pt-4 pb-1.5 text-[12px] font-bold text-gray-500 dark:text-white/50">{text}</p>
  )

  const renderItem = (u: User) => (
    <MemberListItem
      key={u.id}
      user={u}
      selected={u.id === activeId}
      onSelect={() => selectUser(u.id)}
      formatRelative={formatRelative}
    />
  )

  const selectCls =
    'appearance-none h-9 pl-3 pr-8 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-[12.5px] font-semibold text-gray-700 dark:text-white/80 focus:outline-none focus:border-brand cursor-pointer'

  // ── 왼쪽: 목록 ─────────────────────────────────────────
  const listColumn = (
    <section
      aria-label="회원 목록"
      className="bg-white dark:bg-card-dark min-h-screen lg:min-h-0 lg:w-[372px] lg:shrink-0 lg:flex lg:flex-col lg:border-r border-gray-200/70 dark:border-white/[0.08]"
    >
      <div className="sticky top-14 lg:static z-10 bg-white/95 dark:bg-card-dark/95 backdrop-blur-sm px-4 pt-3 pb-3 space-y-3 border-b border-gray-200/70 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-8 h-8 -ml-1.5 rounded-lg flex items-center justify-center text-gray-500 dark:text-white/60 hover:text-brand hover:bg-gray-50 dark:hover:bg-white/[0.04]"
            aria-label="뒤로"
          >
            <span className="material-icons-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 className="flex-1 text-[19px] font-bold text-ink-strong tracking-[-0.02em]">
            회원 <span className="text-brand">{counts.all}</span>
            <span className="ml-2 text-[12px] font-medium text-gray-400 dark:text-white/40">활성 {counts.active}</span>
          </h1>
          <div className="relative">
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className={selectCls}
              aria-label="정렬"
            >
              {SORTS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <span className="material-icons-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[18px] text-gray-400 pointer-events-none">expand_more</span>
          </div>
        </div>

        {/* 가입 승인제 — 운영 설정이라 한 줄로 작게, 대신 늘 보이게 */}
        <button
          type="button"
          onClick={handleToggleRequireApproval}
          disabled={savingApproval}
          role="switch"
          aria-checked={requireApproval}
          aria-label="가입 승인제"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] text-left disabled:opacity-50"
        >
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-bold text-ink-strong">가입 승인제</span>
            <span className="block text-[11.5px] text-gray-500 dark:text-white/50 mt-0.5 truncate">
              {requireApproval ? '새 회원은 승인 후에만 로그인할 수 있어요' : '누구나 가입 후 바로 이용할 수 있어요'}
            </span>
          </span>
          <SwitchVisual on={requireApproval} small />
        </button>

        <div className="relative">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-gray-400 dark:text-white/40 pointer-events-none">search</span>
          <input
            ref={searchRef}
            type="text"
            placeholder="이름 · 아이디 검색"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && (e.currentTarget as HTMLInputElement).blur()}
            className="w-full h-10 pl-10 pr-10 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand focus:bg-white dark:focus:bg-white/[0.05] transition-colors"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 p-1 rounded-full"
              aria-label="검색어 지우기"
            >
              <span className="material-icons-outlined text-[18px]">close</span>
            </button>
          ) : (
            <kbd className="hidden lg:block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 rounded-md border border-gray-200 dark:border-white/[0.1] text-[11px] text-gray-400 dark:text-white/40 font-sans">/</kbd>
          )}
        </div>

        {/* 권한·상태 세그먼트 */}
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04]" role="tablist">
          {TABS.map(([v, l, n]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={tab === v}
              onClick={() => setTab(v)}
              className={`flex-1 h-8 rounded-lg text-[12.5px] font-semibold whitespace-nowrap transition-colors ${
                tab === v
                  ? 'bg-white dark:bg-white/[0.1] text-ink-strong shadow-sm'
                  : 'text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white/80'
              }`}
            >
              {l}
              {v !== 'all' && n > 0 && (
                <span className={`ml-0.5 ${v === 'pending' ? 'text-amber-600 dark:text-amber-300' : ''}`}>{n}</span>
              )}
            </button>
          ))}
        </div>

        {/* 직분 */}
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TITLE_FILTERS.map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setFilterTitle(v)}
              aria-pressed={filterTitle === v}
              className={`shrink-0 h-7 px-2.5 rounded-full text-[12px] font-semibold border transition-colors ${
                filterTitle === v
                  ? 'bg-[var(--brand-soft-strong)] border-transparent text-brand'
                  : 'border-gray-200 dark:border-white/[0.1] text-gray-500 dark:text-white/55 hover:text-gray-800 dark:hover:text-white/80'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-10 lg:pb-3 lg:flex-1 lg:overflow-y-auto">
        {loading ? (
          <SkeletonRows />
        ) : filteredAndSorted.length === 0 ? (
          <EmptyList onReset={resetFilters} />
        ) : (
          <>
            {pendingInList.length > 0 && (
              <>
                {groupLabel(`승인 대기 ${pendingInList.length}`)}
                {pendingInList.map(renderItem)}
                {pendingInList.length > 1 && (
                  <div className="px-4 pt-1.5">
                    <button
                      type="button"
                      onClick={() => handleApproveAll(pendingInList.map(u => u.id))}
                      className="w-full h-9 rounded-xl border border-dashed border-gray-300 dark:border-white/[0.15] text-[12.5px] font-semibold text-brand hover:bg-[var(--brand-soft)] transition-colors"
                    >
                      대기 {pendingInList.length}명 모두 승인
                    </button>
                  </div>
                )}
              </>
            )}
            {restInList.length > 0 && (
              <>
                {groupLabel(
                  `${SORTS.find(([v]) => v === sortKey)![1]} · ${restInList.length}명`,
                )}
                {restInList.map(renderItem)}
              </>
            )}
          </>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-1.5 px-4 py-2 border-t border-gray-200/70 dark:border-white/[0.06] text-[11.5px] text-gray-400 dark:text-white/40">
        <kbd className="px-1.5 rounded-md border border-gray-200 dark:border-white/[0.1] font-sans">↑</kbd>
        <kbd className="px-1.5 rounded-md border border-gray-200 dark:border-white/[0.1] font-sans">↓</kbd>
        회원 이동
        <kbd className="ml-2 px-1.5 rounded-md border border-gray-200 dark:border-white/[0.1] font-sans">/</kbd>
        검색
      </div>
    </section>
  )

  const detail = selectedUser && (
    <MemberDetail
      key={selectedUser.id}
      user={selectedUser}
      onToggleAdmin={() => handleToggleAdmin(selectedUser.id, selectedUser.is_admin)}
      onTogglePastor={() =>
        handleTogglePastor(selectedUser.id, selectedUser.full_name || selectedUser.username, !!selectedUser.is_pastor)
      }
      onChurchTitle={title => handleChurchTitle(selectedUser, title)}
      onToggleStatus={() => handleToggleStatus(selectedUser.id, selectedUser.is_active)}
      onApproval={approve => handleApproval(selectedUser.id, approve)}
      onResetPassword={() => handleResetPassword(selectedUser.id, selectedUser.full_name || selectedUser.username)}
      formatDate={formatDate}
      formatRelative={formatRelative}
    />
  )

  return (
    // PC(lg+): 목록·상세가 각자 스크롤하는 고정 높이 2단. 모바일: 목록 ↔ 상세 한 화면씩
    <div
      id="user-mgmt-top"
      className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:h-[calc(100vh-56px)] lg:min-h-0 lg:p-4 lg:overflow-hidden"
    >
      <div className="max-w-md mx-auto lg:max-w-[1240px] lg:h-full lg:flex lg:rounded-3xl lg:overflow-hidden lg:border border-gray-200/70 dark:border-white/[0.08]">
        {showMobileDetail ? (
          <div className="min-h-screen">
            <div className="sticky top-14 z-10 bg-[var(--app-canvas)]/95 dark:bg-background-dark/95 backdrop-blur-sm px-2 h-12 flex items-center border-b border-gray-200/70 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => history.back()}
                className="h-9 px-2 rounded-lg inline-flex items-center gap-1 text-[14px] font-semibold text-gray-700 dark:text-white/80"
              >
                <span className="material-icons-outlined text-[22px]">arrow_back</span>
                회원 목록
              </button>
            </div>
            {detail}
          </div>
        ) : (
          <>
            {listColumn}
            {isLg && (
              <section aria-label="회원 상세" className="flex-1 min-w-0 overflow-y-auto">
                {detail ??
                  (!loading && (
                    <div className="h-full flex items-center justify-center text-[13.5px] text-gray-400 dark:text-white/40">
                      왼쪽에서 회원을 골라 주세요
                    </div>
                  ))}
              </section>
            )}
          </>
        )}
      </div>

      {tempPassword && (
        <TempPasswordDialog
          name={tempPassword.name}
          password={tempPassword.password}
          onClose={() => setTempPassword(null)}
        />
      )}
    </div>
  )
}

export default UserManagement
