// 소그룹 관리 (관리자)
// Single Responsibility: 그룹 목록 조회·검색/정렬과 복사/삭제 액션.
// 화면은 GroupDesk(관리 데스크 — 목록 + 초대 QR·정리 안내 상세, 2026-11-27)가 그린다.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../utils/toast'
import { fetchAdminGroups, deleteAdminGroup } from '../../api/admin'
import { groupInviteUrl } from '../../utils/inviteLink'
import { copyToClipboard } from '../../utils/clipboard'
import { confirmDialog } from '../../utils/confirmDialog'
import { can } from '../../utils/access'
import GroupDesk from './components/GroupDesk'
import { filterGroups, type AdminGroup, type GroupSeg, type GroupSort } from './components/groupDeskUtils'

/** 서버 상한(100) — 검색은 전체를 대상으로 해야 하므로 페이지를 모두 받아 둔다 */
const PAGE_LIMIT = 100
/** 안전장치 — 그룹이 폭증해도 요청이 무한정 늘지 않게 */
const MAX_PAGES = 10

const GroupManagement = () => {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [seg, setSeg] = useState<GroupSeg>('all')
  const [sort, setSort] = useState<GroupSort>('recent')

  /* 페이지를 나눠 받으면 검색이 '현재 페이지 안에서만' 걸린다 — 관리자는
     없는 그룹이라고 오해하게 된다. 그래서 전체를 받아 두고 검색·정렬은
     클라이언트에서 처리한다 (그룹 수는 많아야 수백 단위). */
  const loadGroups = useCallback(async () => {
    try {
      const first = await fetchAdminGroups(1, PAGE_LIMIT)
      let items = first.data.items
      const pages = Math.min(first.data.total_pages, MAX_PAGES)
      if (pages > 1) {
        const rest = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) => fetchAdminGroups(i + 2, PAGE_LIMIT)),
        )
        items = items.concat(...rest.map((r) => r.data.items))
      }
      setGroups(items)
      if (first.data.total > items.length) {
        showToast(`그룹이 많아 최근 ${items.length}개만 불러왔습니다`, 'info')
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : '그룹 목록을 불러오는데 실패했습니다', 'error')
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    void loadGroups()
  }, [navigate, loadGroups])

  const handleDelete = async (group: AdminGroup) => {
    // 그룹 삭제는 되돌릴 수 없다 — 무엇이 함께 사라지는지 숫자로 보여주고 묻는다
    if (
      !(await confirmDialog({
        title: '그룹 삭제',
        message: `"${group.name}" 그룹을 지울까요?`,
        description: `멤버 ${group.member_count}명 · 기도제목 ${group.prayer_count}개\n그룹에 쌓인 나눔이 모두 사라지며 되돌릴 수 없어요.`,
        confirmText: '네, 지울게요',
        icon: 'delete_forever',
      }))
    ) {
      return
    }
    try {
      await deleteAdminGroup(group.id)
      // 목록을 다시 받지 않고 그 자리에서 뺀다 — 상세는 다음 그룹으로 자연스럽게 넘어간다
      setGroups((prev) => prev.filter((g) => g.id !== group.id))
      showToast('그룹을 지웠어요', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '그룹 삭제에 실패했습니다', 'error')
    }
  }

  const handleCopyCode = async (group: AdminGroup) => {
    if (!group.invite_code) return
    const ok = await copyToClipboard(group.invite_code)
    showToast(ok ? `초대 코드 ${group.invite_code}를 복사했어요` : '복사에 실패했습니다', ok ? 'success' : 'error')
  }

  const handleCopyLink = async (group: AdminGroup) => {
    if (!group.invite_code) return
    const ok = await copyToClipboard(groupInviteUrl(group.invite_code))
    showToast(ok ? '초대 링크를 복사했어요' : '복사에 실패했습니다', ok ? 'success' : 'error')
  }

  const filtered = useMemo(() => filterGroups(groups, searchTerm, seg, sort), [groups, searchTerm, seg, sort])

  return (
    <GroupDesk
      groups={groups}
      filtered={filtered}
      loading={loading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      seg={seg}
      onSegChange={setSeg}
      sort={sort}
      onSortChange={setSort}
      onBack={() => navigate(-1)}
      onClearFilters={() => {
        setSearchTerm('')
        setSeg('all')
      }}
      onViewPublic={() => navigate('/groups')}
      onViewInvite={(g) => g.invite_code && navigate(`/groups/join/${g.invite_code}`)}
      onCopyCode={handleCopyCode}
      onCopyLink={handleCopyLink}
      onDelete={handleDelete}
    />
  )
}

export default GroupManagement
