// 말씀 필사 — 내 기록 저장(정확도 95%+면 서버가 읽음 처리까지) / 통계 / 장별 진행 / 교회 성경 / 허브 묶음
import { requestData } from '../utils/request'
import type { TypingRelaySummary } from './relay'

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
  book_number?: number
  chapter?: number
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
  /** 연속 기록을 이어 준 쉼표(한 주에 하루 쉰 날, YYYY-MM-DD) */
  rest_days: string[]
  rest_used_this_week: boolean
  /** 고른 하루 목표(절). 아직 안 골랐으면 null */
  daily_goal: number | null
}

/** 하루 목표로 고를 수 있는 절 수 */
export const DAILY_GOALS = [1, 3, 5, 10] as const

export interface TypingCalendar {
  start: string
  today: string
  /** YYYY-MM-DD → 그날 필사한 절 수 (쓴 날만) */
  days: Record<string, number>
}

export interface TypingDaily {
  date: string
  verse: {
    id: number
    book_number: number
    book_name: string
    chapter: number
    verse: number
    label: string
    text: string
    merged_ids: number[]
  } | null
  done_count: number
  recent: { user_id: number; name: string; avatar_url: string | null }[]
  me: { rank: number; duration_ms: number; accuracy: number; cpm: number } | null
}

export interface ChurchBible {
  total_verses: number
  typed_verses: number
  week_added: number
  week_people: number
  contributors: number
  my_verses: number
  /** 교회 성경에서 내가 처음 채운 칸 수 */
  my_first: number
  books: Record<string, number>
  book_totals: Record<string, number>
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

/** 필사 허브 묶음 — 허브가 따로 보내던 5~6개 요청을 한 번에. 각 조각은 단건 응답과 같은 모양 */
export interface TypingHomeBundle {
  stats: TypingStats
  calendar: TypingCalendar
  daily: TypingDaily
  church_bible: ChurchBible
  relays: TypingRelaySummary[]
  /** stats.next_position 자리의 본문(이어 쓸 말씀 미리보기). 전권을 다 썼으면 null */
  next_verse_text: string | null
}

export const submitTypingRecord = (input: TypingRecordInput): Promise<TypingRecordResult> =>
  requestData('/bible-typing/records', {
    method: 'POST',
    auth: 'required',
    json: input,
    errorMessage: '필사 기록을 저장하지 못했어요',
  })

export const getTypingStats = (): Promise<TypingStats> =>
  requestData('/bible-typing/stats', { auth: 'required', errorMessage: '필사 기록을 불러오지 못했어요' })

export const getChapterTyping = async (bookNumber: number, chapter: number): Promise<number[]> => {
  const data = await requestData<{ verse_ids: number[] }>(`/bible-typing/chapters/${bookNumber}/${chapter}`, {
    auth: 'required',
    errorMessage: '필사 진행을 불러오지 못했어요',
  })
  return data.verse_ids
}

/** 이 책의 장별 필사를 마친 절 수 — 키는 장 번호(문자열) */
export const getBookTyping = async (bookNumber: number): Promise<Record<string, number>> => {
  const data = await requestData<{ chapters: Record<string, number> }>(`/bible-typing/books/${bookNumber}`, {
    auth: 'required',
    errorMessage: '필사 진행을 불러오지 못했어요',
  })
  return data.chapters
}

export const getTypingWeekly = (): Promise<TypingWeekly> =>
  requestData('/bible-typing/weekly', { auth: 'required', errorMessage: '이번 주 필사 현황을 불러오지 못했어요' })

export const updateTypingGoal = async (dailyGoal: number): Promise<number> => {
  const data = await requestData<{ daily_goal: number }>('/bible-typing/prefs', {
    method: 'PUT',
    auth: 'required',
    json: { daily_goal: dailyGoal },
    errorMessage: '하루 목표를 저장하지 못했어요',
  })
  return data.daily_goal
}

export const getTypingCalendar = (days = 182): Promise<TypingCalendar> =>
  requestData(`/bible-typing/calendar?days=${days}`, { auth: 'required', errorMessage: '필사 달력을 불러오지 못했어요' })

export const getTypingDaily = (): Promise<TypingDaily> =>
  requestData('/bible-typing/daily', { auth: 'required', errorMessage: '오늘의 한 절을 불러오지 못했어요' })

export const getChurchBible = (): Promise<ChurchBible> =>
  requestData('/bible-typing/church-bible', {
    auth: 'required',
    errorMessage: '우리 교회가 함께 쓰는 성경을 불러오지 못했어요',
  })

export const getTypingHome = (): Promise<TypingHomeBundle> =>
  requestData('/bible-typing/home', { auth: 'required', errorMessage: '필사 기록을 불러오지 못했어요' })
