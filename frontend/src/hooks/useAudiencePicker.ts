import { useMemo, useState } from 'react'
import { getUserList, type User } from '../api/user'
import { showToast } from '../utils/toast'

export type AudienceMode = 'all' | 'active' | 'admin' | 'selected'
export type UserListFilter = 'all' | 'active' | 'admin'

/**
 * 발송 대상 선택 상태 — 사용자 목록 로딩, 대상 모드(전체/활성/관리자/직접 선택),
 * 직접 선택 모드의 검색·필터·체크 상태를 묶는다.
 * 푸시 발송 외에도 "회원 대상 지정"이 필요한 어드민 화면에서 재사용 가능.
 */
export const useAudiencePicker = () => {
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  const [audienceMode, setAudienceMode] = useState<AudienceMode>('all')
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [userListFilter, setUserListFilter] = useState<UserListFilter>('all')
  const [userSearch, setUserSearch] = useState('')

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const data = await getUserList()
      setUsers(data.users)
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
      showToast('사용자 목록을 불러오는데 실패했습니다', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const adminCount = users.filter((u) => u.is_admin).length
  const activeCount = users.filter((u) => u.is_active).length

  // 사용자 리스트 (선택 발송 모드용)
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    return users.filter((u) => {
      if (userListFilter === 'active' && !u.is_active) return false
      if (userListFilter === 'admin' && !u.is_admin) return false
      if (!q) return true
      return (
        u.username.toLowerCase().includes(q) ||
        (u.full_name?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [users, userListFilter, userSearch])

  // 실제 발송 대상 user_ids (audienceMode 별) — 'all'은 undefined(서버가 전체로 해석)
  const audienceUserIds = useMemo<number[] | undefined>(() => {
    if (audienceMode === 'all') return undefined
    if (audienceMode === 'active') return users.filter((u) => u.is_active).map((u) => u.id)
    if (audienceMode === 'admin') return users.filter((u) => u.is_admin).map((u) => u.id)
    return selectedUserIds
  }, [audienceMode, users, selectedUserIds])

  const audienceCount =
    audienceMode === 'all' ? users.length : (audienceUserIds?.length ?? 0)

  const audienceLabel = (() => {
    if (audienceMode === 'all') return `전체 ${users.length}명`
    if (audienceMode === 'active') return `활성 회원 ${audienceCount}명`
    if (audienceMode === 'admin') return `관리자 ${audienceCount}명`
    return `선택 ${audienceCount}명`
  })()

  const toggleUser = (id: number) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredUsers.map((u) => u.id)
    const allSelected = visibleIds.every((id) => selectedUserIds.includes(id))
    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const reset = () => {
    setSelectedUserIds([])
    setAudienceMode('all')
  }

  return {
    users,
    isLoadingUsers,
    loadUsers,
    audienceMode,
    setAudienceMode,
    selectedUserIds,
    userListFilter,
    setUserListFilter,
    userSearch,
    setUserSearch,
    filteredUsers,
    audienceUserIds,
    audienceCount,
    audienceLabel,
    adminCount,
    activeCount,
    toggleUser,
    toggleSelectAllVisible,
    reset,
  }
}

export type AudiencePickerState = ReturnType<typeof useAudiencePicker>
