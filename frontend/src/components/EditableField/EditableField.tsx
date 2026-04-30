import { useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './EditableField.css'

interface EditableFieldProps {
  value: string
  onSave: (newValue: string) => void | Promise<void>
  isAdmin: boolean
  multiline?: boolean
  label?: string
  type?: 'text' | 'number'
  children: ReactNode
}

const EditableField = ({
  value,
  onSave,
  isAdmin,
  multiline,
  label,
  type = 'text',
  children,
}: EditableFieldProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const open = () => {
    setDraft(value)
    setIsOpen(true)
  }

  const close = () => setIsOpen(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(draft)
      setIsOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAdmin) return <>{children}</>

  return (
    <span className="ef-wrapper">
      {children}
      <button
        type="button"
        className="ef-edit-btn"
        onClick={(e) => {
          e.stopPropagation()
          open()
        }}
        aria-label="edit"
        title="수정"
      >
        <span className="material-icons-outlined">edit</span>
      </button>

      {isOpen &&
        createPortal(
          <div className="ef-overlay" onClick={close} role="dialog">
            <div className="ef-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ef-header">
                <h3>{label || '텍스트 수정'}</h3>
                <button onClick={close} className="ef-close" aria-label="close">
                  <span className="material-icons-outlined">close</span>
                </button>
              </div>

              <div className="ef-body">
                {multiline ? (
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={5}
                    autoFocus
                  />
                ) : (
                  <input
                    type={type}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    autoFocus
                  />
                )}
                {multiline && (
                  <p className="ef-hint">줄바꿈을 그대로 입력하면 화면에도 반영됩니다.</p>
                )}
              </div>

              <div className="ef-footer">
                <button onClick={close} className="ef-cancel">취소</button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="ef-save"
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </span>
  )
}

export default EditableField
