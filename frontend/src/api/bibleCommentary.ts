import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import type {
  BibleCommentary,
  BibleCommentaryAIGenerateRequest,
  BibleCommentaryAIGenerateResponse,
  BibleCommentaryBatchOneResponse,
  BibleCommentaryCreateRequest,
  BibleCommentaryListResponse,
  BibleCommentaryUpdateRequest,
} from '../types/bibleCommentary'

const BASE = `${API_V1}/bible-commentaries`

export const listChapterCommentaries = async (
  bookNumber: number,
  chapter: number,
): Promise<BibleCommentaryListResponse> => {
  const response = await apiFetch(`${BASE}/chapter/${bookNumber}/${chapter}`)
  if (!response.ok) {
    throw new Error('해석을 불러오지 못했습니다')
  }
  return response.json()
}

export const listVerseCommentaries = async (
  bookNumber: number,
  chapter: number,
  verse: number,
): Promise<BibleCommentaryListResponse> => {
  const response = await apiFetch(`${BASE}/verse/${bookNumber}/${chapter}/${verse}`)
  if (!response.ok) {
    throw new Error('해석을 불러오지 못했습니다')
  }
  return response.json()
}

export const createCommentary = async (
  payload: BibleCommentaryCreateRequest,
): Promise<BibleCommentary> => {
  const response = await apiFetch(BASE, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '해석 추가에 실패했습니다')
  }
  const data = await response.json()
  return data.commentary as BibleCommentary
}

export const updateCommentary = async (
  commentaryId: number,
  payload: BibleCommentaryUpdateRequest,
): Promise<BibleCommentary> => {
  const response = await apiFetch(`${BASE}/${commentaryId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '해석 수정에 실패했습니다')
  }
  const data = await response.json()
  return data.commentary as BibleCommentary
}

export const generateCommentaryDraft = async (
  payload: BibleCommentaryAIGenerateRequest,
): Promise<BibleCommentaryAIGenerateResponse> => {
  const response = await apiFetch(`${BASE}/ai-generate`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'AI 해석 초안 생성에 실패했습니다')
  }
  return response.json()
}

/**
 * 해석 없는 절 1건을 AI로 생성해 바로 저장 (관리자 전용).
 * 프론트에서 원하는 횟수만큼 순차 호출하며 진행률을 표시한다.
 * 1건씩 처리하므로 Gemini 1회 호출이라 타임아웃에 안전하다.
 */
export const batchGenerateOneCommentary = async (
  bookNumber?: number,
  chapter?: number,
): Promise<BibleCommentaryBatchOneResponse> => {
  const params = new URLSearchParams()
  if (bookNumber != null) params.set('book_number', String(bookNumber))
  if (chapter != null) params.set('chapter', String(chapter))
  const query = params.toString()
  const response = await apiFetch(
    `${BASE}/ai-batch-generate-one${query ? `?${query}` : ''}`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    },
  )
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'AI 해석 생성에 실패했습니다')
  }
  return response.json()
}

export const deleteCommentary = async (commentaryId: number): Promise<void> => {
  const response = await apiFetch(`${BASE}/${commentaryId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok && response.status !== 204) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '해석 삭제에 실패했습니다')
  }
}
