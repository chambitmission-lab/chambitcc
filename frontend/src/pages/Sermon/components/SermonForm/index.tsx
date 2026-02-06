// 설교 등록 폼 메인 컴포넌트
import { useState } from 'react'
import { useSermonForm } from './useSermonForm'
import { SermonFormFields } from './SermonFormFields'
import { AudioUploadSection } from './AudioUploadSection'
import AudioRecorder from '../AudioRecorder'
import type { SermonFormProps } from './types'

const SermonForm = ({ onClose, onSuccess }: SermonFormProps) => {
  const {
    formData,
    handleInputChange,
    handleSubmit,
    handleClose,
    audioUpload,
    isSubmitting,
  } = useSermonForm(onSuccess, onClose)

  const [showRecorder, setShowRecorder] = useState(false)

  const handleRecordingComplete = (blob: Blob) => {
    audioUpload.handleRecordingComplete(blob)
    setShowRecorder(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {showRecorder ? (
          <div className="p-6">
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              onCancel={() => setShowRecorder(false)}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">설교 등록</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            {/* 폼 필드 */}
            <SermonFormFields formData={formData} onChange={handleInputChange} />

            {/* 음성 파일 업로드 */}
            <div className="mt-4">
              <AudioUploadSection
                audioState={audioUpload.audioState}
                onRecordingStart={() => setShowRecorder(true)}
                onFileSelect={audioUpload.handleFileSelect}
                onRemove={audioUpload.removeAudio}
              />
            </div>

            {/* 제출 버튼 */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default SermonForm
