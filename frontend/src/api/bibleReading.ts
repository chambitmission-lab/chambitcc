import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders, requireAuth } from './utils/apiHelpers'

// 타입 정의
export interface BibleReadingRecord {
  id: number
  user_id: number
  verse_id: number
  similarity: number
  read_at: string
  created_at: string
}

export interface MarkVerseAsReadRequest {
  similarity: number
  read_at: string
}

export interface MarkVerseAsReadResponse {
  success: boolean
  data: BibleReadingRecord
}

export interface ReadVerse {
  id: number
  verse_id: number
  book_id: number
  book_name_ko: string
  chapter: number
  verse: number
  text: string
  similarity: number
  read_at: string
}

export interface ReadVersesResponse {
  success: boolean
  data: {
    read_verses: ReadVerse[]
    pagination: {
      current_page: number
      page_size: number
      total_items: number
      total_pages: number
      has_next: boolean
      has_prev: boolean
    }
  }
}

export interface ChapterReadStatus {
  verse_id: number
  verse: number
  is_read: boolean
  similarity: number | null
  read_at: string | null
}

export interface ChapterReadStatusResponse {
  success: boolean
  data: {
    book_number: number
    book_name_ko: string
    chapter: number
    total_verses: number
    read_verses: number
    progress: number
    verses: ChapterReadStatus[]
  }
}

export interface BookProgress {
  book_id: number
  book_name_ko: string
  book_name_en: string
  total_verses: number
  read_verses: number
  progress: number
  last_read_at: string | null
}

export interface ReadingProgressResponse {
  success: boolean
  data: {
    overall: {
      total_verses: number
      read_verses: number
      progress: number
    }
    old_testament: {
      total_verses: number
      read_verses: number
      progress: number
    }
    new_testament: {
      total_verses: number
      read_verses: number
      progress: number
    }
    books: BookProgress[]
  }
}

export interface ChapterProgress {
  chapter: number
  total_verses: number
  read_verses: number
  progress: number
  completed: boolean
  last_read_at: string | null
}

export interface BookDetailProgressResponse {
  success: boolean
  data: {
    book_id: number
    book_name_ko: string
    book_name_en: string
    total_verses: number
    read_verses: number
    progress: number
    chapters: ChapterProgress[]
  }
}

// API 함수들

/**
 * 구절 읽음 처리
 */
export const markVerseAsRead = async (
  verseId: number,
  similarity: number
): Promise<BibleReadingRecord> => {
  requireAuth()
  
  const response = await apiFetch(
    `${API_V1}/bible/verses/${verseId}/read`,
    {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        similarity,
        read_at: new Date().toISOString()
      })
    }
  )
  
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('ALREADY_READ')
    }
    throw new Error('구절 읽음 처리에 실패했습니다')
  }
  
  const result: MarkVerseAsReadResponse = await response.json()
  return result.data
}

/**
 * 읽은 구절 목록 조회
 */
export const getReadVerses = async (params?: {
  book_id?: number
  chapter?: number
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}): Promise<ReadVersesResponse['data']> => {
  requireAuth()
  
  const queryParams = new URLSearchParams()
  
  if (params?.book_id) queryParams.append('book_id', params.book_id.toString())
  if (params?.chapter) queryParams.append('chapter', params.chapter.toString())
  if (params?.start_date) queryParams.append('start_date', params.start_date)
  if (params?.end_date) queryParams.append('end_date', params.end_date)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.page_size) queryParams.append('page_size', params.page_size.toString())
  
  const url = `${API_V1}/bible/verses/read${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  
  const response = await apiFetch(url, {
    headers: getAuthHeaders(true)
  })
  
  if (!response.ok) {
    throw new Error('읽은 구절 목록을 불러오는데 실패했습니다')
  }
  
  const result: ReadVersesResponse = await response.json()
  return result.data
}

/**
 * 특정 장의 읽음 상태 조회
 */
export const getChapterReadStatus = async (
  bookNumber: number,
  chapter: number
): Promise<ChapterReadStatusResponse['data']> => {
  requireAuth()
  
  const response = await apiFetch(
    `${API_V1}/bible/chapters/${bookNumber}/${chapter}/read-status`,
    {
      headers: getAuthHeaders(true)
    }
  )
  
  if (!response.ok) {
    throw new Error('장 읽음 상태를 불러오는데 실패했습니다')
  }
  
  const result: ChapterReadStatusResponse = await response.json()
  return result.data
}

/**
 * 전체 읽기 진행률 조회
 */
export const getReadingProgress = async (): Promise<ReadingProgressResponse['data']> => {
  requireAuth()
  
  const response = await apiFetch(
    `${API_V1}/bible/reading-progress`,
    {
      headers: getAuthHeaders(true)
    }
  )
  
  if (!response.ok) {
    throw new Error('읽기 진행률을 불러오는데 실패했습니다')
  }
  
  const result: ReadingProgressResponse = await response.json()
  return result.data
}

/**
 * 특정 책의 읽기 진행률 조회
 */
export const getBookReadingProgress = async (
  bookId: number
): Promise<BookDetailProgressResponse['data']> => {
  requireAuth()
  
  const response = await apiFetch(
    `${API_V1}/bible/reading-progress?book_id=${bookId}`,
    {
      headers: getAuthHeaders(true)
    }
  )
  
  if (!response.ok) {
    throw new Error('책 읽기 진행률을 불러오는데 실패했습니다')
  }
  
  const result: BookDetailProgressResponse = await response.json()
  return result.data
}

/**
 * 읽음 취소
 */
export const unmarkVerseAsRead = async (verseId: number): Promise<void> => {
  requireAuth()
  
  const response = await apiFetch(
    `${API_V1}/bible/verses/${verseId}/read`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(true)
    }
  )
  
  if (!response.ok) {
    throw new Error('읽음 취소에 실패했습니다')
  }
}
