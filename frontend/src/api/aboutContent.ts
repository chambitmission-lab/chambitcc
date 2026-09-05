// 소개 페이지 컨텐츠 API
import type {
  AboutContent,
  UpdateAboutContentRequest,
  AboutImageUploadResponse,
} from '../types/aboutContent'
import { request } from './utils/request'

const EMPTY_CONTENT: AboutContent = {
  fields: {},
  hero_background_url: null,
}

// 컨텐츠 조회 (인증 불필요). 백엔드 미구현 / 404 시 빈 컨텐츠 반환.
export const getAboutContent = async (): Promise<AboutContent> => {
  try {
    // 404 = 아직 저장된 컨텐츠 없음 → 기본 i18n 사용
    return await request<AboutContent>('/about-content')
  } catch (error) {
    console.warn('about-content API not available, using defaults:', error)
    return EMPTY_CONTENT
  }
}

// 컨텐츠 수정 (관리자). 부분 업데이트 지원.
export const updateAboutContent = async (
  data: UpdateAboutContentRequest
): Promise<AboutContent> => {
  return request<AboutContent>('/about-content', {
    method: 'PUT',
    json: data,
    errorMessage: 'Failed to update about content',
  })
}

// 배경 이미지 업로드 (관리자). multipart/form-data.
export const uploadAboutImage = async (
  file: File
): Promise<AboutImageUploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  return request<AboutImageUploadResponse>('/about-content/upload', {
    method: 'POST',
    body: formData,
    errorMessage: 'Failed to upload image',
  })
}
