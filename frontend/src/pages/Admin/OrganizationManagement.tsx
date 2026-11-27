// 조직도 관리 (admin, /admin/organization)
// Single Responsibility: 조직 트리 조회와 추가·수정·삭제·순서·보임 전환·기본 조직도 넣기.
// 화면은 OrganizationDesk(관리 데스크 — 의결기구·위원회 목록 + 하위 조직 편집 트리, 2026-11-27),
// 추가·수정 폼은 org/UnitComposer 가 그린다.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import {
  organizationKeys,
  useAdminOrgTree,
  useCreateOrgUnit,
  useDeleteOrgUnit,
  useReorderOrgUnits,
  useSeedOrg,
  useUpdateOrgUnit,
} from '../../hooks/useOrganization'
import { UNIT_TYPE_LABEL, type OrgTree, type OrgUnit, type OrgUnitType } from '../../types/organization'
import { can } from '../../utils/access'
import { countAll } from './org/orgCount'
import { UnitComposer, type FormState } from './org/UnitComposer'
import OrganizationDesk from './components/OrganizationDesk'
import { buildParentOptions, patchUnit, shiftOrder, subtreeIds } from './components/organizationDeskUtils'

const EMPTY_FORM: FormState = { name: '', unit_type: 'department', parent_id: null, is_active: true, note: '' }

type Composer =
  | { mode: 'create'; initial: FormState; parentLabel: string }
  | { mode: 'edit'; unit: OrgUnit; initial: FormState; parentLabel: string }
  | null

const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback)

