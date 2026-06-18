export interface BibleBookIntroAuthor {
  id: number
  username: string
  full_name?: string | null
}

/** 성경 권(책) 개관 — book_number 당 1행 */
export interface BibleBookIntro {
  id: number
  book_number: number
  one_liner: string
  theme?: string | null
  author_period?: string | null
  key_chapters?: string | null
  overview: string
  christ_connection?: string | null
  author_id?: number | null
  author?: BibleBookIntroAuthor | null
  created_at: string
  updated_at: string
}

/** 등록/수정(upsert) 요청 — book_number는 경로로 보낸다 */
export interface BibleBookIntroUpsertRequest {
  one_liner: string
  theme?: string
  author_period?: string
  key_chapters?: string
  overview: string
  christ_connection?: string
}

export interface BibleBookIntroAIGenerateRequest {
  book_number: number
}

export interface BibleBookIntroAIGenerateResponse {
  one_liner: string
  theme?: string | null
  author_period?: string | null
  key_chapters?: string | null
  overview: string
  christ_connection?: string | null
  book_name: string
}
