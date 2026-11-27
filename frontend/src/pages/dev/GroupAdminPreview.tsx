// /dev/groups-admin — 소그룹 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 GroupDesk 를 표본으로 띄운다. 삭제는 이 화면 안에서만 빠지고
// (서버 호출 없음), 복사·초대장은 토스트로만 알린다.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GroupDesk from '../Admin/components/GroupDesk'
import { filterGroups, type AdminGroup, type GroupSeg, type GroupSort } from '../Admin/components/groupDeskUtils'
import { showToast } from '../../utils/toast'

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

const g = (
  id: number,
  name: string,
  icon: string,
  description: string,
  member_count: number,
  prayer_count: number,
  creator_name: string,
  age: number,
): AdminGroup => ({
  id,
  name,
  icon,
  description,
  member_count,
  prayer_count,
  creator_id: id,
  creator_name,
  created_at: daysAgo(age),
  updated_at: daysAgo(age),
  invite_code: `GR${(id * 7919).toString(36).toUpperCase().padStart(4, 'X')}`,
  is_member: false,
  is_admin: false,
})

const SAMPLE: AdminGroup[] = [
  g(6, '청년부 목요일', '❤️', '또래끼리 신앙과 일상을 나누는 소모임이에요. 부담 없이 함께해요.', 1, 0, 'tae', 2),
  g(5, '2026년 새가족', '🙏', '교회에 새로 오신 분들과 함께 첫걸음을 걷는 방이에요. 편하게 기도제목을 나눠요.', 4, 0, 'admin', 9),
  g(4, '3구역', '👥', '매주 모여 말씀과 삶을 나누고, 한 주간 서로의 기도제목을 품는 우리 셀이에요.', 2, 2, 'admin', 21),
  g(3, '밴드모임', '🕊️', '밴드창단', 1, 1, 'hui', 40),
  g(2, '유치부', '❤️', '유치부', 1, 0, 'goo', 64),
  g(1, '찬양팀', '🎵', '찬양', 1, 0, 'goo', 120),
]

const GroupAdminPreview = () => {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<AdminGroup[]>(SAMPLE)
  const [searchTerm, setSearchTerm] = useState('')
  const [seg, setSeg] = useState<GroupSeg>('all')
  const [sort, setSort] = useState<GroupSort>('recent')
  const filtered = useMemo(() => filterGroups(groups, searchTerm, seg, sort), [groups, searchTerm, seg, sort])

  return (
    <GroupDesk
      groups={groups}
      filtered={filtered}
      loading={false}
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
      onViewInvite={(x) => showToast(`미리보기 — ${x.name} 초대장`, 'info')}
      onCopyCode={(x) => showToast(`미리보기 — 코드 ${x.invite_code} 복사`, 'info')}
      onCopyLink={(x) => showToast(`미리보기 — ${x.name} 링크 복사`, 'info')}
      onDelete={(x) => setGroups((list) => list.filter((y) => y.id !== x.id))}
    />
  )
}

export default GroupAdminPreview
