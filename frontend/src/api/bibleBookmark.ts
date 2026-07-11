import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders, requireAuth } from './utils/apiHelpers'

export type HighlightColor = 'yellow' | 'orange' | 'pink' | 'blue' | 'green'

export interface VerseBookmark {
  id: number
  verse_id: number
  highlight_color: HighlightColor | null
  note: string | null
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface VerseBookmarkWithVerse extends VerseBookmark {
  book_number: number
  book_name_ko: string
  chapter: number
  verse: number
  text: string
}

export interface BookmarkListResponse {
  items: VerseBookmarkWithVerse[]
  total: number
  page: number
  page_size: number
}

export interface BookmarkStats {
  bookmarks_count: number
  notes_count: number
  favorites_count: number
}

export interface UpsertBookmarkPayload {
  highlight_color?: HighlightColor | null
  note?: string | null
  is_favorite?: boolean
}

const bookmarkPath = (verseId: number) => `${API_V1}/bible/verses/${verseId}/bookmark`

export const upsertBookmark = async (
  verseId: number,
  payload: UpsertBookmarkPayload
): Promise<VerseBookmark> => {
  requireAuth()
  const response = await apiFetch(bookmarkPath(verseId), {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      highlight_color: payload.highlight_color ?? null,
      note: payload.note ?? null,
      is_favorite: payload.is_favorite ?? false,
    }),
  })
  if (!response.ok) {
    throw new Error('북마크 저장에 실패했습니다')
  }
  const data = await response.json()
  return data.data
}

export const deleteBookmark = async (verseId: number): Promise<void> => {
  requireAuth()
  const response = await apiFetch(bookmarkPath(verseId), {
    method: 'DELETE',
    headers: getAuthHeaders(true),
  })
  if (!response.ok) {
    throw new Error('북마크 삭제에 실패했습니다')
  }
}

export const getBookmark = async (verseId: number): Promise<VerseBookmark | null> => {
  requireAuth()
  const response = await apiFetch(bookmarkPath(verseId), {
    headers: getAuthHeaders(true),
  })
  if (!response.ok) {
    throw new Error('북마크 조회에 실패했습니다')
  }
  const data = await response.json()
  return data.data
}

export const listBookmarks = async (params?: {
  favorites_only?: boolean
  notes_only?: boolean
  color?: HighlightColor
  book_number?: number
  page?: number
  page_size?: number
}): Promise<BookmarkListResponse> => {
  requireAuth()
  const query = new URLSearchParams()
  if (params?.favorites_only) query.append('favorites_only', 'true')
  if (params?.notes_only) query.append('notes_only', 'true')
  if (params?.color) query.append('color', params.color)
  if (params?.book_number) query.append('book_number', String(params.book_number))
  if (params?.page) query.append('page', String(params.page))
  if (params?.page_size) query.append('page_size', String(params.page_size))

  const url = `${API_V1}/bible/bookmarks${query.toString() ? `?${query}` : ''}`
  const response = await apiFetch(url, { headers: getAuthHeaders(true) })
  if (!response.ok) {
    throw new Error('북마크 목록 조회에 실패했습니다')
  }
  const data = await response.json()
  return data.data
}

/** 즐겨찾기 플레이리스트 순서 저장 — id 나열 순서가 곧 재생 순서 */
export const reorderBookmarks = async (bookmarkIds: number[]): Promise<void> => {
  requireAuth()
  const response = await apiFetch(`${API_V1}/bible/bookmarks/reorder`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ bookmark_ids: bookmarkIds }),
  })
  if (!response.ok) {
    throw new Error('순서 저장에 실패했습니다')
  }
}

export const getBookmarkStats = async (): Promise<BookmarkStats> => {
  requireAuth()
  const response = await apiFetch(`${API_V1}/bible/bookmarks/stats`, {
    headers: getAuthHeaders(true),
  })
  if (!response.ok) {
    throw new Error('북마크 통계 조회에 실패했습니다')
  }
  const data = await response.json()
  return data.data
}
