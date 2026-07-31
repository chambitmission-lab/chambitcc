// 설교 등록 폼 메인 컴포넌트 — 토스 블루 플랫
import { useState, useRef } from 'react'
import { useSermonForm } from './useSermonForm'
import { SermonFormFields } from './SermonFormFields'
import { AudioUploadSection } from './AudioUploadSection'
import { TranscriptUploadSection } from './TranscriptUploadSection'
import AudioRecorder from '../AudioRecorder'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import type { SermonFormProps } from './types'
import './SermonForm.css'

const SermonForm = ({ sermon, onClose, onSuccess }: SermonFormProps) => {
  const {
    formData,
    handleInputChange,
    handleSubmit,
    handleClose,
    audioUpload,
    transcriptUpload,
    createdSermonId,
    isSubmitting,
    isEditMode,
  } = useSermonForm(onSuccess, onClose, sermon)

  const [showRecorder, setShowRecorder] = useState(false)
  const isOpeningRecorderRef = useRef(false)

  // 뒤로가기 → 녹음기가 열려있으면 녹음기만, 아니면 폼 닫기
  useModalBackButton(() => {
    if (showRecorder) {
      setShowRecorder(false)
      isOpeningRecorderRef.current = false
    } else {
      handleClose()
    }
  })

  const handleRecordingComplete = (blob: Blob) => {
    audioUpload.handleRecordingComplete(blob)
    setShowRecorder(false)
    isOpeningRecorderRef.current = false
  }

  const handleRecordingStart = () => {
    // 이미 녹음기를 여는 중이거나 열려있으면 무시
    if (isOpeningRecorderRef.current || showRecorder) {
      return
    }

    isOpeningRecorderRef.current = true
    setShowRecorder(true)
  }

  return (
    <div className="sf-overlay" onClick={handleClose}>
      <div className="sf-modal" onClick={(e) => e.stopPropagation()}>
        {showRecorder ? (
          <div className="p-6 overflow-y-auto">
            <AudioRecorder
              key="single-recorder"
              onRecordingComplete={handleRecordingComplete}
              onCancel={() => setShowRecorder(false)}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            {/* 헤더 - 고정 */}
            <div className="sf-header">
              <h2 className="sf-header-title">{isEditMode ? '설교 수정' : '설교 등록'}</h2>
              <button type="button" onClick={handleClose} className="sf-close-btn" aria-label="닫기">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            {/* 폼 내용 - 스크롤 영역 */}
            <div className="sf-body">
              <SermonFormFields formData={formData} onChange={handleInputChange} />

              {/* 음성 파일 */}
              <div className="sf-section" style={{ marginTop: '1.25rem' }}>
                <h3 className="sf-section-title">
                  <span className="material-icons-outlined">headphones</span>
                  설교 음성
                </h3>
                <AudioUploadSection
                  audioState={audioUpload.audioState}
                  onRecordingStart={handleRecordingStart}
                  onFileSelect={audioUpload.handleFileSelect}
                  onRemove={audioUpload.removeAudio}
                />
              </div>

              {/* 트랜스크립트 업로드 (설교 등록 후 또는 수정 시) */}
              {(createdSermonId || isEditMode) && (
                <div style={{ marginTop: '1.25rem' }}>
                  <TranscriptUploadSection
                    sermonId={createdSermonId}
                    onFileSelect={transcriptUpload.handleFileSelect}
                    isUploading={transcriptUpload.isUploading}
                    uploadResult={transcriptUpload.uploadResult}
                  />
                </div>
              )}
            </div>

            {/* 제출 버튼 - 고정 */}
            <div className="sf-footer">
              <button type="button" onClick={handleClose} className="sf-footer-btn cancel">
                취소
              </button>
              <button type="submit" disabled={isSubmitting} className="sf-footer-btn submit">
                {isSubmitting
                  ? isEditMode
                    ? '수정 중...'
                    : '등록 중...'
                  : isEditMode
                    ? '수정하기'
                    : '등록하기'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default SermonForm
