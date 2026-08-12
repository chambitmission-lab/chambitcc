import {
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
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

const TYPE_OPTIONS: { value: OrgUnitType; label: string; desc: string }[] = [
  { value: 'governance', label: '의결기구', desc: '공동의회 · 당회 · 제직회' },
  { value: 'committee', label: '위원회', desc: '조직도 최상단 묶음' },
  { value: 'bureau', label: '국', desc: '위원회 아래 묶음 헤더' },
  { value: 'department', label: '부서', desc: '실제 활동 단위' },
]

interface FormState {
  name: string
  unit_type: OrgUnitType
  parent_id: number | null
  is_active: boolean
  note: string
}

interface RowActions {
  onAddChild: (parent: OrgUnit) => void
  onEdit: (unit: OrgUnit) => void
  onMove: (unit: OrgUnit, direction: 'up' | 'down') => void
  onDelete: (unit: OrgUnit) => void
}

// ── 등록/수정 모달 (Composer 패턴 — slide-up + pill grid) ──────────────

const UnitComposer = ({
  mode,
  initial,
  parentLabel,
  parentOptions,
  onSave,
  onCancel,
  isPending,
}: {
  mode: 'create' | 'edit'
  initial: FormState
  parentLabel: string
  /** 수정 모드에서만 노출되는 상위 조직 이동 후보 */
  parentOptions: { id: number | null; name: string; depth: number }[]
  onSave: (form: FormState) => void
  onCancel: () => void
  isPending: boolean
}) => {
  const [form, setForm] = useState<FormState>(initial)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="w-full max-w-md bg-background-light dark:bg-background-dark rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-pop-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
          <div className="min-w-0">
            <h3 className="font-bold text-ink-strong text-[15px]">
              {mode === 'create' ? '조직 추가' : '조직 수정'}
            </h3>
            <p className="text-[11.5px] text-gray-400 dark:text-white/40 mt-0.5 truncate">
              {parentLabel}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* 이름 */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">
              조직 이름
            </label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="예: 예배 위원회 / 유치부"
              maxLength={100}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          {/* 구분 */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">
              구분
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, unit_type: opt.value }))}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-colors ${
                    form.unit_type === opt.value
                      ? 'border-brand bg-[var(--brand-soft)] shadow-[0_0_10px_var(--brand-glow)]'
                      : 'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <span className="block text-[13px] font-bold text-ink-strong">{opt.label}</span>
                  <span className="block text-[11px] text-gray-400 dark:text-white/40 mt-0.5 leading-snug">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 상위 조직 이동 — 수정할 때만 */}
          {mode === 'edit' && (
            <div>
              <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">
                상위 조직
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                {parentOptions.map(opt => (
                  <button
                    key={opt.id ?? 'root'}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, parent_id: opt.id }))}
                    className={`px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors ${
                      form.parent_id === opt.id
                        ? 'border-brand bg-[var(--brand-soft-strong)] text-brand'
                        : 'border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/50 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    {opt.depth > 0 && <span className="opacity-40 mr-1">└</span>}
                    {opt.name}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-white/35 mt-1.5 leading-snug">
                자기 자신이나 자기 하위 조직으로는 옮길 수 없습니다.
              </p>
            </div>
          )}

          {/* 한 줄 설명 */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">
              한 줄 설명 (선택)
            </label>
            <input
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="예: 주일 2부 예배 담당"
              maxLength={255}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          {/* 공개 여부 */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              className={`w-10 h-6 rounded-full transition-colors ${
                form.is_active ? 'bg-brand' : 'bg-gray-200 dark:bg-white/10'
              }`}
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${
                  form.is_active ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-sm text-gray-700 dark:text-white/70">
              공개 {form.is_active ? '' : '안 함 (조직도에서 숨김)'}
            </span>
          </label>
        </div>

        <div className="px-5 py-4 border-t border-border-light dark:border-border-dark flex gap-2 flex-shrink-0">
          <button
            onClick={() => onSave(form)}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold bg-brand text-white rounded-xl hover:bg-brand-dim disabled:opacity-50 transition-colors"
          >
            {isPending ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/[0.08] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 한 줄 행 ──────────────────────────────────────────────────────────

const IconButton = ({
  icon,
  label,
  tone = 'muted',
  onClick,
}: {
  icon: string
  label: string
  tone?: 'muted' | 'brand' | 'danger'
  onClick: () => void
}) => {
  const toneClass =
    tone === 'brand'
      ? 'text-brand hover:bg-[var(--brand-soft)]'
      : tone === 'danger'
        ? 'text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
        : 'text-gray-400 dark:text-white/35 hover:text-gray-700 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${toneClass}`}
    >
      <span className="material-icons-outlined text-[16px]">{icon}</span>
    </button>
  )
}

