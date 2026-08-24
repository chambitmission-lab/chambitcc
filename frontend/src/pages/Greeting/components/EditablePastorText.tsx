// 현 담임목사 텍스트의 인라인 편집 (✏️)
//
// AboutEditor/EditableText 와 화면·조작감을 맞추되 저장처만 다르다 —
// 저쪽은 about_content.fields(싱글톤), 이쪽은 church_pastors 레코드.
// 모달 CSS 는 AboutEditor.css 를 그대로 재사용해 두 화면의 편집 UI를 하나로 유지한다.
import { useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { showToast } from '../../../utils/toast'
import { useUpdatePastor } from '../../../hooks/usePastors'
import type { Pastor, PastorTextField } from '../../../types/pastor'
import '../../../components/AboutEditor/AboutEditor.css'

interface EditablePastorTextProps {
  pastor: Pastor
  field: PastorTextField
  /** 인사말 본문처럼 긴 글은 textarea + 넉넉한 행수로 */
  multiline?: boolean
  rows?: number
  isAdmin: boolean
  children: ReactNode
}

const EditablePastorText = ({
  pastor,
  field,
  multiline,
  rows = 5,
  isAdmin,
  children,
}: EditablePastorTextProps) => {
  const { language } = useLanguage()
  const updateMutation = useUpdatePastor()

  const [isOpen, setIsOpen] = useState(false)
  const [valueKo, setValueKo] = useState('')
  const [valueEn, setValueEn] = useState('')

  const open = () => {
    setValueKo((pastor[`${field}_ko` as keyof Pastor] as string | null) ?? '')
    setValueEn((pastor[`${field}_en` as keyof Pastor] as string | null) ?? '')
    setIsOpen(true)
  }

  const close = () => setIsOpen(false)

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: pastor.id,
        data: {
          [`${field}_ko`]: valueKo,
          [`${field}_en`]: valueEn,
        },
      })
      showToast(language === 'ko' ? '저장되었습니다' : 'Saved', 'success')
      setIsOpen(false)
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error
          ? error.message
          : language === 'ko'
            ? '저장에 실패했습니다'
            : 'Failed to save',
        'error',
      )
    }
  }

  if (!isAdmin) return <>{children}</>

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

      {isOpen &&
        createPortal(
          <div className="about-edit-overlay" onClick={close} role="dialog">
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
                      rows={rows}
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
                      rows={rows}
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
                    ? '줄바꿈을 그대로 입력하면 화면에도 반영됩니다. 영문을 비우면 한국어가 그대로 표시됩니다.'
                    : 'Line breaks are preserved. Leave English blank to fall back to Korean.'}
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
          </div>,
          document.body,
        )}
    </span>
  )
}

export default EditablePastorText
