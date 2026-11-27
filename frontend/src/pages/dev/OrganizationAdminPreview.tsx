// /dev/organization-admin — 조직도 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 OrganizationDesk 를 표본으로 띄운다. 순서 바꾸기(드래그·화살표)·숨김·삭제는
// 이 화면 안에서만 바뀌고(서버 호출 없음), 추가·수정은 토스트로만 알린다. 국 있는 위원회·부서 없는 위원회·숨김 포함.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OrganizationDesk from '../Admin/components/OrganizationDesk'
import { patchUnit } from '../Admin/components/organizationDeskUtils'
import type { OrgTree, OrgUnit, OrgUnitType } from '../../types/organization'
import { showToast } from '../../utils/toast'

let seq = 0
const u = (name: string, unit_type: OrgUnitType, children: OrgUnit[] = [], p: Partial<OrgUnit> = {}): OrgUnit => {
  const id = ++seq
  return { id, parent_id: null, name, unit_type, sort_order: id, is_active: true, note: null, ...p, children: children.map((c) => ({ ...c, parent_id: id })) }
}
const d = (name: string, p: Partial<OrgUnit> = {}) => u(name, 'department', [], p)

const SEED: OrgTree = {
  governance: [u('공동의회', 'governance', [u('당회', 'governance', [u('제직회', 'governance')])])],
  committees: [
    u('예배위원회', 'committee', [u('예배국', 'bureau', [d('찬양대'), d('안내부', { note: '주일 1·2·3부 안내' }), d('헌금위원')]), u('방송국', 'bureau', [d('영상부'), d('음향부')])], {
      note: '주일 예배와 절기 예배 전반',
    }),
    u('교육위원회', 'committee', [d('유치부'), d('유년부'), d('초등부'), d('중고등부'), d('청년부', { is_active: false })]),
    u('선교위원회', 'committee', [d('국내선교부'), d('해외선교부')]),
    u('봉사위원회', 'committee', [], { is_active: false }),
  ],
  committee_count: 4,
  department_count: 13,
  updated_at: null,
}

const removeUnit = (units: OrgUnit[], id: number): OrgUnit[] => units.filter((x) => x.id !== id).map((x) => ({ ...x, children: removeUnit(x.children, id) }))
const reorderIn = (units: OrgUnit[], parentId: number | null, ids: number[]): OrgUnit[] => {
  const sortList = (list: OrgUnit[]) => [...list].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
  if (parentId == null) return units.some((x) => ids.includes(x.id)) ? sortList(units) : units
  return units.map((x) => (x.id === parentId ? { ...x, children: sortList(x.children) } : { ...x, children: reorderIn(x.children, parentId, ids) }))
}

const OrganizationAdminPreview = () => {
  const navigate = useNavigate()
  const [tree, setTree] = useState(SEED)
  const apply = (fn: (l: OrgUnit[]) => OrgUnit[]) => setTree((t) => ({ ...t, governance: fn(t.governance), committees: fn(t.committees) }))
  const saveOrder = (parentId: number | null, ids: number[]) => apply((l) => reorderIn(l, parentId, ids))

  return (
    <OrganizationDesk
      tree={tree}
      loading={false}
      seeding={false}
      onSeed={() => showToast('미리보기 — 기본 조직도를 넣어요', 'info')}
      onBack={() => navigate(-1)}
      onReorderCommittees={(ids) => saveOrder(null, ids)}
      onCreate={(parent, type) => showToast(`미리보기 — ${parent ? `${parent.name} 아래 ` : ''}${type} 추가 창이 열려요`, 'info')}
      onAddChild={(parent) => showToast(`미리보기 — ${parent.name} 아래 추가 창이 열려요`, 'info')}
      onEdit={(x) => showToast(`미리보기 — '${x.name}' 수정 창이 열려요`, 'info')}
      onMove={(x, dir, siblings, parentId) => {
        const i = siblings.indexOf(x.id)
        const j = dir === 'up' ? i - 1 : i + 1
        if (j < 0 || j >= siblings.length) return
        const next = [...siblings]
        ;[next[i], next[j]] = [next[j], next[i]]
        saveOrder(parentId, next)
      }}
      onDelete={(x) => apply((l) => removeUnit(l, x.id))}
      onReorder={(parentId, ids) => saveOrder(parentId, ids)}
      onToggleActive={(x) => apply((l) => patchUnit(l, x.id, { is_active: !x.is_active }))}
      onViewPublic={() => showToast('미리보기 — /organization 으로 가요', 'info')}
    />
  )
}

export default OrganizationAdminPreview