const OrganizationManagement = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading } = useAdminOrgTree()
  const createUnit = useCreateOrgUnit()
  const updateUnit = useUpdateOrgUnit()
  const deleteUnit = useDeleteOrgUnit()
  const reorder = useReorderOrgUnits()
  const seed = useSeedOrg()

  const [composer, setComposer] = useState<Composer>(null)

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [navigate])

  const parentOptions = useMemo(() => buildParentOptions([...(data?.governance ?? []), ...(data?.committees ?? [])]), [data])

  const openCreate = (parent: OrgUnit | null, unitType: OrgUnitType) =>
    setComposer({
      mode: 'create',
      initial: { ...EMPTY_FORM, unit_type: unitType, parent_id: parent?.id ?? null },
      parentLabel: parent ? `${parent.name} 아래에 ${UNIT_TYPE_LABEL[unitType]} 추가` : `최상위에 ${UNIT_TYPE_LABEL[unitType]} 추가`,
    })

  const openEdit = (unit: OrgUnit) =>
    setComposer({
      mode: 'edit',
      unit,
      initial: { name: unit.name, unit_type: unit.unit_type, parent_id: unit.parent_id, is_active: unit.is_active, note: unit.note ?? '' },
      parentLabel: `${UNIT_TYPE_LABEL[unit.unit_type]} · ${unit.name}`,
    })

  const handleSave = async (form: FormState) => {
    if (!form.name.trim()) {
      showToast('조직 이름을 입력하세요', 'error')
      return
    }
    const payload = { name: form.name.trim(), unit_type: form.unit_type, parent_id: form.parent_id, is_active: form.is_active, note: form.note.trim() || null }
    try {
      if (composer?.mode === 'edit') {
        await updateUnit.mutateAsync({ id: composer.unit.id, data: payload })
        showToast('고쳤어요', 'success')
      } else {
        await createUnit.mutateAsync(payload)
        showToast('추가했어요', 'success')
      }
      setComposer(null)
    } catch (e) {
      showToast(errMsg(e, '저장 실패'), 'error')
    }
  }

  const handleDelete = async (unit: OrgUnit) => {
    const childCount = countAll(unit) - 1
    const ok = await confirmDialog({
      title: '조직 삭제',
      message: `"${unit.name}"을(를) 지울까요?`,
      description: `${childCount > 0 ? `하위 조직 ${childCount}개도 함께 사라져요. ` : ''}되돌릴 수 없어요. 잠시 가리려면 숨김을 쓰세요.`,
      confirmText: '네, 지울게요',
      icon: 'delete_forever',
    })
    if (!ok) return
    try {
      await deleteUnit.mutateAsync(unit.id)
      showToast('지웠어요', 'success')
    } catch (e) {
      showToast(errMsg(e, '삭제 실패'), 'error')
    }
  }

  const saveOrder = (parentId: number | null, orderedIds: number[], onError?: () => void) =>
    reorder.mutate(
      { parentId, orderedIds },
      {
        onError: (e) => {
          showToast(errMsg(e, '순서 변경 실패'), 'error')
          onError?.()
        },
      },
    )

  // 화살표도 드래그와 같은 /reorder 로 — 예전 /move 는 최상위에서 의결기구와 위원회를 한 줄로 보고 바꿔,
  // 첫 위원회 '위로'가 화면상 아무 변화 없이 마지막 의결기구와 자리만 맞바꾸곤 했다.
  const handleMove = (unit: OrgUnit, dir: 'up' | 'down', siblingIds: number[], parentId: number | null) => {
    const next = shiftOrder(siblingIds, unit.id, dir)
    if (next) saveOrder(parentId, next)
  }

  // 보임/숨김 — 스위치가 바로 넘어가게(낙관적), 실패하면 되돌린다
  const handleToggleActive = async (unit: OrgUnit) => {
    const key = organizationKeys.adminTree()
    const prev = qc.getQueryData<OrgTree>(key)
    const next = !unit.is_active
    if (prev)
      qc.setQueryData<OrgTree>(key, {
        ...prev,
        governance: patchUnit(prev.governance, unit.id, { is_active: next }),
        committees: patchUnit(prev.committees, unit.id, { is_active: next }),
      })
    try {
      await updateUnit.mutateAsync({ id: unit.id, data: { is_active: next } })
      showToast(next ? '성도 조직도에 다시 보여요' : '숨겼어요 — 성도 조직도에서 안 보여요', 'success')
    } catch (e) {
      if (prev) qc.setQueryData(key, prev)
      showToast(errMsg(e, '바꾸지 못했어요'), 'error')
    }
  }

  const handleSeed = async (force: boolean) => {
    if (force) {
      const ok = await confirmDialog({
        title: '기본 조직도로 되돌리기',
        message: '지금 조직도를 모두 지우고 기본 조직도를 다시 넣을까요?',
        description: '지금까지 고친 내용은 모두 사라져요.',
        confirmText: '되돌리기',
        icon: 'restart_alt',
      })
      if (!ok) return
    }
    try {
      const result = await seed.mutateAsync(force)
      showToast(result.message, result.seeded ? 'success' : 'error')
    } catch (e) {
      showToast(errMsg(e, '기본 조직도 넣기 실패'), 'error')
    }
  }

  return (
    <>
      <OrganizationDesk
        tree={data}
        loading={isLoading}
        seeding={seed.isPending}
        onSeed={(force) => void handleSeed(force)}
        onBack={() => navigate(-1)}
        onReorderCommittees={(ids, onError) => saveOrder(null, ids, onError)}
        keyboardPaused={composer != null}
        onCreate={openCreate}
        onAddChild={(parent) => openCreate(parent, parent.unit_type === 'governance' ? 'governance' : 'department')}
        onEdit={openEdit}
        onMove={handleMove}
        onDelete={(u) => void handleDelete(u)}
        onReorder={saveOrder}
        onToggleActive={(u) => void handleToggleActive(u)}
        onViewPublic={() => navigate('/organization')}
      />

      {composer && (
        <UnitComposer
          key={composer.mode === 'edit' ? `edit-${composer.unit.id}` : 'create'}
          mode={composer.mode}
          initial={composer.initial}
          parentLabel={composer.parentLabel}
          // 자기 자신과 자기 하위로는 옮길 수 없다(서버도 막지만, 고를 수 없게 미리 뺀다)
          parentOptions={composer.mode === 'edit' ? parentOptions.filter((o) => o.id == null || !subtreeIds(composer.unit).has(o.id)) : parentOptions}
          onSave={handleSave}
          onCancel={() => setComposer(null)}
          isPending={createUnit.isPending || updateUnit.isPending}
        />
      )}
    </>
  )
}

export default OrganizationManagement
