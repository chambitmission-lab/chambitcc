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

export interface TypingRelaySummary {
  id: number
  title: string
  book_number: number
  book_name: string
  chapter: number
  done: number
  total: number
  members: number
  my_verses: number
  completed: boolean
}

export interface TypingRelayPreview extends TypingRelaySummary {
  owner_name: string | null
  is_member: boolean
}

export interface TypingRelayDetail {
  id: number
  title: string
  book_number: number
  book_name: string
  chapter: number
  invite_code: string
  is_owner: boolean
  completed: boolean
  done: number
  total: number
  members: {
    user_id: number
    name: string
    avatar_url: string | null
    verses: number
    is_me: boolean
    is_owner: boolean
  }[]
  verses: {
    id: number
    verse: number
    label: string
    by: { user_id: number; name: string } | null
    /** 이 칸을 쓰고 남긴 한마디(가장 최근 것) */
    note: { user_id: number; name: string; message: string } | null
  }[]
  /** 아직 아무도 안 쓴 첫 절 — 다 채웠으면 null */
  next_verse: number | null
  /** 지금 이 방에서 쓰고 있는 다른 멤버와 그 절 */
  live: TypingRelayLive[]
  /** 지금 누구 차례인지 — 마지막 바통을 받은 사람이 아직 이어받지 않았으면 그 사람과 가리키는 빈칸 */
  turn: {
    user_id: number
    name: string
    from_user_id: number
    from_name: string
    message: string | null
    verse: number
    label: string
  } | null
  /** 내게 넘어온 바통(turn 이 나일 때) — 이어받으면(이 장을 한 절 쓰면) 사라진다 */
  baton: { from_user_id: number; name: string; message: string | null; verse: number | null; label: string | null } | null
  /** '알아두면 좋은 말' 풀이를 열어 본 멤버 — 표제어 → user_id(서버 메모리, 옛 백엔드면 없음) */
  gloss_views?: Record<string, number[]>
}

export interface TypingRelayLive {
  user_id: number
  verse: number
}

export type TypingCheerKind = 'pray' | 'cheer' | 'amen'

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

export const updateTypingGoal = async (dailyGoal: number): Promise<number> => {
  const res = await request<Envelope<{ daily_goal: number }>>('/bible-typing/prefs', {
    method: 'PUT',
    auth: 'required',
    json: { daily_goal: dailyGoal },
    errorMessage: '하루 목표를 저장하지 못했어요',
  })
  return res.data.daily_goal
}

export const getTypingCalendar = async (days = 182): Promise<TypingCalendar> => {
  const res = await request<Envelope<TypingCalendar>>(`/bible-typing/calendar?days=${days}`, {
    auth: 'required',
    errorMessage: '필사 달력을 불러오지 못했어요',
  })
  return res.data
}

export const getTypingDaily = async (): Promise<TypingDaily> => {
  const res = await request<Envelope<TypingDaily>>('/bible-typing/daily', {
    auth: 'required',
    errorMessage: '오늘의 한 절을 불러오지 못했어요',
  })
  return res.data
}

export const getChurchBible = async (): Promise<ChurchBible> => {
  const res = await request<Envelope<ChurchBible>>('/bible-typing/church-bible', {
    auth: 'required',
    errorMessage: '우리 교회 필사 성경을 불러오지 못했어요',
  })
  return res.data
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

export const getTypingHome = async (): Promise<TypingHomeBundle> => {
  const res = await request<Envelope<TypingHomeBundle>>('/bible-typing/home', {
    auth: 'required',
    errorMessage: '필사 기록을 불러오지 못했어요',
  })
  return res.data
}

export const getTypingRelays = async (): Promise<TypingRelaySummary[]> => {
  const res = await request<Envelope<TypingRelaySummary[]>>('/bible-typing/relays', {
    auth: 'required',
    errorMessage: '릴레이 필사를 불러오지 못했어요',
  })
  return res.data
}

export const createTypingRelay = async (input: {
  book_number: number
  chapter: number
  title?: string
}): Promise<{ id: number; invite_code: string }> => {
  const res = await request<Envelope<{ id: number; invite_code: string }>>('/bible-typing/relays', {
    method: 'POST',
    auth: 'required',
    json: input,
    errorMessage: '릴레이를 만들지 못했어요',
  })
  return res.data
}

export const getTypingRelay = async (id: number): Promise<TypingRelayDetail> => {
  const res = await request<Envelope<TypingRelayDetail>>(`/bible-typing/relays/${id}`, {
    auth: 'required',
    errorMessage: '릴레이를 불러오지 못했어요',
  })
  return res.data
}

export const previewTypingRelay = async (code: string): Promise<TypingRelayPreview> => {
  const res = await request<Envelope<TypingRelayPreview>>(`/bible-typing/relays/invite/${encodeURIComponent(code)}`, {
    auth: 'required',
    errorMessage: '초대 링크를 확인하지 못했어요',
  })
  return res.data
}

export const joinTypingRelay = async (code: string): Promise<number> => {
  const res = await request<Envelope<{ id: number }>>(`/bible-typing/relays/join/${encodeURIComponent(code)}`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '릴레이에 참여하지 못했어요',
  })
  return res.data.id
}

