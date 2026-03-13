// 설교 폼 상태 및 로직 관리
import { useState } from 'react'
import { useCreateSermon, useUpdateSermon } from '../../../../hooks/useSermons'
import { showToast } from '../../../../utils/toast'
import { validateFormData } from './validation'
import { useAudioUpload } from './useAudioUpload'
import { useTranscriptUpload } from './useTranscriptUpload'
import type { Sermon } from '../../../../types/sermon'
import type { SermonFormData } from './types'

export const useSermonForm = (onSuccess: () => void, onClose: () => void, sermon?: Sermon) => {
  const [formData, setFormData] = useState<SermonFormData>({
    title: sermon?.title || '',
    pastor: sermon?.pastor || '',
    bible_verse: sermon?.bible_verse || '',
    sermon_date: sermon?.sermon_date || new Date().toISOString().split('T')[0],
    content: sermon?.content || '',
    audio_url: sermon?.audio_url || '',
    video_url: sermon?.video_url || '',
    thumbnail_url: sermon?.thumbnail_url || '',
  })

  const [createdSermonId, setCreatedSermonId] = useState<number | null>(sermon?.id || null)

  const createSermonMutation = useCreateSermon()
  const updateSermonMutation = useUpdateSermon()
  const audioUpload = useAudioUpload()
  const transcriptUpload = useTranscriptUpload(createdSermonId)

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
      // 음성 파일 업로드 (새로운 파일이 있는 경우에만)
      const audioUrl = await audioUpload.uploadAudio()

      const submitData = {
        ...formData,
        audio_url: audioUrl || formData.audio_url,
      }

      if (sermon) {
        // 수정 모드
        await updateSermonMutation.mutateAsync({
          id: sermon.id,
          data: submitData,
        })
      } else {
        // 생성 모드
        const createdSermon = await createSermonMutation.mutateAsync(submitData)
        setCreatedSermonId(createdSermon.id)
      }

      onSuccess()
      onClose()
    } catch (error) {
      showToast(sermon ? '설교 수정에 실패했습니다' : '설교 등록에 실패했습니다', 'error')
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
    transcriptUpload,
    createdSermonId,
    isSubmitting: createSermonMutation.isPending || updateSermonMutation.isPending || audioUpload.audioState.isUploading,
    isEditMode: !!sermon,
  }
}
