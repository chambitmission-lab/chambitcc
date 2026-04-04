import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders, requireAuth } from './utils/apiHelpers'

// 정원 테마 타입 정의
export type ThemeType = 'preset' | 'custom'
export type PresetName = 'classic' | 'fantasy' | 'space' | 'watercolor'
export type ImageType = 'moon' | 'sun'

export interface GardenTheme {
  id?: number
  user_id?: number
  theme_type: ThemeType
  preset_name: PresetName | null
  moon_image_url: string | null
  sun_image_url: string | null
  created_at?: string
  updated_at?: string
}

export interface GardenThemeResponse {
  success: boolean
  data: GardenTheme
}

export interface ImageUploadResponse {
  success: boolean
  data: {
    image_url: string
    image_type: ImageType
    file_size: number
    uploaded_at: string
  }
}

/**
 * 정원 테마 설정 조회
 */
export const getGardenTheme = async (): Promise<GardenTheme> => {
  requireAuth()

  const response = await apiFetch(`${API_V1}/garden/theme`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    // 404인 경우 기본 테마 반환
    if (response.status === 404) {
      return {
        theme_type: 'preset',
        preset_name: 'classic',
        moon_image_url: null,
        sun_image_url: null,
      }
    }
    throw new Error('정원 테마를 불러오는데 실패했습니다')
  }

  const result = await response.json()
  console.log('getGardenTheme response:', result)
  
  // 백엔드 응답 구조에 따라 처리
  // 케이스 1: { success: true, data: { theme_type: "...", ... } }
  if (result.data) {
    return result.data
  }
  
  // 케이스 2: { theme_type: "...", ... } (직접 테마 객체)
  if (result.theme_type) {
    return result
  }
  
  // 응답이 없거나 구조가 다른 경우 기본 테마 반환
  console.warn('Unexpected theme response structure:', result)
  return {
    theme_type: 'preset',
    preset_name: 'classic',
    moon_image_url: null,
    sun_image_url: null,
  }
}

/**
 * 정원 테마 설정 저장
 */
export const saveGardenTheme = async (theme: Omit<GardenTheme, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<GardenTheme> => {
  requireAuth()

  const response = await apiFetch(`${API_V1}/garden/theme`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(theme),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '정원 테마 저장에 실패했습니다')
  }

  const result = await response.json()
  console.log('saveGardenTheme response:', result)
  
  // 백엔드 응답 구조에 따라 처리
  if (result.data) {
    return result.data
  }
  
  if (result.theme_type) {
    return result
  }
  
  // 저장 성공했지만 응답이 없는 경우 입력값 반환
  return theme as GardenTheme
}

/**
 * 정원 이미지 업로드
 */
export const uploadGardenImage = async (file: File, imageType: ImageType): Promise<string> => {
  requireAuth()

  const formData = new FormData()
  formData.append('image', file)
  formData.append('image_type', imageType)

  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/garden/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '이미지 업로드에 실패했습니다')
  }

  const result = await response.json()
  console.log('Upload response:', result) // 디버깅용
  
  // 백엔드 응답 구조에 따라 처리
  // 케이스 1: { success: true, data: { image_url: "..." } }
  if (result.data && result.data.image_url) {
    return result.data.image_url
  }
  
  // 케이스 2: { image_url: "..." }
  if (result.image_url) {
    return result.image_url
  }
  
  // 케이스 3: { url: "..." }
  if (result.url) {
    return result.url
  }
  
  // 케이스 4: 직접 URL 문자열
  if (typeof result === 'string') {
    return result
  }
  
  console.error('Unexpected response structure:', result)
  throw new Error('이미지 URL을 찾을 수 없습니다')
}
