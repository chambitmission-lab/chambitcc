import './EditableField.css'

interface AddItemButtonProps {
  isAdmin: boolean
  onClick: () => void
  label?: string
}

export const AddItemButton = ({ isAdmin, onClick, label }: AddItemButtonProps) => {
  if (!isAdmin) return null
  return (
    <button type="button" className="ef-add-btn" onClick={onClick}>
      <span className="material-icons-outlined">add</span>
      <span>{label || '항목 추가'}</span>
    </button>
  )
}

interface RemoveItemButtonProps {
  isAdmin: boolean
  onClick: () => void
}

export const RemoveItemButton = ({ isAdmin, onClick }: RemoveItemButtonProps) => {
  if (!isAdmin) return null
  return (
    <button
      type="button"
      className="ef-remove-btn"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label="remove"
      title="삭제"
    >
      <span className="material-icons-outlined">delete</span>
    </button>
  )
}
