// 설교 등록 폼 컴포넌트
import { useState } from 'react'
import AudioRecorder from './AudioRecorder'
import { useUploadAudio, useCreateSermon, useDeleteAudioOnly } from '../../../hooks/useSermons'
import { showToast } from '../../../utils/toast'
import type { SermonCreateRequest } from '../../../types/sermon'

interface SermonFormProps {
  onClose: () => void
  onSuccess: () => void
}

const SermonForm = ({ onClose, onSuccess }: SermonFormProps) => {
  const [showRecorder, setShowRecorder] = useState(false)
  const [formData, setFormData] = useState<SermonCreateRequest>({
    title: '',
    pastor: '',
    bible_verse: '',
    sermon_date: new Date().toISOString().split('T')[0],
    content: '',
    audio_url: '',
    video_url: '',
    thumbnail_url: '',
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)

  const uploadAudioMutation = useUploadAudio()
  const createSermonMutation = useCreateSermon()
  const deleteAudioMutation = useDeleteAudioOnly()

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRecordingComplete = async (audioBlob: Blob) => {
    const file = new File([audioBlob], `sermon_${Date.now()}.webm`, {
      type: audioBlob.type,
    })
    setAudioFile(file)
    setShowRecorder(false)
    showToast('녹음이 완료되었습니다', 'success')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 크기 체크 (100MB)
      if (file.size > 100 * 1024 * 1024) {
        showToast('파일 크기는 100MB를 초과할 수 없습니다', 'error')
        return
      }
      
      // 파일 형식 체크
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/wav', 'audio/ogg', 'audio/m4a']
      if (!allowedTypes.includes(file.type)) {
        showToast('지원하지 않는 파일 형식입니다', 'error')
        return
      }
      
      setAudioFile(file)
      showToast('파일이 선택되었습니다', 'success')
    }
  }

  const handleRemoveAudio = async () => {
    // 이미 업로드된 파일이 있으면 서버에서 삭제
    if (uploadedAudioUrl) {
      try {
        await deleteAudioMutation.mutateAsync(uploadedAudioUrl)
        setUploadedAudioUrl('')
      } catch (error) {
        console.error('Audio deletion error:', error)
      }
    }
    
    setAudioFile(null)
    setFormData(prev => ({ ...prev, audio_url: '' }))
  }

  const handleClose = async () => {
    // 폼을 닫을 때 업로드된 음성 파일이 있으면 삭제 (고아 파일 방지)
    if (uploadedAudioUrl) {
      try {
        await deleteAudioMutation.mutateAsync(uploadedAudioUrl)
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    }
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 필수 필드 검증
    if (!formData.title || !formData.pastor || !formData.bible_verse || !formData.content) {
      showToast('모든 필수 항목을 입력해주세요', 'error')
      return
    }

    try {
      setIsUploading(true)
      
      // 음성 파일이 있으면 먼저 업로드
      let audioUrl = formData.audio_url
      if (audioFile && !uploadedAudioUrl) {
        const uploadResult = await uploadAudioMutation.mutateAsync(audioFile)
        audioUrl = uploadResult.audio_url
        setUploadedAudioUrl(audioUrl)
      } else if (uploadedAudioUrl) {
        audioUrl = uploadedAudioUrl
      }

      // 설교 생성
      await createSermonMutation.mutateAsync({
        ...formData,
        audio_url: audioUrl,
      })

      // 성공 시 uploadedAudioUrl 초기화 (삭제 방지)
      setUploadedAudioUrl('')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Sermon creation error:', error)
    } finally {
      setIsUploading(false)
    }
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
            <div className="space-y-4">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="설교 제목을 입력하세요"
                  required
                />
              </div>

              {/* 목사님 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  목사님 *
                </label>
                <input
                  type="text"
                  name="pastor"
                  value={formData.pastor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="목사님 성함을 입력하세요"
                  required
                />
              </div>

              {/* 성경 구절 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  성경 구절 *
                </label>
                <input
                  type="text"
                  name="bible_verse"
                  value={formData.bible_verse}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="예: 요한복음 3:16"
                  required
                />
              </div>

              {/* 설교 날짜 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  설교 날짜 *
                </label>
                <input
                  type="date"
                  name="sermon_date"
                  value={formData.sermon_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* 설교 내용 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  설교 내용 *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="설교 내용을 입력하세요"
                  required
                />
              </div>

              {/* 음성 파일 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  음성 파일
                </label>
                {audioFile ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        선택된 파일: {audioFile.name}
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveAudio}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <span className="material-icons-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRecorder(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      <span className="material-icons-outlined">mic</span>
                      녹음하기
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors cursor-pointer">
                      <span className="material-icons-outlined">upload_file</span>
                      파일 선택
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* 비디오 URL (선택) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  비디오 URL (선택)
                </label>
                <input
                  type="url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              {/* 썸네일 URL (선택) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  썸네일 URL (선택)
                </label>
                <input
                  type="url"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>
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
                disabled={isUploading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default SermonForm
