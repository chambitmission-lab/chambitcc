import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { showToast } from '../../utils/toast'
import {
  useUpdateAboutContent,
  useUploadAboutImage,
} from '../../hooks/useAboutContent'
import type { AboutFieldKey } from '../../types/aboutContent'
import './AboutEditor.css'

interface EditableImageProps {
  /** URL을 저장할 fields 키 — 별도 컬럼 없이 기존 fields JSON에 넣어 백엔드 무변경 */
  fieldKey: AboutFieldKey
  currentUrl: string
  isAdmin: boolean
  title: string
  children: ReactNode
}

const EditableImage = ({ fieldKey, currentUrl, isAdmin, title, children }: EditableImageProps) => {
  const { language } = useLanguage()
  const updateMutation = useUpdateAboutContent()
  const uploadMutation = useUploadAboutImage()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const open = () => {
    setPreviewUrl(currentUrl || null)
    setPendingFile(null)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setPendingFile(null)
    setPreviewUrl(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const saveUrl = async (url: string) => {
    // 언어와 무관한 URL이라 두 언어 값에 같은 문자열을 넣는다
    await updateMutation.mutateAsync({
      fields: { [fieldKey]: { ko: url, en: url } },
    })
  }

  const handleSave = async () => {
    try {
      let url = currentUrl
      if (pendingFile) {
        const uploadResult = await uploadMutation.mutateAsync(pendingFile)
        url = uploadResult.url
      }
      await saveUrl(url)
      showToast(language === 'ko' ? '사진이 변경되었습니다' : 'Photo updated', 'success')
      close()
    } catch (error) {
      console.error(error)
      showToast(language === 'ko' ? '저장에 실패했습니다' : 'Failed to save', 'error')
    }
  }

  const handleRemove = async () => {
    try {
      await saveUrl('')
      showToast(language === 'ko' ? '사진이 삭제되었습니다' : 'Photo removed', 'success')
      close()
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
        aria-label="edit photo"
        title={language === 'ko' ? '사진 수정' : 'Edit photo'}
      >
        <span className="material-icons-outlined">image</span>
      </button>

      {isOpen &&
        createPortal(
          <div className="about-edit-overlay" onClick={close} role="dialog">
            <div className="about-edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="about-edit-header">
                <h3>{title}</h3>
                <button onClick={close} className="about-edit-close" aria-label="close">
                  <span className="material-icons-outlined">close</span>
                </button>
              </div>

              <div className="about-edit-body">
                {previewUrl ? (
                  <div className="about-edit-preview">
                    <img src={previewUrl} alt="preview" />
                  </div>
                ) : (
                  <div className="about-edit-preview about-edit-preview--empty">
                    {language === 'ko' ? '미리보기 없음' : 'No preview'}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="about-edit-pick"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="material-icons-outlined">upload</span>
                  <span>{language === 'ko' ? '이미지 선택' : 'Choose image'}</span>
                </button>

                {currentUrl && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="about-edit-remove"
                  >
                    {language === 'ko' ? '사진 삭제' : 'Remove photo'}
                  </button>
                )}
              </div>

              <div className="about-edit-footer">
                <button onClick={close} className="about-edit-cancel">
                  {language === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={uploadMutation.isPending || updateMutation.isPending}
                  className="about-edit-save"
                >
                  {uploadMutation.isPending || updateMutation.isPending
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
          document.body
        )}
    </span>
  )
}

export default EditableImage
