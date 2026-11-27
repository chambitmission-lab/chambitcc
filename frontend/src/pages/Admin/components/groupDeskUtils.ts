// 소그룹 관리 데스크 규칙 — 실제 화면(GroupManagement)과 dev 미리보기가 같은 규칙을 쓴다
import type { AdminGroupListResponse } from '../../../api/admin'

export type AdminGroup = AdminGroupListResponse['data']['items'][number]
export type GroupSeg = 'all' | 'active' | 'quiet'
export type GroupSort = 'recent' | 'members' | 'prayers' | 'name'

/** 기도가 하나도 없고 멤버도 혼자면 '조용한 그룹' — 정리 후보 */
export const isQuietGroup = (g: AdminGroup) => g.prayer_count === 0 && g.member_count <= 1

/** 검색(이름·소개·만든 사람·초대 코드) + 세그먼트 + 정렬 */
export const filterGroups = (groups: AdminGroup[], searchTerm: string, seg: GroupSeg, sort: GroupSort) => {
  const q = searchTerm.trim().toLowerCase()
  return groups
    .filter((g) => {
      const matchesSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        (g.description ?? '').toLowerCase().includes(q) ||
        g.creator_name.toLowerCase().includes(q) ||
        (g.invite_code ?? '').toLowerCase().includes(q)
      const matchesSeg = seg === 'all' || (seg === 'quiet') === isQuietGroup(g)
      return matchesSearch && matchesSeg
    })
    .sort((a, b) => {
      if (sort === 'members') return b.member_count - a.member_count
      if (sort === 'prayers') return b.prayer_count - a.prayer_count
      if (sort === 'name') return a.name.localeCompare(b.name, 'ko')
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
}
