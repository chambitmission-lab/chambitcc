// 설교 준비 AI (고신 개혁주의 기준 · 이단 표현은 서버가 거른다 · 목사님 확인 후에만 쓰임)
// 연구 재료 · 원고 점검 · 한 주 묶음 · 적용 다리 · 대지 후보 · 설교 계획
import { pastorGet, pastorSend } from './_http'

export interface BriefPair {
  id: string
  title: string
  body: string
}

export interface SermonBrief {
  label: string
  summary: string
  context: BriefPair[]
  words: Array<{ id: string; word: string; original: string; meaning: string }>
  christ: Array<{ id: string; text: string }>
  /** 웨스트민스터 신앙고백 장 — 제목은 서버가 붙인다 */
  doctrines: Array<{ id: string; chapter: number; title: string; why: string }>
  cautions: BriefPair[]
  big_ideas: Array<{ id: string; text: string }>
  questions: Array<{ id: string; text: string }>
  /** 이단 표현이 있어 버린 항목 수 */
  filtered: number
}

export const fetchSermonBrief = (ref: string, refresh = false): Promise<SermonBrief> =>
  pastorSend('/pastor/sermon-study/brief', 'POST', { ref, refresh }, '연구 재료를 만들지 못했습니다')

export type ReviewKind = 'scripture' | 'text' | 'theology' | 'gospel' | 'fact' | 'clarity'

export interface ReviewFinding {
  id?: string
  kind: ReviewKind
  section: string | null
  quote: string
  comment: string
  /** 말씀 대조에서만 — 개역개정 본문(없는 구절이면 null) */
  expected?: string | null
}

export interface SermonReview {
  findings: ReviewFinding[]
  scripture: ReviewFinding[]
  quotes_checked: number
  strengths: string[]
  gospel_note: string
  filtered: number
  /** 원고가 상한을 넘어 뒷부분은 AI 가 보지 못했다 */
  truncated?: boolean
  reviewed_chars?: number
}

export const reviewOutline = (id: number): Promise<SermonReview> =>
  pastorSend(`/pastor/outlines/${id}/review`, 'POST', {}, '원고를 점검하지 못했습니다')

export interface WeekDevotion {
  day: string
  passage: string | null
  title: string
  body: string
  prayer: string
}

export interface WeekPackContent {
  summary: string[]
  kids: string
  questions: string[]
  devotions: WeekDevotion[]
}

export interface WeekPack extends WeekPackContent {
  sermon_id: number | null
  is_published: boolean
  published_at: string | null
  updated_at: string | null
}

export interface WeekPackData {
  pack: WeekPack | null
  sermon: { id: number; title: string; bible_verse: string | null; date: string | null } | null
}

export const fetchWeekPack = (outlineId: number): Promise<WeekPackData> =>
  pastorGet(`/pastor/outlines/${outlineId}/week-pack`, '한 주 묶음을 불러오지 못했습니다')

export const draftWeekPack = (
  outlineId: number,
): Promise<WeekPackContent & { filtered: number; truncated?: boolean; read_chars?: number }> =>
  pastorSend(`/pastor/outlines/${outlineId}/week-pack/draft`, 'POST', {}, '한 주 묶음 초안을 만들지 못했습니다')

export const saveWeekPack = (
  outlineId: number,
  data: WeekPackContent & { sermon_id: number | null; publish: boolean; reviewed: boolean },
): Promise<WeekPackData> =>
  pastorSend(`/pastor/outlines/${outlineId}/week-pack`, 'PUT', data, '한 주 묶음을 저장하지 못했습니다')

// 적용 다리 — 본문 + 우리 교회 형편(이름 없는 집계)
export interface ChurchContext {
  days: number
  emotion_total: number | null
  emotions: Array<{ label: string; count: number }>
  /** 지금 돌봄 중인 상황 — 3가정 미만 종류는 서버가 뺀다 */
  care: Array<{ label: string; count: number }>
  words: string[]
  events: Array<{ title: string; date: string | null }>
  theme: { text: string; ref: string } | null
}

export interface SermonBridge {
  label: string
  context: ChurchContext
  bridges: Array<{ id: string; audience: string; need: string; truth: string; application: string; basis: string }>
  caution: string
  filtered: number
}

export const fetchSermonBridge = (ref: string, refresh = false): Promise<SermonBridge> =>
  pastorSend('/pastor/sermon-study/bridge', 'POST', { ref, refresh }, '적용 후보를 만들지 못했습니다')

// 대지 후보 — 뼈대만(근거 절은 본문 범위 안인지 서버가 확인)
export interface OutlineOption {
  id: string
  style: string
  title: string
  points: Array<{ label: string; verses: string | null; verses_unchecked: boolean; gist: string }>
  intro: string
  close: string
}

export interface OutlineOptions {
  label: string
  big_idea: string
  options: OutlineOption[]
  filtered: number
}

export const fetchOutlineOptions = (ref: string, bigIdea: string): Promise<OutlineOptions> =>
  pastorSend('/pastor/sermon-study/outline-options', 'POST', { ref, big_idea: bigIdea }, '대지 후보를 만들지 못했습니다')

// 설교 계획 — 다가오는 주일 시리즈 후보
export interface PlanInputs {
  weeks: number
  sundays: Array<{ date: string; season: string | null }>
  testament: { ot: number; nt: number }
  stale: Array<{ name: string; last_date: string | null }>
  recent: Array<{ title: string; bible_verse: string | null; date: string }>
  theme: { text: string; ref: string } | null
}

export interface PlanSunday {
  date: string
  season: string | null
  passage: string | null
  passage_unchecked: boolean
  title: string
  gist: string
  /** 최근 3년 안에 같은 장을 설교한 날 */
  recent_overlap: string | null
}

export interface SermonSeries {
  id: string
  title: string
  kind: '강해' | '주제'
  why: string
  sundays: PlanSunday[]
}

export interface SermonPlan {
  inputs: PlanInputs
  focus: string
  series: SermonSeries[]
  filtered: number
}

export const fetchPlanInputs = (weeks: number, start: string | null): Promise<PlanInputs> =>
  pastorGet(`/pastor/sermon-plan/inputs?weeks=${weeks}${start ? `&start=${start}` : ''}`, '설교 계획 재료를 불러오지 못했습니다')

export const fetchSermonPlan = (data: { weeks: number; start: string | null; focus: string }): Promise<SermonPlan> =>
  pastorSend('/pastor/sermon-plan', 'POST', data, '설교 계획을 만들지 못했습니다')
