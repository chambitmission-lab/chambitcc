import { API_V1 } from '../config/api'
import { request, requestRaw, type UntypedJson } from './utils/request'
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
  /** 단어를 다듬으면 밑줄 범위도 함께 좁혀 보낸다. 생략 시 기존 위치 유지 */
  char_start?: number | null
  char_end?: number | null
}

export const createWordNote = async (
  verseId: number,
  payload: CreateWordNotePayload
): Promise<WordNote> => {
  const data = await request<UntypedJson>(`/bible/verses/${verseId}/word-notes`, {
    method: 'POST',
    auth: 'required',
    json: {
      word: payload.word,
      note: payload.note ?? null,
      char_start: payload.char_start ?? null,
      char_end: payload.char_end ?? null,
    },
    errorMessage: '단어 저장에 실패했습니다',
  })
  return data.data
}

export const updateWordNote = async (
  noteId: number,
  payload: UpdateWordNotePayload
): Promise<WordNote> => {
  const data = await request<UntypedJson>(`/bible/word-notes/${noteId}`, {
    method: 'PUT',
    auth: 'required',
    json: {
      word: payload.word,
      note: payload.note ?? null,
      // 백엔드는 범위 생략 시 기존 위치를 유지한다 (null 반쪽 전송 금지)
      ...(payload.char_start != null && payload.char_end != null
        ? { char_start: payload.char_start, char_end: payload.char_end }
        : {}),
    },
    errorMessage: '단어 수정에 실패했습니다',
  })
  return data.data
}

export const deleteWordNote = async (noteId: number): Promise<void> => {
  await requestRaw(`/bible/word-notes/${noteId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '단어 삭제에 실패했습니다',
  })
}

/** 한 장의 내 단어 노트 전체 — 본문 밑줄 표시용 배치 조회 */
export const listChapterWordNotes = async (
  bookNumber: number,
  chapter: number
): Promise<WordNote[]> => {
  const data = await request<UntypedJson>(`/bible/word-notes/by-chapter?book_number=${bookNumber}&chapter=${chapter}`, { auth: 'required', errorMessage: '단어 노트 조회에 실패했습니다' })
  return data.data.items
}

/** 내 단어장 목록 (구절 정보 포함, 최신순) */
export const listWordNotes = async (params?: {
  q?: string
  /** 특정 권만 — 장 선택 그리드의 밑줄·메모 점 표시용 (구버전 백엔드는 무시) */
  book_number?: number
  page?: number
  page_size?: number
}): Promise<WordNoteListResponse> => {
  const query = new URLSearchParams()
  if (params?.q) query.append('q', params.q)
  if (params?.book_number) query.append('book_number', String(params.book_number))
  if (params?.page) query.append('page', String(params.page))
  if (params?.page_size) query.append('page_size', String(params.page_size))

  const url = `${API_V1}/bible/word-notes${query.toString() ? `?${query}` : ''}`
  const data = await request<UntypedJson>(url, { auth: 'required', errorMessage: '단어장 목록 조회에 실패했습니다' })
  return data.data
}
