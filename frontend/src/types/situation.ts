export interface SituationCategory {
  id: number
  name: string
  icon: string
  color: string
  order: number
  is_active: boolean
  /** 기도 감정 태그 매핑 (여러 감정을 한 카테고리로 묶기) */
  emotion_keys: string[]
  /** 기도 제목/내용 매칭 키워드 */
  keywords: string[]
  /** 매칭 실패 시 쓰이는 기본 카테고리 여부 */
  is_default: boolean
  verse_count: number
  created_at: string
}

export interface SituationVerse {
  id: number
  category_id: number
  verse_id: number
  order: number
  /** 기도 폴백 추천에 함께 보여줄 위로 메시지 (선택) */
  message?: string | null
  book_number: number
  book_name_ko: string
  chapter: number
  verse: number
  text: string
}

export interface SituationWithVerses {
  id: number
  name: string
  icon: string
  color: string
  verses: SituationVerse[]
}

export interface SituationCategoryCreate {
  name: string
  icon: string
  color: string
  order: number
  is_active: boolean
  emotion_keys?: string[]
  keywords?: string[]
  is_default?: boolean
}

export interface SituationCategoryUpdate {
  name?: string
  icon?: string
  color?: string
  order?: number
  is_active?: boolean
  emotion_keys?: string[]
  keywords?: string[]
  is_default?: boolean
}

export interface SituationVerseAdd {
  verse_id?: number
  book_number?: number
  chapter?: number
  verse?: number
  order?: number
  message?: string
}
