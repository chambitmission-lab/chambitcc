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
    console.log('[SermonForm] Recording complete, blob size:', blob.size)
    audioUpload.handleRecordingComplete(blob)
    setShowRecorder(false)
  }

  const handleRecordingStart = () => {
    console.log('[SermonForm] Opening recorder...')
    setShowRecorder(true)
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-hidden"
      onClick={handleClose}
    >
      <div 
        className="bg-background-light dark:bg-background-dark rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {showRecorder ? (
          <div className="p-6 overflow-y-auto">
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              onCancel={() => setShowRecorder(false)}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            {/* 헤더 - 고정 */}
            <div className="flex-shrink-0 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                설교 등록
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="relative group w-10 h-10 flex items-center justify-center flex-shrink-0"
              >
                {/* 가장 바깥 빛 확산 (크고 은은하게) */}
                <div className="absolute inset-0 rounded-full bg-purple-500/20 dark:bg-yellow-400/20 blur-2xl scale-150 group-hover:scale-[2] animate-pulse transition-transform duration-500"></div>
                
                {/* 중간 빛 레이어 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/50 via-pink-400/50 to-purple-500/50 dark:from-yellow-300/50 dark:via-orange-300/50 dark:to-yellow-400/50 blur-xl scale-125 group-hover:scale-150 animate-pulse transition-transform duration-300"></div>
                
                {/* 강한 빛 레이어 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/70 to-pink-500/70 dark:from-yellow-400/70 dark:to-orange-400/70 blur-lg group-hover:blur-xl animate-pulse"></div>
                
                {/* 내부 빛나는 원 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300 via-pink-300 to-purple-400 dark:from-yellow-300 dark:via-orange-300 dark:to-yellow-400 opacity-60 blur-md group-hover:opacity-80 animate-pulse"></div>
                
                {/* 반짝이는 효과 */}
                <div className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/50 blur-sm animate-ping"></div>
                
                {/* X 아이콘 배경 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 dark:from-yellow-400 dark:to-orange-400 opacity-80 group-hover:opacity-100 shadow-[0_0_30px_rgba(168,85,247,0.8)] dark:shadow-[0_0_40px_rgba(250,204,21,0.9)] group-hover:shadow-[0_0_50px_rgba(168,85,247,1)] dark:group-hover:shadow-[0_0_60px_rgba(250,204,21,1)] transition-all"></div>
                
                {/* X 아이콘 */}
                <span className="material-icons-outlined relative z-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,1)] transition-all group-hover:scale-110 group-hover:rotate-90 duration-300 font-bold">
                  close
                </span>
              </button>
            </div>

            {/* 폼 내용 - 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* 폼 필드 카드 */}
              <div className="relative mb-3">
                {/* 글래스모피즘 카드 */}
                <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-4 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  {/* 내부 빛 효과 */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-2xl pointer-events-none"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-white/10 dark:to-white/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <SermonFormFields formData={formData} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              {/* 음성 파일 업로드 */}
              <div className="mb-3">
                <AudioUploadSection
                  audioState={audioUpload.audioState}
                  onRecordingStart={handleRecordingStart}
                  onFileSelect={audioUpload.handleFileSelect}
                  onRemove={audioUpload.removeAudio}
                />
              </div>
            </div>

            {/* 제출 버튼 - 고정 */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark">
              <div className="flex gap-3">
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
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default SermonForm
