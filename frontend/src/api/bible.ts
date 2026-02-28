import { API_V1, apiFetch } from '../config/api'
import type { BibleBook, BibleChapterResponse, BibleChapterPaginatedResponse, BibleVerse, BibleSearchResult } from '../types/bible'

// Mock 데이터 import (개발/테스트용)
import { getMockBibleBooks, getMockBibleChapter, getMockBibleSearch } from './bible.mock'

// Mock 모드 활성화 여부 (백엔드 API가 준비되면 false로 변경)
const USE_MOCK_DATA = false

// 성경 책 목록 조회
export const getBibleBooks = async (): Promise<BibleBook[]> => {
  if (USE_MOCK_DATA) {
    return getMockBibleBooks()
  }
  
  const response = await apiFetch(`${API_V1}/bible/books`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch bible books')
  }
  
  return response.json()
}

// 특정 장 읽기 - 책 ID 사용
export const getBibleChapter = async (bookId: number, chapter: number): Promise<BibleChapterResponse> => {
  if (USE_MOCK_DATA) {
    return getMockBibleChapter(bookId, chapter)
  }
  
  const response = await apiFetch(`${API_V1}/bible/chapter/${bookId}/${chapter}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch bible chapter')
  }
  
  return response.json()
}

// 특정 구절 조회
export const getBibleVerse = async (book: string, chapter: number, verse: number): Promise<BibleVerse> => {
  const response = await apiFetch(`${API_V1}/bible/verse/${encodeURIComponent(book)}/${chapter}/${verse}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch bible verse')
  }
  
  return response.json()
}

// 성경 검색
export const searchBible = async (keyword: string, page: number = 1, limit: number = 20): Promise<BibleSearchResult> => {
  if (USE_MOCK_DATA) {
    return getMockBibleSearch(keyword)
  }
  
  const params = new URLSearchParams({
    keyword,
    page: page.toString(),
    limit: limit.toString()
  })
  
  const response = await apiFetch(`${API_V1}/bible/search?${params}`)
  
  if (!response.ok) {
    throw new Error('Failed to search bible')
  }
  
  return response.json()
}

// 페이지네이션 장 조회 (무한 스크롤용)
export const getBibleChapterPaginated = async (
  bookNumber: number, 
  chapter: number, 
  page: number = 1, 
  pageSize: number = 20
): Promise<BibleChapterPaginatedResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  })
  
  const response = await apiFetch(`${API_V1}/bible/chapter/${bookNumber}/${chapter}/paginated?${params}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch bible chapter paginated')
  }
  
  return response.json()
}
