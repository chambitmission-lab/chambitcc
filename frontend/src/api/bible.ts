import { API_V1, apiFetch } from '../config/api'
import type { BibleBook, BibleChapterResponse, BibleVerse, BibleSearchResult } from '../types/bible'

// Mock 데이터 import (개발/테스트용)
import { getMockBibleBooks, getMockBibleChapter, getMockBibleSearch } from './bible.mock'

// Mock 모드 활성화 여부 (백엔드 API가 준비되면 false로 변경)
const USE_MOCK_DATA = false

console.log('🔧 Bible API - USE_MOCK_DATA:', USE_MOCK_DATA)

// 성경 책 목록 조회
export const getBibleBooks = async (): Promise<BibleBook[]> => {
  if (USE_MOCK_DATA) {
    console.log('📖 Using mock data for bible books')
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
    console.log(`📖 Using mock data for book ${bookId} chapter ${chapter}`)
    return getMockBibleChapter(bookId, chapter)
  }
  
  const url = `${API_V1}/bible/chapter/${bookId}/${chapter}`
  console.log(`🌐 Fetching from API:`, {
    bookId,
    chapter,
    url,
    bookIdType: typeof bookId,
    chapterType: typeof chapter
  })
  
  const response = await apiFetch(url)
  
  console.log(`📡 Response status:`, response.status)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`❌ API Error:`, {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    })
    throw new Error(`Failed to fetch bible chapter: ${response.status} ${errorText}`)
  }
  
  const data = await response.json()
  console.log(`✅ Received chapter data:`, data)
  return data
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
    console.log(`📖 Using mock data for search: ${keyword}`)
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
