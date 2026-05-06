export interface BibleCommentaryAuthor {
  id: number
  username: string
  full_name?: string | null
}

export interface BibleCommentary {
  id: number
  book_number: number
  chapter: number
  verse_start: number
  verse_end: number
  title?: string | null
  content: string
  category?: string | null
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
}

export interface BibleCommentaryUpdateRequest {
  verse_start?: number
  verse_end?: number
  title?: string
  content?: string
  category?: string
}

export const COMMENTARY_CATEGORIES = [
  '신학적',
  '역사적',
  '원어',
  '적용',
  '묵상',
] as const

export type BibleCommentaryCategory = (typeof COMMENTARY_CATEGORIES)[number]
