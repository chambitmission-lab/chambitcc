import { useState } from 'react'
import type { ReactNode } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { showToast } from '../../utils/toast'
import { useAboutContent, useUpdateAboutContent } from '../../hooks/useAboutContent'
import type { AboutFieldKey } from '../../types/aboutContent'
import './AboutEditor.css'

interface EditableTextProps {
  fieldKey: AboutFieldKey
  multiline?: boolean
  isAdmin: boolean
  children: ReactNode
}

const EditableText = ({ fieldKey, multiline, isAdmin, children }: EditableTextProps) => {
  const { language } = useLanguage()
  const { getRawValue } = useAboutContent()
  const updateMutation = useUpdateAboutContent()

  const [isOpen, setIsOpen] = useState(false)
  const [valueKo, setValueKo] = useState('')
  const [valueEn, setValueEn] = useState('')

  const open = () => {
    setValueKo(getRawValue(fieldKey, 'ko'))
    setValueEn(getRawValue(fieldKey, 'en'))
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
  }

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        fields: {
          [fieldKey]: { ko: valueKo, en: valueEn },
        },
      })
      showToast(language === 'ko' ? '저장되었습니다' : 'Saved', 'success')
      setIsOpen(false)
    } catch (error) {
      console.error(error)
      showToast(language === 'ko' ? '저장에 실패했습니다' : 'Failed to save', 'error')
    }
  }

  if (!isAdmin) {
    return <>{children}</>
  }

  return (
    <span className="about-editable-wrapper">
      {children}
      <button
        type="button"
        className="about-edit-btn"
        onClick={(e) => {
          e.stopPropagation()
          open()
        }}
        aria-label="edit"
        title={language === 'ko' ? '수정' : 'Edit'}
      >
        <span className="material-icons-outlined">edit</span>
      </button>

      {isOpen && (
        <div
          className="about-edit-overlay"
          onClick={close}
          role="dialog"
        >
          <div className="about-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="about-edit-header">
              <h3>{language === 'ko' ? '텍스트 수정' : 'Edit Text'}</h3>
              <button onClick={close} className="about-edit-close" aria-label="close">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="about-edit-body">
              <label className="about-edit-label">
                <span>한국어</span>
                {multiline ? (
                  <textarea
                    value={valueKo}
                    onChange={(e) => setValueKo(e.target.value)}
                    rows={5}
                  />
                ) : (
                  <input
                    type="text"
                    value={valueKo}
                    onChange={(e) => setValueKo(e.target.value)}
                  />
                )}
              </label>

              <label className="about-edit-label">
                <span>English</span>
                {multiline ? (
                  <textarea
                    value={valueEn}
                    onChange={(e) => setValueEn(e.target.value)}
                    rows={5}
                  />
                ) : (
                  <input
                    type="text"
                    value={valueEn}
                    onChange={(e) => setValueEn(e.target.value)}
                  />
                )}
              </label>

              <p className="about-edit-hint">
                {language === 'ko'
                  ? '줄바꿈을 그대로 입력하면 화면에도 반영됩니다.'
                  : 'Line breaks are preserved in the display.'}
              </p>
            </div>

            <div className="about-edit-footer">
              <button onClick={close} className="about-edit-cancel">
                {language === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="about-edit-save"
              >
                {updateMutation.isPending
                  ? language === 'ko'
                    ? '저장 중...'
                    : 'Saving...'
                  : language === 'ko'
                  ? '저장'
                  : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  )
}

export default EditableText