/** 앱 사용자를 초대 링크 없이 바로 넣기 — 들어온 사람에겐 알림이 간다. 이미 함께하는 사람은 건너뛴다 */
export const addTypingRelayMembers = async (id: number, userIds: number[]): Promise<number> => {
  const res = await request<Envelope<{ added_count: number }>>(`/bible-typing/relays/${id}/members`, {
    method: 'POST',
    auth: 'required',
    json: { user_ids: userIds },
    errorMessage: '초대하지 못했어요',
  })
  return res.data.added_count
}

export const leaveTypingRelay = async (id: number): Promise<void> => {
  await request<Envelope<null>>(`/bible-typing/relays/${id}/members/me`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '릴레이에서 나가지 못했어요',
  })
}

/** 지금 쓰는 절 하트비트(null = 화면을 떠남) — 나를 뺀 지금 접속한 멤버를 돌려준다 */
export const sendTypingRelayPresence = async (id: number, verse: number | null): Promise<TypingRelayLive[]> => {
  const res = await request<Envelope<{ live: TypingRelayLive[] }>>(`/bible-typing/relays/${id}/presence`, {
    method: 'POST',
    auth: 'required',
    json: { verse },
    errorMessage: '접속 표시를 보내지 못했어요',
  })
  return res.data.live
}

export const sendTypingRelayCheer = async (input: { id: number; to_user_id: number; kind: TypingCheerKind }): Promise<void> => {
  await request<Envelope<null>>(`/bible-typing/relays/${input.id}/cheer`, {
    method: 'POST',
    auth: 'required',
    json: { to_user_id: input.to_user_id, kind: input.kind },
    errorMessage: '응원을 보내지 못했어요',
  })
}

export const passTypingRelayBaton = async (input: {
  id: number
  verse_id: number
  to_user_id: number | null
  message: string | null
}): Promise<void> => {
  await request<Envelope<null>>(`/bible-typing/relays/${input.id}/baton`, {
    method: 'POST',
    auth: 'required',
    json: { verse_id: input.verse_id, to_user_id: input.to_user_id, message: input.message },
    errorMessage: '바통을 넘기지 못했어요',
  })
}

/** 릴레이 방 — 알아두면 좋은 말 풀이를 열어 봤다(처음이면 같은 방 사람들에게 알림) */
export const sendTypingRelayGlossView = async (input: { id: number; term: string }): Promise<void> => {
  await request<Envelope<null>>(`/bible-typing/relays/${input.id}/gloss`, {
    method: 'POST',
    auth: 'required',
    json: { term: input.term },
    errorMessage: '풀이 열람을 알리지 못했어요',
  })
}

// ── 혼자 쓸 때도 함께 — 지금 이 장을 쓰는 사람 ────────────────

/** 같은 장을 지금 쓰는 사람. 익명이면 user_id·name·avatar_url 이 null — key 로만 가리킨다 */
export interface TypingChapterPerson {
  key: string
  user_id: number | null
  name: string | null
  avatar_url: string | null
  verse: number
}

export interface TypingTogetherSnapshot {
  /** 내 key — 명단에서 나를 빼는 데 쓴다 */
  me_key: string
  people: TypingChapterPerson[]
  /** 오늘 이 장을 (통과로) 쓴 성도 수 */
  today_writers: number
}

export const sendTypingTogetherPresence = async (input: {
  book_number: number
  chapter: number
  verse: number
  anon: boolean
}): Promise<TypingTogetherSnapshot> => {
  const res = await request<Envelope<TypingTogetherSnapshot>>('/bible-typing/together/presence', {
    method: 'POST',
    auth: 'required',
    json: input,
    errorMessage: '접속 표시를 보내지 못했어요',
  })
  return res.data
}

export const leaveTypingTogether = async (): Promise<void> => {
  await request<Envelope<null>>('/bible-typing/together/presence', {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '접속 표시를 지우지 못했어요',
  })
}

export const sendTypingTogetherCheer = async (input: {
  book_number: number
  chapter: number
  to_key: string
  kind: TypingCheerKind
}): Promise<void> => {
  await request<Envelope<null>>('/bible-typing/together/cheer', {
    method: 'POST',
    auth: 'required',
    json: input,
    errorMessage: '응원을 보내지 못했어요',
  })
}

// ── 알아두면 좋은 말 — 성도들이 남긴 한 줄 ────────────────────

export interface GlossaryLine {
  id: number
  name: string
  avatar_url: string | null
  message: string
  mine: boolean
  created_at: string
}

export interface GlossaryLineBucket {
  count: number
  lines: GlossaryLine[]
}

export const getGlossaryLines = async (terms: string[]): Promise<Record<string, GlossaryLineBucket>> => {
  const res = await request<Envelope<Record<string, GlossaryLineBucket>>>(
    `/bible-typing/glossary-lines?terms=${encodeURIComponent(terms.join(','))}`,
    { auth: 'required', errorMessage: '한 줄을 불러오지 못했어요' },
  )
  return res.data
}

export const saveGlossaryLine = async (input: {
  term: string
  message: string
  book_number?: number
  chapter?: number
  verse_id?: number
}): Promise<{ id: number; term: string; message: string }> => {
  const res = await request<Envelope<{ id: number; term: string; message: string }>>('/bible-typing/glossary-lines', {
    method: 'PUT',
    auth: 'required',
    json: input,
    errorMessage: '한 줄을 남기지 못했어요',
  })
  return res.data
}

export const deleteGlossaryLine = async (id: number): Promise<void> => {
  await request<Envelope<null>>(`/bible-typing/glossary-lines/${id}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '한 줄을 지우지 못했어요',
  })
}
