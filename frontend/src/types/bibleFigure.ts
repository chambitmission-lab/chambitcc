// 성경 인물 가계도 타입 정의

export interface KeyVerseRef {
  book_number: number
  chapter: number
  verse: number | null
  label: string | null
  book_name_ko?: string | null
  text?: string | null
  is_read?: boolean | null
}

export interface BibleFigureSummary {
  id: number
  slug: string
  name_ko: string
  name_en: string | null
  testament: 'OLD' | 'NEW' | 'BOTH'
  era: string | null
  role: string | null
  gender: 'male' | 'female' | null
  is_messianic_line: boolean
  sort_order: number
  description_short: string | null
}

export interface BibleFigureDetail extends BibleFigureSummary {
  name_hebrew: string | null
  description_long: string | null
  birth_year_estimate: number | null
  death_year_estimate: number | null
  key_verses: KeyVerseRef[]
  parents: BibleFigureSummary[]
  children: BibleFigureSummary[]
  spouses: BibleFigureSummary[]
  reading_progress: number | null
}

export type RelationshipType = 'father' | 'mother' | 'spouse' | 'sibling'

export interface GenealogyLink {
  source: string
  target: string
  type: RelationshipType
  note: string | null
}

export interface GenealogyResponse {
  nodes: BibleFigureSummary[]
  links: GenealogyLink[]
  reading_progress: Record<string, number>
}
