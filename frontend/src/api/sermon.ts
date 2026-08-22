// 설교 API 함수
import { API_V1, apiFetch } from '../config/api'
import type { Sermon, SermonCreateRequest, AudioUploadResponse, TranscriptAnalysisResponse } from '../types/sermon'

/**
 * 설교 목록 조회 (인증 불필요)
 *
 * includeContent=false 면 설교 전문(content)을 null 로 받는다 — 랜딩·홈 카드처럼
 * 제목·설교자·날짜만 그리는 곳용. 설교 페이지는 목록 항목을 그대로 상세에
 * 넘겨 전문을 보여주므로 기본값(true)을 유지한다.
 */
export const getSermons = async (skip = 0, limit = 10, includeContent = true): Promise<Sermon[]> => {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) })
  if (!includeContent) params.set('include_content', 'false')
  const response = await apiFetch(`${API_V1}/sermons/?${params}`)
  
  if (!response.ok) {
    throw new Error('설교 목록을 불러오는데 실패했습니다')
  }
  
  return response.json()
}

/**
 * 설교 상세 조회
 */
export const getSermon = async (id: number): Promise<Sermon> => {
  const response = await apiFetch(`${API_V1}/sermons/${id}`)
  
  if (!response.ok) {
    throw new Error('설교를 불러오는데 실패했습니다')
  }
  
  return response.json()
}

/**
 * 음성 파일 업로드 (관리자 전용)
 */
export const uploadAudio = async (file: File): Promise<AudioUploadResponse> => {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await apiFetch(`${API_V1}/sermons/upload-audio`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '음성 파일 업로드에 실패했습니다')
  }
  
  return response.json()
}

/**
 * 설교 생성 (관리자 전용)
 */
export const createSermon = async (data: SermonCreateRequest): Promise<Sermon> => {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  
  const response = await apiFetch(`${API_V1}/sermons/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '설교 생성에 실패했습니다')
  }
  
  return response.json()
}

/**
 * 설교 수정 (관리자 전용)
 */
export const updateSermon = async (id: number, data: SermonCreateRequest): Promise<Sermon> => {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  
  const response = await apiFetch(`${API_V1}/sermons/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '설교 수정에 실패했습니다')
  }
  
  return response.json()
}

/**
 * 설교 삭제 (관리자 전용) - 음성 파일도 자동 삭제됨
 */
export const deleteSermon = async (id: number): Promise<void> => {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  
  const response = await apiFetch(`${API_V1}/sermons/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '설교 삭제에 실패했습니다')
  }
}

/**
 * 음성 파일만 삭제 (관리자 전용)
 * 설교는 유지하고 음성 파일만 삭제할 때 사용
 */
export const deleteAudioOnly = async (audioUrl: string): Promise<void> => {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  
  const response = await apiFetch(
    `${API_V1}/sermons/audio?audio_url=${encodeURIComponent(audioUrl)}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '음성 파일 삭제에 실패했습니다')
  }
}

/**
 * 트랜스크립트 업로드 및 성경 구절 자동 추출 (관리자 전용)
 */
export const analyzeTranscript = async (
  sermonId: number,
  file: File,
  autoGenerateSummary: boolean = true
): Promise<TranscriptAnalysisResponse> => {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await apiFetch(
    `${API_V1}/sermons/${sermonId}/analyze-transcript?auto_generate_summary=${autoGenerateSummary}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '트랜스크립트 분석에 실패했습니다')
  }
  
  return response.json()
}

/**
 * 설교별 성경 구절 목록 조회
 */
export const getSermonBibleReferences = async (sermonId: number) => {
  const response = await apiFetch(`${API_V1}/sermons/${sermonId}/bible-references`)
  
  if (!response.ok) {
    throw new Error('성경 구절 목록을 불러오는데 실패했습니다')
  }
  
  return response.json()
}

/** 설교 검색 — 제목·설교자·본문 부분 일치 (⌘K 팔레트용, 인증 불필요) */
export const searchSermons = async (q: string, limit = 6): Promise<Sermon[]> => {
  // 팔레트는 제목·설교자만 보여주므로 전문은 받지 않는다
  const params = new URLSearchParams({ q, limit: String(limit), skip: '0', include_content: 'false' })
  const response = await apiFetch(`${API_V1}/sermons?${params}`)
  if (!response.ok) throw new Error('설교 검색에 실패했습니다')
  return response.json()
}
