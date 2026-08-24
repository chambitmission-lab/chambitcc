// 현 담임목사 사진의 인라인 교체 (🖼️)
//
// AboutEditor/EditableImage 와 화면은 같지만 업로드 경로가 다르다 —
// about-content/upload 는 히어로(가로 448x280)용이라 인물 사진을 뭉갠다.
// 여기서는 pastors/upload-photo(R2, 세로 비율 보존)를 쓴다.
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { showToast } from '../../../utils/toast'
import { useUpdatePastor, useUploadPastorPhoto } from '../../../hooks/usePastors'
import type { Pastor } from '../../../types/pastor'
import '../../../components/AboutEditor/AboutEditor.css'

interface EditablePastorPhotoProps {
  pastor: Pastor
  isAdmin: boolean
  children: ReactNode
}

const EditablePastorPhoto = ({ pastor, isAdmin, children }: EditablePastorPhotoProps) => {
  const { language } = useLanguage()
  const ko = language === 'ko'
  const updateMutation = useUpdatePastor()
  const uploadMutation = useUploadPastorPhoto()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const currentUrl = pastor.photo_url ?? ''

  const open = () => {
    setPreviewUrl(currentUrl || null)
    setPendingFile(null)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    // 로컬 미리보기 objectURL 해제 (원격 URL은 해당 없음)
    if (pendingFile && previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(null)
    setPreviewUrl(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (pendingFile && previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const savePhoto = async (url: string) => {
    await updateMutation.mutateAsync({ id: pastor.id, data: { photo_url: url } })
  }

  const handleSave = async () => {
    try {
      let url = currentUrl
      if (pendingFile) {
        url = await uploadMutation.mutateAsync(pendingFile)
      }
      await savePhoto(url)
      showToast(ko ? '사진이 변경되었습니다' : 'Photo updated', 'success')
      close()
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : ko ? '저장에 실패했습니다' : 'Failed to save',
        'error',
      )
    }
  }

  const handleRemove = async () => {
    try {
      await savePhoto('')
      showToast(ko ? '사진이 삭제되었습니다' : 'Photo removed', 'success')
      close()
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : ko ? '저장에 실패했습니다' : 'Failed to save',
        'error',
      )
    }
  }

  if (!isAdmin) return <>{children}</>

  const busy = uploadMutation.isPending || updateMutation.isPending

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
        title={ko ? '사진 수정' : 'Edit photo'}
      >
        <span className="material-icons-outlined">image</span>
      </button>

      {isOpen &&
        createPortal(
          <div className="about-edit-overlay" onClick={close} role="dialog">
            <div className="about-edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="about-edit-header">
                <h3>{ko ? '담임목사 사진' : 'Pastor Photo'}</h3>
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
                    {ko ? '미리보기 없음' : 'No preview'}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="about-edit-pick"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="material-icons-outlined">upload</span>
                  <span>{ko ? '이미지 선택' : 'Choose image'}</span>
                </button>

                <p className="about-edit-hint">
                  {ko
                    ? '세로 인물 사진이 가장 잘 맞습니다. 업로드하면 비율을 유지한 채 자동으로 줄여서 저장됩니다.'
                    : 'Portrait photos work best. Uploads are resized automatically while keeping the aspect ratio.'}
                </p>

                {currentUrl && (
                  <button type="button" onClick={handleRemove} className="about-edit-remove">
                    {ko ? '사진 삭제' : 'Remove photo'}
                  </button>
                )}
              </div>

              <div className="about-edit-footer">
                <button onClick={close} className="about-edit-cancel">
                  {ko ? '취소' : 'Cancel'}
                </button>
                <button onClick={handleSave} disabled={busy} className="about-edit-save">
                  {busy ? (ko ? '저장 중...' : 'Saving...') : ko ? '저장' : 'Save'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </span>
  )
}

export default EditablePastorPhoto
