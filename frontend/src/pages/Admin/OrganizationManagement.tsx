import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import { useDragSort } from '../../hooks/useDragSort'
import {
  useAdminOrgTree,
  useCreateOrgUnit,
  useDeleteOrgUnit,
  useMoveOrgUnit,
  useReorderOrgUnits,
  useSeedOrg,
  useUpdateOrgUnit,
} from '../../hooks/useOrganization'
import { UNIT_TYPE_LABEL, type OrgUnit, type OrgUnitType } from '../../types/organization'
import { can } from '../../utils/access'
import { CommitteeGroup, DragHandle, SortableRows } from './org/OrgTree'
import { countAll } from './org/orgCount'
import type { FormState } from './org/UnitComposer'
import type { RowActions } from './org/OrgTree'
import { UnitComposer } from './org/UnitComposer'


const EMPTY_FORM: FormState = {
  name: '',
  unit_type: 'department',
  parent_id: null,
  is_active: true,
  note: '',
}

const OrganizationManagement = () => {
  const navigate = useNavigate()
  const { data, isLoading } = useAdminOrgTree()
  const createUnit = useCreateOrgUnit()
  const updateUnit = useUpdateOrgUnit()
  const deleteUnit = useDeleteOrgUnit()
  const moveUnit = useMoveOrgUnit()
  const reorderCommittees = useReorderOrgUnits()
  const seed = useSeedOrg()

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [composer, setComposer] = useState<
    | { mode: 'create'; initial: FormState; parentLabel: string }
    | { mode: 'edit'; unit: OrgUnit; initial: FormState; parentLabel: string }
    | null
  >(null)

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [navigate])

  // 위원회 카드 자체도 드래그로 순서를 바꿀 수 있다 (형제 = 루트의 위원회들)
  const committeeSort = useDragSort(
    (data?.committees ?? []).map(c => c.id),
    ordered =>
      reorderCommittees.mutate(
        { parentId: null, orderedIds: ordered },
        {
          onError: err => {
            showToast(err instanceof Error ? err.message : '순서 변경 실패', 'error')
            committeeSort.resetOrder()
          },
        },
      ),
  )
  const committeesById = useMemo(
    () => new Map((data?.committees ?? []).map(c => [c.id, c])),
    [data],
  )

  // 상위 조직 이동 후보 — 부서는 자식을 가질 수 없으므로 제외한다
  const parentOptions = useMemo(() => {
    const options: { id: number | null; name: string; depth: number }[] = [
      { id: null, name: '최상위', depth: 0 },
    ]
    const walk = (units: OrgUnit[], depth: number) => {
      units.forEach(unit => {
        if (unit.unit_type !== 'department') {
          options.push({ id: unit.id, name: unit.name, depth })
        }
        walk(unit.children, depth + 1)
      })
    }
    walk([...(data?.governance ?? []), ...(data?.committees ?? [])], 0)
    return options
  }, [data])

  const inactiveCount = useMemo(() => {
    if (!data) return 0
    const count = (units: OrgUnit[]): number =>
      units.reduce(
        (total, unit) => total + (unit.is_active ? 0 : 1) + count(unit.children),
        0,
      )
    return count([...data.governance, ...data.committees])
  }, [data])

  const toggle = (id: number) =>
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const openCreate = (parent: OrgUnit | null, unitType: OrgUnitType) =>
    setComposer({
      mode: 'create',
      initial: { ...EMPTY_FORM, unit_type: unitType, parent_id: parent?.id ?? null },
      parentLabel: parent ? `${parent.name} 아래에 추가` : '최상위에 추가',
    })

  const openEdit = (unit: OrgUnit) =>
    setComposer({
      mode: 'edit',
      unit,
      initial: {
        name: unit.name,
        unit_type: unit.unit_type,
        parent_id: unit.parent_id,
        is_active: unit.is_active,
        note: unit.note ?? '',
      },
      parentLabel: `${UNIT_TYPE_LABEL[unit.unit_type]} · ${unit.name}`,
    })

  const handleSave = async (form: FormState) => {
    if (!form.name.trim()) {
      showToast('조직 이름을 입력하세요', 'error')
      return
    }
    const payload = {
      name: form.name.trim(),
      unit_type: form.unit_type,
      parent_id: form.parent_id,
      is_active: form.is_active,
      note: form.note.trim() || null,
    }
    try {
      if (composer?.mode === 'edit') {
        await updateUnit.mutateAsync({ id: composer.unit.id, data: payload })
        showToast('수정되었습니다', 'success')
      } else {
        await createUnit.mutateAsync(payload)
        showToast('추가되었습니다', 'success')
      }
      setComposer(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '저장 실패', 'error')
    }
  }

  const handleDelete = async (unit: OrgUnit) => {
    const childCount = countAll(unit) - 1
    const confirmed = await confirmDialog({
      title: '조직 삭제',
      message: `"${unit.name}"을(를) 삭제할까요?`,
      description:
        childCount > 0
          ? `하위 조직 ${childCount}개도 함께 삭제됩니다.`
          : '삭제하면 되돌릴 수 없습니다.',
      confirmText: '삭제',
      icon: 'delete_forever',
    })
    if (!confirmed) return
    try {
      await deleteUnit.mutateAsync(unit.id)
      showToast('삭제되었습니다', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '삭제 실패', 'error')
    }
  }

  const handleMove = async (unit: OrgUnit, direction: 'up' | 'down') => {
    try {
      await moveUnit.mutateAsync({ id: unit.id, direction })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '순서 변경 실패', 'error')
    }
  }

  const handleSeed = async (force: boolean) => {
    if (force) {
      const confirmed = await confirmDialog({
        title: '조직도 초기화',
        message: '기존 조직도를 모두 지우고 기본 조직도를 다시 넣을까요?',
        description: '지금까지 수정한 내용은 사라집니다.',
        confirmText: '다시 넣기',
        icon: 'restart_alt',
      })
      if (!confirmed) return
    }
    try {
      const result = await seed.mutateAsync(force)
      showToast(result.message, result.seeded ? 'success' : 'error')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '씨드 실패', 'error')
    }
  }

  const rowActions: RowActions = {
    onAddChild: (parent: OrgUnit) =>
      openCreate(parent, parent.unit_type === 'governance' ? 'governance' : 'department'),
    onEdit: openEdit,
    onMove: handleMove,
    onDelete: handleDelete,
  }

  const isEmpty =
    !isLoading && data && data.governance.length === 0 && data.committees.length === 0

  return (
    // lg 에선 이 페이지만 스스로 스크롤하는 상자로 만든다 — #root 의 overflow-y 탓에
    // sticky 가 전역으로 죽어 있어, 이 상자가 있어야 우측 도구 레일 sticky 가 산다.
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark lg:h-[calc(100vh-56px)] lg:min-h-0 lg:overflow-y-auto">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-24 lg:max-w-[1100px] lg:mt-2 lg:mb-10 lg:min-h-0 lg:pb-8 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark">
        {/* 헤더 */}
        {/* lg 에선 도구가 우측 레일에 고정되므로 헤더 sticky 를 풀어 둔다 */}
        <div className="sticky top-0 lg:static lg:rounded-t-3xl z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">조직도 관리</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* PC(lg+) 2단 — 좌: 조직 트리 / 우: 추가 버튼·통계·안내가 sticky.
            래퍼 3개는 lg 미만에서 display:contents 라 모바일 흐름은 기존과 완전히 동일하다. */}
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:items-start lg:px-5 lg:pt-4">
          <div className="contents lg:block lg:col-start-2 lg:row-start-1 lg:sticky lg:top-3 lg:space-y-3">
            {/* PC 전용 추가 버튼 — lg 에선 FAB 대신 레일 상단에서 연다 */}
            <button
              type="button"
              onClick={() => openCreate(null, 'committee')}
              className="hidden lg:flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
            >
              <span className="material-icons-round text-[18px]">add</span>
              위원회 추가
            </button>

            {/* 통계 + 초기화 */}
            <div className="px-4 pt-4 pb-2 lg:px-0 lg:pt-0 flex items-center justify-between gap-2">
              <div className="flex gap-2 flex-wrap">
                <span className="text-[13px] px-3 py-1 rounded-full bg-[var(--brand-soft-strong)] text-brand font-semibold border border-[var(--brand-glow)]">
                  위원회 {data?.committee_count ?? 0}
                </span>
                <span className="text-[13px] px-3 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/50 font-medium border border-gray-200/50 dark:border-white/[0.06]">
                  부서 {data?.department_count ?? 0}
                </span>
                {inactiveCount > 0 && (
                  <span className="text-[13px] px-3 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/35 font-medium border border-gray-200/50 dark:border-white/[0.06]">
                    숨김 {inactiveCount}
                  </span>
                )}
              </div>
              {!isEmpty && (
                <button
                  onClick={() => handleSeed(true)}
                  disabled={seed.isPending}
                  className="shrink-0 text-[12px] px-3 py-1.5 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.08] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 transition-colors"
                >
                  초기화
                </button>
              )}
            </div>

            <p className="px-4 pb-2 lg:px-0 text-[11.5px] text-gray-400 dark:text-white/35 leading-relaxed">
              위원회 → 국 → 부서 순서로 묶입니다. 국은 생략하고 위원회 아래 부서를 바로 둘 수도 있습니다.
              이름 왼쪽의 ⠿ 핸들을 잡고 끌면 같은 묶음 안에서 순서를 바꿀 수 있습니다.
            </p>

          </div>

          <div className="contents lg:block lg:col-start-1 lg:row-start-1 lg:min-w-0">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
              </div>
            ) : isEmpty ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <span className="material-icons-outlined text-[48px] text-gray-200 dark:text-white/20 mb-3">
                  account_tree
                </span>
                <p className="text-sm text-gray-400 dark:text-white/30 mb-4">
                  아직 등록된 조직도가 없습니다
                </p>
                <button
                  onClick={() => handleSeed(false)}
                  disabled={seed.isPending}
                  className="px-4 py-2 text-sm font-semibold bg-brand text-white rounded-xl hover:bg-brand-dim disabled:opacity-50 transition-colors"
                >
                  기본 조직도 넣기
                </button>
              </div>
            ) : (
              <>
                {/* 의결기구 */}
                <section className="px-4 pt-2 lg:px-0 lg:pt-0">
                  <div className="flex items-center justify-between px-1 mb-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                      의결기구
                    </p>
                    <button
                      onClick={() => openCreate(null, 'governance')}
                      className="text-[12px] font-semibold text-brand hover:bg-[var(--brand-soft)] px-2 py-1 rounded-lg transition-colors"
                    >
                      + 추가
                    </button>
                  </div>
                  <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] px-3.5 py-1">
                    {data && data.governance.length > 0 ? (
                      <SortableRows
                        parentId={null}
                        units={data.governance}
                        depth={0}
                        isLast
                        actions={rowActions}
                      />
                    ) : (
                      <p className="py-3 text-[12.5px] text-gray-400 dark:text-white/30">
                        등록된 의결기구가 없습니다
                      </p>
                    )}
                  </div>
                </section>

                {/* 위원회 */}
                <section className="px-4 pt-4 lg:px-0 lg:pb-8 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted px-1">
                    위원회
                  </p>
                  {committeeSort.orderedIds.map(id => {
                    const committee = committeesById.get(id)
                    if (!committee) return null
                    return (
                      <div
                        key={id}
                        ref={committeeSort.setItemRef(id)}
                        style={committeeSort.itemStyle(id)}
                        className={
                          committeeSort.draggingId === id ? '[&>div]:shadow-xl' : undefined
                        }
                      >
                        <CommitteeGroup
                          committee={committee}
                          expanded={expandedIds.has(committee.id)}
                          onToggle={() => toggle(committee.id)}
                          handle={<DragHandle {...committeeSort.handleProps(id)} />}
                          actions={rowActions}
                        />
                      </div>
                    )
                  })}
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FAB — 위원회 추가 */}
      <button
        onClick={() => openCreate(null, 'committee')}
        className="fixed bottom-6 right-1/2 translate-x-[calc(50%+min(calc(100vw/2),24rem)-4.5rem)] z-30 lg:hidden flex items-center gap-2 px-5 py-3 bg-brand hover:bg-brand-dim text-white text-sm font-bold rounded-2xl shadow-[0_4px_20px_var(--brand-glow)] transition-colors"
      >
        <span className="material-icons-round text-[18px]">add</span>
        위원회 추가
      </button>

      {composer && (
        <UnitComposer
          key={composer.mode === 'edit' ? `edit-${composer.unit.id}` : 'create'}
          mode={composer.mode}
          initial={composer.initial}
          parentLabel={composer.parentLabel}
          parentOptions={
            composer.mode === 'edit'
              ? parentOptions.filter(o => o.id !== composer.unit.id)
              : parentOptions
          }
          onSave={handleSave}
          onCancel={() => setComposer(null)}
          isPending={createUnit.isPending || updateUnit.isPending}
        />
      )}
    </div>
  )
}

export default OrganizationManagement
