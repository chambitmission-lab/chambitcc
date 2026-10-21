// 만나 내리기(필사 미니게임) — 판 받기 · 기록 · 순위 · 부서 대항 · 고스트 라이벌 · 라이브
import { requestData } from '../utils/request'

export type MannaKind = 'daily' | 'free'
export type MannaMode = 'easy' | 'normal' | 'hard'

export interface MannaVerse {
  id: number
  book_number: number
  chapter: number
  verse: number
  /** "요한복음 3:16" */
  ref: string
  text: string
}

/** 한 판에 쓸 말씀 여덟 절(짧은 절부터). daily 는 오늘 교회 전체가 같은 판, seed 로 끼어드는 만나까지 같게 */
export interface MannaSet {
  kind: MannaKind
  date: string
  seed: number
  verses: MannaVerse[]
}

export interface MannaRunInput {
  kind: MannaKind
  mode: MannaMode
  set_date: string
  score: number
  verses_done: number
  perfect_verses: number
  words_caught: number
  words_missed: number
  max_combo: number
  duration_ms: number
  /** 절마다의 누적 점수 — 고스트 라이벌 비교용 */
  checkpoints?: number[]
}

export interface MannaRunResult {
  run_id: number
  /** 어제 판을 자정 넘어 보내면 free 로 바뀐다 */
  kind: MannaKind
  mode: MannaMode
  /** false 면 사람이 낼 수 없는 기록으로 판정돼 순위·칭호에서 빠졌다 */
  counted: boolean
  score: number
  is_best: boolean
  best: number
  /** 오늘의 만나 그 난이도 순위(연습 판이면 null) */
  rank: number | null
  players: number
  /** 오늘의 만나로 보냈지만 판 날짜가 오늘이 아니라 연습으로 남겼다 */
  demoted?: boolean
  /** 이 판으로 앞지른 사람 이름(1위였던 사람·바로 앞 사람) — 알림이 갔다 */
  overtook: string[]
  /** 라이브 창 안에서 친 판이면 라이브 순위 */
  live: { key: string; rank: number | null; players: number } | null
}

export interface MannaBoardEntry {
  rank: number
  user_id: number
  name: string
  avatar_url: string | null
  team_key: string | null
  score: number
  verses_done: number
  reached_canaan: boolean
  is_me: boolean
}

export interface MannaBoard {
  date: string
  mode: MannaMode
  players: number
  entries: MannaBoardEntry[]
  me: { rank: number; score: number } | null
}

/** 고스트 라이벌 — 오늘 같은 판을 친 사람의 절별 누적 점수 */
export interface MannaRivalEntry extends MannaBoardEntry {
  checkpoints: number[]
}
export type MannaRivalRelation = 'leader' | 'above' | 'below' | 'self'
export interface MannaRival {
  date: string
  mode: MannaMode
  players: number
  rival: (MannaRivalEntry & { relation: MannaRivalRelation }) | null
  leader: MannaRivalEntry | null
  me: MannaRivalEntry | null
}

export interface MannaLiveWindow {
  key: string
  starts_at: string
  ends_at: string
  /** 요일 한 글자(수·일) */
  weekday: string
}
export interface MannaLiveBoard {
  key: string
  players: number
  entries: MannaBoardEntry[]
  me: { rank: number; score: number } | null
}
export interface MannaLive {
  now: string
  mode: MannaMode
  minutes: number
  current: (MannaLiveWindow & { board: MannaLiveBoard }) | null
  next: MannaLiveWindow | null
  last: (MannaLiveWindow & { board: MannaLiveBoard }) | null
}

export interface MannaTeamStanding {
  key: string
  name: string
  color: string
  /** 1인당 평균 점수(부서 점수) */
  score: number
  total: number
  members: number
  participants: number
  rank: number
}

export interface MannaChampion {
  week_start: string
  week_end: string
  team: MannaTeamStanding | null
  person: { user_id: number; name: string; avatar_url: string | null; points: number; team_key: string | null } | null
  is_my_team: boolean
  is_me: boolean
}
export interface MannaHome {
  now: string
  live: (MannaLiveWindow & { state: 'live' | 'soon'; players: number }) | null
  champion: MannaChampion | null
}

/** 라이브 한 판 SSE — 창 안에서 한 판을 마친 사람 */
export interface MannaLiveEvent {
  live_key: string
  user_id: number
  name: string
  score: number
  verses_done: number
  reached_canaan: boolean
  rank: number | null
  players: number
}

export interface MannaTeams {
  week_start: string
  week_ends_at: string
  /** 서버 KST 현재 시각 — 광야 지도의 선두 위치(주가 얼마나 흘렀나) */
  now: string
  teams: MannaTeamStanding[]
  team_options: { key: string; name: string; color: string }[]
  me: { team_key: string | null; points: number }
  team_top: { user_id: number; name: string; avatar_url: string | null; points: number; is_me: boolean }[]
  weights: Record<MannaMode, number>
}

export interface MannaSummary {
  date: string
  best: Record<MannaMode, number>
  runs: number
  perfect_total: number
  canaan_count: number
  today: { mode: MannaMode; score: number; rank: number | null; players: number } | null
  players_today: number
  team_key: string | null
}

/** 로그인 없이도 받을 수 있다(연습은 누구나) — 토큰이 있으면 붙는다 */
export const getMannaSet = (kind: MannaKind): Promise<MannaSet> =>
  requestData(`/bible-typing/manna/set?kind=${kind}`, { errorMessage: '오늘의 만나를 불러오지 못했어요' })

export const submitMannaRun = (input: MannaRunInput): Promise<MannaRunResult> =>
  requestData('/bible-typing/manna/runs', {
    method: 'POST',
    auth: 'required',
    json: input,
    errorMessage: '기록을 저장하지 못했어요',
  })

export const getMannaBoard = (mode: MannaMode): Promise<MannaBoard> =>
  requestData(`/bible-typing/manna/board?mode=${mode}`, {
    auth: 'required',
    errorMessage: '오늘의 만나 순위를 불러오지 못했어요',
  })

export const getMannaTeams = (): Promise<MannaTeams> =>
  requestData('/bible-typing/manna/teams', { auth: 'required', errorMessage: '부서 대항전을 불러오지 못했어요' })

export const getMannaRival = (mode: MannaMode): Promise<MannaRival> =>
  requestData(`/bible-typing/manna/rival?mode=${mode}`, {
    auth: 'required',
    errorMessage: '오늘의 라이벌을 불러오지 못했어요',
  })

export const getMannaLive = (): Promise<MannaLive> =>
  requestData('/bible-typing/manna/live', { auth: 'required', errorMessage: '라이브 정보를 불러오지 못했어요' })

export const getMannaHome = (): Promise<MannaHome> =>
  requestData('/bible-typing/manna/home', { auth: 'required', errorMessage: '만나 소식을 불러오지 못했어요' })

export const getMannaSummary = (): Promise<MannaSummary> =>
  requestData('/bible-typing/manna/summary', {
    auth: 'required',
    errorMessage: '만나 내리기 기록을 불러오지 못했어요',
  })
