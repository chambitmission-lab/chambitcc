import { useRef, useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { showToast } from '../../utils/toast'
import {
  useAboutContent,
  useUpdateAboutContent,
  useUploadAboutImage,
} from '../../hooks/useAboutContent'
import './AboutEditor.css'

interface HeroEditButtonProps {
  isAdmin: boolean
}

const HeroEditButton = ({ isAdmin }: HeroEditButtonProps) => {
  const { language } = useLanguage()
  const { heroBackgroundUrl } = useAboutContent()
  const updateMutation = useUpdateAboutContent()
  const uploadMutation = useUploadAboutImage()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const open = () => {
    setPreviewUrl(heroBackgroundUrl ?? null)
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

  const handleSave = async () => {
    try {
      let url = heroBackgroundUrl ?? null
      if (pendingFile) {
        const uploadResult = await uploadMutation.mutateAsync(pendingFile)
        url = uploadResult.url
      }
      await updateMutation.mutateAsync({ hero_background_url: url })
      showToast(language === 'ko' ? '배경이 변경되었습니다' : 'Background updated', 'success')
      close()
    } catch (error) {
      console.error(error)
      showToast(language === 'ko' ? '저장에 실패했습니다' : 'Failed to save', 'error')
    }
  }

  const handleRemove = async () => {
    try {
      await updateMutation.mutateAsync({ hero_background_url: null })
      showToast(language === 'ko' ? '배경이 초기화되었습니다' : 'Background reset', 'success')
      close()
    } catch (error) {
      console.error(error)
      showToast(language === 'ko' ? '저장에 실패했습니다' : 'Failed to save', 'error')
    }
  }

  if (!isAdmin) return null

  return (
    <>
      <button
        type="button"
        className="about-edit-btn about-edit-btn--hero"
        onClick={open}
        aria-label="edit background"
        title={language === 'ko' ? '배경 수정' : 'Edit background'}
      >
        <span className="material-icons-outlined">image</span>
      </button>

      {isOpen && (
        <div className="about-edit-overlay" onClick={close} role="dialog">
          <div className="about-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="about-edit-header">
              <h3>{language === 'ko' ? '배경 이미지' : 'Background Image'}</h3>
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

              {heroBackgroundUrl && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="about-edit-remove"
                >
                  {language === 'ko' ? '기본 배경으로 되돌리기' : 'Reset to default'}
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
        </div>
      )}
    </>
  )
}

export default HeroEditButton