const DragHandle = (props: ComponentPropsWithoutRef<'span'>) => (
  <span
    {...props}
    title="끌어서 순서 변경"
    aria-label="끌어서 순서 변경"
    className="w-5 h-7 -ml-1 flex items-center justify-center shrink-0 text-gray-300 dark:text-white/20 cursor-grab active:cursor-grabbing select-none"
  >
    <span className="material-icons-round text-[16px]">drag_indicator</span>
  </span>
)

const UnitRow = ({
  unit,
  depth,
  isLast,
  handle,
  actions,
}: {
  unit: OrgUnit
  depth: number
  /** 카드 안에서 시각적으로 마지막 줄이면 구분선을 지운다 */
  isLast: boolean
  handle: ReactNode
  actions: RowActions
}) => (
  <div>
    <div
      className={`flex items-center gap-1.5 py-2 ${
        isLast && unit.children.length === 0
          ? ''
          : 'border-b border-gray-100 dark:border-white/[0.04]'
      }`}
      style={{ paddingLeft: `${depth * 14}px` }}
    >
      {handle}
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          {depth > 0 && (
            <span className="text-gray-300 dark:text-white/15 text-[12px] leading-none">└</span>
          )}
          <span
            className={`truncate ${
              unit.unit_type === 'bureau'
                ? 'text-[13px] font-bold text-brand'
                : 'text-[13px] font-medium text-gray-800 dark:text-white/80'
            }`}
          >
            {unit.name}
          </span>
          {!unit.is_active && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/30 rounded-full border border-gray-200 dark:border-white/[0.06]">
              숨김
            </span>
          )}
        </span>
        {unit.note && (
          <span className="block text-[11px] text-gray-400 dark:text-white/35 truncate mt-0.5 pl-[18px]">
            {unit.note}
          </span>
        )}
      </span>

      <span className="flex items-center shrink-0">
        <IconButton icon="arrow_upward" label="위로" onClick={() => actions.onMove(unit, 'up')} />
        <IconButton
          icon="arrow_downward"
          label="아래로"
          onClick={() => actions.onMove(unit, 'down')}
        />
        {unit.unit_type !== 'department' && (
          <IconButton
            icon="add"
            label="하위 추가"
            tone="brand"
            onClick={() => actions.onAddChild(unit)}
          />
        )}
        <IconButton icon="edit" label="수정" onClick={() => actions.onEdit(unit)} />
        <IconButton
          icon="delete_outline"
          label="삭제"
          tone="danger"
          onClick={() => actions.onDelete(unit)}
        />
      </span>
    </div>

    {unit.children.length > 0 && (
      <SortableRows
        parentId={unit.id}
        units={unit.children}
        depth={depth + 1}
        isLast={isLast}
        actions={actions}
      />
    )}
  </div>
)

// ── 드래그 정렬 목록 — 같은 부모의 형제들끼리만 자리를 바꾼다 ──────────

const SortableRows = ({
  parentId,
  units,
  depth,
  isLast,
  actions,
}: {
  parentId: number | null
  units: OrgUnit[]
  depth: number
  isLast: boolean
  actions: RowActions
}) => {
  const reorder = useReorderOrgUnits()
  const sort = useDragSort(
    units.map(u => u.id),
    ordered =>
      reorder.mutate(
        { parentId, orderedIds: ordered },
        {
          onError: err => {
            showToast(err instanceof Error ? err.message : '순서 변경 실패', 'error')
            sort.resetOrder()
          },
        },
      ),
  )
  const byId = new Map(units.map(u => [u.id, u]))

  return (
    <>
      {sort.orderedIds.map((id, index) => {
        const unit = byId.get(id)
        if (!unit) return null
        return (
          <div
            key={id}
            ref={sort.setItemRef(id)}
            style={sort.itemStyle(id)}
            className={
              sort.draggingId === id
                ? 'rounded-xl -mx-1.5 px-1.5 bg-white dark:bg-card-dark shadow-lg ring-1 ring-black/[0.06] dark:ring-white/10'
                : undefined
            }
          >
            <UnitRow
              unit={unit}
              depth={depth}
              isLast={isLast && index === sort.orderedIds.length - 1}
              handle={
                units.length > 1 ? (
                  <DragHandle {...sort.handleProps(id)} />
                ) : (
                  <span className="w-5 h-7 -ml-1 shrink-0" />
                )
              }
              actions={actions}
            />
          </div>
        )
      })}
    </>
  )
}

