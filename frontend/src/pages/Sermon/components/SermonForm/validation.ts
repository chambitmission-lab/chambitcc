// 유효성 검증 로직
import type { SermonFormData, ValidationResult } from './types'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/webm',
  'audio/wav',
  'audio/ogg',
  'audio/m4a'
]

export const validateFormData = (formData: SermonFormData): ValidationResult => {
  if (!formData.title?.trim()) {
    return { isValid: false, message: '제목을 입력해주세요' }
  }

  if (!formData.pastor?.trim()) {
    return { isValid: false, message: '목사님 성함을 입력해주세요' }
  }

  if (!formData.bible_verse?.trim()) {
    return { isValid: false, message: '성경 구절을 입력해주세요' }
  }

  if (!formData.content?.trim()) {
    return { isValid: false, message: '설교 내용을 입력해주세요' }
  }

  return { isValid: true }
}

export const validateAudioFile = (file: File): ValidationResult => {
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, message: '파일 크기는 100MB를 초과할 수 없습니다' }
  }

  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return { isValid: false, message: '지원하지 않는 파일 형식입니다' }
  }

  return { isValid: true }
}
