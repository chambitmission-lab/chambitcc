// 설교 폼 상태 및 로직 관리
import { useState } from 'react'
import { useCreateSermon } from '../../../../hooks/useSermons'
import { showToast } from '../../../../utils/toast'
import { validateFormData } from './validation'
import { useAudioUpload } from './useAudioUpload'
import type { SermonFormData } from './types'

export const useSermonForm = (onSuccess: () => void, onClose: () => void) => {
  const [formData, setFormData] = useState<SermonFormData>({
    title: '',
    pastor: '',
    bible_verse: '',
    sermon_date: new Date().toISOString().split('T')[0],
    content: '',
    audio_url: '',
    video_url: '',
    thumbnail_url: '',
  })

  const createSermonMutation = useCreateSermon()
  const audioUpload = useAudioUpload()

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const validation = validateFormData(formData)
    if (!validation.isValid) {
      showToast(validation.message!, 'error')
      return
    }

    try {
      // 음성 파일 업로드
      const audioUrl = await audioUpload.uploadAudio()

      // 설교 생성
      await createSermonMutation.mutateAsync({
        ...formData,
        audio_url: audioUrl,
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Sermon creation error:', error)
      showToast('설교 등록에 실패했습니다', 'error')
    }
  }

  const handleClose = async () => {
    await audioUpload.cleanup()
    onClose()
  }

  return {
    formData,
    handleInputChange,
    handleSubmit,
    handleClose,
    audioUpload,
    isSubmitting: createSermonMutation.isPending || audioUpload.audioState.isUploading,
  }
}
