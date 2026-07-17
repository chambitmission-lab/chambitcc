import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders, requireAuth } from './utils/apiHelpers'

/** 절 안의 특정 단어에 남긴 뜻/메모 */
export interface WordNote {
  id: number
  verse_id: number
  word: string
  char_start: number | null
  char_end: number | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface WordNoteWithVerse extends WordNote {
  book_number: number
  book_name_ko: string
  chapter: number
  verse: number
  text: string
}

export interface WordNoteListResponse {
  items: WordNoteWithVerse[]
  total: number
  page: number
  page_size: number
}

export interface CreateWordNotePayload {
  word: string
  note?: string | null
  char_start?: number | null
  char_end?: number | null
}

export interface UpdateWordNotePayload {
  word: string
  note?: string | null
}

export const createWordNote = async (
  verseId: number,
  payload: CreateWordNotePayload
): Promise<WordNote> => {
  requireAuth()
  const response = await apiFetch(`${API_V1}/bible/verses/${verseId}/word-notes`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      word: payload.word,
      note: payload.note ?? null,
      char_start: payload.char_start ?? null,
      char_end: payload.char_end ?? null,
    }),
  })
  if (!response.ok) {
    throw new Error('단어 저장에 실패했습니다')
  }
  const data = await response.json()
  return data.data
}

export const updateWordNote = async (
  noteId: number,
  payload: UpdateWordNotePayload
): Promise<WordNote> => {
  requireAuth()
  const response = await apiFetch(`${API_V1}/bible/word-notes/${noteId}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ word: payload.word, note: payload.note ?? null }),
  })
  if (!response.ok) {
    throw new Error('단어 수정에 실패했습니다')
  }
  const data = await response.json()
  return data.data
}

export const deleteWordNote = async (noteId: number): Promise<void> => {
  requireAuth()
  const response = await apiFetch(`${API_V1}/bible/word-notes/${noteId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true),
  })
  if (!response.ok) {
    throw new Error('단어 삭제에 실패했습니다')
  }
}

/** 한 장의 내 단어 노트 전체 — 본문 밑줄 표시용 배치 조회 */
export const listChapterWordNotes = async (
  bookNumber: number,
  chapter: number
): Promise<WordNote[]> => {
  requireAuth()
  const response = await apiFetch(
    `${API_V1}/bible/word-notes/by-chapter?book_number=${bookNumber}&chapter=${chapter}`,
    { headers: getAuthHeaders(true) }
  )
  if (!response.ok) {
    throw new Error('단어 노트 조회에 실패했습니다')
  }
  const data = await response.json()
  return data.data.items
}

/** 내 단어장 목록 (구절 정보 포함, 최신순) */
export const listWordNotes = async (params?: {
  q?: string
  page?: number
  page_size?: number
}): Promise<WordNoteListResponse> => {
  requireAuth()
  const query = new URLSearchParams()
  if (params?.q) query.append('q', params.q)
  if (params?.page) query.append('page', String(params.page))
  if (params?.page_size) query.append('page_size', String(params.page_size))

  const url = `${API_V1}/bible/word-notes${query.toString() ? `?${query}` : ''}`
  const response = await apiFetch(url, { headers: getAuthHeaders(true) })
  if (!response.ok) {
    throw new Error('단어장 목록 조회에 실패했습니다')
  }
  const data = await response.json()
  return data.data
}
