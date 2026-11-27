// 조직도 관리 데스크 규칙 — 실제 화면과 dev 미리보기가 같이 쓴다
import type { OrgUnit } from '../../../types/organization'

/** 왼쪽 목록에서 고른 것 — 의결기구 묶음 전체 또는 위원회 하나 */
export type OrgSel = 'gov' | number

const walk = (units: OrgUnit[], fn: (u: OrgUnit) => void) =>
  units.forEach((u) => {
    fn(u)
    walk(u.children, fn)
  })

/** 하위(자기 자신 제외) 중 조건에 맞는 개수 */
export const countBelow = (unit: OrgUnit, pred: (u: OrgUnit) => boolean) => {
  let n = 0
  walk(unit.children, (u) => {
    if (pred(u)) n++
  })
  return n
}

/** 목록 전체(하위 포함)에서 숨긴 조직 수 */
export const countHidden = (units: OrgUnit[]) => {
  let n = 0
  walk(units, (u) => {
    if (!u.is_active) n++
  })
  return n
}

/** 이름·설명이 검색어에 맞는 첫 하위 조직 이름 — 위원회 줄에 '○○ 포함'으로 보여 준다 */
export const deepMatch = (unit: OrgUnit, q: string): { self: boolean; child: string | null } | null => {
  const s = q.trim().toLowerCase()
  if (!s) return { self: true, child: null }
  const hit = (u: OrgUnit) => u.name.toLowerCase().includes(s) || (u.note?.toLowerCase().includes(s) ?? false)
  if (hit(unit)) return { self: true, child: null }
  let child: string | null = null
  walk(unit.children, (u) => {
    if (!child && hit(u)) child = u.name
  })
  return child ? { self: false, child } : null
}

/** 자기와 모든 하위 id — 상위 조직 후보에서 빼야 한다(자기 하위 밑으로는 못 옮긴다) */
export const subtreeIds = (unit: OrgUnit) => {
  const ids = new Set<number>([unit.id])
  walk(unit.children, (u) => ids.add(u.id))
  return ids
}

/** 상위 조직 후보 — 부서는 자식을 가질 수 없으므로 제외 */
export const buildParentOptions = (roots: OrgUnit[]) => {
  const out: { id: number | null; name: string; depth: number }[] = [{ id: null, name: '최상위', depth: 0 }]
  const go = (units: OrgUnit[], depth: number) =>
    units.forEach((u) => {
      if (u.unit_type !== 'department') out.push({ id: u.id, name: u.name, depth })
      go(u.children, depth + 1)
    })
  go(roots, 0)
  return out
}

/** 형제 목록에서 한 칸 옮긴 새 순서 — 끝이면 null */
export const shiftOrder = (ids: number[], id: number, dir: 'up' | 'down'): number[] | null => {
  const i = ids.indexOf(id)
  const j = dir === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= ids.length) return null
  const next = [...ids]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

/** 트리에서 id 로 찾기 */
export const findUnit = (roots: OrgUnit[], id: number): OrgUnit | null => {
  let found: OrgUnit | null = null
  walk(roots, (u) => {
    if (!found && u.id === id) found = u
  })
  return found
}

/** 낙관적 수정 — 트리 안의 한 조직만 바꾼 새 트리 */
export const patchUnit = (units: OrgUnit[], id: number, patch: Partial<OrgUnit>): OrgUnit[] =>
  units.map((u) => (u.id === id ? { ...u, ...patch } : { ...u, children: patchUnit(u.children, id, patch) }))