// ── 위원회 카드 (접기/펼치기) ─────────────────────────────────────────

const CommitteeGroup = ({
  committee,
  expanded,
  onToggle,
  handle,
  actions,
}: {
  committee: OrgUnit
  expanded: boolean
  onToggle: () => void
  handle: ReactNode
  actions: RowActions
}) => {
  const childCount = countAll(committee) - 1

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.20)]">
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />

      <div className="relative z-10 flex items-center gap-1.5 px-3 py-3">
        {handle}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex-1 min-w-0 flex items-center gap-2 text-left"
        >
          <span className="w-1.5 h-7 rounded-full bg-brand shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold text-ink-strong truncate">
                {committee.name}
              </span>
              {!committee.is_active && (
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/30 rounded-full border border-gray-200 dark:border-white/[0.06]">
                  숨김
                </span>
              )}
            </span>
            <span className="block text-[11.5px] text-gray-400 dark:text-white/35">
              하위 {childCount}개
            </span>
          </span>
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-gray-400 dark:text-white/35 transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <span className="flex items-center shrink-0">
          <IconButton
            icon="arrow_upward"
            label="위로"
            onClick={() => actions.onMove(committee, 'up')}
          />
          <IconButton
            icon="arrow_downward"
            label="아래로"
            onClick={() => actions.onMove(committee, 'down')}
          />
          <IconButton
            icon="add"
            label="하위 추가"
            tone="brand"
            onClick={() => actions.onAddChild(committee)}
          />
          <IconButton icon="edit" label="수정" onClick={() => actions.onEdit(committee)} />
          <IconButton
            icon="delete_outline"
            label="삭제"
            tone="danger"
            onClick={() => actions.onDelete(committee)}
          />
        </span>
      </div>

      {expanded && (
        <div className="relative z-10 px-3.5 pb-2 animate-pop-in">
          {committee.children.length === 0 ? (
            <p className="py-3 text-[12.5px] text-gray-400 dark:text-white/30">
              하위 조직이 없습니다
            </p>
          ) : (
            <SortableRows
              parentId={committee.id}
              units={committee.children}
              depth={0}
              isLast
              actions={actions}
            />
          )}
        </div>
      )}
    </div>
  )
}

const countAll = (unit: OrgUnit): number =>
  1 + unit.children.reduce((total, child) => total + countAll(child), 0)

// ── 메인 ─────────────────────────────────────────────────────────────

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
    if (!isAdmin()) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-24">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
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

        {/* 통계 + 초기화 */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
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

        <p className="px-4 pb-2 text-[11.5px] text-gray-400 dark:text-white/35 leading-relaxed">
          위원회 → 국 → 부서 순서로 묶입니다. 국은 생략하고 위원회 아래 부서를 바로 둘 수도 있습니다.
          이름 왼쪽의 ⠿ 핸들을 잡고 끌면 같은 묶음 안에서 순서를 바꿀 수 있습니다.
        </p>

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
            <section className="px-4 pt-2">
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
            <section className="px-4 pt-4 space-y-2">
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

      {/* FAB — 위원회 추가 */}
      <button
        onClick={() => openCreate(null, 'committee')}
        className="fixed bottom-6 right-1/2 translate-x-[calc(50%+min(calc(100vw/2),24rem)-4.5rem)] z-30 flex items-center gap-2 px-5 py-3 bg-brand hover:bg-brand-dim text-white text-sm font-bold rounded-2xl shadow-[0_4px_20px_var(--brand-glow)] transition-colors"
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
