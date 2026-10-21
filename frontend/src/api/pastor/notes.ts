// 설교 메모장 (작성한 목회자만)
import { pastorDelete, pastorGet, pastorSend } from './_http'

export type NoteKind = 'idea' | 'illustration' | 'life' | 'quote' | 'question'

export interface NoteRef {
  label: string
  book_number: number
  chapter: number
  verse: number | null
  /** passage — '더 이을 본문' 칸에 적은 것 / body — 메모 글에서 자동으로 읽은 것 */
  origin: 'passage' | 'body'
  /** 상세·미리보기에서만 — 앞의 몇 절 */
  text?: string | null
}

export interface NoteTopic {
  id: number
  name: string
  icon: string
  color: string
  hits: string[]
  /** 상세·미리보기에서만 — 상황별 성경의 대표 구절 */
  verses?: Array<{ label: string; book_number: number; chapter: number; verse: number; text: string }>
}

export interface SermonNote {
  id: number
  kind: NoteKind
  body: string
  passage: string | null
  source: string | null
  tags: string[]
  pinned: boolean
  from_visit: boolean
  used_on: string | null
  used_sermon: { id: number; title: string; date: string } | null
  created_at: string | null
  updated_at: string | null
  refs: NoteRef[]
  topics: NoteTopic[]
  /** 관련 메모 목록에서만 — 왜 이 메모가 나왔는지 */
  reasons?: string[]
}

export interface NoteListData {
  total: number
  unused: number
  count: number
  items: SermonNote[]
  tags: Array<{ tag: string; count: number }>
  topics: Array<{ id: number; name: string; icon: string; color: string; count: number }>
  books: Array<{ book_number: number; name: string; count: number }>
  resurface: SermonNote[]
}

export interface NoteFilters {
  q?: string
  kind?: NoteKind | null
  tag?: string | null
  topic?: number | null
  book?: number | null
  unused?: boolean
}

export interface NoteInput {
  kind: NoteKind
  body: string
  passage?: string | null
  source?: string | null
  tags?: string[]
  pinned?: boolean
  from_visit_id?: number | null
}

export interface NoteAnalysis {
  refs: NoteRef[]
  topics: NoteTopic[]
  names: Array<{ name: string; match: string }>
}

export interface RelatedNotes {
  query: string
  topics?: string[]
  items: SermonNote[]
}

export interface SermonOption {
  id: number
  title: string
  date: string
  bible_verse: string | null
}

const noteQuery = (f: NoteFilters): string => {
  const p = new URLSearchParams()
  if (f.q?.trim()) p.set('q', f.q.trim())
  if (f.kind) p.set('kind', f.kind)
  if (f.tag) p.set('tag', f.tag)
  if (f.topic) p.set('topic', String(f.topic))
  if (f.book) p.set('book', String(f.book))
  if (f.unused) p.set('unused', 'true')
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const fetchNotes = (filters: NoteFilters = {}): Promise<NoteListData> =>
  pastorGet(`/pastor/notes${noteQuery(filters)}`, '설교 메모를 불러오는데 실패했습니다')

export const analyzeNote = (body: string, passage: string | null): Promise<NoteAnalysis> =>
  pastorSend('/pastor/notes/analyze', 'POST', { body, passage }, '말씀 연결을 확인하지 못했습니다')

export const fetchRelatedNotes = (ref: string): Promise<RelatedNotes> =>
  pastorGet(`/pastor/notes/related?ref=${encodeURIComponent(ref)}`, '관련 메모를 불러오는데 실패했습니다')

export const fetchSermonOptions = (): Promise<SermonOption[]> =>
  pastorGet('/pastor/notes/sermon-options', '설교 목록을 불러오는데 실패했습니다')

export const createNote = (data: NoteInput): Promise<SermonNote> =>
  pastorSend('/pastor/notes', 'POST', data, '메모 저장에 실패했습니다')

export const updateNote = (
  id: number,
  data: Partial<Omit<NoteInput, 'from_visit_id'>> & { used_sermon_id?: number | null; used_on?: string | null },
): Promise<SermonNote> => pastorSend(`/pastor/notes/${id}`, 'PATCH', data, '메모 수정에 실패했습니다')

export const deleteNote = (id: number): Promise<void> =>
  pastorDelete(`/pastor/notes/${id}`, '메모 삭제에 실패했습니다')
