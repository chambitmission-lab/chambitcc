// 말씀 필사(성경 따라 쓰기) API — 기록 저장(정확도 95%+면 서버가 읽음 처리까지) / 통계 / 장별 진행 / 교회 주간 현황
import { request } from './utils/request'

export type TypingMode = 'copy' | 'memorize' | 'sprint'

export interface TypingRecordInput {
  verse_id: number
  mode: TypingMode
  accuracy: number
  char_count: number
  keystrokes: number
  duration_ms: number
  /** 병합 구간(신 6:18-19 등)을 한 덩이로 썼을 때 함께 처리할 딸린 절 id */
  merged_verse_ids?: number[]
}

export interface TypingRecordResult {
  verse_id: number
  cpm: number
  accuracy: number
  /** false 면 사람이 낼 수 없는 속도로 판정돼 기록이 인정되지 않았다 */
  counted: boolean
  /** 정확도 95%+ 이고 인정된 기록 — 필사 완료 */
  passed: boolean
  /** 이번에 새로 읽음 처리된 절 id (이미 읽은 절은 빠진다) */
  marked_read_ids: number[]
  personal_best: boolean
  best_cpm: number
  today_verses: number
}

export interface TypingStats {
  total_verses: number
  total_records: number
  total_keystrokes: number
  avg_accuracy: number | null
  best_cpm: number
  memorize_verses: number
  today_verses: number
  typing_days: number
  current_streak: number
  completed_chapters: number
  /** 책 번호(문자열 키) → 필사한 절 수 */
  books: Record<string, number>
  last_position: { book_number: number; chapter: number; verse: number } | null
  /** 이어 쓸 자리 — 장 끝이면 다음 장 1절, 책 끝이면 다음 책. 전권을 다 썼으면 null */
  next_position: { book_number: number; chapter: number; verse: number } | null
}

export interface TypingWeeklyItem {
  rank: number
  user_id: number
  name: string
  avatar_url: string | null
  verses: number
  best_cpm: number
  is_me: boolean
}

export interface TypingWeekly {
  week_start: string
  church_verses: number
  participants: number
  items: TypingWeeklyItem[]
  my_verses: number
  my_rank: number | null
}

interface Envelope<T> {
  success: boolean
  data: T
}

export const submitTypingRecord = async (input: TypingRecordInput): Promise<TypingRecordResult> => {
  const res = await request<Envelope<TypingRecordResult>>('/bible-typing/records', {
    method: 'POST',
    auth: 'required',
    json: input,
    errorMessage: '필사 기록을 저장하지 못했어요',
  })
  return res.data
}

export const getTypingStats = async (): Promise<TypingStats> => {
  const res = await request<Envelope<TypingStats>>('/bible-typing/stats', {
    auth: 'required',
    errorMessage: '필사 기록을 불러오지 못했어요',
  })
  return res.data
}

export const getChapterTyping = async (bookNumber: number, chapter: number): Promise<number[]> => {
  const res = await request<Envelope<{ verse_ids: number[] }>>(`/bible-typing/chapters/${bookNumber}/${chapter}`, {
    auth: 'required',
    errorMessage: '필사 진행을 불러오지 못했어요',
  })
  return res.data.verse_ids
}

/** 이 책의 장별 필사를 마친 절 수 — 키는 장 번호(문자열) */
export const getBookTyping = async (bookNumber: number): Promise<Record<string, number>> => {
  const res = await request<Envelope<{ chapters: Record<string, number> }>>(`/bible-typing/books/${bookNumber}`, {
    auth: 'required',
    errorMessage: '필사 진행을 불러오지 못했어요',
  })
  return res.data.chapters
}

export const getTypingWeekly = async (): Promise<TypingWeekly> => {
  const res = await request<Envelope<TypingWeekly>>('/bible-typing/weekly', {
    auth: 'required',
    errorMessage: '이번 주 필사 현황을 불러오지 못했어요',
  })
  return res.data
}
