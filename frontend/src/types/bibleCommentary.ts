export interface BibleCommentaryAuthor {
  id: number
  username: string
  full_name?: string | null
}

/** 해석 성격: 'verse' 절별 해석 / 'summary' 요약 해석 */
export type BibleCommentaryScope = 'verse' | 'summary'

export interface BibleCommentary {
  id: number
  book_number: number
  chapter: number
  verse_start: number
  verse_end: number
  title?: string | null
  content: string
  category?: string | null
  scope: BibleCommentaryScope
  author_id?: number | null
  author?: BibleCommentaryAuthor | null
  created_at: string
  updated_at: string
}

export interface BibleCommentaryListResponse {
  total: number
  items: BibleCommentary[]
}

export interface BibleCommentaryCreateRequest {
  book_number: number
  chapter: number
  verse_start: number
  verse_end: number
  title?: string
  content: string
  category?: string
  scope?: BibleCommentaryScope
}

export interface BibleCommentaryUpdateRequest {
  verse_start?: number
  verse_end?: number
  title?: string
  content?: string
  category?: string
  scope?: BibleCommentaryScope
}

export interface BibleCommentaryAIGenerateRequest {
  book_number: number
  chapter: number
  verse_start: number
  verse_end: number
  category?: string
}

export interface BibleCommentaryAIGenerateResponse {
  title?: string | null
  content: string
  category?: string | null
  reference: string
}

/** 미해석 절 1건 자동 생성·저장 결과 (POST /ai-batch-generate-one) */
export interface BibleCommentaryBatchOneResponse {
  /** 더 채울 절이 없으면 true → 반복 중단 */
  done: boolean
  /** 이번에 저장된 해석 (done=true 이면 null) */
  saved: BibleCommentary | null
  /** 남은 미해석 절 수 */
  remaining: number
}

export const COMMENTARY_CATEGORIES = [
  '신학적',
  '역사적',
  '원어',
  '적용',
  '묵상',
] as const

export type BibleCommentaryCategory = (typeof COMMENTARY_CATEGORIES)[number]
