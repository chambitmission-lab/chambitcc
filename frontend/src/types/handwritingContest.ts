// 손글씨 성경 필사대회 — 백엔드 app/schemas/handwriting_contest.py 와 같은 모양

/** upcoming 시작 전 · open 출품/투표 중 · closed 마감·집계 중 · announced 발표됨 */
export type ContestPhase = 'upcoming' | 'open' | 'closed' | 'announced'
export type EntrySort = 'shuffle' | 'recent' | 'popular'

export interface EntryAuthor {
  id: number
  name: string
  avatar_url: string | null
}

export interface ContestEntry {
  id: number
  contest_id: number
  author: EntryAuthor
  verse_ref: string
  verse_text: string
  comment: string | null
  image_url: string | null
  width: number | null
  height: number | null
  has_ink: boolean
  card_consent: boolean
  /** 순위 비공개 대회는 발표 전까지 null */
  vote_count: number | null
  voted_by_me: boolean
  is_mine: boolean
  rank: number | null
  can_make_card: boolean
  is_hidden: boolean
  created_at: string
}

export interface EntryPage {
  items: ContestEntry[]
  total: number
  has_more: boolean
}

export interface ContestSummary {
  id: number
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  phase: ContestPhase
  votes_per_user: number
  show_ranking: boolean
  results_published_at: string | null
  is_active: boolean
  entry_count: number
  voter_count: number
}

export interface ContestDetail extends ContestSummary {
  my_entry: ContestEntry | null
  my_vote_entry_ids: number[]
  votes_left: number
  winners: ContestEntry[]
}

export interface ContestWrite {
  title: string
  description: string | null
  /** KST 벽시계 'YYYY-MM-DDTHH:mm' */
  starts_at: string
  ends_at: string
  votes_per_user: number
  show_ranking: boolean
  is_active: boolean
}

export interface EntrySubmit {
  verse_ref: string
  verse_text: string
  comment: string
  card_consent: boolean
  png: Blob
  ink: Blob
  width: number
  height: number
}
