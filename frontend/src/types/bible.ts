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
  book_number?: number
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

// 검색 결과 책 정보
export interface BibleSearchBook {
  book_number: number
  book_name_ko: string
  book_name_en: string
  testament: string
  chapter_count: number
}

// 검색 결과
export interface BibleSearchResult {
  total: number
  results: BibleVerse[]
  is_chapter_search?: boolean
  book_number?: number | null
  book_name_ko?: string | null
  chapter?: number | null
  is_book_search?: boolean
  book?: BibleSearchBook | null
  books?: BibleSearchBook[] | null
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

// 성경 구절 수정 요청 (관리자용)
export interface UpdateBibleVerseRequest {
  text: string
}

// 성경 구절 수정 응답
export interface UpdateBibleVerseResponse {
  success: boolean
  data: BibleVerse
}

// 성경 본문 오디오북(TTS) 음성 종류
export type BibleTTSVoice = 'female' | 'male'

// 성경 본문 오디오북(TTS) 응답
export interface BibleTTSResponse {
  audio_url: string // 재생 가능한 mp3 public URL
  voice: BibleTTSVoice // 사용된 음성
  cached: boolean // true면 기존 캐시 재사용
}
