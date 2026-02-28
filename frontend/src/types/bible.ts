// 성경 책 정보
export interface BibleBook {
  id: number
  book_name_ko: string
  book_name_en: string
  testament: 'OLD' | 'NEW'
  book_number: number
  chapter_count: number
}

// 성경 구절
export interface BibleVerse {
  id: number
  book_id: number
  book_name_ko: string
  chapter: number
  verse: number
  text: string
}

// 장 전체 조회 응답
export interface BibleChapterResponse {
  book_name_ko: string
  book_name_en: string
  chapter: number
  verses: BibleVerse[]
}

// 검색 결과
export interface BibleSearchResult {
  total: number
  results: BibleVerse[]
}

// 페이지네이션 장 조회 응답
export interface BibleChapterPaginatedResponse {
  book_number: number
  book_name_ko: string
  book_name_en: string
  chapter: number
  verses: BibleVerse[]
  total_verses: number
  current_page: number
  page_size: number
  has_more: boolean
}
