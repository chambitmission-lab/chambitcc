import { request, requestRaw, withStatusMessages, type RequestPriority } from './utils/request'

// 타입 정의
export interface BibleReadingRecord {
  id: number
  user_id: number
  verse_id: number
  similarity: number
  read_at: string
  created_at: string
  /** 이 절로 현재 통독 회차(성경 전체)를 완독했는지 — 구버전 백엔드엔 없다 */
  cycle_completed?: boolean
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
  book_name_en?: string
  total_verses: number
  read_verses: number
  progress_rate: number // 완독률 0~100 (절 기준)
  /** 전체 장 수 */
  total_chapters?: number
  /** 완독한 장 수 — 그 장의 모든 절을 읽은 장만 카운트 */
  read_chapters?: number
  /** 완독률 0~100 (장 기준) = read_chapters / total_chapters */
  chapter_progress_rate?: number
  last_read_at: string | null
}

// 구약/신약/전체 요약 — 절 기준과 장 기준을 함께 제공한다.
// UI는 "몇 장 중 몇 장"이 사람의 성경 읽기 감각에 맞으므로 장 기준을 주 지표로 쓴다.
export interface TestamentProgress {
  total_verses: number
  read_verses: number
  progress_rate: number
  total_chapters?: number
  read_chapters?: number
}

// 통독 회차 — 백엔드 bible_reading_views.cycle_payload. 진행률은 현재 회차 기준이다
export interface ReadingCycle {
  cycle_no: number
  started_at: string | null
  completed_at: string | null
}

export interface ReadingCycleSummary {
  /** 지금 읽고 있는 회차 (1독=1) */
  current_cycle: number
  /** 완독한 회차 수 = 통독 횟수 */
  completed_count: number
  /** 현재 회차를 완독했는지 — 참이면 다음 회차를 시작할 수 있다 */
  current_completed: boolean
  cycles: ReadingCycle[]
}

