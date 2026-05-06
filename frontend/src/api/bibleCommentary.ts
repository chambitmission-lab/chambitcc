import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import type {
  BibleCommentary,
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
