// SermonForm 관련 타입 정의
import type { SermonCreateRequest } from '../../../../types/sermon'

export interface SermonFormProps {
  onClose: () => void
  onSuccess: () => void
}

export interface SermonFormData extends SermonCreateRequest {}

export interface AudioUploadState {
  file: File | null
  uploadedUrl: string
  isUploading: boolean
}

export interface ValidationResult {
  isValid: boolean
  message?: string
}
