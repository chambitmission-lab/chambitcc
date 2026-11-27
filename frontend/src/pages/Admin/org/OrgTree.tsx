// 조직도 행 — 드래그 핸들 · 단위 행 · 같은 부모 형제끼리 드래그 정렬.
// 2026-11-27 관리 데스크(OrganizationDesk) 오른쪽 상세 안에서 쓰도록 다듬었다:
// 아이콘은 인라인 SVG, 순서 바꾸기(화살표·드래그)는 모두 actions 로 위임 — 서버 호출은 컨테이너가 한다.

import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { useDragSort } from '../../../hooks/useDragSort'
import { UNIT_TYPE_LABEL, type OrgUnit } from '../../../types/organization'

interface RowActions {
  onAddChild: (parent: OrgUnit) => void
  onEdit: (unit: OrgUnit) => void
  /** 화살표 — 형제 순서(siblingIds) 안에서 한 칸 */
  onMove: (unit: OrgUnit, direction: 'up' | 'down', siblingIds: number[], parentId: number | null) => void
  onDelete: (unit: OrgUnit) => void
  /** 드래그 — 놓은 순서 저장. 실패하면 onError 로 원래 자리로 돌린다 */
  onReorder: (parentId: number | null, orderedIds: number[], onError: () => void) => void
}

const I = ({ d, size = 16 }: { d: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)
const IC = {
  up: <path d="M12 19V5M5 12l7-7 7 7" />,
  down: <path d="M12 5v14M19 12l-7 7-7-7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6l-1.4 14a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 6" /><path d="M9 6V4h6v2" /></>,
  grip: <><circle cx="9" cy="6" r="1.2" /><circle cx="15" cy="6" r="1.2" /><circle cx="9" cy="12" r="1.2" /><circle cx="15" cy="12" r="1.2" /><circle cx="9" cy="18" r="1.2" /><circle cx="15" cy="18" r="1.2" /></>,
}

const IconButton = ({
  icon,
  label,
  tone = 'muted',
  disabled,
  onClick,
}: {
  icon: ReactNode
  label: string
  tone?: 'muted' | 'brand' | 'danger'
  disabled?: boolean
  onClick: () => void
}) => {
  const toneClass =
    tone === 'brand'
      ? 'text-brand hover:bg-[var(--brand-soft)]'
      : tone === 'danger'
        ? 'text-gray-400 dark:text-white/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
        : 'text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.07]'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-25 disabled:pointer-events-none ${toneClass}`}
    >
      <I d={icon} />
    </button>
  )
}

const DragHandle = (props: ComponentPropsWithoutRef<'span'>) => (
  <span
    {...props}
    title="끌어서 순서 바꾸기"
    aria-label="끌어서 순서 바꾸기"
    className="w-6 h-8 -ml-1 flex items-center justify-center shrink-0 text-gray-300 dark:text-white/25 hover:text-gray-500 dark:hover:text-white/50 cursor-grab active:cursor-grabbing select-none touch-none"
  >
    <I d={IC.grip} size={16} />
  </span>
)

const UnitRow = ({
  unit,
  depth,
  isLast,
  first,
  last,
  siblingIds,
  parentId,
  handle,
  actions,
}: {
  unit: OrgUnit
  depth: number
  /** 카드 안에서 시각적으로 마지막 줄이면 구분선을 지운다 */
  isLast: boolean
  first: boolean
  last: boolean
  siblingIds: number[]
  parentId: number | null
  handle: ReactNode
  actions: RowActions
}) => {
  const bureau = unit.unit_type === 'bureau'
  return (
    <div>
      <div
        className={`group flex items-center gap-2 py-2.5 ${isLast && unit.children.length === 0 ? '' : 'border-b border-gray-100 dark:border-white/[0.05]'}`}
        style={{ paddingLeft: `${depth * 22}px` }}
      >
        {handle}
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5">
            {depth > 0 && <span className="text-gray-300 dark:text-white/20 text-[13px] leading-none">└</span>}
            <span
              className={`truncate text-[15px] ${
                !unit.is_active ? 'text-gray-400 dark:text-white/35 line-through decoration-gray-300 dark:decoration-white/20' : bureau ? 'font-bold text-brand' : 'font-semibold text-ink-strong'
              }`}
            >
              {unit.name}
            </span>
            {bureau && <span className="shrink-0 text-[11.5px] font-bold text-gray-400 dark:text-white/40">{UNIT_TYPE_LABEL.bureau}</span>}
            {!unit.is_active && (
              <span className="shrink-0 inline-flex items-center h-[20px] px-1.5 rounded-md text-[11.5px] font-bold bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65">숨김</span>
            )}
          </span>
          {unit.note && <span className={`block text-[13px] text-gray-500 dark:text-white/50 truncate mt-0.5 ${depth > 0 ? 'pl-[18px]' : ''}`}>{unit.note}</span>}
        </span>

        {/* PC 는 줄에 올렸을 때 또렷하게, 터치 기기는 늘 보인다 */}
        <span className="flex items-center shrink-0 lg:opacity-60 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition-opacity">
          <IconButton icon={IC.up} label="위로" disabled={first} onClick={() => actions.onMove(unit, 'up', siblingIds, parentId)} />
          <IconButton icon={IC.down} label="아래로" disabled={last} onClick={() => actions.onMove(unit, 'down', siblingIds, parentId)} />
          {unit.unit_type !== 'department' && <IconButton icon={IC.plus} label="하위 추가" tone="brand" onClick={() => actions.onAddChild(unit)} />}
          <IconButton icon={IC.edit} label="수정" onClick={() => actions.onEdit(unit)} />
          <IconButton icon={IC.trash} label="삭제" tone="danger" onClick={() => actions.onDelete(unit)} />
        </span>
      </div>

      {unit.children.length > 0 && <SortableRows parentId={unit.id} units={unit.children} depth={depth + 1} isLast={isLast} actions={actions} />}
    </div>
  )
}

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
  // 실패 시 되돌리기 — 훅 결과를 콜백 안에서 바로 부르지 않고 ref 로 건넨다
  const resetRef = useRef<() => void>(() => {})
  const sort = useDragSort(
    units.map((u) => u.id),
    (ordered) => actions.onReorder(parentId, ordered, () => resetRef.current()),
  )
  useEffect(() => {
    resetRef.current = sort.resetOrder
  })
  const byId = new Map(units.map((u) => [u.id, u]))

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
            className={sort.draggingId === id ? 'relative z-10 rounded-xl -mx-2 px-2 bg-white dark:bg-card-dark shadow-lg ring-1 ring-black/[0.06] dark:ring-white/10' : undefined}
          >
            <UnitRow
              unit={unit}
              depth={depth}
              isLast={isLast && index === sort.orderedIds.length - 1}
              first={index === 0}
              last={index === sort.orderedIds.length - 1}
              siblingIds={sort.orderedIds}
              parentId={parentId}
              handle={units.length > 1 ? <DragHandle {...sort.handleProps(id)} /> : <span className="w-6 h-8 -ml-1 shrink-0" />}
              actions={actions}
            />
          </div>
        )
      })}
    </>
  )
}

export { DragHandle, SortableRows }
export type { RowActions }
