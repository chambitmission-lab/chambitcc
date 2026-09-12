// 조직도 행 — 아이콘 버튼 · 드래그 핸들 · 단위 행 · 드래그 정렬 · 위원회 묶음.

import { type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { showToast } from '../../../utils/toast'
import { useDragSort } from '../../../hooks/useDragSort'
import { useReorderOrgUnits } from '../../../hooks/useOrganization'
import { type OrgUnit } from '../../../types/organization'
import { countAll } from './orgCount'

interface RowActions {
  onAddChild: (parent: OrgUnit) => void
  onEdit: (unit: OrgUnit) => void
  onMove: (unit: OrgUnit, direction: 'up' | 'down') => void
  onDelete: (unit: OrgUnit) => void
}

// ── 등록/수정 모달 (Composer 패턴 — slide-up + pill grid) ──────────────

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


// ── 메인 ─────────────────────────────────────────────────────────────

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { DragHandle, SortableRows, CommitteeGroup }
export type { RowActions }
