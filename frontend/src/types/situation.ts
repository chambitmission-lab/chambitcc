export interface SituationCategory {
  id: number
  name: string
  icon: string
  color: string
  order: number
  is_active: boolean
  verse_count: number
  created_at: string
}

export interface SituationVerse {
  id: number
  category_id: number
  verse_id: number
  order: number
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
}

export interface SituationCategoryUpdate {
  name?: string
  icon?: string
  color?: string
  order?: number
  is_active?: boolean
}

export interface SituationVerseAdd {
  verse_id?: number
  book_number?: number
  chapter?: number
  verse?: number
  order?: number
}
