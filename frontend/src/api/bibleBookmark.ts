import { API_V1 } from '../config/api'
import { request, requestRaw, type UntypedJson } from './utils/request'
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
  const data = await request<UntypedJson>(bookmarkPath(verseId), {
    method: 'PUT',
    auth: 'required',
    json: {
      highlight_color: payload.highlight_color ?? null,
      note: payload.note ?? null,
      is_favorite: payload.is_favorite ?? false,
    },
    errorMessage: '북마크 저장에 실패했습니다',
  })
  return data.data
}

/** 필드 단위 삭제 대상 — note: 묵상 노트만, favorite: 즐겨찾기만. 미지정 시 통째 삭제 */
export type BookmarkDeleteTarget = 'note' | 'favorite'

export const deleteBookmark = async (
  verseId: number,
  target?: BookmarkDeleteTarget
): Promise<void> => {
  const url = target ? `${bookmarkPath(verseId)}?target=${target}` : bookmarkPath(verseId)
  await requestRaw(url, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '북마크 삭제에 실패했습니다',
  })
}

export const getBookmark = async (verseId: number): Promise<VerseBookmark | null> => {
  const data = await request<UntypedJson>(bookmarkPath(verseId), { auth: 'required', errorMessage: '북마크 조회에 실패했습니다' })
  return data.data
}

/**
 * 한 장의 내 북마크 전체 — 절마다 개별 조회하는 N+1 제거용 배치 조회
 * (word note의 by-chapter와 동일 패턴)
 */
export const listChapterBookmarks = async (
  bookNumber: number,
  chapter: number
): Promise<VerseBookmark[]> => {
  const data = await request<UntypedJson>(`/bible/bookmarks/by-chapter?book_number=${bookNumber}&chapter=${chapter}`, { auth: 'required', errorMessage: '북마크 조회에 실패했습니다' })
  return data.data.items
}

export const listBookmarks = async (params?: {
  favorites_only?: boolean
  notes_only?: boolean
  color?: HighlightColor
  book_number?: number
  page?: number
  page_size?: number
}): Promise<BookmarkListResponse> => {
  const query = new URLSearchParams()
  if (params?.favorites_only) query.append('favorites_only', 'true')
  if (params?.notes_only) query.append('notes_only', 'true')
  if (params?.color) query.append('color', params.color)
  if (params?.book_number) query.append('book_number', String(params.book_number))
  if (params?.page) query.append('page', String(params.page))
  if (params?.page_size) query.append('page_size', String(params.page_size))

  const url = `${API_V1}/bible/bookmarks${query.toString() ? `?${query}` : ''}`
  const data = await request<UntypedJson>(url, { auth: 'required', errorMessage: '북마크 목록 조회에 실패했습니다' })
  return data.data
}

/** 즐겨찾기 플레이리스트 순서 저장 — id 나열 순서가 곧 재생 순서 */
export const reorderBookmarks = async (bookmarkIds: number[]): Promise<void> => {
  await requestRaw('/bible/bookmarks/reorder', {
    method: 'PUT',
    auth: 'required',
    json: { bookmark_ids: bookmarkIds },
    errorMessage: '순서 저장에 실패했습니다',
  })
}

export const getBookmarkStats = async (): Promise<BookmarkStats> => {
  const data = await request<UntypedJson>('/bible/bookmarks/stats', { auth: 'required', errorMessage: '북마크 통계 조회에 실패했습니다' })
  return data.data
}
