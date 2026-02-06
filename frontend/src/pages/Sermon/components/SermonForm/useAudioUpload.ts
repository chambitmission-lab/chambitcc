// 오디오 업로드 관련 로직
import { useState } from 'react'
import { useUploadAudio, useDeleteAudioOnly } from '../../../../hooks/useSermons'
import { showToast } from '../../../../utils/toast'
import { validateAudioFile } from './validation'
import type { AudioUploadState } from './types'

export const useAudioUpload = () => {
  const [audioState, setAudioState] = useState<AudioUploadState>({
    file: null,
    uploadedUrl: '',
    isUploading: false,
  })

  const uploadAudioMutation = useUploadAudio()
  const deleteAudioMutation = useDeleteAudioOnly()

  const handleRecordingComplete = (audioBlob: Blob) => {
    const file = new File([audioBlob], `sermon_${Date.now()}.webm`, {
      type: audioBlob.type,
    })
    setAudioState(prev => ({ ...prev, file }))
    showToast('녹음이 완료되었습니다', 'success')
  }

  const handleFileSelect = (file: File) => {
    const validation = validateAudioFile(file)
    
    if (!validation.isValid) {
      showToast(validation.message!, 'error')
      return
    }

    setAudioState(prev => ({ ...prev, file }))
    showToast('파일이 선택되었습니다', 'success')
  }

  const uploadAudio = async (): Promise<string> => {
    if (!audioState.file) return ''

    if (audioState.uploadedUrl) {
      return audioState.uploadedUrl
    }

    setAudioState(prev => ({ ...prev, isUploading: true }))
    
    try {
      const result = await uploadAudioMutation.mutateAsync(audioState.file)
      setAudioState(prev => ({ 
        ...prev, 
        uploadedUrl: result.audio_url,
        isUploading: false 
      }))
      return result.audio_url
    } catch (error) {
      setAudioState(prev => ({ ...prev, isUploading: false }))
      throw error
    }
  }

  const removeAudio = async () => {
    if (audioState.uploadedUrl) {
      try {
        await deleteAudioMutation.mutateAsync(audioState.uploadedUrl)
      } catch (error) {
        // 삭제 실패 시 무시
      }
    }

    setAudioState({
      file: null,
      uploadedUrl: '',
      isUploading: false,
    })
  }

  const cleanup = async () => {
    if (audioState.uploadedUrl) {
      try {
        await deleteAudioMutation.mutateAsync(audioState.uploadedUrl)
      } catch (error) {
        // 정리 실패 시 무시
      }
    }
  }

  return {
    audioState,
    handleRecordingComplete,
    handleFileSelect,
    uploadAudio,
    removeAudio,
    cleanup,
  }
}
