// 소개 페이지 컨텐츠 API
import { API_V1, apiFetch } from '../config/api'
import type {
  AboutContent,
  UpdateAboutContentRequest,
  AboutImageUploadResponse,
} from '../types/aboutContent'

const EMPTY_CONTENT: AboutContent = {
  fields: {},
  hero_background_url: null,
}

// 컨텐츠 조회 (인증 불필요). 백엔드 미구현 / 404 시 빈 컨텐츠 반환.
export const getAboutContent = async (): Promise<AboutContent> => {
  try {
    const response = await apiFetch(`${API_V1}/about-content`)
    if (!response.ok) {
      // 404 = 아직 저장된 컨텐츠 없음 → 기본 i18n 사용
      return EMPTY_CONTENT
    }
    return response.json()
  } catch (error) {
    console.warn('about-content API not available, using defaults:', error)
    return EMPTY_CONTENT
  }
}

// 컨텐츠 수정 (관리자). 부분 업데이트 지원.
export const updateAboutContent = async (
  data: UpdateAboutContentRequest
): Promise<AboutContent> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/about-content`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to update about content')
  }

  return response.json()
}

// 배경 이미지 업로드 (관리자). multipart/form-data.
export const uploadAboutImage = async (
  file: File
): Promise<AboutImageUploadResponse> => {
  const token = localStorage.getItem('access_token')
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiFetch(`${API_V1}/about-content/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload image')
  }

  return response.json()
}