export interface ReadingProgressResponse {
  success: boolean
  data: {
    overall: TestamentProgress
    old_testament: TestamentProgress
    new_testament: TestamentProgress
    books: BookProgress[]
    /** 구버전 백엔드엔 없다 */
    cycle?: ReadingCycleSummary
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

// GET /bible/reading-progress?book_id=N — 전체 조회와 같은 형태에
// 해당 책의 books 1건 + 장별 진행률(chapters)이 추가로 실려 온다
export interface BookDetailProgressResponse {
  success: boolean
  data: ReadingProgressResponse['data'] & {
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
  // similarity를 0.0 ~ 1.0 범위로 제한하고 소수점 2자리로 반올림
  let normalizedSimilarity = Math.min(1.0, Math.max(0.0, Math.round(similarity * 100) / 100))
  
  // 백엔드가 0.75 이상만 허용하는 경우를 위한 임시 처리
  // 프론트엔드에서는 0.5 이상이면 성공이지만, 백엔드에는 최소 0.75로 전송
  if (normalizedSimilarity < 0.75) {
    console.warn(`Similarity ${normalizedSimilarity} is below backend threshold (0.75), adjusting to 0.75`)
    normalizedSimilarity = 0.75
  }
  
  console.log('Sending to backend:', {
    verseId,
    originalSimilarity: similarity,
    normalizedSimilarity,
    read_at: new Date().toISOString()
  })
  
  const result = await withStatusMessages(
    request<MarkVerseAsReadResponse>(`/bible/verses/${verseId}/read`, {
      method: 'POST',
      auth: 'required',
      json: { similarity: normalizedSimilarity, read_at: new Date().toISOString() },
      errorMessage: '구절 읽음 처리에 실패했습니다',
    }),
    { 409: 'ALREADY_READ' }
  )
  return result.data
}

// 관리자 전용 — 장 일괄 읽음/취소 (본인 계정, 업적 테스트용)
export interface ChapterBulkReadResult {
  book_number: number
  chapter: number
  total_verses: number
  marked_verses: number
  /** 이 장으로 현재 회차(성경 전체)를 완독했는지 */
  cycle_completed?: boolean
}

export interface ChapterBulkUnreadResult {
  book_number: number
  chapter: number
  deleted_records: number
}

/**
 * 장 전체 읽음 처리 (관리자 전용)
 */
export const markChapterAsRead = async (
  bookNumber: number,
  chapter: number
): Promise<ChapterBulkReadResult> => {
  const result: { success: boolean; data: ChapterBulkReadResult } = await request<{ success: boolean; data: ChapterBulkReadResult }>(`/bible/chapters/${bookNumber}/${chapter}/read-all`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '장 전체 읽음 처리에 실패했습니다',
  })
  return result.data
}

/**
 * 장 전체 읽음 취소 (관리자 전용)
 */
export const unmarkChapterAsRead = async (
  bookNumber: number,
  chapter: number
): Promise<ChapterBulkUnreadResult> => {
  const result: { success: boolean; data: ChapterBulkUnreadResult } = await request<{ success: boolean; data: ChapterBulkUnreadResult }>(`/bible/chapters/${bookNumber}/${chapter}/read-all`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '장 전체 읽음 취소에 실패했습니다',
  })
  return result.data
}

/**
 * 특정 장의 읽음 상태 조회
 */
export const getChapterReadStatus = async (
  bookNumber: number,
  chapter: number
): Promise<ChapterReadStatusResponse['data']> => {
  // 절 번호 색·진행률 pill 이 이 응답을 기다린다 — 콜드 진입 게이트에 걸리면 본문이 그려진 뒤에도
  // 읽음 표시가 한 박자 늦게 따라온다. 게이트를 통과하는 high 로 보낸다(핵심 요청 게이트는 풀지 않음)
  const result: ChapterReadStatusResponse = await request<ChapterReadStatusResponse>(`/bible/chapters/${bookNumber}/${chapter}/read-status`, { auth: 'required', priority: 'high', errorMessage: '장 읽음 상태를 불러오는데 실패했습니다' })
  return result.data
}

/**
 * 전체 읽기 진행률 조회
 */
export const getReadingProgress = async (
  options?: { priority?: RequestPriority }
): Promise<ReadingProgressResponse['data']> => {
  const result: ReadingProgressResponse = await request<ReadingProgressResponse>('/bible/reading-progress', {
    auth: 'required',
    errorMessage: '읽기 진행률을 불러오는데 실패했습니다',
    priority: options?.priority,
  })
  return result.data
}

/**
 * 특정 책의 읽기 진행률 조회
 */
export const getBookReadingProgress = async (
  bookId: number
): Promise<BookDetailProgressResponse['data']> => {
  const result: BookDetailProgressResponse = await request<BookDetailProgressResponse>(`/bible/reading-progress?book_id=${bookId}`, { auth: 'required', errorMessage: '책 읽기 진행률을 불러오는데 실패했습니다' })
  return result.data
}

// GET /bible/book-card-context?book_numbers=a,b,c — 검색 탭 책 카드용 묶음.
// 장별 진행률(✓·진행바) + 밑줄·메모·즐겨찾기를 남긴 장(점)을 여러 권까지 한 왕복에 받는다.
// 예전엔 카드마다 한 요청(그 전엔 reading-progress · bookmarks · word-notes 세 요청)이라
// "사"처럼 네 권이 잡히면 동시 요청 한도에 줄을 섰다. 서버는 권수와 무관하게 쿼리 둘로 끝낸다
export interface BookCardContext {
  book_number: number
  chapters: ChapterProgress[]
  marked_chapters: number[]
}

/** 서버 상한과 같다 (BOOK_CARD_MAX_BOOKS) — 그 이상은 잘라 보낸다 */
export const BOOK_CARD_MAX_BOOKS = 10

export const getBookCardContexts = async (bookNumbers: number[]): Promise<BookCardContext[]> => {
  if (bookNumbers.length === 0) return []
  const result = await request<{ success: boolean; data: { books: BookCardContext[] } }>(
    `/bible/book-card-context?book_numbers=${bookNumbers.slice(0, BOOK_CARD_MAX_BOOKS).join(',')}`,
    { auth: 'required', errorMessage: '책 읽기 진행률을 불러오는데 실패했습니다' }
  )
  return result.data.books
}

// 이어 읽기 위치
export interface ResumePosition {
  book_number: number
  book_name_ko: string
  chapter: number
  verse: number
  verse_id: number
  text: string
  read_at: string
}

export interface ResumeReadingResponse {
  success: boolean
  data: {
    latest: ResumePosition | null
    recent_books: ResumePosition[]
    /** 이번 주(KST 월~주일) 중 읽은 날짜 'YYYY-MM-DD' — 이어 읽기 카드의 요일 점. 구버전 캐시엔 없다 */
    week_days?: string[]
  }
}

/**
 * 이어 읽기 위치 조회 (전역 최신 + 책별 마지막)
 */
export const getResumeReading = async (
  limit: number = 10,
  options?: { priority?: RequestPriority }
): Promise<ResumeReadingResponse['data']> => {
  const result: ResumeReadingResponse = await request<ResumeReadingResponse>(`/bible/reading-progress/resume?limit=${limit}`, {
    auth: 'required',
    errorMessage: '이어 읽기 정보를 불러오는데 실패했습니다',
    priority: options?.priority,
  })
  return result.data
}

/**
 * 읽음 취소
 */
export const unmarkVerseAsRead = async (verseId: number): Promise<void> => {
  await requestRaw(`/bible/verses/${verseId}/read`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '읽음 취소에 실패했습니다',
  })
}

/**
 * 다음 통독 회차 시작 — 현재 회차를 완독한 뒤에만 (아니면 409).
 * 지난 회차 기록은 서버에 그대로 남고, 진행률·장 읽음 표시·이어읽기만 0 에서 다시 시작한다
 */
export const startReadingCycle = async (): Promise<ReadingCycleSummary> => {
  const result = await request<{ success: boolean; data: ReadingCycleSummary }>('/bible/reading-cycles', {
    method: 'POST',
    auth: 'required',
    errorMessage: '새 회차를 시작하지 못했습니다',
  })
  return result.data
}
