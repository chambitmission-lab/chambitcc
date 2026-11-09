import { DeskIcon as Icon } from './DeskIcon'
import { ICON } from './deskIcons'
import { iconBtnCls } from './deskStyles'

export const RowActions = ({
  index,
  count,
  onMove,
  onDuplicate,
  onRemove,
}: {
  index: number
  count: number
  onMove: (to: number) => void
  onDuplicate: () => void
  onRemove: () => void
}) => (
  <div className="flex items-center justify-end opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
    <button type="button" className={iconBtnCls} disabled={index === 0} onClick={() => onMove(index - 1)} title="위로">
      <Icon d={ICON.up} />
    </button>
    <button type="button" className={iconBtnCls} disabled={index === count - 1} onClick={() => onMove(index + 1)} title="아래로">
      <Icon d={ICON.down} />
    </button>
    <button type="button" className={iconBtnCls} onClick={onDuplicate} title="복제">
      <Icon d={ICON.copy} size={15} />
    </button>
    <button type="button" className={iconBtnCls + ' hover:!text-red-500'} onClick={onRemove} title="삭제">
      <Icon d={ICON.trash} size={15} />
    </button>
  </div>
)
