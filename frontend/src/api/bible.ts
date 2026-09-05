import type { BibleBook, BibleChapterResponse, BibleChapterPaginatedResponse, BibleVerse, BibleSearchResult, UpdateBibleVerseRequest, UpdateBibleVerseResponse } from '../types/bible'
// Mock 데이터 import (개발/테스트용)
import { getMockBibleBooks, getMockBibleChapter, getMockBibleSearch } from './bible.mock'
import { request } from './utils/request'

// Mock 모드 활성화 여부 (백엔드 API가 준비되면 false로 변경)
const USE_MOCK_DATA = false

// 성경 책 목록 조회
export const getBibleBooks = async (): Promise<BibleBook[]> => {
  if (USE_MOCK_DATA) {
    return getMockBibleBooks()
  }
  
  return request<BibleBook[]>('/bible/books', { errorMessage: 'Failed to fetch bible books' })
}

// 특정 장 읽기 - 책 ID 사용
export const getBibleChapter = async (bookId: number, chapter: number): Promise<BibleChapterResponse> => {
  if (USE_MOCK_DATA) {
    return getMockBibleChapter(bookId, chapter)
  }
  
  return request<BibleChapterResponse>(`/bible/chapter/${bookId}/${chapter}`, { errorMessage: 'Failed to fetch bible chapter' })
}

// 특정 구절 조회
/* book은 책 번호(1~66) — 백엔드 라우트가 book_number: int라 책 이름 문자열을
 * 넣으면 무조건 422가 난다. 이름밖에 없으면 sermonMeta의 resolveBookNumber로 변환. */
export const getBibleVerse = async (book: number | string, chapter: number, verse: number): Promise<BibleVerse> => {
  return request<BibleVerse>(`/bible/verse/${encodeURIComponent(book)}/${chapter}/${verse}`, { errorMessage: 'Failed to fetch bible verse' })
}

// 성경 검색 — 키워드 검색은 offset 기반 페이징(무한 스크롤), 책·장 검색은 항상 전체 반환
export const searchBible = async (
  keyword: string,
  options: { limit?: number; offset?: number; testament?: 'OLD' | 'NEW'; bookNumber?: number } = {}
): Promise<BibleSearchResult> => {
  if (USE_MOCK_DATA) {
    return getMockBibleSearch(keyword)
  }

  const { limit = 30, offset = 0, testament, bookNumber } = options
  const params = new URLSearchParams({
    keyword,
    limit: limit.toString(),
    offset: offset.toString()
  })
  if (testament) params.set('testament', testament)
  if (bookNumber) params.set('book_number', bookNumber.toString())

  return request<BibleSearchResult>(`/bible/search?${params}`, { errorMessage: 'Failed to search bible' })
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
  
  return request<BibleChapterPaginatedResponse>(`/bible/chapter/${bookNumber}/${chapter}/paginated?${params}`, { errorMessage: 'Failed to fetch bible chapter paginated' })
}

/**
 * 성경 구절 수정 (관리자 전용)
 */
export const updateBibleVerse = async (verseId: number, data: UpdateBibleVerseRequest): Promise<BibleVerse> => {
  const result: UpdateBibleVerseResponse = await request<UpdateBibleVerseResponse>(`/bible/verses/${verseId}`, {
    method: 'PUT',
    json: data,
    errorMessage: '성경 구절 수정에 실패했습니다',
  })
  return result.data
}

// 오디오북(TTS) 스트리밍 URL·절별 타이밍 조회는 ./bibleTts.ts 에 있다.
